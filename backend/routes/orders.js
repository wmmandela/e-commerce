const express = require('express');
const router = express.Router();
const { get, run, all } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

/**
 * Checkout and create order from active cart
 * POST /api/orders/checkout
 * Body: { shippingName, shippingPhone, shippingCounty, shippingEstate, shippingAddress }
 */
router.post('/checkout', async (req, res) => {
  try {
    const { 
      shippingName, 
      shippingPhone, 
      shippingCounty = 'Nairobi', 
      shippingEstate = 'Kilimani', 
      shippingAddress 
    } = req.body;

    if (!shippingName || !shippingPhone || !shippingAddress) {
      return res.status(400).json({ error: 'Please provide full name, Safaricom phone number, and delivery address.' });
    }

    // Get current user cart items
    const cartItems = await all(`
      SELECT ci.quantity, p.id as product_id, p.title, p.price, p.stock, p.image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [req.user.id]);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Please add products before checking out.' });
    }

    // Validate stock
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({
          error: `Insufficient stock for "${item.title}". Only ${item.stock} available in Nairobi warehouse.`
        });
      }
    }

    let subtotal = 0;
    cartItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const shippingFee = subtotal > 0 ? 10 : 0;
    const tax = Math.round(subtotal * 0.16);
    const totalAmount = subtotal + shippingFee + tax;

    const orderNumber = `SOKO-KE-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;

    // Create Order
    const orderResult = await run(`
      INSERT INTO orders (
        order_number, user_id, device_name, subtotal, shipping_fee, tax, total_amount,
        status, shipping_name, shipping_phone, shipping_county, shipping_estate, shipping_address, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      req.user.id,
      req.deviceName || 'Nairobi Client',
      subtotal,
      shippingFee,
      tax,
      totalAmount,
      'pending',
      shippingName.trim(),
      shippingPhone.trim(),
      shippingCounty.trim(),
      shippingEstate.trim(),
      shippingAddress.trim(),
      'mpesa'
    ]);

    const orderId = orderResult.id;

    // Create Order Items and adjust stock
    for (const item of cartItems) {
      await run(`
        INSERT INTO order_items (order_id, product_id, title, price, quantity, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.title, item.price, item.quantity, item.image_url]);

      await run(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity, item.product_id]);
    }

    const createdOrder = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    const items = await all(`SELECT * FROM order_items WHERE order_id = ?`, [orderId]);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully. Please proceed with Lipa Na M-Pesa payment.',
      order: {
        ...createdOrder,
        items
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Internal error processing checkout.' });
  }
});

/**
 * List orders for current user
 * GET /api/orders
 */
router.get('/', async (req, res) => {
  try {
    const orders = await all(`
      SELECT o.*,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
             p.status as payment_status,
             p.mpesa_ref
      FROM orders o
      LEFT JOIN payments p ON p.id = (SELECT MAX(id) FROM payments WHERE order_id = o.id)
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    return res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Could not fetch your orders.' });
  }
});

/**
 * Get single order details
 * GET /api/orders/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await get(`SELECT * FROM orders WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const items = await all(`SELECT * FROM order_items WHERE order_id = ?`, [order.id]);
    const payment = await get(`SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1`, [order.id]);

    return res.json({
      ...order,
      items,
      payment
    });
  } catch (error) {
    console.error('Error fetching order detail:', error);
    return res.status(500).json({ error: 'Could not fetch order detail.' });
  }
});

module.exports = router;
