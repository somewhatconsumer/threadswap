<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { getCurrentPosition } from '@/lib/geolocation'
import { distanceMeters } from '@/lib/distance'
import MapCanvas from '@/components/MapCanvas.vue'
import RadiusFilter from '@/components/RadiusFilter.vue'
import type { Post } from '@/types/database'
import type { PostWithAvatar } from '@/stores/posts'

const router = useRouter()
const postsStore = usePostsStore()

const center = ref({ lat: 37.7749, lng: -122.4194 })
const userPosition = ref<{ lat: number; lng: number } | null>(null)
const radiusKm = ref(25)
const mapReady = ref(false)
const avatarByUserId = ref<Record<string, string | null>>({})

const postsInRadius = computed<Post[]>(() => {
  const list = postsStore.posts
  const pos = userPosition.value
  if (!pos || radiusKm.value <= 0) return list
  const radiusM = radiusKm.value * 1000
  return list.filter((p) => distanceMeters(pos.lat, pos.lng, p.lat, p.lng) <= radiusM)
})

const postsWithAvatar = computed<PostWithAvatar[]>(() => {
  return postsInRadius.value.map((p) => ({
    ...p,
    avatar_url: avatarByUserId.value[p.user_id] ?? null,
  }))
})

onMounted(async () => {
  const pos = await getCurrentPosition()
  center.value = pos
  userPosition.value = pos
  mapReady.value = true
  await postsStore.fetchPosts()
})

watch(
  () => postsStore.posts,
  async (posts) => {
    const ids = [...new Set(posts.map((p) => p.user_id))]
    if (ids.length > 0) {
      avatarByUserId.value = await postsStore.fetchAvatarsForUserIds(ids)
    }
  },
  { immediate: true }
)

watch(userPosition, (pos) => {
  if (pos) center.value = pos
})

function onMessage(post: Post) {
  router.push({ name: 'messages', query: { postId: post.id } })
}
</script>

<template>
  <div class="map-view">
    <div class="map-toolbar">
      <RadiusFilter v-model="radiusKm" :disabled="!mapReady" />
    </div>
    <div class="map-wrap">
      <MapCanvas
        v-if="mapReady"
        :center="center"
        :posts="postsWithAvatar"
        :user-position="userPosition"
        :radius-km="radiusKm"
        @message="onMessage"
      />
      <div v-else class="map-loading">Loading map…</div>
      <div v-if="mapReady && !postsStore.loading && postsInRadius.length === 0" class="map-empty">
        <p>No swaps in this radius yet.</p>
        <p class="hint">Try a larger radius or create a post to get started!</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  min-height: 400px;
}

.map-toolbar {
  padding: 0.75rem 1rem;
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.map-wrap {
  flex: 1;
  position: relative;
  min-height: 0;
}

.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  color: var(--text-muted);
}

.map-empty {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.25rem;
  background: var(--surface-elevated);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  text-align: center;
  font-size: 0.95rem;
  color: var(--text);
}

.map-empty .hint {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>
