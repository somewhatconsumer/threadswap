import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { title: 'Second Wardrobe' },
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('@/views/MapView.vue'),
      meta: { title: 'Map' },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { title: 'Log in', guest: true },
    },
    {
      path: '/post/new',
      name: 'create-post',
      component: () => import('@/views/CreatePostView.vue'),
      meta: { title: 'New post', requiresAuth: true },
    },
    {
      path: '/post/:id',
      name: 'post',
      component: () => import('@/views/PostDetailView.vue'),
      meta: { title: 'Post' },
    },
    {
      path: '/post/:id/edit',
      name: 'edit-post',
      component: () => import('@/views/EditPostView.vue'),
      meta: { title: 'Edit post', requiresAuth: true },
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('@/views/MessagesView.vue'),
      meta: { title: 'Messages', requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { title: 'Profile', requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.init()
  }
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'auth', query: { redirect: to.fullPath } }
  }
  if (to.meta.guest && auth.isLoggedIn && to.name === 'auth') {
    const redirect = (to.query.redirect as string) || '/map'
    return { path: redirect }
  }
  return true
})

export default router
