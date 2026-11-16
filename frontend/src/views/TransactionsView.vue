<template>
  <main class="container transactions-page">
    <div class="breadcrumb">
      <router-link to="/">Home</router-link> / Transactions
    </div>

    <header class="page-heading">
      <div>
        <h1>Transactions</h1>
        <p>Every M-PESA payment attempt, confirmation, and receipt.</p>
      </div>
      <button class="btn btn-outline" :disabled="loading" @click="loadTransactions">
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </header>

    <div v-if="errorMessage" class="notice notice-error" role="alert">{{ errorMessage }}</div>

    <section class="summary-grid" aria-label="Transaction summary">
      <article class="summary-card">
        <span>Completed transfers</span>
        <strong>{{ completedCount }}</strong>
      </article>
      <article class="summary-card">
        <span>Amount confirmed</span>
        <strong>KSh {{ formatAmount(completedAmount) }}</strong>
      </article>
      <article class="summary-card">
        <span>Failed / review</span>
        <strong>{{ attentionCount }}</strong>
      </article>
    </section>

    <p class="pending-note">Pending attempts are hidden until M-PESA returns a final result. They remain linked to their orders for callback reconciliation.</p>

    <section class="ledger card">
      <div class="ledger-toolbar">
        <div class="filters" aria-label="Filter transactions">
          <button v-for="option in filterOptions" :key="option.value"
            :class="['filter-button', { selected: activeFilter === option.value }]"
            @click="activeFilter = option.value">
            {{ option.label }}
          </button>
        </div>
        <label class="search-box">
          <span class="sr-only">Search transactions</span>
          <input v-model="searchQuery" class="form-input" type="search" placeholder="Search order or receipt" />
        </label>
      </div>

      <div v-if="loading && transactions.length === 0" class="empty-state">Loading transactions…</div>
      <div v-else-if="filteredTransactions.length === 0" class="empty-state">
        <strong>{{ transactions.length ? 'No matching transactions' : 'No transactions yet' }}</strong>
        <p>{{ transactions.length ? 'Try a different filter or search.' : 'Your M-PESA payment attempts will appear here.' }}</p>
      </div>
      <div v-else class="table-scroll">
        <table class="transactions-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Order</th>
              <th scope="col">Phone</th>
              <th scope="col" class="numeric">Amount</th>
              <th scope="col">Status</th>
              <th scope="col">M-PESA receipt / details</th>
              <th scope="col"><span class="sr-only">Order link</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in filteredTransactions" :key="transaction.id">
              <td data-label="Date">{{ formatDate(transaction.completed_at || transaction.created_at) }}</td>
              <td data-label="Order" class="order-cell">
                <strong>{{ transaction.order_number }}</strong>
                <small v-if="transaction.simulated" class="simulated-tag">Simulated record</small>
              </td>
              <td data-label="Phone">{{ transaction.phone_masked || '—' }}</td>
              <td data-label="Amount" class="numeric amount-cell">KSh {{ formatAmount(transaction.amount) }}</td>
              <td data-label="Status">
                <span :class="['status-pill', `status-${statusKey(transaction.status)}`]">
                  {{ statusLabel(transaction.status) }}
                </span>
              </td>
              <td data-label="Receipt / details" class="receipt-cell">
                <strong v-if="transaction.mpesa_ref" class="receipt-ref">{{ transaction.mpesa_ref }}</strong>
                <span v-else>{{ transaction.result_desc || pendingText(transaction.status) }}</span>
                <small v-if="transaction.result_code !== null && transaction.result_code !== undefined">Result {{ transaction.result_code }}</small>
              </td>
              <td class="action-cell">
                <router-link :to="`/order-confirmation/${transaction.order_id}`" class="order-link">View order</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer class="ledger-footer">Showing {{ filteredTransactions.length }} of {{ transactions.length }} recorded transactions</footer>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const transactions = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const searchQuery = ref('');
const activeFilter = ref('all');

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'attention', label: 'Failed / review' }
];

const completedCount = computed(() => transactions.value.filter(item => item.status === 'completed').length);
const attentionCount = computed(() => transactions.value.filter(item => ['failed', 'needs_review'].includes(item.status)).length);
const completedAmount = computed(() => transactions.value
  .filter(item => item.status === 'completed')
  .reduce((sum, item) => sum + Number(item.amount || 0), 0));

