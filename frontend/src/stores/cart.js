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
      const saved = localStorage.getItem('sokobora_guest_cart');
      if (saved) {
        try {
          items.value = JSON.parse(saved);
        } catch (e) {
          items.value = [];
        }
      }
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
      const existing = items.value.find(i => i.product_id === product.id || i.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.value.push({
          product_id: product.id,
          id: product.id,
          title: product.title,
          brand: product.brand,
          price: product.price,
          original_price: product.original_price,
          image_url: product.image_url,
          stock: product.stock,
          quantity
        });
      }
      localStorage.setItem('sokobora_guest_cart', JSON.stringify(items.value));
      calculateLocalSummary();
      return { success: true };
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
      const item = items.value.find(i => i.product_id === productId || i.id === productId);
      if (item) {
        if (quantity <= 0) {
          items.value = items.value.filter(i => (i.product_id || i.id) !== productId);
        } else {
          item.quantity = quantity;
        }
      }
      localStorage.setItem('sokobora_guest_cart', JSON.stringify(items.value));
      calculateLocalSummary();
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
      items.value = items.value.filter(i => (i.product_id || i.id) !== productId);
      localStorage.setItem('sokobora_guest_cart', JSON.stringify(items.value));
      calculateLocalSummary();
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
      items.value = [];
      localStorage.removeItem('sokobora_guest_cart');
      calculateLocalSummary();
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

  async function mergeGuestCart() {
    const saved = localStorage.getItem('sokobora_guest_cart');
    if (!saved || !authStore.isAuthenticated) return;

    try {
      const guestItems = JSON.parse(saved).map(i => ({
        productId: i.product_id || i.id,
        quantity: i.quantity || 1
      }));

      if (guestItems.length > 0) {
        const res = await fetch('/api/cart/merge', {
          method: 'POST',
          headers: authStore.authHeaders,
          body: JSON.stringify({ guestItems })
        });
        if (res.ok) {
          const data = await res.json();
          items.value = data.cart.items;
          summary.value = data.cart.summary;
          localStorage.removeItem('sokobora_guest_cart');
          lastSynced.value = new Date().toLocaleTimeString();
        }
      }
    } catch (e) {
      console.warn('Cart merge error:', e);
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
    clearCart,
    mergeGuestCart
  };
});
