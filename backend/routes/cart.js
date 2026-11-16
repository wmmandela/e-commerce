const express = require('express');
const router = express.Router();
const { get, run, all } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

/**
 * Helper to fetch full populated cart with totals formatted for Kenya
 */
const fetchPopulatedCart = async (userId) => {
  const items = await all(`
    SELECT ci.id as cart_item_id, ci.quantity, ci.updated_at,
           p.id as product_id, p.title, p.slug, p.brand, p.price, p.original_price,
           p.stock, p.image_url, p.kebs_certified, c.name as category_name
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE ci.user_id = ?
    ORDER BY ci.updated_at DESC
  `, [userId]);

  let subtotal = 0;
  let totalItems = 0;

  const populatedItems = items.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    totalItems += item.quantity;
    return {
      ...item,
      itemTotal
    };
  });

  const shippingFee = subtotal > 0 ? 10 : 0;
  const tax = Math.round(subtotal * 0.16); // 16% Kenya VAT (KRA)
  const total = subtotal + shippingFee + tax;

  return {
    items: populatedItems,
    summary: {
      subtotal,
      shippingFee,
      tax,
      total,
      totalItems,
      currency: 'KSh'
    }
  };
};

/**
 * Get user's active cart
 * GET /api/cart
 */
router.get('/', async (req, res) => {
  try {
    const cart = await fetchPopulatedCart(req.user.id);
    return res.json({
      success: true,
      cart,
      deviceInfo: {
        syncedOn: new Date().toISOString(),
        deviceId: req.deviceId,
        deviceName: req.deviceName
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ error: 'Could not load shopping cart.' });
  }
});

/**
 * Add product to cart
 * POST /api/cart/add
 */
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10));

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    const product = await get('SELECT id, stock, title FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const existing = await get('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({ error: `Cannot add more. Only ${product.stock} units available in Nairobi warehouse.` });
      }
      await run('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newQty, existing.id]);
    } else {
      if (qty > product.stock) {
        return res.status(400).json({ error: `Cannot add. Only ${product.stock} units available in Nairobi warehouse.` });
      }
      await run(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, productId, qty]
      );
    }

    const cart = await fetchPopulatedCart(req.user.id);
    return res.json({
      success: true,
      message: `"${product.title}" added to your cart.`,
      cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ error: 'Could not add product to cart.' });
  }
});

/**
 * Update cart item quantity
 * PUT /api/cart/update
 */
router.put('/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId || isNaN(qty)) {
      return res.status(400).json({ error: 'Valid productId and quantity required.' });
    }

    if (qty <= 0) {
      await run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    } else {
      const product = await get('SELECT stock FROM products WHERE id = ?', [productId]);
      if (qty > product.stock) {
        return res.status(400).json({ error: `Requested quantity exceeds available stock (${product.stock}).` });
      }
      await run(
        `UPDATE cart_items 
         SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ? AND product_id = ?`,
        [qty, req.user.id, productId]
      );
    }

    const cart = await fetchPopulatedCart(req.user.id);
    return res.json({
      success: true,
      message: 'Cart updated successfully.',
      cart
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    return res.status(500).json({ error: 'Could not update cart quantity.' });
  }
});

/**
 * Remove single item from cart
 * DELETE /api/cart/item/:productId
 */
router.delete('/item/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    await run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);

    const cart = await fetchPopulatedCart(req.user.id);
    return res.json({
      success: true,
      message: 'Product removed from your cart.',
      cart
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return res.status(500).json({ error: 'Could not remove item from cart.' });
  }
});

/**
 * Clear full cart
 * DELETE /api/cart/clear
 */
router.delete('/clear', async (req, res) => {
  try {
    await run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    const cart = await fetchPopulatedCart(req.user.id);
    return res.json({
      success: true,
      message: 'Shopping cart cleared.',
      cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({ error: 'Could not clear cart.' });
  }
});

/**
 * Merge local guest cart into backend user cart upon login
 * POST /api/cart/merge
 */
router.post('/merge', async (req, res) => {
  try {
    const { guestItems = [] } = req.body;

    for (const item of guestItems) {
      if (!item.productId || !item.quantity) continue;
      const existing = await get('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, item.productId]);
      if (existing) {
        await run('UPDATE cart_items SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [item.quantity, existing.id]);
      } else {
        await run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.user.id, item.productId, item.quantity]);
      }
    }

    const cart = await fetchPopulatedCart(req.user.id);
    return res.json({
      success: true,
      message: 'Cart synchronized across your Kenyan devices.',
      cart
    });
  } catch (error) {
    console.error('Error merging cart:', error);
    return res.status(500).json({ error: 'Could not merge cart.' });
  }
});

module.exports = router;