const filteredTransactions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return transactions.value.filter(item => {
    const matchesFilter = activeFilter.value === 'all'
      || (activeFilter.value === 'attention' ? ['failed', 'needs_review'].includes(item.status) : item.status === activeFilter.value);
    const matchesSearch = !query || [item.order_number, item.mpesa_ref, item.result_desc, item.status]
      .some(value => String(value || '').toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });
});

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: '/transactions' } });
    return;
  }
  loadTransactions();
});

async function loadTransactions() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await fetch('/api/payments/transactions', { headers: authStore.authHeaders });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load transactions.');
    transactions.value = data;
  } catch (error) {
    errorMessage.value = error.message || 'Could not load transactions.';
  } finally {
    loading.value = false;
  }
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusKey(status) {
  return ['completed', 'pending', 'failed', 'needs_review'].includes(status) ? status : 'unknown';
}

function statusLabel(status) {
  return ({ completed: 'Completed', pending: 'Pending', failed: 'Failed', needs_review: 'Review' })[status] || status || 'Unknown';
}

function pendingText(status) {
  if (status === 'pending') return 'Waiting for M-PESA confirmation';
  if (status === 'needs_review') return 'Payment needs review';
  return 'No receipt recorded';
}
</script>

<style scoped>
.transactions-page { padding: 2.25rem 1.25rem 4rem; }
.breadcrumb { color: var(--text-muted); font-size: .8125rem; margin-bottom: 1.25rem; }
.breadcrumb a { color: var(--primary); }
.page-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.page-heading h1 { font-size: 2.1rem; line-height: 1.15; font-weight: 800; margin: 0 0 .35rem; }
.page-heading p { color: var(--text-muted); margin: 0; }
.summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-bottom: .75rem; }
.pending-note { color: var(--text-muted); font-size: .82rem; margin: 0 0 1.25rem; }
.summary-card { background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.1rem 1.25rem; box-shadow: var(--shadow-sm); }
.summary-card span { display: block; color: var(--text-muted); font-size: .8rem; margin-bottom: .45rem; }
.summary-card strong { color: var(--text-main); font-size: 1.35rem; font-weight: 800; }
.ledger { overflow: hidden; }
.ledger-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 1rem 1.1rem; border-bottom: 1px solid var(--border); }
.filters { display: flex; gap: .4rem; flex-wrap: wrap; }
.filter-button { background: transparent; border: 1px solid var(--border); border-radius: 999px; padding: .45rem .8rem; color: var(--text-muted); cursor: pointer; font: inherit; font-size: .82rem; }
.filter-button.selected { background: var(--primary); border-color: var(--primary); color: white; }
.search-box { width: min(100%, 290px); }
.search-box .form-input { width: 100%; }
.table-scroll { overflow-x: auto; }
.transactions-table { width: 100%; min-width: 920px; border-collapse: collapse; text-align: left; }
.transactions-table th { background: #f8fafc; color: var(--text-muted); font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: .85rem .9rem; white-space: nowrap; }
.transactions-table td { border-top: 1px solid var(--border); padding: .9rem; font-size: .84rem; vertical-align: middle; }
.transactions-table tr:hover td { background: #fbfdfc; }
.numeric { text-align: right; }
.amount-cell { color: #064e3b; font-weight: 800; white-space: nowrap; }
.order-cell strong, .receipt-cell strong { display: block; color: var(--text-main); }
.order-cell small, .receipt-cell small { display: block; color: var(--text-muted); margin-top: .2rem; }
.simulated-tag { color: #92400e !important; }
.status-pill { display: inline-flex; align-items: center; border-radius: 999px; padding: .3rem .65rem; font-size: .72rem; font-weight: 800; white-space: nowrap; }
.status-completed { color: #065f46; background: #d1fae5; }
.status-pending { color: #92400e; background: #fef3c7; }
.status-failed { color: #991b1b; background: #fee2e2; }
.status-needs_review { color: #1d4ed8; background: #dbeafe; }
.status-unknown { color: #475569; background: #e2e8f0; }
.receipt-cell { max-width: 250px; color: var(--text-muted); }
.receipt-ref { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.action-cell { white-space: nowrap; }
.order-link { color: var(--primary); font-weight: 700; text-decoration: none; }
.order-link:hover { text-decoration: underline; }
.empty-state { text-align: center; padding: 3.5rem 1rem; color: var(--text-muted); }
.empty-state strong { color: var(--text-main); }
.empty-state p { margin-bottom: 0; }
.ledger-footer { color: var(--text-muted); border-top: 1px solid var(--border); padding: .75rem 1rem; font-size: .78rem; }
.notice { padding: .8rem 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; }
.notice-error { color: #991b1b; background: #fee2e2; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 760px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .page-heading h1 { font-size: 1.8rem; }
}
</style>
