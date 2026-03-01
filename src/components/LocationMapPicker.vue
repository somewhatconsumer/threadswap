<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import { getCurrentPosition, getDefaultCenter } from '@/lib/geolocation'

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

watch(() => props.modelValue, (v) => {
  if (map && marker && v) {
    marker.setLatLng([v.lat, v.lng])
    map.setView([v.lat, v.lng], map.getZoom())
  }
}, { deep: true })
</script>

<template>
  <div class="location-map-picker">
    <div ref="mapContainer" class="location-map-canvas" />
    <p v-if="status === 'loading'" class="location-status">Loading map…</p>
    <p v-else-if="status === 'ready'" class="location-status hint">Drag the pin to set your location</p>
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
