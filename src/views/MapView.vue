<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { getCurrentPosition } from '@/lib/geolocation'
import { distanceMeters } from '@/lib/distance'
import MapCanvas from '@/components/MapCanvas.vue'
import RadiusFilter from '@/components/RadiusFilter.vue'
import { geocodeAddress, suggestAddresses, type GeocodeResult } from '@/lib/geocoding'
import type { Post } from '@/types/database'
import type { PostWithAvatar } from '@/stores/posts'

const router = useRouter()
const postsStore = usePostsStore()

const center = ref({ lat: 37.7749, lng: -122.4194 })
const userPosition = ref<{ lat: number; lng: number } | null>(null)
const radiusKm = ref(25)
const mapReady = ref(false)
const avatarByUserId = ref<Record<string, string | null>>({})
const searchQuery = ref('')
const searching = ref(false)
const searchError = ref('')
const suggestions = ref<GeocodeResult[]>([])
let debounceId: number | undefined

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

watch(
  searchQuery,
  (q) => {
    if (debounceId) {
      window.clearTimeout(debounceId)
      debounceId = undefined
    }
    const trimmed = q.trim()
    if (!trimmed || trimmed.length < 3) {
      suggestions.value = []
      searchError.value = ''
      return
    }
    debounceId = window.setTimeout(async () => {
      try {
        searching.value = true
        searchError.value = ''
        suggestions.value = await suggestAddresses(trimmed, 5)
        if (suggestions.value.length === 0) {
          searchError.value = 'No matches found for that address.'
        }
      } catch {
        searchError.value = 'Something went wrong while searching for that address.'
        suggestions.value = []
      } finally {
        searching.value = false
      }
    }, 350)
  }
)

async function applyResult(result: GeocodeResult) {
  center.value = { lat: result.lat, lng: result.lng }
  userPosition.value = { lat: result.lat, lng: result.lng }
  searchQuery.value = result.displayName
  suggestions.value = []
}

async function lookupAddress() {
  const q = searchQuery.value.trim()
  if (!q) return
  if (suggestions.value.length > 0) {
    const first = suggestions.value[0]
    if (!first) return
    await applyResult(first)
    return
  }
  searchError.value = ''
  searching.value = true
  try {
    const result = await geocodeAddress(q)
    if (!result) {
      searchError.value = 'Could not find that address.'
      return
    }
    await applyResult(result)
  } catch {
    searchError.value = 'Something went wrong while looking up that address.'
  } finally {
    searching.value = false
  }
}
</script>

<template>
  <div class="map-view">
    <div class="map-toolbar">
      <RadiusFilter v-model="radiusKm" :disabled="!mapReady" />
      <div class="map-search">
        <input
          v-model="searchQuery"
          type="text"
          class="map-search-input"
          placeholder="Search by address…"
          :disabled="!mapReady"
          @keydown.enter.prevent="lookupAddress"
        />
        <button
          type="button"
          class="map-search-btn"
          :disabled="!mapReady || !searchQuery.trim() || searching"
          @click="lookupAddress"
        >
          {{ searching ? 'Searching…' : 'Use' }}
        </button>
      </div>
      <ul v-if="suggestions.length" class="map-search-suggestions">
        <li
          v-for="s in suggestions"
          :key="`${s.lat}-${s.lng}-${s.displayName}`"
          class="map-search-suggestion"
          @click="applyResult(s)"
        >
          {{ s.displayName }}
        </li>
      </ul>
      <p v-if="searchError" class="map-search-error">{{ searchError }}</p>
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.map-search {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  justify-content: flex-end;
}

.map-search-input {
  flex: 1;
  max-width: 260px;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 0.9rem;
}

.map-search-btn {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
}

.map-search-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.map-search-suggestions {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0 0;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  font-size: 0.85rem;
}

.map-search-suggestion {
  padding: 0.25rem 0;
  cursor: pointer;
}

.map-search-suggestion + .map-search-suggestion {
  border-top: 1px solid var(--border-subtle);
}

.map-search-suggestion:hover {
  color: var(--accent);
}

.map-search-error {
  margin: 0;
  font-size: 0.8rem;
  color: #b91c1c;
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
