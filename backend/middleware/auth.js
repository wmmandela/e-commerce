const jwt = require('jsonwebtoken');
const { get, run } = require('../db');

const parseUserAgent = (userAgent = '') => {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'desktop';

  if (/mobile/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'tablet';
  }

  if (/iPhone/i.test(userAgent)) os = 'iOS (iPhone)';
  else if (/iPad/i.test(userAgent)) os = 'iPadOS';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/Windows NT/i.test(userAgent)) os = 'Windows';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/Linux/i.test(userAgent)) os = 'Linux';

  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome';
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Edg/i.test(userAgent)) browser = 'Edge';

  return { browser, os, deviceType };
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    if (!process.env.JWT_SECRET) return res.status(503).json({ error: 'Authentication service is not configured.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await get('SELECT id, name, email, phone, avatar_url FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    req.user = user;

    // Track Multi-Device Shopping session
    const deviceId = req.headers['x-device-id'] || `device_web_${user.id}_fallback`;
    const clientProvidedName = req.headers['x-device-name'];
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    const deviceName = clientProvidedName || `${uaInfo.browser} on ${uaInfo.os}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    try {
      const existing = await get('SELECT id FROM user_devices WHERE user_id = ? AND device_id = ?', [user.id, deviceId]);
      if (existing) {
        await run(
          `UPDATE user_devices 
           SET last_active = CURRENT_TIMESTAMP, device_name = ?, browser = ?, os = ?, ip_address = ?
           WHERE id = ?`,
          [deviceName, uaInfo.browser, uaInfo.os, ip, existing.id]
        );
      } else {
        await run(
          `INSERT INTO user_devices (user_id, device_id, device_name, device_type, browser, os, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user.id, deviceId, deviceName, uaInfo.deviceType, uaInfo.browser, uaInfo.os, ip]
        );
      }
    } catch (devErr) {
      console.warn('Could not record device session:', devErr.message);
    }

    req.deviceId = deviceId;
    req.deviceName = deviceName;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = { authMiddleware, parseUserAgent };
