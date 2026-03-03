<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const displayName = ref('')
const error = ref('')
const loading = ref(false)

const redirectTo = computed(() => (route.query.redirect as string) || '/')

async function handleGoogle() {
  error.value = ''
  loading.value = true
  try {
    await auth.signInWithGoogle()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Sign in failed'
  } finally {
    loading.value = false
  }
}

async function handleEmail() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = 'Enter your email'
    return
  }
  if (!password.value) {
    error.value = 'Enter your password'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  loading.value = true
  try {
    if (isSignUp.value) {
      await auth.signUpWithEmail(email.value.trim(), password.value, displayName.value.trim() || undefined)
      error.value = ''
      // Redirect after signup; they may need to confirm email depending on Supabase config
      await router.push(redirectTo.value)
    } else {
      await auth.signInWithEmail(email.value.trim(), password.value)
      await router.push(redirectTo.value)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  isSignUp.value = !isSignUp.value
  error.value = ''
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-card">
      <h1 class="title">{{ isSignUp ? 'Create account' : 'Welcome back' }}</h1>
      <p class="subtitle">Swap clothes with people near you</p>

      <div v-if="error" class="error-msg" role="alert">
        {{ error }}
      </div>

      <div class="auth-actions">
        <button
          type="button"
          class="btn btn-google"
          :disabled="loading"
          @click="handleGoogle"
        >
          Continue with Google
        </button>

        <div class="divider">or</div>

        <form class="email-form" @submit.prevent="handleEmail">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="input"
            autocomplete="email"
            :disabled="loading"
          />
          <input
            v-model="password"
            type="password"
            placeholder="Password (min 6 characters)"
            class="input"
            autocomplete="new-password"
            :disabled="loading"
          />
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ isSignUp ? 'Sign up' : 'Log in' }} with email
          </button>
        </form>

        <button type="button" class="toggle-mode" @click="toggleMode">
          {{ isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-view {
  padding: 2rem 1rem;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 24rem;
  background: var(--surface-elevated);
  border-radius: var(--radius-card);
  padding: 2rem;
  box-shadow: var(--shadow-card);
}

.title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.subtitle {
  margin: 0 0 1.5rem;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.error-msg {
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn {
  padding: 0.6rem 1rem;
  border-radius: var(--radius-btn);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-google {
  background: var(--surface);
}

.btn-primary {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input {
  padding: 0.6rem 1rem;
  border-radius: var(--radius-btn);
  border: 1px solid var(--border);
  font-size: 1rem;
  background: var(--surface);
}

.toggle-mode {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 0;
  font-weight: 500;
}

.toggle-mode:hover {
  text-decoration: underline;
}

.divider {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0.25rem 0;
}
</style>
