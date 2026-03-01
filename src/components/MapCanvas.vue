<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import type { Post } from '@/types/database'
import type { PostWithAvatar } from '@/stores/posts'
import { supabase } from '@/lib/supabase'

const props = defineProps<{
  center: { lat: number; lng: number }
  posts: PostWithAvatar[]
  userPosition: { lat: number; lng: number } | null
  radiusKm: number
}>()

const emit = defineEmits<{
  message: [post: Post]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null
let radiusCircle: L.Circle | null = null

const defaultAvatarUrl = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230d9488"><circle cx="12" cy="8" r="4"/><path d="M12 14c-3.3 0-6 1.8-6 4v2h12v-2c0-2.2-2.7-4-6-4z"/></svg>'
)

function getImageUrl(path: string): string {
  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}

function getAvatarIcon(avatarUrl: string | null | undefined): L.DivIcon {
  const src = avatarUrl && avatarUrl.startsWith('http') ? avatarUrl : defaultAvatarUrl
  return L.divIcon({
    html: `<div class="threadswap-marker threadswap-marker-avatar"><img src="${src}" alt="" /></div>`,
    className: 'threadswap-marker-wrap',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  })
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function postCategories(post: Post): string[] {
  const c = (post as Post & { categories?: string[] }).categories
  if (Array.isArray(c) && c.length > 0) return c
  return [post.category]
}

function buildTooltipContent(post: PostWithAvatar): string {
  const cats = postCategories(post).map(escapeHtml).join(', ')
  return `
    <div class="threadswap-tooltip">
      <strong>${escapeHtml(post.title)}</strong>
      <span class="popup-cat">${cats}</span>
      <span class="popup-hint">Click for details</span>
    </div>
  `
}

function buildPopupContent(post: PostWithAvatar): HTMLElement {
  const div = document.createElement('div')
  div.className = 'threadswap-popup threadswap-popup-full'
  const imageUrls = (post.image_urls ?? []).map(getImageUrl)
  const cats = postCategories(post).map(escapeHtml).join(', ')
  const imagesHtml = imageUrls.length > 0
    ? `<div class="popup-images"><div class="popup-images-scroll">${imageUrls.map((url) => `<img src="${escapeHtml(url)}" alt="" />`).join('')}</div></div>`
    : ''
  div.innerHTML = `
    ${imagesHtml}
    <strong class="popup-title">${escapeHtml(post.title)}</strong>
    <span class="popup-cat">${cats}</span>
    ${post.address_label ? `<span class="popup-addr">${escapeHtml(post.address_label)}</span>` : ''}
    <div class="popup-actions">
      <a href="/post/${post.id}" class="popup-link">View</a>
      <button type="button" class="popup-msg">Message</button>
    </div>
  `
  const msgBtn = div.querySelector('.popup-msg')
  if (msgBtn) {
    msgBtn.addEventListener('click', () => emit('message', post))
  }
  return div
}

function updateMarkers() {
  if (!map || !markersLayer) return
  markersLayer.clearLayers()
  for (const post of props.posts) {
    const marker = L.marker([post.lat, post.lng], {
      icon: getAvatarIcon(post.avatar_url),
    })
    marker.bindTooltip(buildTooltipContent(post), {
      direction: 'top',
      offset: [0, -24],
      className: 'threadswap-tooltip-wrap',
      opacity: 0.95,
    })
    marker.bindPopup(buildPopupContent(post), {
      minWidth: 260,
      maxWidth: 320,
      className: 'threadswap-popup-wrap',
    })
    marker.addTo(markersLayer)
  }
}

function updateRadiusCircle() {
  if (!map || !props.userPosition) return
  if (radiusCircle) {
    map.removeLayer(radiusCircle)
    radiusCircle = null
  }
  if (props.radiusKm > 0) {
    radiusCircle = L.circle(
      [props.userPosition.lat, props.userPosition.lng],
      { radius: props.radiusKm * 1000 }
    ).addTo(map)
    radiusCircle.setStyle({ color: 'var(--accent)', fillOpacity: 0.08, weight: 2 })
  }
}

onMounted(() => {
  if (!mapContainer.value) return
  map = L.map(mapContainer.value).setView([props.center.lat, props.center.lng], 12)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM & CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map)
  markersLayer = L.layerGroup().addTo(map)
  updateMarkers()
  updateRadiusCircle()
})

watch(() => [props.center, props.posts, props.userPosition, props.radiusKm] as const, () => {
  if (map && props.center) {
    map.setView([props.center.lat, props.center.lng], map.getZoom())
  }
  updateMarkers()
  updateRadiusCircle()
}, { deep: true })
</script>

<template>
  <div ref="mapContainer" class="map-canvas" />
</template>

<style>
.threadswap-marker-wrap {
  background: none !important;
  border: none !important;
}

.threadswap-marker {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--accent);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.threadswap-marker img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.threadswap-tooltip-wrap {
  background: var(--surface-elevated) !important;
  border: 2px solid var(--accent) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
}

.threadswap-tooltip {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  min-width: 140px;
}

.threadswap-tooltip strong {
  display: block;
  margin-bottom: 0.2rem;
}

.popup-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.threadswap-popup-wrap .leaflet-popup-content-wrapper {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  border: 1px solid var(--border);
  overflow: hidden;
}

.threadswap-popup-full {
  padding: 0;
  font-size: 0.9rem;
  margin: 0;
}

.popup-images {
  width: 100%;
  max-height: 140px;
  overflow: hidden;
  background: var(--border);
}

.popup-images-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.popup-images-scroll img {
  height: 100px;
  width: 100px;
  min-width: 100px;
  object-fit: cover;
  border-radius: 8px;
  scroll-snap-align: start;
}

.threadswap-popup-full .popup-title {
  display: block;
  padding: 0.5rem 0.75rem 0.2rem;
}

.threadswap-popup-full .popup-cat {
  display: block;
  padding: 0 0.75rem;
  color: var(--accent);
  text-transform: capitalize;
  font-size: 0.85rem;
}

.threadswap-popup-full .popup-addr {
  display: block;
  padding: 0.2rem 0.75rem 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.popup-actions {
  padding: 0.5rem 0.75rem 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.popup-link {
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--border);
  color: var(--accent);
  text-decoration: none;
}

.popup-msg {
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--accent);
  color: white;
  border: none;
  cursor: pointer;
}

.map-canvas {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
