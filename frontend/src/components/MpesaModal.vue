<template>
  <div class="modal-backdrop" @click.self="closeIfAllowed">
    <section class="modal-content" style="max-width: 440px;" role="dialog" aria-modal="true" aria-labelledby="payment-title">
      <header style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 1.5rem; text-align: center;">
        <h2 id="payment-title" style="font-size: 1.4rem; color: #ffffff; margin-bottom: 0.25rem;">M-PESA payment</h2>
        <p style="font-size: 0.8125rem; color: #d1fae5;">Order {{ order.order_number }}</p>
      </header>

      <div style="padding: 1.5rem; text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 800; color: #065f46; margin-bottom: 0.35rem;">
          KSh {{ Number(order.total_amount).toLocaleString() }}
        </div>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
          Payment prompt for <strong>{{ phone }}</strong>
        </p>

        <div v-if="step === 'starting'" role="status" style="padding: 1.25rem 0;">
          <span class="payment-spinner" aria-hidden="true"></span>
          <p style="margin-top: 0.75rem;">Sending payment request…</p>
        </div>

        <div v-else-if="step === 'waiting'" role="status" aria-live="polite" style="padding: 0.5rem 0 1rem;">
          <span class="payment-spinner" aria-hidden="true"></span>
          <h3 style="margin: 0.75rem 0 0.35rem; font-size: 1.1rem;">Check your phone</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem;">
            <template v-if="existingPending">This order already has a pending payment request. We’re checking its result; no new prompt was sent.</template>
            <template v-else>Approve the M-PESA prompt on your handset. We’ll confirm your order as soon as payment is verified.</template>
          </p>
          <p v-if="waitingTooLong" style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">
            We haven’t received payment confirmation yet. Check your M-PESA messages before trying again. You can check the status here.
          </p>
          <p v-if="errorMessage" role="alert" style="margin-top: 0.75rem; color: var(--danger); font-size: 0.8rem;">
            {{ errorMessage }}
          </p>
          <button @click="checkStatus" class="btn btn-outline btn-block" style="margin-top: 1rem;" :disabled="checking">
            {{ checking ? 'Checking…' : 'Check payment status' }}
          </button>
          <button @click="emit('close')" class="btn btn-secondary btn-block" style="margin-top: 0.5rem;">
            Continue shopping
          </button>
        </div>

        <div v-else-if="step === 'failed'" role="alert">
          <div style="color: var(--danger); font-weight: 700; margin-bottom: 0.5rem;">Payment wasn’t completed</div>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">{{ errorMessage }}</p>
          <label class="form-label" for="payment-phone" style="text-align: left;">M-PESA phone number</label>
          <input id="payment-phone" v-model="phone" class="form-input" type="tel" autocomplete="tel" placeholder="0712345678" />
          <button @click="startPayment" class="btn btn-mpesa btn-block btn-lg" style="margin-top: 1rem;" :disabled="loading">
            {{ loading ? 'Sending…' : 'Try again' }}
          </button>
          <button @click="emit('close')" class="btn btn-outline btn-block" style="margin-top: 0.5rem;">Close</button>
        </div>

        <div v-else-if="step === 'review'" role="alert">
          <div style="color: #92400e; font-weight: 700; margin-bottom: 0.5rem;">We’re checking this payment</div>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">
            Keep your order number {{ order.order_number }} for reference. We’ll update your order when verification is complete.
          </p>
          <button @click="emit('close')" class="btn btn-outline btn-block">Close</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const props = defineProps({ order: { type: Object, required: true } });
const emit = defineEmits(['close', 'payment-success']);
const router = useRouter();
const authStore = useAuthStore();
const step = ref('starting');
const phone = ref(props.order.shipping_phone || authStore.user?.phone || '');
const errorMessage = ref('');
const checkoutRequestId = ref('');
const existingPending = ref(false);
const loading = ref(false);
const checking = ref(false);
const startedAt = ref(0);
const now = ref(Date.now());
let pollTimer;
let elapsedTimer;

const waitingTooLong = computed(() => startedAt.value && now.value - startedAt.value > 120000);

onMounted(startPayment);
onUnmounted(() => {
  clearInterval(pollTimer);
  clearInterval(elapsedTimer);
});

async function startPayment() {
  if (loading.value) return;
  loading.value = true;
  errorMessage.value = '';
  step.value = 'starting';
  try {
    const response = await fetch('/api/payments/mpesa/initiate', {
      method: 'POST',
      headers: authStore.authHeaders,
      body: JSON.stringify({ orderId: props.order.id, phone: phone.value.trim() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not start M-PESA payment.');
    checkoutRequestId.value = data.checkoutRequestId;
    existingPending.value = Boolean(data.existingPending);
    startedAt.value = Date.now();
    step.value = 'waiting';
    pollTimer = setInterval(checkStatus, 3000);
    elapsedTimer = setInterval(() => {
      now.value = Date.now();
      if (waitingTooLong.value && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }, 15000);
    await checkStatus();
  } catch (error) {
    errorMessage.value = error.message;
    step.value = 'failed';
  } finally {
    loading.value = false;
  }
}

async function checkStatus() {
  if (checking.value || !['waiting', 'review'].includes(step.value)) return;
  checking.value = true;
  errorMessage.value = '';
  try {
    const response = await fetch(`/api/payments/status/${props.order.id}`, { headers: authStore.authHeaders });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not check payment status.');
    if ((data.statusQueryUnavailable || data.statusQueryPending) && data.payment?.status === 'pending') {
      errorMessage.value = data.statusQueryError || 'Daraja has not provided a final payment update. The payment is still unconfirmed; check your M-PESA messages before trying again.';
    }
    if (data.orderStatus === 'paid' && data.payment?.status === 'completed') {
      clearInterval(pollTimer);
      emit('payment-success', data);
      emit('close');
      router.replace(`/order-confirmation/${props.order.id}`);
    } else if (data.orderStatus === 'payment_review' || data.payment?.status === 'needs_review') {
      step.value = 'review';
    } else if (data.payment?.status === 'failed') {
      clearInterval(pollTimer);
      errorMessage.value = 'The request was cancelled or couldn’t be completed. Please try again.';
      step.value = 'failed';
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    checking.value = false;
  }
}

function closeIfAllowed() {
  if (step.value !== 'waiting' && step.value !== 'starting') emit('close');
}
</script>

<style scoped>
.payment-spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid #d1fae5;
  border-top-color: #059669;
  border-radius: 50%;
  animation: payment-spin 0.8s linear infinite;
}

@keyframes payment-spin { to { transform: rotate(360deg); } }
</style>
