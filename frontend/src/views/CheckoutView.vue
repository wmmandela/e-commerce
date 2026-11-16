<template>
  <div class="container checkout-page" style="padding: 2.5rem 1.25rem 5rem;">
    <!-- Breadcrumb -->
    <div style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.5rem;">
      <router-link to="/cart" style="color: var(--primary);">Shopping Cart</router-link> / 
      <span>Checkout</span>
    </div>

    <h1 class="checkout-title" style="font-size: 2rem; font-weight: 800; margin-bottom: 2rem;">Checkout & M-Pesa Payment</h1>

    <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 2rem; align-items: flex-start;" class="checkout-layout">
      <!-- Checkout Form -->
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Delivery Details -->
        <div class="card" style="padding: 1.75rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
            <div style="width: 2rem; height: 2rem; background: var(--primary-light); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">
              1
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 800;">Delivery Information (Kenya)</h3>
          </div>

          <form @submit.prevent="handlePlaceOrder">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="shipping.name" 
                  placeholder="e.g. Mandela Machera" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Safaricom M-Pesa Phone Number *</label>
                <input 
                  type="tel" 
                  class="form-input" 
                  v-model="shipping.phone" 
                  placeholder="e.g. 0712345678 or 254712345678" 
                  required 
                />
              </div>
            </div>

            <!-- Kenyan Counties & Estates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="form-grid-2">
              <div class="form-group">
                <label class="form-label">County *</label>
                <select class="form-input" v-model="shipping.county" required>
                  <option value="Nairobi">Nairobi County</option>
                  <option value="Mombasa">Mombasa County</option>
                  <option value="Kisumu">Kisumu County</option>
                  <option value="Nakuru">Nakuru County</option>
                  <option value="Eldoret (Uasin Gishu)">Uasin Gishu (Eldoret)</option>
                  <option value="Kisii">Kisii County</option>
                  <option value="Kiambu">Kiambu County</option>
                  <option value="Machakos">Machakos County</option>
                  <option value="Kajiado">Kajiado County</option>
                  <option value="Nyeri">Nyeri County</option>
                  <option value="Kilifi">Kilifi County</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Estate / Town / Neighborhood *</label>
                <input 
                  type="text" 
                  class="form-input" 
                  v-model="shipping.estate" 
                  placeholder="e.g. Kilimani, Westlands, Roysambu, Nyali" 
                  required 
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Building / House Number / Street Address *</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="shipping.address" 
                placeholder="e.g. The Mirage Tower, Floor 4, Chiromo Rd or House 12B" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label">Country</label>
              <input 
                type="text" 
                class="form-input" 
                value="Kenya 🇰🇪" 
                disabled 
                style="background: #f1f5f9; cursor: not-allowed; font-weight: 700;" 
              />
            </div>
          </form>
        </div>

        <!-- Payment Method Selection -->
        <div class="card" style="padding: 1.75rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
            <div style="width: 2rem; height: 2rem; background: var(--mpesa-light); color: var(--mpesa-dark); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">
              2
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 800;">Payment Method</h3>
          </div>

          <!-- M-PESA option -->
          <div style="border: 2px solid #10b981; border-radius: var(--radius-xl); padding: 1.25rem; background: #ecfdf5; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 2.75rem; height: 2.75rem; background: #059669; color: white; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.875rem;">
                MPESA
              </div>
              <div>
                <div style="font-weight: 800; font-size: 1rem; color: #065f46;">
                  Lipa Na M-PESA
                </div>
                <div style="font-size: 0.8125rem; color: #047857;">
                  Approve the secure payment prompt on your phone.
                </div>
              </div>
            </div>

            <div style="color: #059669; font-weight: 800; font-size: 1.25rem;">
              ●
            </div>
          </div>
        </div>
      </div>

      <!-- Order Review Sidebar -->
      <aside class="card" style="padding: 1.5rem; position: sticky; top: 5.5rem;">
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);">
          Order Summary ({{ cartStore.totalItemsCount }} {{ cartStore.totalItemsCount === 1 ? 'item' : 'items' }})
        </h3>

        <!-- Items list preview -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 240px; overflow-y: auto; margin-bottom: 1.25rem; padding-right: 0.35rem;">
          <div 
            v-for="item in cartStore.items" 
            :key="item.product_id || item.id"
            style="display: flex; gap: 0.75rem; align-items: center; font-size: 0.875rem;"
          >
            <img :src="item.image_url" :alt="item.title" style="width: 44px; height: 44px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border);" />
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.title }}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">{{ item.quantity }} × KSh {{ Number(item.price).toLocaleString() }}</div>
            </div>
            <div style="font-weight: 700; color: #064e3b;">
              KSh {{ (item.price * item.quantity).toLocaleString() }}
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.625rem; font-size: 0.875rem; padding-top: 1rem; border-top: 1px solid var(--border); margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Subtotal</span>
            <strong>KSh {{ Number(cartStore.summary.subtotal).toLocaleString() }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Transport Fee</span>
            <strong>KSh {{ Number(cartStore.summary.shippingFee).toLocaleString() }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">VAT (KRA 16%)</span>
            <strong>KSh {{ Number(cartStore.summary.tax).toLocaleString() }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 800; padding-top: 0.75rem; border-top: 1px solid var(--border); margin-top: 0.25rem;">
            <span>Total to Pay</span>
            <span style="color: #059669;">
              KSh {{ Number(cartStore.summary.total).toLocaleString() }}
            </span>
          </div>
        </div>

        <button 
          @click="handlePlaceOrder" 
          class="btn btn-mpesa btn-block btn-lg"
          :disabled="isSubmitting || cartStore.items.length === 0"
        >
          <span v-if="isSubmitting">Creating Order...</span>
          <span v-else>Proceed to M-PESA Payment</span>
        </button>

        <div v-if="error" style="margin-top: 1rem; padding: 0.75rem; background: var(--danger-light); color: var(--danger); font-size: 0.8125rem; border-radius: var(--radius-md);">
          {{ error }}
        </div>
      </aside>
    </div>

    <!-- M-PESA payment confirmation -->
    <MpesaModal 
      v-if="showMpesaModal && currentOrder" 
      :order="currentOrder" 
      @close="showMpesaModal = false"
      @payment-success="handlePaymentSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useCartStore } from '../stores/cart';
import MpesaModal from '../components/MpesaModal.vue';

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();

const shipping = ref({
  name: authStore.user?.name || 'Mandela Machera',
  phone: authStore.user?.phone || '254712345678',
  county: authStore.user?.county || 'Nairobi',
  estate: authStore.user?.estate || 'Kilimani',
  address: 'The Mirage Tower, Floor 4, Chiromo Rd'
});

const isSubmitting = ref(false);
const error = ref(null);
const showMpesaModal = ref(false);
const currentOrder = ref(null);

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: '/checkout' } });
    return;
  }
  await cartStore.fetchCart();
  if (cartStore.items.length === 0) {
    router.push('/cart');
  }
});

async function handlePlaceOrder() {
  if (!shipping.value.name || !shipping.value.phone || !shipping.value.address) {
    error.value = 'Please provide your full name, phone number, and delivery address.';
    return;
  }

  isSubmitting.value = true;
  error.value = null;

  try {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: authStore.authHeaders,
      body: JSON.stringify({
        shippingName: shipping.value.name,
        shippingPhone: shipping.value.phone,
        shippingCounty: shipping.value.county,
        shippingEstate: shipping.value.estate,
        shippingAddress: shipping.value.address
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');

    currentOrder.value = data.order;
    showMpesaModal.value = true;
  } catch (err) {
    error.value = err.message;
  } finally {
    isSubmitting.value = false;
  }
}

function handlePaymentSuccess(paymentData) {
  cartStore.items = [];
  cartStore.fetchCart();
}
</script>

<style scoped>
@media (max-width: 860px) {
  .checkout-layout {
    grid-template-columns: 1fr !important;
  }
  .form-grid-2 {
    grid-template-columns: 1fr !important;
  }
}
</style>
