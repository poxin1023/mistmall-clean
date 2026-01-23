import { createRouter, createWebHistory } from 'vue-router'

import ProductsPage from '../pages/ProductsPage.vue'
import ProductDetailPage from '../pages/ProductDetailPage.vue'
import OrdersPage from '../pages/OrdersPage.vue'
import NoticePage from '../pages/NoticePage.vue'
import CheckoutPage from '../pages/CheckoutPage.vue'
import OrderSuccessPage from '../pages/OrderSuccessPage.vue' // ✅ 新增

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/products' },

    { path: '/products', component: ProductsPage },
    { path: '/product/:id', component: ProductDetailPage },

    { path: '/checkout', component: CheckoutPage },

    // ✅ 成功頁
    { path: '/order-success', component: OrderSuccessPage },

    { path: '/orders', component: OrdersPage },
    { path: '/notice', component: NoticePage },

    { path: '/:pathMatch(.*)*', redirect: '/products' }
  ]
})

export default router
