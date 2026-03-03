<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import { getCurrentPosition, getDefaultCenter } from '@/lib/geolocation'
import { geocodeAddress, suggestAddresses, type GeocodeResult } from '@/lib/geocoding'

const props = defineProps<{
  modelValue: { lat: number; lng: number } | null
  addressLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: { lat: number; lng: number }]
  'update:addressLabel': [v: string]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null
const status = ref<'loading' | 'ready' | 'error'>('loading')
const searchQuery = ref('')
const searching = ref(false)
const searchError = ref('')
const suggestions = ref<GeocodeResult[]>([])
let debounceId: number | undefined

const defaultCenter = getDefaultCenter()

onMounted(() => {
  if (!mapContainer.value) return
  const initial = props.modelValue ?? defaultCenter
  map = L.map(mapContainer.value).setView([initial.lat, initial.lng], 13)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM & CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map)

  const icon = L.divIcon({
    html: '<div class="location-picker-pin"></div>',
    className: 'location-picker-pin-wrap',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  })
  marker = L.marker([initial.lat, initial.lng], { icon, draggable: true })
    .addTo(map)
    .on('dragend', () => {
      const latlng = marker!.getLatLng()
      emit('update:modelValue', { lat: latlng.lat, lng: latlng.lng })
    })

  status.value = 'ready'
  getCurrentPosition().then((pos) => {
    if (!map || !marker) return
    marker.setLatLng([pos.lat, pos.lng])
    map.setView([pos.lat, pos.lng], 13)
    emit('update:modelValue', pos)
  }).catch(() => {
    status.value = 'error'
  })
})

watch(
  () => props.modelValue,
  (v) => {
    if (map && marker && v) {
      marker.setLatLng([v.lat, v.lng])
      map.setView([v.lat, v.lng], map.getZoom())
    }
  },
  { deep: true }
)

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
  if (!map || !marker) return
  marker.setLatLng([result.lat, result.lng])
  map.setView([result.lat, result.lng], 13)
  emit('update:modelValue', { lat: result.lat, lng: result.lng })
  emit('update:addressLabel', result.displayName)
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
  <div class="location-map-picker">
    <div ref="mapContainer" class="location-map-canvas" />
    <p v-if="status === 'loading'" class="location-status">Loading map…</p>
    <p v-else-if="status === 'ready'" class="location-status hint">Drag the pin or search by address to set your location.</p>
    <div class="location-search">
      <input
        v-model="searchQuery"
        type="text"
        class="location-search-input"
        placeholder="Start typing an address…"
        @keydown.enter.prevent="lookupAddress"
      />
      <button
        type="button"
        class="location-search-btn"
        :disabled="!searchQuery.trim() || searching"
        @click="lookupAddress"
      >
        {{ searching ? 'Searching…' : 'Use' }}
      </button>
    </div>
    <ul v-if="suggestions.length" class="location-suggestions">
      <li
        v-for="s in suggestions"
        :key="`${s.lat}-${s.lng}-${s.displayName}`"
        class="location-suggestion"
        @click="applyResult(s)"
      >
        {{ s.displayName }}
      </li>
    </ul>
    <p v-if="searchError" class="location-error">{{ searchError }}</p>
  </div>
</template>

<style scoped>
.location-map-picker {
  position: relative;
  border-radius: var(--radius-card);
  overflow: hidden;
  border: 2px solid var(--border);
  background: var(--surface);
}

.location-map-canvas {
  width: 100%;
  height: 220px;
}

.location-status {
  margin: 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  background: var(--surface-elevated);
}

.location-status.hint {
  color: var(--accent);
  font-weight: 500;
}

.location-search {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem 0.25rem;
  align-items: center;
  background: var(--surface-elevated);
}

.location-search-input {
  flex: 1;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 0.9rem;
}

.location-search-btn {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
}

.location-search-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.location-suggestions {
  list-style: none;
  margin: 0;
  padding: 0 0.75rem 0.5rem;
  max-height: 180px;
  overflow-y: auto;
  background: var(--surface-elevated);
  border-top: 1px solid var(--border);
}

.location-suggestion {
  padding: 0.4rem 0;
  font-size: 0.85rem;
  cursor: pointer;
}

.location-suggestion + .location-suggestion {
  border-top: 1px solid var(--border-subtle);
}

.location-suggestion:hover {
  color: var(--accent);
}

.location-error {
  margin: 0;
  padding: 0 0.75rem 0.75rem;
  font-size: 0.8rem;
  color: #b91c1c;
  background: var(--surface-elevated);
}
</style>

<style>
.location-picker-pin-wrap {
  background: none !important;
  border: none !important;
}

.location-picker-pin {
  width: 32px;
  height: 42px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 36'%3E%3Cpath fill='%230d9488' stroke='%23fff' stroke-width='2' d='M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z'/%3E%3Ccircle fill='%23fff' cx='12' cy='12' r='4'/%3E%3C/svg%3E") center/contain no-repeat;
  cursor: grab;
}
.location-picker-pin:active {
  cursor: grabbing;
}
</style>
