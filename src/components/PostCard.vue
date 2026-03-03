<script setup lang="ts">
import { ref } from 'vue'
import type { Post } from '@/types/database'
import { supabase } from '@/lib/supabase'

const props = defineProps<{
  post: Post
  showMessage?: boolean
}>()

const emit = defineEmits<{
  message: [post: Post]
}>()

const imageUrl = ref<string | null>(null)

function getImageUrl(path: string) {
  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}

const firstImage = props.post.image_urls?.[0]
if (firstImage) {
  imageUrl.value = getImageUrl(firstImage)
}

function displayCategories(post: Post): string {
  const c = (post as Post & { categories?: string[] }).categories
  if (Array.isArray(c) && c.length > 0) return c.join(', ')
  return post.category
}

function onMessage() {
  emit('message', props.post)
}
</script>

<template>
  <article class="post-card">
    <div v-if="imageUrl" class="post-card-image">
      <img :src="imageUrl" :alt="post.title" />
    </div>
    <div v-else class="post-card-image placeholder">No image</div>
    <div class="post-card-body">
      <h3 class="post-title">{{ post.title }}</h3>
      <p class="post-category">{{ displayCategories(post) }}</p>
      <p v-if="post.address_label" class="post-location">{{ post.address_label }}</p>
      <button
        v-if="showMessage"
        type="button"
        class="btn-message"
        @click.stop="onMessage"
      >
        Message
      </button>
    </div>
  </article>
</template>

<style scoped>
.post-card {
  background: var(--surface-elevated);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-subtle);
  transition: box-shadow var(--transition-smooth), border-color var(--transition-smooth);
}

.post-card:hover {
  box-shadow: var(--shadow-card-hover);
}

.post-card-image {
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--neutral-100);
}

.post-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-card-image.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.post-card-body {
  padding: 1rem;
}

.post-title {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.post-category {
  margin: 0;
  font-size: 0.85rem;
  color: var(--accent);
  text-transform: capitalize;
}

.post-location {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.btn-message {
  margin-top: 0.75rem;
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-btn);
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--accent);
  color: white;
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.btn-message:hover {
  background: var(--accent-hover);
}

.btn-message:active {
  transform: scale(0.98);
}
</style>
