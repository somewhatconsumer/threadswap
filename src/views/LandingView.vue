<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

function goToMap() {
  router.push({ name: 'map' })
}

function goToAuth() {
  router.push({ name: 'auth' })
}

function goToCreatePost() {
  router.push({ name: 'create-post' })
}
</script>

<template>
  <div class="landing-view">
    <!-- Minimal background: soft gradient only -->
    <div class="landing-bg" aria-hidden="true">
      <div class="bg-gradient" />
    </div>

    <div class="landing-hero">
      <!-- Wardrobe logo: larger, cozy, clearly a wardrobe -->
      <div class="wardrobe-visual animate-fade-in-up" aria-hidden="true">
        <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" class="wardrobe-svg">
          <defs>
            <linearGradient id="wardrobe-wood" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#e8e4df"/>
              <stop offset="50%" stop-color="#f5f3f0"/>
              <stop offset="100%" stop-color="#ddd9d3"/>
            </linearGradient>
            <linearGradient id="wardrobe-door" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.5)"/>
              <stop offset="100%" stop-color="rgba(255,255,255,0.2)"/>
            </linearGradient>
            <filter id="wardrobe-shadow" x="-10%" y="-5%" width="120%" height="115%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.08"/>
            </filter>
          </defs>
          <!-- Main cabinet body - cozy rounded shape -->
          <rect x="24" y="16" width="152" height="172" rx="20" fill="url(#wardrobe-wood)" stroke="var(--neutral-200)" stroke-width="1.5" filter="url(#wardrobe-shadow)"/>
          <!-- Top cap / molding -->
          <rect x="20" y="12" width="160" height="12" rx="6" fill="url(#wardrobe-wood)" stroke="var(--neutral-200)" stroke-width="1"/>
          <!-- Left door -->
          <rect x="32" y="32" width="68" height="148" rx="14" fill="url(#wardrobe-door)" stroke="var(--neutral-200)" stroke-width="1.25"/>
          <!-- Right door -->
          <rect x="100" y="32" width="68" height="148" rx="14" fill="url(#wardrobe-door)" stroke="var(--neutral-200)" stroke-width="1.25"/>
          <!-- Door handles - accent -->
          <circle cx="88" cy="100" r="6" fill="var(--accent)" stroke="white" stroke-width="1.5"/>
          <circle cx="112" cy="100" r="6" fill="var(--accent)" stroke="white" stroke-width="1.5"/>
          <!-- Base / feet -->
          <rect x="18" y="186" width="164" height="20" rx="10" fill="url(#wardrobe-wood)" stroke="var(--neutral-200)" stroke-width="1.25"/>
        </svg>
      </div>

      <h1 class="hero-title animate-fade-in-up" style="animation-delay: 0.05s">Second Wardrobe</h1>
      <p class="hero-tagline animate-fade-in-up" style="animation-delay: 0.1s">Swap clothes with people near you</p>
      <p class="hero-desc animate-fade-in-up" style="animation-delay: 0.15s">
        Post what you have, set your location on the map, and discover others who want to swap. Simple and local.
      </p>

      <div class="hero-actions animate-fade-in-up" style="animation-delay: 0.25s">
        <button type="button" class="btn btn-primary" @click="goToMap">
          Browse the map
        </button>
        <template v-if="auth.isLoggedIn">
          <button type="button" class="btn btn-secondary" @click="goToCreatePost">
            Create a post
          </button>
        </template>
        <button v-else type="button" class="btn btn-secondary" @click="goToAuth">
          Log in to get started
        </button>
      </div>

      <div class="feature-pills animate-fade-in-up" style="animation-delay: 0.3s">
        <span class="pill">Map-based</span>
        <span class="pill">Local swaps</span>
        <span class="pill">Messages</span>
      </div>
    </div>

    <footer class="landing-footer">
      <router-link :to="{ name: 'map' }">Map</router-link>
      <span v-if="auth.isLoggedIn">·</span>
      <router-link v-if="auth.isLoggedIn" :to="{ name: 'create-post' }">Create Post</router-link>
      <span v-if="auth.isLoggedIn">·</span>
      <router-link v-if="auth.isLoggedIn" :to="{ name: 'profile' }">Profile</router-link>
      <template v-else>
        · <router-link :to="{ name: 'auth' }">Log in</router-link>
      </template>
    </footer>
  </div>
</template>

<style scoped>
.landing-view {
  min-height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem 5rem;
  position: relative;
  overflow: hidden;
}

.landing-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%, var(--accent-muted) 0%, transparent 55%),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(148, 163, 184, 0.08) 0%, transparent 50%);
}

/* High whitespace: hero in glass card */
.landing-hero {
  text-align: center;
  max-width: 28rem;
  position: relative;
  z-index: 1;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
  padding: 3rem 2rem;
  transition: box-shadow var(--transition-smooth);
}

.landing-hero:hover {
  box-shadow: var(--shadow-card-hover);
}

/* Wardrobe logo*/
.wardrobe-visual {
  margin: 0 auto 2rem;
  width: 160px;
  height: auto;
  flex-shrink: 0;
}

.wardrobe-svg {
  width: 100%;
  height: auto;
  display: block;
}

/* Typography: clean, neutral */
.hero-title {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text);
  line-height: 1.2;
}

.hero-tagline {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text);
}

.hero-desc {
  margin: 0 0 2.5rem;
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Buttons: micro-interactions */
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-btn);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform var(--transition-fast), box-shadow var(--transition-smooth), background-color var(--transition-smooth);
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background: var(--accent);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-card);
}

.btn-secondary {
  background: var(--surface-elevated);
  color: var(--accent);
  border: 1px solid var(--neutral-200);
  box-shadow: var(--shadow-xs);
}

.btn-secondary:hover {
  background: var(--neutral-50);
  border-color: var(--accent);
  color: var(--accent-hover);
  box-shadow: var(--shadow-sm);
}

/* Pills: subtle, glass-like */
.feature-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.pill {
  padding: 0.4rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(8px);
  transition: color var(--transition-smooth), border-color var(--transition-smooth), background var(--transition-smooth);
}

.pill:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.9);
  border-color: var(--neutral-300);
}

.landing-footer {
  margin-top: auto;
  padding-top: 3rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  position: relative;
  z-index: 1;
}

.landing-footer a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.landing-footer a:hover {
  color: var(--accent-hover);
}
</style>
