const express = require('express');
const router = express.Router();
const { get, run, all } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { initiateSTKPush, querySTKPush, normalizePhone } = require('../services/mpesa.service');
const statusQueryState = new Map();
const STATUS_QUERY_INTERVAL_MS = 60000;
const STATUS_QUERY_MAX_ATTEMPTS = 2;

async function applyStkResult(callback) {
  const payment = await get('SELECT * FROM payments WHERE checkout_request_id = ?', [callback.CheckoutRequestID]);
  if (!payment) return false;

  if (Number(callback.ResultCode) === 0) {
    const metadata = callback.CallbackMetadata?.Item || [];
    const receipt = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
    const reportedPhone = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
    let payerPhone = null;
    if (reportedPhone !== undefined && reportedPhone !== null) {
      try {
        payerPhone = normalizePhone(String(reportedPhone));
      } catch {
        payerPhone = null;
      }
    }
    const actualAmount = Number(metadata.find(item => item.Name === 'Amount')?.Value ?? payment.amount);
    if (!Number.isFinite(actualAmount) || actualAmount <= 0) {
      await run(`UPDATE payments SET status = 'needs_review', phone = COALESCE(?, phone), result_code = ?, result_desc = ? WHERE id = ? AND status = 'pending'`,
        [payerPhone, callback.ResultCode, 'Successful payment amount could not be confirmed.', payment.id]);
      return true;
    }

    const amountMatches = Math.round(actualAmount) === Math.round(Number(payment.amount));
    const updated = await run(`
      UPDATE payments
      SET status = 'completed', phone = COALESCE(?, phone), mpesa_ref = ?, amount = ?, result_code = ?, result_desc = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending'
    `, [payerPhone, receipt ? String(receipt) : null, actualAmount, callback.ResultCode, callback.ResultDesc || '', payment.id]);

    if (updated.changes) {
      await run('UPDATE orders SET status = ? WHERE id = ?', [amountMatches ? 'paid' : 'payment_review', payment.order_id]);
      if (amountMatches) {
        const orderItems = await all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [payment.order_id]);
        for (const item of orderItems) {
          await run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND quantity = ?',
            [payment.user_id, item.product_id, item.quantity]);
        }
      }
    } else if (payment.status === 'completed' && amountMatches && (payerPhone || (receipt && !payment.mpesa_ref))) {
      await run('UPDATE payments SET mpesa_ref = COALESCE(mpesa_ref, ?), phone = COALESCE(?, phone) WHERE id = ?',
        [receipt ? String(receipt) : null, payerPhone, payment.id]);
    }
    return true;
  }

  const updated = await run(`
    UPDATE payments SET status = 'failed', result_code = ?, result_desc = ?
    WHERE id = ? AND status = 'pending'
  `, [callback.ResultCode, callback.ResultDesc || 'Payment was not completed.', payment.id]);
  if (updated.changes) {
    const orderUpdated = await run("UPDATE orders SET status = 'payment_failed' WHERE id = ? AND status = 'pending'", [payment.order_id]);
    if (orderUpdated.changes) {
      const items = await all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [payment.order_id]);
      for (const item of items) {
        await run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }
  }
  return true;
}

router.post('/mpesa/callback', async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) {
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback payload' });
    }

    const matched = await applyStkResult(callback);
    if (!matched) {
      console.warn('Received M-PESA callback for an unknown checkout request:', callback.CheckoutRequestID);
    } else {
      console.info('Processed M-PESA callback:', {
        checkoutRequestId: callback.CheckoutRequestID,
        resultCode: callback.ResultCode,
        resultDesc: callback.ResultDesc || ''
      });
    }
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('Error handling M-PESA payment callback:', error.message);
    return res.status(500).json({ ResultCode: 1, ResultDesc: 'Callback processing failed' });
  }
});

