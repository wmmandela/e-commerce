<template>
  <div class="container devices-page" style="padding: 2.5rem 1.25rem 4rem;">
    <!-- Breadcrumb -->
    <div style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.5rem;">
      <router-link to="/" style="color: var(--primary);">Home</router-link> / 
      <span>Multi-Device Hub</span>
    </div>

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary-light); color: var(--primary); padding: 0.3rem 0.75rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 800; margin-bottom: 0.5rem;">
          🇰🇪 Your shopping, wherever you are
        </div>
        <h1 style="font-size: 2.25rem; font-weight: 800;">Your devices and saved cart</h1>
        <p style="color: var(--text-muted); font-size: 0.9375rem;">
          Your cart stays up to date when you shop on your phone, tablet, or computer.
        </p>
      </div>

      <button @click="refreshAll" class="btn btn-secondary btn-sm">
        🔄 Refresh Synced Data
      </button>
    </div>

    <!-- Top Status Cards Grid -->
    <div class="device-status-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
      <!-- Active Device -->
      <div class="card" style="border-left: 4px solid var(--primary);">
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">
          Current Active Device
        </div>
        <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">
          {{ authStore.deviceName }}
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #059669; font-weight: 700;">
          <span class="pulse-dot"></span>
          <span>Online in Kenya</span>
        </div>
      </div>

      <!-- Database Synced Cart Items -->
      <div class="card" style="border-left: 4px solid #10b981;">
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">
          Saved cart
        </div>
        <div style="font-size: 1.2rem; font-weight: 800; color: #047857; margin-bottom: 0.5rem;">
          {{ cartStore.totalItemsCount }} {{ cartStore.totalItemsCount === 1 ? 'Item' : 'Items' }} Saved
        </div>
        <div style="font-size: 0.8125rem; color: var(--text-muted);">
          Cart Total: KSh {{ Number(cartStore.summary.total).toLocaleString() }}
        </div>
      </div>

      <!-- Total Devices Connected -->
      <div class="card" style="border-left: 4px solid #f59e0b;">
        <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">
          Connected devices
        </div>
        <div style="font-size: 1.2rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">
          {{ authStore.devices.length || 1 }} Active
        </div>
        <div style="font-size: 0.8125rem; color: var(--text-muted);">
          Account: {{ authStore.user?.email }}
        </div>
      </div>
    </div>

    <!-- Section 1: Interactive Device Simulator Switcher -->
    <div class="card" style="padding: 1.75rem; margin-bottom: 2.5rem; background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%);">
      <div style="margin-bottom: 1.25rem;">
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.25rem;">
          Switch device
        </h3>
        <p style="font-size: 0.875rem; color: var(--text-muted);">
          Choose a device to see how your saved cart follows you.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
        <button 
          @click="switchDevice('mobile_tecno')" 
          class="card"
          style="padding: 1.25rem; text-align: left; cursor: pointer; transition: all 0.2s;"
          :style="authStore.deviceName.includes('Tecno') ? 'border: 2px solid var(--primary); background: #ffffff;' : ''"
        >
          <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">📱</div>
          <div style="font-weight: 800; font-size: 0.9375rem;">Tecno Camon 30 Pro</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Safaricom 5G / Android 14</div>
          <span v-if="authStore.deviceName.includes('Tecno')" style="display: inline-block; margin-top: 0.5rem; font-size: 0.6875rem; background: var(--primary); color: white; padding: 0.15rem 0.5rem; border-radius: var(--radius-sm); font-weight: 700;">
            Current Device
          </span>
        </button>

        <button 
          @click="switchDevice('mobile_samsung')" 
          class="card"
          style="padding: 1.25rem; text-align: left; cursor: pointer; transition: all 0.2s;"
          :style="authStore.deviceName.includes('Samsung') ? 'border: 2px solid var(--primary); background: #ffffff;' : ''"
        >
          <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">📲</div>
          <div style="font-weight: 800; font-size: 0.9375rem;">Samsung Galaxy A54</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Airtel Kenya 5G / OneUI</div>
          <span v-if="authStore.deviceName.includes('Samsung')" style="display: inline-block; margin-top: 0.5rem; font-size: 0.6875rem; background: var(--primary); color: white; padding: 0.15rem 0.5rem; border-radius: var(--radius-sm); font-weight: 700;">
            Current Device
          </span>
        </button>

        <button 
          @click="switchDevice('tablet')" 
          class="card"
          style="padding: 1.25rem; text-align: left; cursor: pointer; transition: all 0.2s;"
          :style="authStore.deviceName.includes('iPad') ? 'border: 2px solid var(--primary); background: #ffffff;' : ''"
        >
          <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">📟</div>
          <div style="font-weight: 800; font-size: 0.9375rem;">iPad Air - Karen Home</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Safari / iPadOS</div>
          <span v-if="authStore.deviceName.includes('iPad')" style="display: inline-block; margin-top: 0.5rem; font-size: 0.6875rem; background: var(--primary); color: white; padding: 0.15rem 0.5rem; border-radius: var(--radius-sm); font-weight: 700;">
            Current Device
          </span>
        </button>

        <button 
          @click="switchDevice('desktop')" 
          class="card"
          style="padding: 1.25rem; text-align: left; cursor: pointer; transition: all 0.2s;"
          :style="authStore.deviceName.includes('MacBook') ? 'border: 2px solid var(--primary); background: #ffffff;' : ''"
        >
          <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">💻</div>
          <div style="font-weight: 800; font-size: 0.9375rem;">MacBook Pro - Nairobi Office</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Chrome / macOS Westlands</div>
          <span v-if="authStore.deviceName.includes('MacBook')" style="display: inline-block; margin-top: 0.5rem; font-size: 0.6875rem; background: var(--primary); color: white; padding: 0.15rem 0.5rem; border-radius: var(--radius-sm); font-weight: 700;">
            Current Device
          </span>
        </button>
      </div>
    </div>

    <!-- Connected devices -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.1rem; font-weight: 700;">
          Your connected devices
        </h3>
        <span style="font-size: 0.8125rem; color: var(--text-muted);">
          Total: <strong>{{ authStore.devices.length }}</strong>
        </span>
      </div>

      <div style="overflow-x: auto;">
        <table class="devices-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
              <th style="padding: 0.875rem 1.5rem;">Device Name</th>
              <th style="padding: 0.875rem 1rem;">Type</th>
              <th style="padding: 0.875rem 1rem;">OS & Browser</th>
              <th style="padding: 0.875rem 1rem;">Last Active</th>
              <th style="padding: 0.875rem 1rem;">Status</th>
              <th style="padding: 0.875rem 1.5rem; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="d in authStore.devices" 
              :key="d.id"
              style="border-bottom: 1px solid var(--border);"
            >
              <td data-label="Device" style="padding: 1rem 1.5rem;">
                <div style="font-weight: 700; color: var(--text-main);">{{ d.device_name }}</div>
              </td>
              <td data-label="Type" style="padding: 1rem;">
                <span style="text-transform: capitalize; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.75rem;">
                  {{ d.device_type || 'desktop' }}
                </span>
              </td>
              <td data-label="OS & Browser" style="padding: 1rem; color: var(--text-muted);">
                {{ d.os || 'macOS' }} • {{ d.browser || 'Browser' }}
              </td>
              <td data-label="Last Active" style="padding: 1rem; color: var(--text-muted);">
                {{ new Date(d.last_active).toLocaleString('en-GB') }}
              </td>
              <td data-label="Status" style="padding: 1rem;">
                <span 
                  v-if="d.device_id === authStore.deviceId"
                  style="background: #d1fae5; color: #065f46; font-size: 0.6875rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: var(--radius-full);"
                >
                  THIS DEVICE
                </span>
                <span 
                  v-else
                  style="background: #e2e8f0; color: #475569; font-size: 0.6875rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: var(--radius-full);"
                >
                  REMOTE DEVICE
                </span>
              </td>
              <td data-label="Action" style="padding: 1rem 1.5rem; text-align: right;">
                <button 
                  v-if="d.device_id !== authStore.deviceId"
                  @click="disconnectDevice(d.device_id)" 
                  style="font-size: 0.75rem; color: var(--danger); font-weight: 600;"
                >
                  Disconnect
                </button>
                <span v-else style="font-size: 0.75rem; color: var(--text-light);">
                  Active Session
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useCartStore } from '../stores/cart';

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: '/devices' } });
    return;
  }
  await refreshAll();
});

async function refreshAll() {
  await authStore.fetchDevices();
  await cartStore.fetchCart();
}

async function switchDevice(type) {
  authStore.simulateDeviceProfile(type);
  await refreshAll();
}

async function disconnectDevice(devId) {
  if (confirm('Are you sure you want to disconnect this device from your account?')) {
    await authStore.disconnectDevice(devId);
  }
}
</script>
