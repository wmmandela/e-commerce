<template>
  <div class="container" style="padding: 2.5rem 1.25rem 4rem;">
    <!-- Title & Device Synced Notice -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1 style="font-size: 2.25rem; font-weight: 800;">Shopping Cart</h1>
        <p style="color: var(--text-muted); font-size: 0.9375rem;">
          Review your selected items before proceeding to secure Lipa Na M-PESA checkout.
        </p>
      </div>

      <div v-if="authStore.isAuthenticated" style="display: flex; align-items: center; gap: 0.5rem; background: var(--mpesa-light); border: 1px solid #a7f3d0; padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: 0.8125rem; color: var(--mpesa-dark);">
        <span class="pulse-dot"></span>
        <span>
          Your cart is saved to your account, {{ authStore.user?.name }}.
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="cartStore.items.length === 0" class="card" style="text-align: center; padding: 5rem 2rem;">
      <div style="width: 5rem; height: 5rem; background: var(--primary-light); color: var(--primary); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </div>
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">Your shopping cart is empty</h2>
      <p style="color: var(--text-muted); max-width: 420px; margin: 0 auto 2rem; font-size: 0.9375rem;">
        Explore our curated Kenyan electronics, fashion, and home appliances catalogue.
      </p>
      <router-link to="/catalogue" class="btn btn-primary btn-lg">
        Browse Catalogue
      </router-link>
    </div>

    <!-- Filled Cart Layout -->
    <div v-else style="display: grid; grid-template-columns: 1fr 380px; gap: 2.5rem; align-items: start;" class="cart-layout">
      <!-- Items List -->
      <div>
        <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 1.5rem;">
          <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
            <span style="font-weight: 700; font-size: 0.9375rem;">
              Items in Cart ({{ cartStore.totalItemsCount }})
            </span>
            <button @click="cartStore.clearCart" style="font-size: 0.8125rem; color: var(--danger); font-weight: 600;">
              Clear All
            </button>
          </div>

          <!-- Items rows -->
          <div 
            v-for="item in cartStore.items" 
            :key="item.product_id || item.id"
            style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; gap: 1.25rem; align-items: center;"
            class="cart-item-row"
          >
            <!-- Image -->
            <img 
              :src="item.image_url" 
              :alt="item.title" 
              style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-lg); border: 1px solid var(--border);"
            />

            <!-- Info -->
            <div style="flex: 1;">
              <div style="font-size: 0.75rem; color: var(--primary); font-weight: 700; text-transform: uppercase;">
                {{ item.brand }}
              </div>
              <router-link :to="`/product/${item.slug || item.product_id || item.id}`">
                <h4 style="font-size: 0.9375rem; font-weight: 700; line-height: 1.4; margin-bottom: 0.25rem;">
                  {{ item.title }}
                </h4>
              </router-link>
              <div style="font-size: 0.875rem; font-weight: 800; color: #064e3b;">
                KSh {{ Number(item.price).toLocaleString() }}
              </div>
            </div>

            <!-- Quantity Counter -->
            <div style="display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-md); background: #ffffff;">
              <button 
                @click="cartStore.updateQuantity(item.product_id || item.id, item.quantity - 1)" 
                style="padding: 0.35rem 0.65rem; font-weight: 700; color: var(--text-muted);"
              >
                -
              </button>
              <span style="width: 2rem; text-align: center; font-size: 0.875rem; font-weight: 700;">
                {{ item.quantity }}
              </span>
              <button 
                @click="cartStore.updateQuantity(item.product_id || item.id, item.quantity + 1)" 
                style="padding: 0.35rem 0.65rem; font-weight: 700; color: var(--text-muted);"
              >
                +
              </button>
            </div>

            <!-- Total for line -->
            <div style="width: 120px; text-align: right; font-weight: 800; font-size: 1rem; color: var(--text-main);">
              KSh {{ (item.price * item.quantity).toLocaleString() }}
            </div>

            <!-- Remove Button -->
            <button 
              @click="cartStore.removeFromCart(item.product_id || item.id)" 
              style="color: var(--text-light); transition: color 0.15s; padding: 0.25rem;"
              onmouseover="this.style.color='var(--danger)'"
              onmouseout="this.style.color='var(--text-light)'"
              title="Remove item"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <router-link to="/catalogue" class="btn btn-outline">
            ← Continue Shopping
          </router-link>
          
          <button 
            @click="cartStore.fetchCart" 
            class="btn btn-secondary btn-sm"
            title="Refresh cart"
          >
            🔄 Refresh cart
          </button>
        </div>
      </div>

      <!-- Order Summary Card -->
      <aside class="card" style="padding: 1.5rem; position: sticky; top: 5.5rem;">
        <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);">
          Order Summary (KES)
        </h3>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9375rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Subtotal</span>
            <strong>KSh {{ Number(cartStore.summary.subtotal).toLocaleString() }}</strong>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Transport Fee</span>
            <strong>
              KSh {{ Number(cartStore.summary.shippingFee).toLocaleString() }}
            </strong>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">VAT (KRA 16%)</span>
            <strong>KSh {{ Number(cartStore.summary.tax).toLocaleString() }}</strong>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 800; padding-top: 1rem; border-top: 1px solid var(--border); margin-top: 0.5rem;">
            <span>Grand Total</span>
            <span style="color: #059669;">
              KSh {{ Number(cartStore.summary.total).toLocaleString() }}
            </span>
          </div>
        </div>

        <button 
          @click="handleProceedToCheckout" 
          class="btn btn-mpesa btn-block btn-lg"
          style="margin-bottom: 0.75rem;"
        >
          Proceed to Checkout
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <div style="text-align: center; font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Secured with Safaricom Lipa Na M-Pesa</span>
        </div>
      </aside>
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
  await cartStore.fetchCart();
});

function handleProceedToCheckout() {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: '/checkout' } });
  } else {
    router.push('/checkout');
  }
}
</script>

<style scoped>
@media (max-width: 860px) {
  .cart-layout {
    grid-template-columns: 1fr !important;
  }
}
</style>
