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
  <header class="second-wardrobe-header">
    <button type="button" class="logo" aria-label="Second Wardrobe home" @click="goHome">
      Second Wardrobe
    </button>
    <nav class="nav">
      <router-link :to="{ name: 'map' }" class="nav-link">Map</router-link>
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
.second-wardrobe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
  background: none;
}

.logo:hover {
  opacity: 0.85;
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nav-link {
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  text-decoration: none;
  color: var(--text, #4b5563);
  background: transparent;
  border: none;
  cursor: pointer;
}

.nav-link.router-link-active {
  color: var(--accent);
  font-weight: 600;
}

.nav-btn.primary {
  background: var(--accent);
  color: white;
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
