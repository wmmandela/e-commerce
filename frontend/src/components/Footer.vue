<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <!-- Brand Info -->
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <div class="brand-icon" style="width: 2.25rem; height: 2.25rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <span style="font-size: 1.35rem; font-weight: 800; color: #ffffff;">
              Soko<span style="color: #10b981;">Bora</span> 🇰🇪
            </span>
          </div>
          <p style="font-size: 0.875rem; line-height: 1.6; margin-bottom: 1.25rem; max-width: 320px;">
            Kenya’s premier online marketplace for genuine electronics, footwear, and lifestyle essentials. Delivering across all 47 counties of Kenya with secure Lipa Na M-PESA.
          </p>
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.06); padding: 0.35rem 0.75rem; border-radius: var(--radius-full); font-size: 0.75rem; color: #6ee7b7;">
            <span>📍 The Mirage Tower, Chiromo Rd, Westlands, Nairobi</span>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="footer-title">Quick Links</h4>
          <ul class="footer-links">
            <li><router-link to="/">Home Showcase</router-link></li>
            <li><router-link to="/catalogue">Full Catalogue</router-link></li>
            <li><router-link to="/cart">Shopping Cart</router-link></li>
            <li><router-link to="/devices">Multi-Device Hub</router-link></li>
          </ul>
        </div>

        <!-- Categories -->
        <div>
          <h4 class="footer-title">Departments</h4>
          <ul class="footer-links">
            <li><a href="#" @click.prevent="filterCat('smartphones')">Safaricom 5G Smartphones</a></li>
            <li><a href="#" @click.prevent="filterCat('laptops')">MacBooks & Workstations</a></li>
            <li><a href="#" @click.prevent="filterCat('audio')">Oraimo Audio & Wearables</a></li>
            <li><a href="#" @click.prevent="filterCat('fashion')">Bata Safari Boots & Maasai</a></li>
            <li><a href="#" @click.prevent="filterCat('home')">Starlink Kenya & Ramtons</a></li>
          </ul>
        </div>

        <!-- Delivery & Payment Partners in Kenya -->
        <div>
          <h4 class="footer-title">Payment & Delivery</h4>
          <p style="font-size: 0.8125rem; margin-bottom: 1rem;">
            Secure, convenient checkout with Lipa Na M-PESA.
          </p>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
            <span style="background: #047857; color: white; font-weight: 800; font-size: 0.75rem; padding: 0.35rem 0.75rem; border-radius: var(--radius-md);">
              Lipa Na M-PESA
            </span>
            <span style="background: rgba(255,255,255,0.1); color: #e2e8f0; font-size: 0.75rem; padding: 0.35rem 0.6rem; border-radius: var(--radius-md);">
              Airtel Money
            </span>
          </div>
          <div style="font-size: 0.75rem; color: #94a3b8;">
            Delivery options available at checkout.
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div>
            © 2026 SokoBora. All rights reserved.
        </div>
        <div style="display: flex; gap: 1.5rem;">
          <span>Location: Nairobi, Kenya</span>
          <span>Made for shoppers in Kenya</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useProductStore } from '../stores/products';

const router = useRouter();
const productStore = useProductStore();

function filterCat(slug) {
  productStore.setCategory(slug);
  router.push('/catalogue');
}
</script>
