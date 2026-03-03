<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
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

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxZoom = ref(1)
const minZoom = 0.5
const maxZoom = 4
const zoomStep = 0.25

const imageUrls = computed(() => {
  const p = post.value
  if (!p?.image_urls?.length) return []
  return p.image_urls.map((path) => {
    const { data } = supabase.storage.from('post-images').getPublicUrl(path)
    return data.publicUrl
  })
})

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxZoom.value = 1
  lightboxOpen.value = true
  window.addEventListener('keydown', onLightboxKeydown)
}

function closeLightbox() {
  lightboxOpen.value = false
  window.removeEventListener('keydown', onLightboxKeydown)
}

function lightboxPrev() {
  if (imageUrls.value.length <= 1) return
  lightboxIndex.value = (lightboxIndex.value - 1 + imageUrls.value.length) % imageUrls.value.length
  lightboxZoom.value = 1
}

function lightboxNext() {
  if (imageUrls.value.length <= 1) return
  lightboxIndex.value = (lightboxIndex.value + 1) % imageUrls.value.length
  lightboxZoom.value = 1
}

function lightboxZoomIn() {
  lightboxZoom.value = Math.min(maxZoom, lightboxZoom.value + zoomStep)
}

function lightboxZoomOut() {
  lightboxZoom.value = Math.max(minZoom, lightboxZoom.value - zoomStep)
}

function lightboxZoomReset() {
  lightboxZoom.value = 1
}

function onLightboxWheel(e: WheelEvent) {
  if (!lightboxOpen.value) return
  e.preventDefault()
  if (e.deltaY < 0) lightboxZoomIn()
  else if (e.deltaY > 0) lightboxZoomOut()
}

function onLightboxKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') lightboxPrev()
  if (e.key === 'ArrowRight') lightboxNext()
}

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

onUnmounted(() => {
  window.removeEventListener('keydown', onLightboxKeydown)
  document.body.style.overflow = ''
})

watch(lightboxOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
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
          class="gallery-img"
          role="button"
          tabindex="0"
          @click="openLightbox(i)"
          @keydown.enter="openLightbox(i)"
          @keydown.space.prevent="openLightbox(i)"
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

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxOpen && post"
        class="lightbox-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
        @click.self="closeLightbox"
      >
        <button type="button" class="lightbox-close" aria-label="Close" @click="closeLightbox">×</button>

        <button
          v-if="imageUrls.length > 1"
          type="button"
          class="lightbox-nav lightbox-prev"
          aria-label="Previous image"
          @click="lightboxPrev"
        >
          ‹
        </button>
        <button
          v-if="imageUrls.length > 1"
          type="button"
          class="lightbox-nav lightbox-next"
          aria-label="Next image"
          @click="lightboxNext"
        >
          ›
        </button>

        <div class="lightbox-image-wrap" @click.self="closeLightbox" @wheel.prevent="onLightboxWheel">
          <img
            :src="imageUrls[lightboxIndex]"
            :alt="`${post.title} image ${lightboxIndex + 1}`"
            class="lightbox-image"
            :style="{ transform: `scale(${lightboxZoom})` }"
            draggable="false"
            @click.stop
          />
        </div>

        <div class="lightbox-toolbar">
          <button type="button" class="lightbox-zoom-btn" aria-label="Zoom out" @click="lightboxZoomOut">−</button>
          <span class="lightbox-zoom-label">{{ Math.round(lightboxZoom * 100) }}%</span>
          <button type="button" class="lightbox-zoom-btn" aria-label="Zoom in" @click="lightboxZoomIn">+</button>
          <button type="button" class="lightbox-zoom-btn reset" @click="lightboxZoomReset">Reset</button>
        </div>

        <p v-if="imageUrls.length > 1" class="lightbox-counter">{{ lightboxIndex + 1 }} / {{ imageUrls.length }}</p>
      </div>
    </Teleport>
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

.post-gallery .gallery-img {
  cursor: pointer;
}

.post-gallery .gallery-img:hover {
  opacity: 0.95;
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

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 4rem 5rem;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 1.75rem;
  line-height: 1;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 2.5rem;
  line-height: 1;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s;
}

.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-prev {
  left: 1rem;
}

.lightbox-next {
  right: 1rem;
}

.lightbox-image-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 1rem;
}

.lightbox-image {
  max-width: 100%;
  max-height: calc(100vh - 10rem);
  width: auto;
  height: auto;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.15s ease-out;
  user-select: none;
  pointer-events: none;
}

.lightbox-toolbar {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 9999px;
}

.lightbox-zoom-btn {
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.25rem;
  line-height: 1;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s;
}

.lightbox-zoom-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.lightbox-zoom-btn.reset {
  width: auto;
  padding: 0 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  margin-left: 0.25rem;
}

.lightbox-zoom-label {
  min-width: 3rem;
  text-align: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.lightbox-counter {
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}
</style>
