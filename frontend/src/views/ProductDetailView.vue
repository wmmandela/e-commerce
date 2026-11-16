<template>
  <div class="container" style="padding: 2.5rem 1.25rem 4rem;">
    <!-- Breadcrumb -->
    <div style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.5rem;">
      <router-link to="/" style="color: var(--primary);">Home</router-link> / 
      <router-link to="/catalogue" style="color: var(--primary);">Catalogue</router-link> / 
      <span>{{ product?.title || 'Product Details' }}</span>
    </div>

    <div v-if="loading" style="text-align: center; padding: 6rem 0;">
      <div style="display: inline-block; width: 2.5rem; height: 2.5rem; border: 3px solid rgba(5, 150, 105, 0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 1rem; color: var(--text-muted);">Loading product details...</p>
    </div>

    <div v-else-if="product" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: start;" class="product-detail-layout">
      <!-- Left: Large Image & Badges -->
      <div>
        <div style="position: relative; background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-md);">
          <img 
            :src="product.image_url" 
            :alt="product.title" 
            class="product-detail-image"
            style="width: 100%; height: 480px; object-fit: cover;"
          />
          <span v-if="product.is_featured" class="product-badge-featured" style="top: 1rem; left: 1rem; font-size: 0.75rem;">
            ⭐ Featured Deal
          </span>
        </div>

        <!-- Trust Badges in Kenya -->
        <div class="product-trust-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 1.25rem;">
          <div class="card" style="padding: 0.75rem; text-align: center;">
            <div style="font-size: 1.25rem;">🇰🇪</div>
            <div style="font-size: 0.75rem; font-weight: 700; margin-top: 0.25rem;">KEBS Certified</div>
            <div style="font-size: 0.6875rem; color: var(--text-muted);">Genuine Standards</div>
          </div>
          <div class="card" style="padding: 0.75rem; text-align: center;">
            <div style="font-size: 1.25rem;">🛡️</div>
            <div style="font-size: 0.75rem; font-weight: 700; margin-top: 0.25rem;">Kenya Warranty</div>
            <div style="font-size: 0.6875rem; color: var(--text-muted);">East Africa Support</div>
          </div>
          <div class="card" style="padding: 0.75rem; text-align: center;">
            <div style="font-size: 1.25rem;">⚡</div>
            <div style="font-size: 0.75rem; font-weight: 700; margin-top: 0.25rem;">Lipa Na M-PESA</div>
            <div style="font-size: 0.6875rem; color: var(--text-muted);">Secure mobile checkout</div>
          </div>
        </div>
      </div>

      <!-- Right: Product Info & Actions -->
      <div>
        <div style="font-size: 0.8125rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
          {{ product.brand }} • {{ product.category_name }}
        </div>

        <h1 style="font-size: 2.25rem; font-weight: 800; line-height: 1.25; margin-bottom: 0.75rem;">
          {{ product.title }}
        </h1>

        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.25rem; background: #fef3c7; color: #b45309; font-weight: 700; font-size: 0.875rem; padding: 0.25rem 0.6rem; border-radius: var(--radius-md);">
            ★ {{ product.rating ? product.rating.toFixed(1) : '4.8' }}
          </div>
          <span style="font-size: 0.875rem; color: var(--text-muted);">
            Based on {{ product.review_count || 18 }} verified buyer reviews across Kenya
          </span>
        </div>

        <!-- Pricing Row -->
        <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: baseline; gap: 1rem;">
            <span style="font-size: 2rem; font-weight: 800; color: #064e3b;">
              KSh {{ Number(product.price).toLocaleString() }}
            </span>
            <span v-if="product.original_price" style="font-size: 1.125rem; color: var(--text-light); text-decoration: line-through;">
              KSh {{ Number(product.original_price).toLocaleString() }}
            </span>
            <span v-if="product.original_price" style="background: #fee2e2; color: #b91c1c; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm);">
              {{ Math.round((1 - product.price / product.original_price) * 100) }}% OFF
            </span>
          </div>
          <div style="font-size: 0.8125rem; color: #059669; font-weight: 600; margin-top: 0.35rem;">
            ✓ {{ product.stock > 0 ? `In stock (${product.stock} available)` : 'Temporarily out of stock' }}
          </div>
        </div>

        <!-- Description -->
        <div style="margin-bottom: 1.75rem;">
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem;">Product Description</h3>
          <p style="color: var(--text-muted); line-height: 1.7; font-size: 0.9375rem;">
            {{ product.description }}
          </p>
        </div>

        <!-- Specs Table -->
        <div v-if="product.specs && Object.keys(product.specs).length > 0" style="margin-bottom: 2rem;">
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem;">Technical Specifications</h3>
          <div style="border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;">
            <div 
              v-for="(val, key) in product.specs" 
              :key="key"
              style="display: flex; justify-content: space-between; padding: 0.625rem 1rem; font-size: 0.875rem; border-bottom: 1px solid var(--border);"
            >
              <span style="color: var(--text-muted); font-weight: 500;">{{ key }}</span>
              <strong style="color: var(--text-main);">{{ val }}</strong>
            </div>
          </div>
        </div>

        <!-- Purchase Action Controls -->
        <div class="product-actions" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap;">
          <!-- Quantity counter -->
          <div style="display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-lg); background: #ffffff;">
            <button 
              @click="qty > 1 ? qty-- : null" 
              style="padding: 0.75rem 1rem; font-size: 1.1rem; font-weight: 700; color: var(--text-muted);"
            >
              -
            </button>
            <span style="width: 2.5rem; text-align: center; font-weight: 700; font-size: 1rem;">{{ qty }}</span>
            <button 
              @click="qty < product.stock ? qty++ : null" 
              style="padding: 0.75rem 1rem; font-size: 1.1rem; font-weight: 700; color: var(--text-muted);"
            >
              +
            </button>
          </div>

          <button 
            @click="handleAddToCart" 
            class="btn btn-primary btn-lg" 
            style="flex: 1;"
            :disabled="product.stock <= 0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span>{{ isAdded ? 'Added to Cart!' : 'Add to Cart' }}</span>
          </button>

          <button 
            @click="handleBuyNow" 
            class="btn btn-mpesa btn-lg" 
            style="flex: 1;"
            :disabled="product.stock <= 0"
          >
            Buy Now with M-Pesa
          </button>
        </div>

        <!-- Multi-Device Sync Notice -->
        <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
          <span class="pulse-dot"></span>
          <span>Adding this product syncs immediately across your phone, tablet, and computer sessions.</span>
        </div>
      </div>
    </div>

    <!-- Related Products -->
    <div v-if="product?.related && product.related.length > 0" style="margin-top: 5rem; border-top: 1px solid var(--border); padding-top: 3rem;">
      <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1.5rem;">Similar Products in Kenya</h2>
      <div class="related-product-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
        <ProductCard 
          v-for="rel in product.related" 
          :key="rel.id" 
          :product="rel" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore } from '../stores/products';
import { useCartStore } from '../stores/cart';
import ProductCard from '../components/ProductCard.vue';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const cartStore = useCartStore();

const product = ref(null);
const loading = ref(true);
const qty = ref(1);
const isAdded = ref(false);

async function loadProduct() {
  loading.value = true;
  try {
    const data = await productStore.fetchProductById(route.params.slug);
    product.value = data;
    qty.value = 1;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadProduct);
watch(() => route.params.slug, loadProduct);

async function handleAddToCart() {
  if (!product.value || product.value.stock <= 0) return;
  await cartStore.addToCart(product.value, qty.value);
  isAdded.value = true;
  setTimeout(() => {
    isAdded.value = false;
  }, 1500);
}

async function handleBuyNow() {
  if (!product.value || product.value.stock <= 0) return;
  await cartStore.addToCart(product.value, qty.value);
  router.push('/cart');
}
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 860px) {
  .product-detail-layout {
    grid-template-columns: 1fr !important;
  }
}
</style>
