<template>
  <div class="container catalogue-page" style="padding: 2.5rem 1.25rem 4rem;">
    <!-- Breadcrumb & Title -->
    <div style="margin-bottom: 2rem;">
      <div style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.5rem;">
        <router-link to="/" style="color: var(--primary);">Home</router-link> / 
        <span>Catalogue</span>
      </div>
      <h1 class="catalogue-title" style="font-size: 2.25rem; font-weight: 800;">Shop</h1>
      <p style="color: var(--text-muted); font-size: 0.9375rem;">
        Phones, laptops, audio, fashion, and home essentials.
      </p>
    </div>

    <!-- Layout Grid: Sidebar Filters + Products -->
    <div style="display: grid; grid-template-columns: 260px 1fr; gap: 2rem; align-items: start;" class="catalogue-layout">
      <!-- Sidebar Filters -->
      <aside class="card catalogue-filter-card" style="padding: 1.5rem; position: sticky; top: 5.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700;">Filters</h3>
          <button @click="resetFilters" style="font-size: 0.75rem; color: var(--primary); font-weight: 700;">
            Reset All
          </button>
        </div>

        <!-- Search in filters -->
        <div class="form-group">
          <label class="form-label" style="font-size: 0.8125rem;">Search Keyword</label>
          <input 
            type="text" 
            class="form-input" 
            placeholder="e.g. Safaricom, Bata..."
            v-model="productStore.searchQuery"
            @input="handleSearchInput"
          />
        </div>

        <!-- Category Filter -->
        <div class="form-group" style="margin-top: 1.5rem;">
          <label class="form-label" style="font-size: 0.8125rem;">Department</label>
          <div class="category-filter-list" style="display: flex; flex-direction: column; gap: 0.4rem;">
            <button 
              @click="handleCategoryChange('all')" 
              class="filter-pill"
              :class="{ active: productStore.activeCategory === 'all' }"
            >
              <span>All Departments</span>
            </button>
            <button 
              v-for="cat in productStore.categories" 
              :key="cat.id"
              @click="handleCategoryChange(cat.slug)" 
              class="filter-pill"
              :class="{ active: productStore.activeCategory === cat.slug }"
            >
              <span>{{ cat.name }}</span>
              <span class="count-badge">{{ cat.product_count }}</span>
            </button>
          </div>
        </div>

        <div class="filter-select-row">
          <!-- Brand Filter -->
          <div class="form-group" style="margin-top: 1.5rem;">
            <label class="form-label" style="font-size: 0.8125rem;">Brand</label>
            <select class="form-input" v-model="productStore.selectedBrand" @change="productStore.fetchProducts()">
              <option value="all">All Brands</option>
              <option v-for="b in productStore.availableBrands" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <!-- Sort Option -->
          <div class="form-group" style="margin-top: 1.5rem;">
            <label class="form-label" style="font-size: 0.8125rem;">Sort By</label>
            <select class="form-input" v-model="productStore.sortOption" @change="productStore.fetchProducts()">
              <option value="featured">Featured First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </aside>

      <!-- Main Products View -->
      <main>
        <!-- Bar: Results summary -->
        <div class="catalogue-results-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: #ffffff; padding: 0.875rem 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <span style="font-size: 0.875rem; color: var(--text-muted);">
            Showing <strong>{{ productStore.products.length }}</strong> products
            <span v-if="productStore.activeCategory !== 'all'"> in <em>{{ getActiveCategoryName() }}</em></span>
          </span>

          <div class="shop-rail-controls">
            <span class="shop-rail-hint">Swipe to browse</span>
            <button class="rail-arrow" aria-label="Scroll products left" @click="scrollProducts(-1)">‹</button>
            <button class="rail-arrow" aria-label="Scroll products right" @click="scrollProducts(1)">›</button>
          </div>

          <div class="catalogue-currency" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-muted);">
            <span>Currency: <strong>KSh (Kenyan Shilling)</strong></span>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="productStore.loading" style="text-align: center; padding: 4rem 0;">
          <div style="display: inline-block; width: 2.5rem; height: 2.5rem; border: 3px solid rgba(5, 150, 105, 0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <p style="margin-top: 1rem; color: var(--text-muted);">Loading products...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="productStore.products.length === 0" class="card" style="text-align: center; padding: 4rem 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">No products match your filter criteria</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Try clearing your search keyword or selecting a different department.</p>
          <button @click="resetFilters" class="btn btn-primary">
            Reset All Filters
          </button>
        </div>

        <!-- Product Grid -->
        <div v-else ref="productRail" class="product-grid catalogue-product-rail" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
          <ProductCard 
            v-for="product in productStore.products" 
            :key="product.id" 
            :product="product" 
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useProductStore } from '../stores/products';
import ProductCard from '../components/ProductCard.vue';

