<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { getCurrentPosition } from '@/lib/geolocation'
import { distanceMeters } from '@/lib/distance'
import RadiusFilter from '@/components/RadiusFilter.vue'
import PostCard from '@/components/PostCard.vue'
import type { Post } from '@/types/database'

const router = useRouter()
const postsStore = usePostsStore()

const userPosition = ref<{ lat: number; lng: number } | null>(null)
const radiusKm = ref(25)
const ready = ref(false)

const postsInRadius = computed<Post[]>(() => {
  const list = postsStore.posts
  const pos = userPosition.value
  if (!pos || radiusKm.value <= 0) return list
  const radiusM = radiusKm.value * 1000
  return list.filter((p) => distanceMeters(pos.lat, pos.lng, p.lat, p.lng) <= radiusM)
})

onMounted(async () => {
  userPosition.value = await getCurrentPosition()
  ready.value = true
  await postsStore.fetchPosts()
})

function onMessage(post: Post) {
  router.push({ name: 'messages', query: { postId: post.id } })
}
</script>

<template>
  <div class="nearby-view">
    <div class="toolbar">
      <h1 class="page-title">Nearby Swaps</h1>
      <RadiusFilter v-model="radiusKm" :disabled="!ready" />
    </div>

    <div v-if="!ready || postsStore.loading" class="loading">
      {{ postsStore.loading ? 'Loading posts…' : 'Getting your location…' }}
    </div>

    <div v-else-if="postsInRadius.length === 0" class="empty">
      <p>No swaps within {{ radiusKm }} km yet.</p>
      <p class="hint">Try a larger radius or create a post to get started!</p>
    </div>

    <div v-else class="grid">
      <router-link
        v-for="post in postsInRadius"
        :key="post.id"
        :to="{ name: 'post', params: { id: post.id } }"
        class="card-link"
      >
        <PostCard :post="post" :show-message="true" @message="onMessage" />
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.nearby-view {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 60px);
  padding-bottom: 2rem;
}

.toolbar {
  padding: 1rem;
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.page-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text);
}

.loading,
.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

.empty .hint {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  opacity: 0.9;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  padding: 1rem;
  align-content: start;
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  min-width: 0;
}

.card-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-card);
}
</style>
