import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CatalogueView from '../views/CatalogueView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import CartView from '../views/CartView.vue';
import CheckoutView from '../views/CheckoutView.vue';
import OrderConfirmationView from '../views/OrderConfirmationView.vue';
import OrdersView from '../views/OrdersView.vue';
import TransactionsView from '../views/TransactionsView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DevicesView from '../views/DevicesView.vue';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/catalogue', name: 'Catalogue', component: CatalogueView },
  { path: '/product/:slug', name: 'ProductDetail', component: ProductDetailView },
  { path: '/cart', name: 'Cart', component: CartView, meta: { requiresAuth: true } },
  { path: '/checkout', name: 'Checkout', component: CheckoutView, meta: { requiresAuth: true } },
  { path: '/order-confirmation/:orderId', name: 'OrderConfirmation', component: OrderConfirmationView, meta: { requiresAuth: true } },
  { path: '/orders', name: 'Orders', component: OrdersView, meta: { requiresAuth: true } },
  { path: '/transactions', name: 'Transactions', component: TransactionsView, meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/register', name: 'Register', component: RegisterView },
  { path: '/devices', name: 'Devices', component: DevicesView, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !useAuthStore().isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }
});

export default router;