const productStore = useProductStore();
const productRail = ref(null);

function scrollProducts(direction) {
  const rail = productRail.value;
  if (!rail) return;
  rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.78, 240), behavior: 'smooth' });
}

onMounted(async () => {
  if (productStore.categories.length === 0) {
    await productStore.fetchCategories();
  }
  await productStore.fetchProducts();
});

function handleCategoryChange(slug) {
  productStore.activeCategory = slug;
  productStore.fetchProducts();
}

let debounceTimer = null;
function handleSearchInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    productStore.fetchProducts();
  }, 350);
}

function resetFilters() {
  productStore.activeCategory = 'all';
  productStore.searchQuery = '';
  productStore.selectedBrand = 'all';
  productStore.sortOption = 'featured';
  productStore.fetchProducts();
}

function getActiveCategoryName() {
  const cat = productStore.categories.find(c => c.slug === productStore.activeCategory);
  return cat ? cat.name : productStore.activeCategory;
}
</script>

<style scoped>
.filter-pill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.filter-pill:hover {
  background: #f1f5f9;
  color: var(--text-main);
}

.filter-pill.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 700;
}

.count-badge {
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-full);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 860px) {
  .catalogue-layout {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 640px) {
  .catalogue-page { padding: 1.1rem .875rem 2rem !important; }
  .catalogue-page > div:first-child { margin-bottom: 1rem !important; }
  .catalogue-title { font-size: 1.8rem !important; }
  .catalogue-layout { gap: .8rem !important; }
  .catalogue-filter-card { position: static !important; padding: .9rem !important; }
  .catalogue-filter-card > div:first-child { margin-bottom: .65rem !important; }
  .catalogue-filter-card .form-group { margin-top: .7rem !important; margin-bottom: 0; }
  .filter-select-row { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
  .filter-select-row .form-group { min-width: 0; }
  .category-filter-list { width: 100%; }
  .category-filter-list .filter-pill { width: max-content !important; flex: 0 0 auto !important; white-space: nowrap; }
  .catalogue-results-bar { padding: .7rem .85rem !important; margin-bottom: .8rem !important; }
  .catalogue-results-bar > span { font-size: .8rem !important; }
  .catalogue-currency { display: none !important; }
  .shop-rail-controls { display: flex; align-items: center; gap: .35rem; }
  .shop-rail-hint { color: var(--text-muted); font-size: .68rem; white-space: nowrap; }
  .shop-rail-controls .rail-arrow { display: inline-flex; width: 1.9rem; height: 1.9rem; }
  .catalogue-page .catalogue-product-rail {
    display: flex !important;
    gap: .75rem !important;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    padding: .1rem .1rem .6rem;
  }
  .catalogue-page .catalogue-product-rail > * { flex: 0 0 min(78vw, 300px); min-width: 0; scroll-snap-align: start; }
  .catalogue-product-rail::-webkit-scrollbar { height: 4px; }
  .catalogue-product-rail::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
}
</style>
