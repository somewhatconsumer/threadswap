<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/database'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const postsStore = usePostsStore()

const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref('')

const imageUrls = computed(() => {
  const p = post.value
  if (!p?.image_urls?.length) return []
  return p.image_urls.map((path) => {
    const { data } = supabase.storage.from('post-images').getPublicUrl(path)
    return data.publicUrl
  })
})

onMounted(async () => {
  const id = route.params.id as string
  if (!id) {
    error.value = 'Invalid post'
    loading.value = false
    return
  }
  const p = await postsStore.fetchPost(id)
  post.value = p ?? null
  if (!p) error.value = 'Post not found'
  loading.value = false
})

function goMessage() {
  if (!post.value) return
  router.push({ name: 'messages', query: { postId: post.value.id } })
}

const canMessage = computed(() => auth.isLoggedIn && post.value && post.value.user_id !== auth.user?.id)

const canEdit = computed(() => auth.isLoggedIn && post.value && post.value.user_id === auth.user?.id)

async function confirmDelete() {
  if (!post.value || post.value.user_id !== auth.user?.id) return
  if (!window.confirm("Delete this post? This can't be undone.")) return
  const { error: err } = await postsStore.deletePost(post.value.id)
  if (err) {
    error.value = err.message
    return
  }
  router.push({ name: 'map' })
}

function displayCategories(p: Post | null): string {
  if (!p) return ''
  const c = (p as Post & { categories?: string[] }).categories
  if (Array.isArray(c) && c.length > 0) return c.join(', ')
  return p.category
}
</script>

<template>
  <div class="post-detail-view">
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="error || !post" class="error">{{ error || 'Post not found' }}</div>
    <article v-else class="post-detail">
      <div class="post-gallery">
        <img
          v-for="(url, i) in imageUrls"
          :key="i"
          :src="url"
          :alt="`${post.title} image ${i + 1}`"
        />
      </div>
      <div v-if="imageUrls.length === 0" class="post-gallery placeholder">No images</div>
      <div class="post-body">
        <h1 class="title">{{ post.title }}</h1>
        <p class="category">{{ displayCategories(post) }}</p>
        <p v-if="post.description" class="description">{{ post.description }}</p>
        <p v-if="post.address_label" class="location">{{ post.address_label }}</p>
        <div v-if="canEdit" class="actions">
          <router-link :to="{ name: 'edit-post', params: { id: post.id } }" class="btn btn-edit">Edit</router-link>
          <button type="button" class="btn btn-delete" @click="confirmDelete">Delete</button>
        </div>
        <button
          v-if="canMessage"
          type="button"
          class="btn-message"
          @click="goMessage"
        >
          Message about this swap
        </button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.post-detail-view {
  padding: 1rem;
  max-width: 36rem;
  margin: 0 auto;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.error {
  color: #b91c1c;
}

.post-detail {
  background: var(--surface-elevated);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.post-gallery {
  display: flex;
  overflow-x: auto;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--border);
}

.post-gallery img {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.post-gallery.placeholder {
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.post-body {
  padding: 1.25rem;
}

.title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.category {
  margin: 0;
  font-size: 0.95rem;
  color: var(--accent);
  text-transform: capitalize;
}

.description {
  margin: 1rem 0 0;
  color: var(--text);
  line-height: 1.5;
}

.location {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.btn-message {
  margin-top: 1rem;
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-btn);
  font-size: 1rem;
  font-weight: 600;
  background: var(--accent);
  color: white;
  border: none;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-btn);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.btn-edit {
  background: var(--surface);
  color: var(--text);
  border: 2px solid var(--border);
}

.btn-edit:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-delete {
  background: transparent;
  color: #b91c1c;
  border: 2px solid #fecaca;
}

.btn-delete:hover {
  background: #fef2f2;
}
</style>
