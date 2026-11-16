import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('sokobora_user') || 'null'));
  const token = ref(localStorage.getItem('sokobora_token') || null);
  const devices = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Multi-Device Identity (Kenyan Context)
  const deviceId = ref(localStorage.getItem('sokobora_device_id') || `dev_ke_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`);
  const deviceName = ref(localStorage.getItem('sokobora_device_name') || detectInitialDeviceName());

  localStorage.setItem('sokobora_device_id', deviceId.value);
  localStorage.setItem('sokobora_device_name', deviceName.value);

  function detectInitialDeviceName() {
    const ua = navigator.userAgent;
    let browser = 'Chrome';
    let device = 'MacBook Pro - Nairobi';
    if (/iPhone/i.test(ua)) device = 'iPhone 15 Pro (Safaricom 5G)';
    else if (/iPad/i.test(ua)) device = 'iPad Air - Nairobi Home';
    else if (/Android/i.test(ua)) device = 'Tecno Camon 30 (Safaricom 5G)';
    else if (/Windows/i.test(ua)) device = 'HP Pavilion - Westlands Office';

    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';

    return `${device} (${browser})`;
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const authHeaders = computed(() => {
    const headers = {
      'Content-Type': 'application/json',
      'x-device-id': deviceId.value,
      'x-device-name': deviceName.value
    };
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }
    return headers;
  });

  async function register(name, email, phone, county, estate, password) {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: authHeaders.value,
        body: JSON.stringify({ name, email, phone, county, estate, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('sokobora_token', data.token);
      localStorage.setItem('sokobora_user', JSON.stringify(data.user));

      await fetchDevices();
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function login(email, password) {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: authHeaders.value,
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      token.value = data.token;
      user.value = data.user;
      devices.value = data.devices || [];
      localStorage.setItem('sokobora_token', data.token);
      localStorage.setItem('sokobora_user', JSON.stringify(data.user));

      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: authHeaders.value
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      user.value = data.user;
      devices.value = data.devices || [];
      localStorage.setItem('sokobora_user', JSON.stringify(data.user));
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  }

  async function fetchDevices() {
    if (!token.value) return;
    try {
      const res = await fetch('/api/auth/devices', {
        headers: authHeaders.value
      });
      if (res.ok) {
        const data = await res.json();
        devices.value = data.devices || [];
      }
    } catch (err) {
      console.warn('Failed to fetch devices:', err);
    }
  }

  async function disconnectDevice(targetDeviceId) {
    try {
      const res = await fetch(`/api/auth/devices/${targetDeviceId}`, {
        method: 'DELETE',
        headers: authHeaders.value
      });
      if (res.ok) {
        devices.value = devices.value.filter(d => d.device_id !== targetDeviceId);
      }
    } catch (err) {
      console.warn('Failed to disconnect device:', err);
    }
  }

  // Switch or Simulate Kenyan Device Profile (Requirement 6 Demo)
  function simulateDeviceProfile(type) {
    let name = 'MacBook Pro - Nairobi Office';
    let id = `dev_mac_${Date.now()}`;

    if (type === 'mobile_tecno') {
      name = 'Tecno Camon 30 Pro (Safaricom 5G)';
      id = `dev_tecno_${Date.now()}`;
    } else if (type === 'mobile_samsung') {
      name = 'Samsung Galaxy A54 (Airtel Kenya)';
      id = `dev_samsung_${Date.now()}`;
    } else if (type === 'tablet') {
      name = 'iPad Air (Safari - Karen Home)';
      id = `dev_ipad_${Date.now()}`;
    } else if (type === 'laptop_work') {
      name = 'HP Pavilion - Westlands Office';
      id = `dev_hp_${Date.now()}`;
    }

    deviceId.value = id;
    deviceName.value = name;
    localStorage.setItem('sokobora_device_id', id);
    localStorage.setItem('sokobora_device_name', name);

    if (token.value) {
      fetchCurrentUser();
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    devices.value = [];
    localStorage.removeItem('sokobora_token');
    localStorage.removeItem('sokobora_user');
  }

  return {
    user,
    token,
    devices,
    deviceId,
    deviceName,
    loading,
    error,
    isAuthenticated,
    authHeaders,
    register,
    login,
    fetchCurrentUser,
    fetchDevices,
    disconnectDevice,
    simulateDeviceProfile,
    logout
  };
});
