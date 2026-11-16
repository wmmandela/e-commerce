<template>
  <header class="navbar">
    <div class="container navbar-inner">
      <!-- Brand -->
      <router-link to="/" class="navbar-brand">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <div style="display: flex; flex-direction: column;">
          <span style="line-height: 1.1;">Soko<span style="color: #059669;">Bora</span> <span style="font-size: 0.8rem; background: #000; color: #fff; padding: 0.1rem 0.4rem; border-radius: 4px; margin-left: 0.2rem;">🇰🇪 KE</span></span>
          <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; letter-spacing: 0.05em;">PREMIER KENYA MARKETPLACE</span>
        </div>
      </router-link>

      <!-- Nav Links -->
      <nav style="display: flex; align-items: center; gap: 1.5rem;" class="nav-links-desktop">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/catalogue" class="nav-link">Catalogue</router-link>
        <router-link to="/devices" class="nav-link" v-if="authStore.isAuthenticated">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
          Multi-Device Hub
        </router-link>
        <router-link to="/transactions" class="nav-link" v-if="authStore.isAuthenticated">
          Transactions
        </router-link>
      </nav>

      <!-- Search Input -->
      <div class="navbar-search">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input 
          type="text" 
          class="search-input" 
          placeholder="Search products..."
          v-model="searchInput"
          @keyup.enter="handleSearch"
        />
      </div>

      <!-- Actions: Cart & User -->
      <div class="navbar-actions">
        <!-- Cart Button -->
        <router-link to="/cart" class="cart-btn" title="View Shopping Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span v-if="cartStore.totalItemsCount > 0" class="cart-badge">
            {{ cartStore.totalItemsCount }}
          </span>
        </router-link>

        <!-- User Authentication State -->
        <div v-if="authStore.isAuthenticated" class="user-menu">
          <button @click="isUserMenuOpen = !isUserMenuOpen" class="user-btn">
            <img :src="authStore.user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=kenya'" alt="Avatar" class="user-avatar" />
            <span style="font-size: 0.875rem; font-weight: 600;">{{ authStore.user?.name?.split(' ')[0] }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          <!-- Dropdown -->
          <div v-if="isUserMenuOpen" class="dropdown-menu">
            <div class="dropdown-header">
              <div class="dropdown-user-name">{{ authStore.user?.name }}</div>
              <div class="dropdown-user-email">{{ authStore.user?.email }} • {{ authStore.user?.county || 'Nairobi' }}</div>
            </div>
            <router-link to="/orders" class="dropdown-item" @click="isUserMenuOpen = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              My Orders
            </router-link>
            <router-link to="/transactions" class="dropdown-item" @click="isUserMenuOpen = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
              Transactions
            </router-link>
            <router-link to="/devices" class="dropdown-item" @click="isUserMenuOpen = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Connected Devices
            </router-link>
            <button @click="handleLogout" class="dropdown-item" style="color: var(--danger); border-top: 1px solid var(--border); margin-top: 0.25rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        <!-- Guest Links -->
        <div v-else style="display: flex; align-items: center; gap: 0.5rem;">
          <router-link to="/login" class="btn btn-secondary btn-sm">
            Sign In
          </router-link>
          <router-link to="/register" class="btn btn-primary btn-sm">
            Register
          </router-link>
        </div>
      </div>
    </div>
  </header>
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
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useCartStore } from '../stores/cart';
import { useProductStore } from '../stores/products';

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const productStore = useProductStore();

const searchInput = ref('');
const isUserMenuOpen = ref(false);

function handleSearch() {
  if (searchInput.value.trim()) {
    productStore.setSearch(searchInput.value.trim());
    router.push('/catalogue');
  }
}

function handleLogout() {
  isUserMenuOpen.value = false;
  authStore.logout();
  router.push('/login');
}
</script>
