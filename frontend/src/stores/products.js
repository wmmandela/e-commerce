import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useProductStore = defineStore('products', () => {
  const products = ref([]);
  const categories = ref([]);
  const activeCategory = ref('all');
  const searchQuery = ref('');
  const sortOption = ref('featured');
  const selectedBrand = ref('all');
  const minPrice = ref(null);
  const maxPrice = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const featuredProducts = computed(() => {
    return products.value.filter(p => p.is_featured === 1);
  });

  const availableBrands = computed(() => {
    const brands = new Set();
    products.value.forEach(p => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands);
  });

  async function fetchCategories() {
    try {
      const res = await fetch('/api/products/categories');
      if (res.ok) {
        categories.value = await res.json();
      }
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }
  }

  async function fetchProducts() {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (activeCategory.value && activeCategory.value !== 'all') {
        params.append('category', activeCategory.value);
      }
      if (searchQuery.value.trim()) {
        params.append('search', searchQuery.value.trim());
      }
      if (selectedBrand.value && selectedBrand.value !== 'all') {
        params.append('brand', selectedBrand.value);
      }
      if (minPrice.value) {
        params.append('minPrice', minPrice.value);
      }
      if (maxPrice.value) {
        params.append('maxPrice', maxPrice.value);
      }
      if (sortOption.value) {
        params.append('sort', sortOption.value);
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Could not load products');
      products.value = await res.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProductById(identifier) {
    try {
      const res = await fetch(`/api/products/${identifier}`);
      if (!res.ok) throw new Error('Product not found');
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  function setCategory(slug) {
    activeCategory.value = slug;
    fetchProducts();
  }

  function setSearch(query) {
    searchQuery.value = query;
    fetchProducts();
  }

  return {
    products,
    categories,
    activeCategory,
    searchQuery,
    sortOption,
    selectedBrand,
    minPrice,
    maxPrice,
    loading,
    error,
    featuredProducts,
    availableBrands,
    fetchCategories,
    fetchProducts,
    fetchProductById,
    setCategory,
    setSearch
  };
});
