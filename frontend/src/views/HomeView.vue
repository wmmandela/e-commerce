<template>
  <div class="home-page">
    <!-- Hero Banner (Kenyan Tech & Lifestyle) -->
    <section style="background: linear-gradient(135deg, #064e3b 0%, #022c22 60%, #0f172a 100%); color: white; padding: 4.5rem 0 5rem; position: relative; overflow: hidden;">
      <div class="container" style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 3rem; align-items: center;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); padding: 0.35rem 0.85rem; border-radius: var(--radius-full); font-size: 0.8125rem; color: #a7f3d0; margin-bottom: 1.25rem;">
            <span>🇰🇪 Shop local, shop with confidence</span>
          </div>

          <h1 style="font-size: 3rem; line-height: 1.15; color: #ffffff; margin-bottom: 1.25rem; font-weight: 800;">
            Good finds, delivered to your door.
          </h1>

          <p style="font-size: 1.125rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 2rem; max-width: 540px;">
            Discover everyday essentials, thoughtful gifts, and standout tech. Shop from anywhere and pay securely with <strong>M-PESA</strong>.
          </p>

          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <router-link to="/catalogue" class="btn btn-mpesa btn-lg">
              Explore Catalogue
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </router-link>

            <a href="#shopping" class="btn btn-outline btn-lg" style="color: white; border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.08);">
              How shopping works
            </a>
          </div>

          <!-- Feature badges in Kenyan Context -->
          <div style="display: flex; gap: 2rem; margin-top: 3rem; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 1.5rem; flex-wrap: wrap;">
            <div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #34d399;">Easy checkout</div>
              <div style="font-size: 0.75rem; color: #94a3b8;">Pay securely with M-PESA</div>
            </div>
            <div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #6ee7b7;">Affordable transport</div>
              <div style="font-size: 0.75rem; color: #94a3b8;">Flat KSh 10 fee</div>
            </div>
            <div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #fbbf24;">KEBS Approved</div>
              <div style="font-size: 0.75rem; color: #94a3b8;">Quality picks for everyday life</div>
            </div>
          </div>
        </div>

        <!-- Hero visual -->
        <div style="position: relative; display: flex; justify-content: center;">
          <div style="position: relative; width: 100%; max-width: 440px;">
            <img 
              src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80" 
              alt="iPhone 15 Pro Max Safaricom 5G" 
              style="width: 100%; border-radius: var(--radius-xl); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15);"
            />
            <!-- Overlay floating chip -->
            <div style="position: absolute; bottom: -1rem; left: -1rem; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(16, 185, 129, 0.4); padding: 0.85rem 1.25rem; border-radius: var(--radius-xl); display: flex; align-items: center; gap: 0.75rem; box-shadow: var(--shadow-xl);">
              <div style="width: 2.25rem; height: 2.25rem; background: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                🇰🇪
              </div>
              <div>
                <div style="font-size: 0.8125rem; font-weight: 700; color: #ffffff;">Shop with confidence</div>
                <div style="font-size: 0.75rem; color: #34d399;">Secure M-PESA checkout</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Strip -->
    <section style="padding: 3rem 0 2rem;">
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.75rem; font-weight: 800;">Featured Categories</h2>
            <p style="color: var(--text-muted); font-size: 0.9375rem;">Find something for every part of your day</p>
          </div>
          <router-link to="/catalogue" style="color: var(--primary); font-weight: 700; font-size: 0.875rem;">
            View All →
          </router-link>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 1rem;">
          <div 
            v-for="cat in productStore.categories" 
            :key="cat.id" 
            @click="handleCategoryClick(cat.slug)"
            class="card"
            style="cursor: pointer; transition: all 0.2s; text-align: center; padding: 1.5rem 1rem;"
            onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.borderColor='var(--border)'; this.style.transform='translateY(0)'"
          >
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">
              {{ getCategoryEmoji(cat.slug) }}
            </div>
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">{{ cat.name }}</h4>
            <span style="font-size: 0.75rem; color: var(--text-muted);">{{ cat.product_count }} Products</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products Showcase -->
    <section style="padding: 2.5rem 0 4rem;">
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
          <div>
            <span style="color: var(--primary); font-size: 0.8125rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Editor's Pick</span>
            <h2 style="font-size: 2rem; font-weight: 800;">Top Trending in Kenya</h2>
          </div>
          <router-link to="/catalogue" class="btn btn-secondary btn-sm">
            Browse Full Catalogue
          </router-link>
        </div>

        <!-- Products Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
          <ProductCard 
            v-for="product in productStore.featuredProducts" 
            :key="product.id" 
            :product="product" 
          />
        </div>
      </div>
    </section>

    <!-- Multi-Device Shopping Explainer Banner (Kenyan Perspective) -->
    <section id="shopping" style="background: #ffffff; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 4rem 0;">
      <div class="container">
        <div style="text-align: center; max-width: 680px; margin: 0 auto 3rem;">
            <span style="color: var(--primary); font-size: 0.8125rem; font-weight: 800; text-transform: uppercase;">Made for everyday shopping</span>
          <h2 style="font-size: 2.25rem; font-weight: 800; margin-top: 0.35rem;">
            How Multi-Device Shopping Works
          </h2>
          <p style="color: var(--text-muted); font-size: 1rem; margin-top: 0.5rem;">
            Pick up where you left off. Your cart stays with you when you switch between your phone, tablet, and computer.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
          <div class="card" style="padding: 2rem;">
            <div style="font-size: 2.5rem; margin-bottom: 1rem;">📱</div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">1. Select on Mobile</h3>
            <p style="color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6;">
              Browse and add your favourites wherever you are.
            </p>
          </div>

          <div class="card" style="padding: 2rem;">
            <div style="font-size: 2.5rem; margin-bottom: 1rem;">💻</div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">2. Review on Laptop</h3>
            <p style="color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6;">
              Sign in on another device and your saved items will be waiting.
            </p>
          </div>

          <div class="card" style="padding: 2rem;">
            <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚡</div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">3. Pay with M-PESA</h3>
            <p style="color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6;">
              Choose M-PESA at checkout for a quick, secure payment.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '../stores/products';
import ProductCard from '../components/ProductCard.vue';

const router = useRouter();
const productStore = useProductStore();

onMounted(async () => {
  await productStore.fetchCategories();
  await productStore.fetchProducts();
});

function handleCategoryClick(slug) {
  productStore.setCategory(slug);
  router.push('/catalogue');
}

function getCategoryEmoji(slug) {
  const map = {
    'smartphones': '📱',
    'laptops': '💻',
    'audio': '🎧',
    'fashion': '👢',
    'home': '☕',
    'stationery': '✏️',
    'everyday-finds': '🛍️'
  };
  return map[slug] || '🛍️';
}
</script>
