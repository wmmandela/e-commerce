<template>
  <div class="product-card">
    <div class="product-image-wrap">
      <router-link :to="`/product/${product.slug || product.id}`">
        <img :src="product.image_url" :alt="product.title" class="product-image" loading="lazy" />
      </router-link>
      <span v-if="product.is_featured" class="product-badge-featured">⭐ Featured</span>
      <span class="product-badge-stock">
        {{ product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock' }}
      </span>
    </div>

    <div class="product-body">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
        <span class="product-category">{{ product.category_name || product.brand }}</span>
        <span v-if="product.kebs_certified" style="font-size: 0.65rem; background: #ecfdf5; color: #047857; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 4px; border: 1px solid #a7f3d0;">
          ✓ KEBS Approved
        </span>
      </div>
      
      <router-link :to="`/product/${product.slug || product.id}`">
        <h3 class="product-title" :title="product.title">{{ product.title }}</h3>
      </router-link>

      <div class="product-rating">
        <span class="stars">
          ★ {{ product.rating ? product.rating.toFixed(1) : '4.8' }}
        </span>
        <span>({{ product.review_count || 12 }} customer reviews)</span>
      </div>

      <div class="product-price-row">
        <div>
          <span class="price-main">KSh {{ formatPrice(product.price) }}</span>
          <span v-if="product.original_price" class="price-original">
            KSh {{ formatPrice(product.original_price) }}
          </span>
        </div>

        <button 
          @click="handleAddToCart" 
          class="btn btn-primary btn-sm"
          :disabled="isAdding || product.stock <= 0"
          :title="product.stock <= 0 ? 'Out of stock' : 'Add to cart'"
        >
          <svg v-if="!isAdding" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span v-if="isAdding">Added!</span>
          <span v-else>Add</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCartStore } from '../stores/cart';

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
});

const cartStore = useCartStore();
const isAdding = ref(false);

function formatPrice(val) {
  if (!val) return '0';
  return Number(val).toLocaleString();
}

async function handleAddToCart() {
  if (props.product.stock <= 0) return;
  isAdding.value = true;
  await cartStore.addToCart(props.product, 1);
  setTimeout(() => {
    isAdding.value = false;
  }, 1000);
}
</script>