router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const transactions = await all(`
      SELECT p.id, p.order_id, p.phone, p.amount, p.mpesa_ref, p.status,
             p.result_code, p.result_desc, p.simulated, p.created_at, p.completed_at,
             o.order_number, o.status AS order_status
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.user_id = ? AND p.status <> 'pending'
      ORDER BY p.created_at DESC, p.id DESC
    `, [req.user.id]);

    return res.json(transactions.map(transaction => ({
      ...transaction,
      phone_masked: transaction.phone ? `••••${String(transaction.phone).slice(-4)}` : null
    })));
  } catch (error) {
    console.error('Error fetching payment transactions:', error.message);
    return res.status(500).json({ error: 'Could not fetch your transactions.' });
  }
});

router.post('/mpesa/initiate', authMiddleware, async (req, res) => {
  let retryReservation = false;
  let retryItems = [];
  let retryOrder = null;
  try {
    const { orderId, phone } = req.body;
    if (!orderId || !phone) {
      return res.status(400).json({ error: 'Order ID and M-PESA phone number are required.' });
    }

    const order = await get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status === 'paid' || order.status === 'refunded') {
      return res.status(409).json({ error: 'This order has already been paid.' });
    }
    if (!['pending', 'payment_failed'].includes(order.status)) {
      return res.status(409).json({ error: 'This order cannot accept another payment request.' });
    }

    const normPhone = normalizePhone(phone);
    const existing = await get(`
      SELECT checkout_request_id FROM payments
      WHERE order_id = ? AND status = 'pending' AND simulated = 0
      ORDER BY id DESC LIMIT 1
    `, [order.id]);
    if (existing) {
      return res.json({ success: true, checkoutRequestId: existing.checkout_request_id, orderId: order.id, existingPending: true });
    }

    const otherPending = await get(`
      SELECT order_id FROM payments
      WHERE phone = ? AND order_id <> ? AND status = 'pending' AND simulated = 0
      ORDER BY id DESC LIMIT 1
    `, [normPhone, order.id]);
    if (otherPending) {
      return res.status(409).json({ error: 'A payment request for this phone is already pending on another order. Check that order before starting another payment.' });
    }

    if (order.status === 'payment_failed') {
      retryItems = await all('SELECT product_id, quantity, title FROM order_items WHERE order_id = ?', [order.id]);
      for (const item of retryItems) {
        const product = await get('SELECT stock FROM products WHERE id = ?', [item.product_id]);
        if (!product || product.stock < item.quantity) {
          return res.status(409).json({ error: `Not enough stock is available to retry ${item.title}.` });
        }
      }
      for (const item of retryItems) {
        await run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
      }
      await run("UPDATE orders SET status = 'pending' WHERE id = ? AND status = 'payment_failed'", [order.id]);
      retryReservation = true;
      retryOrder = order;
    }

    const result = await initiateSTKPush(normPhone, order.total_amount, order.order_number);
    if (!result.success) {
      if (retryReservation) await releaseRetryReservation(retryOrder, retryItems);
      else if (result.retrySafe) await releaseOrderReservation(order.id);
      else await run("UPDATE orders SET status = 'payment_review' WHERE id = ? AND status = 'pending'", [order.id]);
      return res.status(502).json({ error: 'Could not start M-PESA payment. Please try again.' });
    }

    await run(`
      INSERT INTO payments (order_id, user_id, phone, amount, checkout_request_id, merchant_request_id, status, simulated)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', 0)
    `, [order.id, req.user.id, normPhone, order.total_amount, result.checkoutRequestId, result.merchantRequestId]);

    return res.json({
      success: true,
      checkoutRequestId: result.checkoutRequestId,
      orderId: order.id,
      amount: order.total_amount,
      phone: normPhone
    });
  } catch (error) {
    if (retryReservation && retryOrder) await releaseRetryReservation(retryOrder, retryItems);
    else if (error.message.includes('callback URL') || error.message.includes('not configured')) {
      await releaseOrderReservation(req.body.orderId);
    }
    const message = error.message.includes('phone number') ? error.message : 'Payment is temporarily unavailable. Please try again later.';
    console.error('Error initiating M-PESA payment:', error.message);
    return res.status(502).json({ error: message });
  }
});

