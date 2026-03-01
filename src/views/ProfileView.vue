<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import PostCard from '@/components/PostCard.vue'
import type { Post } from '@/types/database'

const auth = useAuthStore()

const displayName = ref('')
const avatarUrl = ref('')
const myPosts = ref<Post[]>([])
const loading = ref(true)
const saving = ref(false)
const uploadingAvatar = ref(false)
const error = ref('')
const avatarInput = ref<HTMLInputElement | null>(null)

const canEdit = computed(() => !!auth.user)

const avatarDisplayUrl = computed(() => {
  const u = avatarUrl.value.trim()
  if (u && (u.startsWith('http') || u.startsWith('https'))) return u
  return null
})

onMounted(async () => {
  if (auth.profile) {
    displayName.value = auth.profile.display_name ?? ''
    avatarUrl.value = auth.profile.avatar_url ?? ''
  }
  const uid = auth.user?.id
  if (uid) {
    const { data } = await supabase.from('posts').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    myPosts.value = (data ?? []) as Post[]
  }
  loading.value = false
})

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function onAvatarFile(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files?.[0]
  el.value = ''
  if (!file || !file.type.startsWith('image/') || !auth.user?.id) return
  uploadingAvatar.value = true
  error.value = ''
  try {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `avatars/${auth.user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('post-images').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })
    if (uploadErr) throw uploadErr
    const { data } = supabase.storage.from('post-images').getPublicUrl(path)
    await auth.updateProfile({ avatar_url: data.publicUrl })
    avatarUrl.value = data.publicUrl
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to upload photo'
  } finally {
    uploadingAvatar.value = false
  }
}

async function saveProfile() {
  if (!auth.user) return
  saving.value = true
  error.value = ''
  try {
    await auth.updateProfile({
      display_name: displayName.value.trim() || undefined,
      avatar_url: avatarUrl.value.trim() || undefined,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="profile-view">
    <div class="profile-card">
      <h1 class="title">My profile</h1>
      <template v-if="canEdit">
        <div v-if="error" class="error-msg" role="alert">{{ error }}</div>

        <div class="avatar-section">
          <label class="label">Profile picture</label>
          <p class="hint">Used on the map and in messages. Click to change.</p>
          <button
            type="button"
            class="avatar-wrap"
            :disabled="uploadingAvatar"
            @click="triggerAvatarUpload"
          >
            <img
              v-if="avatarDisplayUrl"
              :src="avatarDisplayUrl"
              alt="Profile"
              class="avatar-img"
            />
            <span v-else class="avatar-placeholder">
              {{ uploadingAvatar ? 'Uploading…' : 'Add photo' }}
            </span>
          </button>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onAvatarFile"
          />
        </div>

        <div class="field">
          <label class="label">Display name</label>
          <input v-model="displayName" type="text" class="input" placeholder="Your name" />
        </div>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="saveProfile">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
      <p v-else class="muted">Log in to edit your profile.</p>
    </div>

    <section class="my-posts-section">
      <h2 class="section-title">My posts</h2>
      <div v-if="loading" class="loading">Loading…</div>
      <div v-else-if="myPosts.length" class="posts-grid">
        <router-link
          v-for="post in myPosts"
          :key="post.id"
          :to="{ name: 'post', params: { id: post.id } }"
          class="post-wrap"
        >
          <PostCard :post="post" :show-message="false" />
        </router-link>
      </div>
      <p v-else class="empty">You haven't posted any swaps yet. <router-link :to="{ name: 'create-post' }">Create one</router-link>!</p>
    </section>
  </div>
</template>

<style scoped>
.profile-view {
  padding: 1.5rem 1rem 3rem;
  max-width: 48rem;
  margin: 0 auto;
}

.profile-card {
  background: var(--surface-elevated);
  border-radius: var(--radius-card);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-card);
}

.title {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}

.avatar-section {
  margin-bottom: 1.25rem;
}

.avatar-section .hint {
  margin: 0.25rem 0 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.avatar-wrap {
  display: block;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  padding: 0;
  transition: border-color var(--transition-smooth);
}

.avatar-wrap:hover:not(:disabled) {
  border-color: var(--accent);
}

.avatar-wrap:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: center;
}

.hidden {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.field {
  margin-bottom: 1rem;
}

.label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: var(--text);
}

.input {
  width: 100%;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-btn);
  border: 1px solid var(--border);
  font-size: 1rem;
}

.error-msg {
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: var(--radius-btn);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-btn);
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.muted {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.my-posts-section {
  margin-top: 1.5rem;
}

.section-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.loading,
.empty {
  color: var(--text-muted);
  padding: 1rem 0;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.post-wrap {
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.post-wrap :deep(.post-card) {
  transition: box-shadow var(--transition-smooth);
}

.post-wrap:hover :deep(.post-card) {
  box-shadow: var(--shadow-card-hover);
}
</style>
