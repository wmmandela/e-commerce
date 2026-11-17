<template>
  <div class="app-layout">
    <!-- Main Navigation Bar -->
    <Navbar />

    <!-- Main Route View -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Global Footer -->
    <Footer />

    <!-- Always mounted with the app shell so it remains present across route changes. -->
    <Teleport to="body">
    <nav class="mobile-bottom-nav" aria-label="Main navigation">
      <router-link to="/" class="mobile-nav-item">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>
        <span>Home</span>
      </router-link>
      <router-link to="/catalogue" class="mobile-nav-item">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>
        <span>Shop</span>
      </router-link>
      <router-link to="/cart" class="mobile-nav-item">
        <span class="mobile-cart-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
          <span v-if="cartStore.totalItemsCount > 0" class="mobile-cart-badge">{{ cartStore.totalItemsCount }}</span>
        </span>
        <span>Cart</span>
      </router-link>
      <router-link :to="authStore.isAuthenticated ? '/transactions' : '/login'" class="mobile-nav-item">
        <svg v-if="authStore.isAuthenticated" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18M19 9l-5 5-4-4-3 3"/></svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
        <span>{{ authStore.isAuthenticated ? 'Payments' : 'Sign in' }}</span>
      </router-link>
    </nav>
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useCartStore } from './stores/cart';
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';

const authStore = useAuthStore();
const cartStore = useCartStore();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await authStore.fetchCurrentUser();
    await authStore.fetchDevices();
  }
  await cartStore.fetchCart();
});
</script>

<style>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  min-width: 0;
}

.main-content {
  flex: 1;
  width: 100%;
  min-width: 0;
}
</style>
