<template>
  <div class="container orders-page" style="padding: 2.5rem 1.25rem 4rem;">
    <!-- Breadcrumb -->
    <div style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.5rem;">
      <router-link to="/" style="color: var(--primary);">Home</router-link> / 
      <span>My Orders</span>
    </div>

    <div class="orders-heading" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1 style="font-size: 2.25rem; font-weight: 800;">My Order History</h1>
        <p style="color: var(--text-muted); font-size: 0.9375rem;">
          View past purchases and verified Lipa Na M-PESA receipts.
        </p>
      </div>

      <router-link to="/catalogue" class="btn btn-primary btn-sm">
        + Place New Order
      </router-link>
    </div>

    <div v-if="loading" style="text-align: center; padding: 4rem 0;">
      <p>Loading your orders...</p>
    </div>

    <div v-else-if="orders.length === 0" class="card" style="text-align: center; padding: 4rem 2rem;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">No orders placed yet</h3>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">You haven't made any purchases yet. Explore our Kenyan catalogue to find genuine products!</p>
      <router-link to="/catalogue" class="btn btn-primary">
        Browse Catalogue
      </router-link>
    </div>

    <div v-else class="orders-list" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <div 
        v-for="ord in orders" 
        :key="ord.id" 
        class="card order-card"
        style="padding: 1.5rem; transition: all 0.2s;"
      >
        <div class="order-card-heading" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Order Number</span>
            <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">{{ ord.order_number }}</div>
          </div>

          <div class="order-meta" style="display: flex; align-items: center; gap: 1.5rem; font-size: 0.875rem;">
            <div>
              <span style="color: var(--text-muted);">Date: </span>
              <strong>{{ new Date(ord.created_at).toLocaleDateString('en-GB') }}</strong>
            </div>

            <div>
              <span style="color: var(--text-muted);">Total: </span>
              <strong style="color: #064e3b; font-size: 1.05rem;">KSh {{ Number(ord.total_amount).toLocaleString() }}</strong>
            </div>

            <!-- Status Pill -->
            <span 
              v-if="ord.status === 'paid'"
              style="background: #d1fae5; color: #065f46; font-size: 0.75rem; font-weight: 800; padding: 0.3rem 0.75rem; border-radius: var(--radius-full); text-transform: uppercase;"
            >
              ✓ PAID ({{ ord.mpesa_ref || 'Receipt pending' }})
            </span>
            <span
              v-else-if="ord.status === 'payment_failed'"
              style="background: #fee2e2; color: #991b1b; font-size: 0.75rem; font-weight: 800; padding: 0.3rem 0.75rem; border-radius: var(--radius-full); text-transform: uppercase;"
            >
              Payment not completed
            </span>
            <span
              v-else-if="ord.status === 'payment_review'"
              style="background: #fef3c7; color: #92400e; font-size: 0.75rem; font-weight: 800; padding: 0.3rem 0.75rem; border-radius: var(--radius-full); text-transform: uppercase;"
            >
              Checking payment
            </span>
            <span 
              v-else
              style="background: #fef3c7; color: #92400e; font-size: 0.75rem; font-weight: 800; padding: 0.3rem 0.75rem; border-radius: var(--radius-full); text-transform: uppercase;"
            >
              ● PENDING PAYMENT
            </span>
          </div>
        </div>

        <div class="order-card-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div class="order-recipient" style="font-size: 0.875rem; color: var(--text-muted);">
            Recipient: <strong>{{ ord.shipping_name }}</strong> • {{ ord.shipping_estate }}, {{ ord.shipping_county }} ({{ ord.shipping_phone }})
          </div>

          <router-link :to="`/order-confirmation/${ord.id}`" class="btn btn-outline btn-sm">
            View Full Invoice →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const orders = ref([]);
const loading = ref(true);

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  try {
    const res = await fetch('/api/orders', {
      headers: authStore.authHeaders
    });
    if (res.ok) {
      orders.value = await res.json();
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>