async function releaseRetryReservation(order, items) {
  for (const item of items) {
    await run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
  }
  await run("UPDATE orders SET status = 'payment_failed' WHERE id = ? AND status = 'pending'", [order.id]);
}

async function releaseOrderReservation(orderId) {
  const updated = await run("UPDATE orders SET status = 'payment_failed' WHERE id = ? AND status = 'pending'", [orderId]);
  if (!updated.changes) return;
  const items = await all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
  for (const item of items) {
    await run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
  }
}

router.get('/status/:orderId', authMiddleware, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    let order = await get('SELECT id, status FROM orders WHERE id = ? AND user_id = ?', [req.params.orderId, req.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    let statusQueryUnavailable = false;
    let statusQueryError = null;
    let payment = await get(`
      SELECT id, checkout_request_id, status, mpesa_ref, amount, phone, result_desc, completed_at
      FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1
    `, [order.id]);
    if (payment?.status === 'pending') {
      const queryState = statusQueryState.get(payment.id) || {
        lastQueryAt: Date.now(),
        attempts: 0,
        unavailable: false,
        processing: false,
        error: null
      };
      statusQueryState.set(payment.id, queryState);
      if (queryState.attempts < STATUS_QUERY_MAX_ATTEMPTS && Date.now() - queryState.lastQueryAt >= STATUS_QUERY_INTERVAL_MS) {
        queryState.lastQueryAt = Date.now();
        queryState.attempts += 1;
        try {
          const result = await querySTKPush(payment.checkout_request_id);
          if (result.ResultCode !== undefined && result.ResultCode !== null && result.ResultCode !== '') {
            await applyStkResult({
              CheckoutRequestID: payment.checkout_request_id,
              ResultCode: result.ResultCode,
              ResultDesc: result.ResultDesc || result.ResponseDescription || '',
              CallbackMetadata: result.CallbackMetadata
            });
            order = await get('SELECT id, status FROM orders WHERE id = ?', [order.id]);
            payment = await get(`
              SELECT id, checkout_request_id, status, mpesa_ref, amount, phone, result_desc, completed_at
              FROM payments WHERE id = ?
            `, [payment.id]);
          }
        } catch (queryError) {
          const darajaCode = queryError.response?.data?.errorCode;
          const httpStatus = queryError.response?.status;
          if (String(darajaCode) === '500.001.1001') {
            queryState.processing = true;
            queryState.unavailable = false;
            queryState.error = 'Daraja reports that this transaction is still processing. Keep this order open and wait for its final callback.';
          } else {
            queryState.processing = false;
            queryState.unavailable = true;
            queryState.error = httpStatus
              ? `Daraja status check is unavailable (HTTP ${httpStatus}${darajaCode ? `, code ${darajaCode}` : ''}). The payment is still unconfirmed.`
              : 'Could not connect to Daraja to check this payment. The payment is still unconfirmed.';
          }
          console.warn('Could not query M-PESA status:', queryError.response?.status || queryError.message, darajaCode || '');
        }
        statusQueryState.set(payment.id, queryState);
      }
      statusQueryUnavailable = queryState.unavailable || (queryState.attempts >= STATUS_QUERY_MAX_ATTEMPTS && !queryState.processing);
      statusQueryError = queryState.error || null;
    } else if (payment) {
      statusQueryState.delete(payment.id);
    }
    return res.json({ orderStatus: order.status, isPaid: order.status === 'paid', statusQueryUnavailable, statusQueryPending: Boolean(payment?.status === 'pending' && statusQueryState.get(payment.id)?.processing), statusQueryError, payment: payment || null });
  } catch (error) {
    return res.status(500).json({ error: 'Could not check payment status.' });
  }
});

module.exports = router;
