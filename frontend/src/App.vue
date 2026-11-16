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
}

.main-content {
  flex: 1;
}
</style>
