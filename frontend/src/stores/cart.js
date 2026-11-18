import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';

export const useCartStore = defineStore('cart', () => {
  const authStore = useAuthStore();
  
  const items = ref([]);
  const summary = ref({
    subtotal: 0,
    shippingFee: 0,
    tax: 0,
    total: 0,
    totalItems: 0,
    currency: 'KSh'
  });
  const loading = ref(false);
  const lastSynced = ref(null);
  const syncMessage = ref('');

  const totalItemsCount = computed(() => {
    return items.value.reduce((acc, item) => acc + (item.quantity || 1), 0);
  });

  function calculateLocalSummary() {
    let subtotal = 0;
    let totalItems = 0;
    items.value.forEach(item => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      subtotal += itemTotal;
      totalItems += item.quantity || 1;
    });

    const shippingFee = subtotal > 0 ? 10 : 0;
    const tax = Math.round(subtotal * 0.16); // 16% Kenya VAT
    const total = subtotal + shippingFee + tax;

    summary.value = {
      subtotal,
      shippingFee,
      tax,
      total,
      totalItems,
      currency: 'KSh'
    };
  }

  async function fetchCart() {
    if (!authStore.isAuthenticated) {
      localStorage.removeItem('sokobora_guest_cart');
      items.value = [];
      calculateLocalSummary();
      return;
    }

    loading.value = true;
    try {
      const res = await fetch('/api/cart', {
        headers: authStore.authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        items.value = data.cart.items;
        summary.value = data.cart.summary;
        lastSynced.value = new Date().toLocaleTimeString();
      }
    } catch (err) {
      console.warn('Failed to fetch remote cart:', err);
    } finally {
      loading.value = false;
    }
  }

  async function addToCart(product, quantity = 1) {
    if (!authStore.isAuthenticated) {
      return { success: false, requiresAuth: true };
    }

    loading.value = true;
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: authStore.authHeaders,
        body: JSON.stringify({ productId: product.id, quantity })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add item to cart');

      items.value = data.cart.items;
      summary.value = data.cart.summary;
      lastSynced.value = new Date().toLocaleTimeString();
      syncMessage.value = `Cart synced to ${authStore.deviceName}`;
      return data;
    } catch (err) {
      alert(err.message);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateQuantity(productId, quantity) {
    if (!authStore.isAuthenticated) {
      return;
    }

    loading.value = true;
    try {
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: authStore.authHeaders,
        body: JSON.stringify({ productId, quantity })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update quantity');

      items.value = data.cart.items;
      summary.value = data.cart.summary;
      lastSynced.value = new Date().toLocaleTimeString();
    } catch (err) {
      alert(err.message);
    } finally {
      loading.value = false;
    }
  }

  async function removeFromCart(productId) {
    if (!authStore.isAuthenticated) {
      return;
    }

    loading.value = true;
    try {
      const res = await fetch(`/api/cart/item/${productId}`, {
        method: 'DELETE',
        headers: authStore.authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Haikuweza kuondolewa');

      items.value = data.cart.items;
      summary.value = data.cart.summary;
      lastSynced.value = new Date().toLocaleTimeString();
    } catch (err) {
      alert(err.message);
    } finally {
      loading.value = false;
    }
  }

  async function clearCart() {
    if (!authStore.isAuthenticated) {
      return;
    }

    loading.value = true;
    try {
      const res = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: authStore.authHeaders
      });
      const data = await res.json();
      items.value = [];
      summary.value = data.cart.summary;
      lastSynced.value = new Date().toLocaleTimeString();
    } catch (err) {
      console.warn('Failed to clear cart:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    summary,
    loading,
    lastSynced,
    syncMessage,
    totalItemsCount,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };
});
