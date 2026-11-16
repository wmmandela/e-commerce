const axios = require('axios');

const DARAJA_BASE = process.env.MPESA_BASE_URL || (process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke');

const getDarajaTimestamp = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
};

/** Get an OAuth token from Daraja API */
const getAccessToken = async () => {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new Error('M-Pesa Consumer Key or Secret not configured.');
  }

  const creds = Buffer.from(`${key}:${secret}`).toString('base64');

  const { data } = await axios.get(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${creds}`
      },
      timeout: 10000
    }
  );
  return data.access_token;
};

/** Normalizes phone number to standard Safaricom 254XXXXXXXXX format */
const normalizePhone = (phone) => {
  let cleaned = String(phone).replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.slice(1);
  if (!cleaned.startsWith('254') && cleaned.length === 9) cleaned = '254' + cleaned;
  if (!/^254[71]\d{8}$/.test(cleaned)) {
    throw new Error('Enter a valid Kenyan M-PESA phone number.');
  }
  return cleaned;
};

const getCallbackUrl = () => {
  const value = process.env.MPESA_CALLBACK_URL;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('M-PESA callback URL is not configured.');
  }
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(process.env.MPESA_ENV !== 'production' && isLocal && parsed.protocol === 'http:')) {
    throw new Error('M-PESA callback URL must use HTTPS.');
  }
  return parsed.toString();
};

/**
 * Initiate an STK Push (Lipa Na M-Pesa Online) via Daraja API
 */
const initiateSTKPush = async (phone, amount, orderNumber) => {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) throw new Error('M-PESA payment credentials are not configured.');
  const callbackUrl = getCallbackUrl();

  const timestamp = getDarajaTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const normPhone = normalizePhone(phone);
  const intAmount = Math.round(Number(amount));
  if (!Number.isFinite(intAmount) || intAmount < 1) {
    throw new Error('The payment amount is invalid.');
  }

  const accountReference = `ECOM${String(orderNumber).replace(/[^a-z0-9]/gi, '').slice(-8)}`;
  const transactionDesc = `Order ${String(orderNumber).replace(/[^a-z0-9]/gi, '').slice(-7)}`;

  let token;
  try {
    token = await getAccessToken();
  } catch (error) {
    return { success: false, retrySafe: true, error: error.message };
  }

  try {
    const { data } = await axios.post(
      `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: intAmount,
        PartyA: normPhone,
        PartyB: shortcode,
        PhoneNumber: normPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 15000
      }
    );

    if (String(data.ResponseCode) !== '0' || !data.CheckoutRequestID) {
      return { success: false, retrySafe: true, error: data.ResponseDescription || 'Safaricom did not accept the payment request.' };
    }
    return {
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      responseDescription: data.ResponseDescription
    };
  } catch (error) {
    const errDetails = error.response ? error.response.data : error.message;
    console.warn('Daraja API STK Push network attempt result:', errDetails);
    return {
      success: false,
      error: errDetails,
      retrySafe: Boolean(error.response),
    };
  }
};

const querySTKPush = async (checkoutRequestId) => {
  const shortcode = process.env.MPESA_SHORTCODE;
  if (!shortcode) throw new Error('M-PESA shortcode is not configured.');
  const passkey = process.env.MPESA_PASSKEY;
  if (!passkey) throw new Error('M-PESA passkey is not configured.');
  const timestamp = getDarajaTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const token = await getAccessToken();
  const { data } = await axios.post(`${DARAJA_BASE}/mpesa/stkpushquery/v1/query`, {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId
  }, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000
  });
  return data;
};

module.exports = {
  getAccessToken,
  initiateSTKPush,
  normalizePhone,
  getDarajaTimestamp,
  querySTKPush
};
