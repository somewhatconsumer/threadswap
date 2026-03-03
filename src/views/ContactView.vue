<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const auth = useAuthStore()

const name = ref('')
const email = ref('')
const message = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)

const namePlaceholder = computed(() => (auth.isLoggedIn ? 'Your name (optional)' : 'Your name'))
const emailPlaceholder = computed(() => (auth.isLoggedIn ? 'Your email (optional)' : 'Your email'))

onMounted(() => {
  if (auth.isLoggedIn && auth.user?.email) {
    email.value = auth.user.email
    if (auth.profile?.display_name) name.value = auth.profile.display_name
  }
})

async function submit() {
  error.value = ''
  const trimmedMessage = message.value.trim()
  if (!trimmedMessage) {
    error.value = 'Please enter your message'
    return
  }
  loading.value = true
  try {
    const { error: err } = await supabase.from('feedback').insert({
      name: name.value.trim() || null,
      email: email.value.trim() || null,
      message: trimmedMessage,
      user_id: auth.user?.id ?? null,
    })
    if (err) throw err
    sent.value = true
    name.value = ''
    email.value = ''
    message.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="contact-view">
    <div class="contact-card">
      <h1 class="title">Contact & feedback</h1>
      <p class="subtitle">Send a message, report a bug, or suggest an improvement. I’ll get back to you.</p>

      <form v-if="!sent" class="form" @submit.prevent="submit">
        <div v-if="error" class="error-msg" role="alert">{{ error }}</div>

        <div class="field">
          <label class="label" for="contact-name">Name</label>
          <input
            id="contact-name"
            v-model="name"
            type="text"
            class="input"
            :placeholder="namePlaceholder"
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label class="label" for="contact-email">Email</label>
          <input
            id="contact-email"
            v-model="email"
            type="email"
            class="input"
            :placeholder="emailPlaceholder"
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label class="label" for="contact-message">Message <span class="required">*</span></label>
          <textarea
            id="contact-message"
            v-model="message"
            class="textarea"
            placeholder="Your feedback, question, or how I can help..."
            rows="5"
            :disabled="loading"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Sending…' : 'Send message' }}
        </button>
      </form>

      <div v-else class="success-msg">
        <p>Thanks for getting in touch. I’ll read your message and reply if you left an email.</p>
        <button type="button" class="btn btn-secondary" @click="sent = false">Send another</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-view {
  padding: 1.5rem 1rem 3rem;
}

.contact-card {
  max-width: 28rem;
  margin: 0 auto;
  background: var(--surface-elevated);
  border-radius: var(--radius-card);
  padding: 1.5rem;
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
  font-size: 0.95rem;
  color: var(--text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.label .required {
  color: var(--accent);
}

.input,
.textarea {
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  border: 2px solid var(--border);
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;
  font-family: inherit;
}

.input:focus,
.textarea:focus {
  border-color: var(--accent);
  outline: none;
}

.textarea {
  resize: vertical;
  min-height: 6rem;
}

.error-msg {
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.success-msg {
  text-align: center;
  padding: 0.5rem 0;
}

.success-msg p {
  margin: 0 0 1rem;
  color: var(--text);
  line-height: 1.5;
}

.btn {
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-btn);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: box-shadow 0.2s;
}

.btn-primary {
  background: var(--accent);
  color: white;
  margin-top: 0.25rem;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--surface);
  color: var(--accent);
  border: 2px solid var(--accent);
}

.btn-secondary:hover {
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.2);
}
</style>
