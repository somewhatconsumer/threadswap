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
    <div class="landing-bg">
      <div class="gradient-orb orb-1" />
      <div class="gradient-orb orb-2" />
      <div class="gradient-orb orb-3" />
      <div class="gradient-orb orb-4" />
      <div class="gradient-orb orb-5" />
      <div class="mesh-gradient" />
      <div class="noise-overlay" />
    </div>

    <div class="landing-hero">
      <h1 class="hero-title animate-fade-in-up">Threadswap</h1>
      <p class="hero-tagline animate-fade-in-up" style="animation-delay: 0.05s">Swap clothes with people near you</p>
      <p class="hero-desc animate-fade-in-up" style="animation-delay: 0.1s">
        Post what you have, set your location on the map, and discover others who want to swap. Simple and local.
      </p>

      <div class="hero-actions animate-fade-in-up" style="animation-delay: 0.2s">
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

      <div class="feature-pills animate-fade-in-up" style="animation-delay: 0.25s">
        <span class="pill">Map-based</span>
        <span class="pill">Local swaps</span>
        <span class="pill">Messages</span>
      </div>
    </div>

    <footer class="landing-footer">
      <router-link :to="{ name: 'map' }">Map</router-link>
      <span v-if="auth.isLoggedIn">·</span>
      <router-link v-if="auth.isLoggedIn" :to="{ name: 'create-post' }">Create post</router-link>
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
  padding: 2rem 1rem 4rem;
  position: relative;
  overflow: hidden;
}

.landing-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.mesh-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(13, 148, 136, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(245, 158, 11, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 50% 90%, rgba(99, 102, 241, 0.1) 0%, transparent 45%);
  background-size: 200% 200%;
  animation: gradient-drift 18s ease-in-out infinite;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.5;
  will-change: transform;
}

.orb-1 {
  width: 320px;
  height: 320px;
  background: rgba(13, 148, 136, 0.4);
  top: -100px;
  left: -80px;
  animation: float-slow 20s ease-in-out infinite;
}

.orb-2 {
  width: 280px;
  height: 280px;
  background: rgba(245, 158, 11, 0.35);
  top: 40%;
  right: -60px;
  animation: float-slower 25s ease-in-out infinite reverse;
}

.orb-3 {
  width: 240px;
  height: 240px;
  background: rgba(99, 102, 241, 0.3);
  bottom: -40px;
  left: 20%;
  animation: float-slow 22s ease-in-out infinite 2s;
}

.orb-4 {
  width: 180px;
  height: 180px;
  background: rgba(236, 72, 153, 0.25);
  top: 60%;
  left: 10%;
  animation: pulse-soft 8s ease-in-out infinite;
}

.orb-5 {
  width: 200px;
  height: 200px;
  background: rgba(34, 211, 238, 0.25);
  top: 15%;
  right: 25%;
  animation: float-slower 18s ease-in-out infinite 1s;
}

.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}

.landing-hero {
  text-align: center;
  max-width: 28rem;
  position: relative;
  z-index: 1;
}

.hero-title {
  margin: 0 0 0.5rem;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #1f2937 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.hero-tagline {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  color: var(--text);
  font-weight: 600;
}

.hero-desc {
  margin: 0 0 2rem;
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

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
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform var(--transition-smooth), box-shadow var(--transition-smooth);
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #0d9488, #0f766e);
  color: white;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.5);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: var(--accent);
  border: 2px solid var(--accent);
  backdrop-filter: blur(8px);
}

.btn-secondary:hover {
  background: white;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.2);
}

.feature-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.pill {
  padding: 0.45rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.85);
  color: var(--text);
  border: 1px solid rgba(13, 148, 136, 0.3);
  backdrop-filter: blur(8px);
  transition: background var(--transition-smooth), transform var(--transition-smooth);
}

.pill:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

.landing-footer {
  margin-top: auto;
  padding-top: 3rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  position: relative;
  z-index: 1;
}

.landing-footer a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
}

.landing-footer a:hover {
  text-decoration: underline;
}
</style>
