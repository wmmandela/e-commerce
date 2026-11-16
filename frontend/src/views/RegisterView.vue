<template>
  <div class="container" style="padding: 4rem 1.25rem 6rem; max-width: 520px;">
    <div class="card" style="padding: 2.5rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);">
      <div style="text-align: center; margin-bottom: 2rem;">
        <div class="brand-icon" style="margin: 0 auto 1rem; width: 3.25rem; height: 3.25rem;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7.5" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </div>
        <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 0.35rem;">Create Your SokoBora Account</h1>
        <p style="color: var(--text-muted); font-size: 0.875rem;">
          Sign up to shop seamlessly across mobile and desktop devices with Safaricom M-Pesa integration.
        </p>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="name" 
            placeholder="e.g. Mandela Machera" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input 
            type="email" 
            class="form-input" 
            v-model="email" 
            placeholder="e.g. mandela@sokobora.co.ke" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Safaricom M-Pesa Phone Number</label>
          <input 
            type="tel" 
            class="form-input" 
            v-model="phone" 
            placeholder="0712345678 or 254712345678" 
            required 
          />
          <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; display: block;">
            Used for delivery updates and payment prompts.
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">County</label>
            <select class="form-input" v-model="county">
              <option value="Nairobi">Nairobi</option>
              <option value="Mombasa">Mombasa</option>
              <option value="Kisumu">Kisumu</option>
              <option value="Nakuru">Nakuru</option>
              <option value="Eldoret">Eldoret</option>
              <option value="Kisii">Kisii</option>
              <option value="Kiambu">Kiambu</option>
              <option value="Machakos">Machakos</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Estate / Neighborhood</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="estate" 
              placeholder="e.g. Kilimani, Westlands" 
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input 
            type="password" 
            class="form-input" 
            v-model="password" 
            placeholder="Minimum 6 characters" 
            minlength="6" 
            required 
          />
        </div>

        <div v-if="authStore.error" style="padding: 0.75rem; background: var(--danger-light); color: var(--danger); font-size: 0.8125rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
          {{ authStore.error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary btn-block btn-lg" 
          :disabled="authStore.loading"
          style="margin-bottom: 1.25rem;"
        >
          <span v-if="authStore.loading">Registering...</span>
          <span v-else>Register & Start Shopping</span>
        </button>

        <div style="text-align: center; font-size: 0.875rem; color: var(--text-muted);">
          Already have an account? 
          <router-link to="/login" style="color: var(--primary); font-weight: 700;">
            Sign in
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useCartStore } from '../stores/cart';

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();

const name = ref('');
const email = ref('');
const phone = ref('2547');
const county = ref('Nairobi');
const estate = ref('Kilimani');
const password = ref('');

async function handleRegister() {
  try {
    await authStore.register(name.value, email.value, phone.value, county.value, estate.value, password.value);
    await cartStore.mergeGuestCart();
    await cartStore.fetchCart();
    router.push('/');
  } catch (err) {
    // Handled in store
  }
}
</script>
