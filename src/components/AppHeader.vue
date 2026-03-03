<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const displayName = computed(() =>
  auth.profile?.display_name ?? auth.user?.email?.split('@')[0] ?? 'Account'
)

function goHome() {
  router.push({ name: 'landing' })
}

function goCreatePost() {
  router.push({ name: 'create-post' })
}

function goMessages() {
  router.push({ name: 'messages' })
}

function goProfile() {
  router.push({ name: 'profile' })
}

function goAuth() {
  router.push({ name: 'auth' })
}

async function handleSignOut() {
  try {
    await auth.signOut()
  } catch {
    // State already cleared in store; ensure we redirect
  }
  router.push({ name: 'landing' })
}
</script>

<template>
  <header class="app-header">
    <button type="button" class="logo" aria-label="Second Wardrobe home" @click="goHome">
      Second Wardrobe
    </button>
    <nav class="nav">
      <router-link :to="{ name: 'map' }" class="nav-link">Map</router-link>
      <router-link :to="{ name: 'nearby-swaps' }" class="nav-link">Nearby</router-link>
      <button
        v-if="auth.isLoggedIn"
        type="button"
        class="nav-link nav-btn"
        @click="goCreatePost"
      >
        Create Post
      </button>
      <button
        v-if="auth.isLoggedIn"
        type="button"
        class="nav-link nav-btn"
        @click="goMessages"
      >
        Messages
      </button>
      <router-link :to="{ name: 'contact' }" class="nav-link">Contact</router-link>
      <template v-if="auth.isLoggedIn">
        <button type="button" class="nav-link nav-btn" @click="goProfile">
          {{ displayName }}
        </button>
        <button type="button" class="nav-link nav-btn sign-out" @click="handleSignOut">
          Sign out
        </button>
      </template>
      <button v-else type="button" class="nav-link nav-btn primary" @click="goAuth">
        Log in
      </button>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: var(--header-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--header-border);
  flex-wrap: wrap;
  gap: 0.5rem;
  box-shadow: var(--shadow-xs);
}

.logo {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--accent);
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
  background: none;
  transition: color var(--transition-fast), opacity var(--transition-fast);
}

.logo:hover {
  color: var(--accent-hover);
  opacity: 0.9;
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.nav-link {
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-btn);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.nav-link:hover {
  color: var(--text);
}

.nav-link.router-link-active {
  color: var(--accent);
  font-weight: 600;
}

.nav-btn.primary {
  background: var(--accent);
  color: white;
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.nav-btn.primary:hover {
  background: var(--accent-hover);
}

.nav-btn.primary:active {
  transform: scale(0.98);
}

.nav-btn.sign-out {
  color: var(--text-muted);
  font-weight: 500;
}

.nav-btn.sign-out:hover {
  color: var(--text);
  text-decoration: underline;
}
</style>
