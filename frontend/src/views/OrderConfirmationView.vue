<template>
  <div class="container order-confirmation-page" style="padding: 3rem 1.25rem 5rem; max-width: 760px;">
    <div v-if="loading" style="text-align: center; padding: 4rem 0;">
      <p>Loading your order details...</p>
    </div>

    <div v-else-if="order" class="card order-receipt" style="padding: 2.5rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);">
      <!-- Success Icon -->
      <div style="text-align: center; margin-bottom: 2rem;">
        <div :style="order.status === 'paid' ? 'width: 4.5rem; height: 4.5rem; background: #d1fae5; color: #059669; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;' : 'width: 4.5rem; height: 4.5rem; background: #fef3c7; color: #b45309; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;'">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span :style="order.status === 'paid' ? 'font-size: 0.8125rem; font-weight: 800; color: #059669; background: #ecfdf5; padding: 0.25rem 0.75rem; border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.05em;' : 'font-size: 0.8125rem; font-weight: 800; color: #92400e; background: #fef3c7; padding: 0.25rem 0.75rem; border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.05em;'">
          {{ order.status === 'paid' ? 'Payment confirmed' : order.status === 'payment_failed' ? 'Payment not completed' : 'Awaiting payment' }}
        </span>
        <h1 style="font-size: 2rem; font-weight: 800; margin-top: 0.5rem; margin-bottom: 0.25rem;">{{ order.status === 'paid' ? 'Thank you for your order' : 'Complete your payment' }}</h1>
        <p style="color: var(--text-muted); font-size: 0.9375rem;">
          <template v-if="order.status === 'paid'">Your payment is confirmed. Your receipt is ready below.</template>
          <template v-else-if="order.status === 'payment_failed'">The payment request was not completed. You can try again.</template>
          <template v-else>We’re still waiting for M-PESA to confirm this payment.</template>
        </p>
        <button v-if="order.status === 'pending' || order.status === 'payment_failed'" @click="showPayment = true" class="btn btn-mpesa" style="margin-top: 1rem;">
          {{ order.status === 'payment_failed' ? 'Try payment again' : 'Continue payment' }}
        </button>
      </div>

      <!-- Key Details Card -->
      <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
        <div class="order-detail-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; font-size: 0.875rem;">
          <div>
            <span style="color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Order Number</span>
            <strong style="font-size: 1rem; color: var(--primary);">{{ order.order_number }}</strong>
          </div>
          <div>
            <span style="color: var(--text-muted); display: block; margin-bottom: 0.25rem;">M-PESA Receipt</span>
            <strong style="font-size: 1rem; color: #047857; font-family: monospace;">{{ order.payment?.mpesa_ref || 'Pending' }}</strong>
          </div>
          <div>
            <span style="color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Transaction Date</span>
            <strong>{{ new Date(order.created_at).toLocaleDateString('en-GB') }}</strong>
          </div>
          <div>
            <span style="color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Payment Method</span>
            <strong>M-PESA</strong>
          </div>
        </div>
      </div>

      <!-- Items List -->
      <div style="margin-bottom: 2rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem;">Items in Your Order</h3>
        <div style="border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;">
          <div 
            v-for="item in order.items" 
            :key="item.id"
            style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border);"
          >
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img :src="item.image_url" :alt="item.title" style="width: 48px; height: 48px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border);" />
              <div>
                <div style="font-weight: 700; font-size: 0.9375rem;">{{ item.title }}</div>
                <div style="font-size: 0.8125rem; color: var(--text-muted);">Quantity: {{ item.quantity }}</div>
              </div>
            </div>
            <strong style="font-size: 0.9375rem; color: #064e3b;">
              KSh {{ (item.price * item.quantity).toLocaleString() }}
            </strong>
          </div>

          <div style="padding: 1.25rem; background: #f8fafc; font-size: 0.9375rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Subtotal</span>
              <span>KSh {{ Number(order.subtotal).toLocaleString() }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Transport Fee</span>
              <span>{{ order.shipping_fee === 0 ? 'FREE' : `KSh ${Number(order.shipping_fee).toLocaleString()}` }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
              <span style="color: var(--text-muted);">VAT (KRA 16%)</span>
              <span>KSh {{ Number(order.tax).toLocaleString() }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 800; border-top: 1px solid var(--border); padding-top: 0.75rem;">
              <span>{{ order.status === 'paid' ? 'Total paid' : 'Order total' }}</span>
              <span style="color: #059669;">KSh {{ Number(order.total_amount).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Delivery Address in Kenya -->
      <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 2rem;">
        <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
          Delivery Destination in Kenya
        </h4>
        <div style="font-weight: 700; font-size: 0.9375rem;">{{ order.shipping_name }}</div>
        <div style="color: var(--text-muted); font-size: 0.875rem;">
          {{ order.shipping_address }}, {{ order.shipping_estate }}, {{ order.shipping_county }}, Kenya 🇰🇪
        </div>
        <div style="color: var(--text-muted); font-size: 0.875rem;">Phone: {{ order.shipping_phone }}</div>
      </div>

      <!-- Action Buttons -->
      <div v-if="order.status === 'paid'" class="receipt-actions" style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <button @click="printReceipt" class="btn btn-outline" style="flex: 1;">
          🖨️ Print Invoice
        </button>
        <router-link to="/orders" class="btn btn-secondary" style="flex: 1;">
          My Orders
        </router-link>
        <router-link to="/catalogue" class="btn btn-primary" style="flex: 1.5;">
          Continue Shopping
        </router-link>
      </div>
    </div>
    <div v-else class="card" style="text-align: center; padding: 3rem 2rem;">
      <h1 style="font-size: 1.5rem; margin-bottom: 0.75rem;">Order unavailable</h1>
      <p style="color: var(--text-muted);">We couldn’t load this order. Please check My Orders or try again.</p>
      <router-link to="/orders" class="btn btn-primary" style="margin-top: 1rem;">My Orders</router-link>
    </div>

    <MpesaModal v-if="showPayment && order" :order="order" @close="showPayment = false" @payment-success="refreshOrder" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import MpesaModal from '../components/MpesaModal.vue';

const route = useRoute();
const authStore = useAuthStore();
const order = ref(null);
const loading = ref(true);
const showPayment = ref(false);
let statusTimer;

onMounted(async () => {
  await refreshOrder();
  if (order.value && order.value.status !== 'paid') {
    statusTimer = setInterval(refreshOrder, 5000);
  }
});

onUnmounted(() => clearInterval(statusTimer));

async function refreshOrder() {
  try {
    const res = await fetch(`/api/orders/${route.params.orderId}`, { headers: authStore.authHeaders });
    if (!res.ok) throw new Error('Could not load order');
    order.value = await res.json();
    if (order.value.status === 'paid') clearInterval(statusTimer);
  } catch (err) {
    console.error('Failed to fetch order', err);
  } finally {
    loading.value = false;
  }
}

function printReceipt() {
  window.print();
}
</script>
