const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run, all } = require('../db');
const { authMiddleware, parseUserAgent } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    if (!JWT_SECRET) return res.status(503).json({ error: 'Authentication service is not configured.' });
    const { name, email, phone, county = 'Nairobi', estate = 'Kilimani', password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Please provide your Full Name, Email, Kenyan Phone Number, and Password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists in Kenya.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = await run(
      `INSERT INTO users (name, email, phone, county, estate, password_hash, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        phone.trim(),
        county.trim(),
        estate.trim(),
        passwordHash,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`
      ]
    );

    const userId = userResult.id;
    const user = await get('SELECT id, name, email, phone, county, estate, avatar_url, created_at FROM users WHERE id = ?', [userId]);

    // Record initial device
    const deviceId = req.headers['x-device-id'] || `dev_ke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    const deviceName = req.headers['x-device-name'] || `${uaInfo.browser} on ${uaInfo.os} (Kenya)`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '197.232.88.1';

    await run(
      `INSERT INTO user_devices (user_id, device_id, device_name, device_type, browser, os, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, deviceId, deviceName, uaInfo.deviceType, uaInfo.browser, uaInfo.os, ip]
    );

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      message: 'Welcome to SokoBora Kenya! Account successfully registered.',
      token,
      user,
      deviceId
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

/**
 * User login
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    if (!JWT_SECRET) return res.status(503).json({ error: 'Authentication service is not configured.' });
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await get('SELECT * FROM users WHERE email = ? AND is_active = 1', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Register / update device session for multi-device shopping
    const deviceId = req.headers['x-device-id'] || `dev_ke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    const deviceName = req.headers['x-device-name'] || `${uaInfo.browser} on ${uaInfo.os} (Kenya)`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '197.232.88.1';

    const existingDevice = await get('SELECT id FROM user_devices WHERE user_id = ? AND device_id = ?', [user.id, deviceId]);
    if (existingDevice) {
      await run(
        `UPDATE user_devices 
         SET last_active = CURRENT_TIMESTAMP, device_name = ?, browser = ?, os = ?, ip_address = ?
         WHERE id = ?`,
        [deviceName, uaInfo.browser, uaInfo.os, ip, existingDevice.id]
      );
    } else {
      await run(
        `INSERT INTO user_devices (user_id, device_id, device_name, device_type, browser, os, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, deviceId, deviceName, uaInfo.deviceType, uaInfo.browser, uaInfo.os, ip]
      );
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      county: user.county,
      estate: user.estate,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    };

    const devices = await all('SELECT * FROM user_devices WHERE user_id = ? ORDER BY last_active DESC', [user.id]);

    return res.json({
      message: 'Welcome back! Login successful.',
      token,
      user: safeUser,
      deviceId,
      devices
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req, res) => {
  const devices = await all('SELECT * FROM user_devices WHERE user_id = ? ORDER BY last_active DESC', [req.user.id]);
  return res.json({
    user: req.user,
    currentDeviceId: req.deviceId,
    devices
  });
});

/**
 * List all devices connected to this account (Multi-Device Shopping requirement)
 * GET /api/auth/devices
 */
router.get('/devices', authMiddleware, async (req, res) => {
  try {
    const devices = await all(
      'SELECT id, device_id, device_name, device_type, browser, os, ip_address, last_active FROM user_devices WHERE user_id = ? ORDER BY last_active DESC',
      [req.user.id]
    );

    const cartCountRow = await get(
      'SELECT SUM(quantity) as total_items FROM cart_items WHERE user_id = ?',
      [req.user.id]
    );

    return res.json({
      devices,
      currentDeviceId: req.deviceId,
      syncedCartItems: cartCountRow.total_items || 0
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return res.status(500).json({ error: 'Could not fetch connected devices.' });
  }
});

/**
 * Disconnect a device session
 * DELETE /api/auth/devices/:deviceId
 */
router.delete('/devices/:deviceId', authMiddleware, async (req, res) => {
  try {
    await run('DELETE FROM user_devices WHERE user_id = ? AND device_id = ?', [req.user.id, req.params.deviceId]);
    return res.json({ message: 'Device session removed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Could not remove device session.' });
  }
});

module.exports = router;
