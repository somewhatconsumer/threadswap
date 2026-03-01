<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import { supabase } from '@/lib/supabase'
import CategoryMultiSelect from '@/components/CategoryMultiSelect.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import LocationMapPicker from '@/components/LocationMapPicker.vue'
import type { Category } from '@/types/database'
import type { Post } from '@/types/database'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const postsStore = usePostsStore()

const post = ref<Post | null>(null)
const categories = ref<Category[]>([])
const title = ref('')
const description = ref('')
const selectedCategories = ref<string[]>([])
const location = ref<{ lat: number; lng: number } | null>(null)
const addressLabel = ref('')
const keptImagePaths = ref<string[]>([])
const imageUploadRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const postId = computed(() => route.params.id as string)

const existingImageUrls = computed(() =>
  keptImagePaths.value.map((path) => {
    const { data } = supabase.storage.from('post-images').getPublicUrl(path)
    return data.publicUrl
  })
)

function removeExistingImage(i: number) {
  keptImagePaths.value = keptImagePaths.value.filter((_, j) => j !== i)
}

onMounted(async () => {
  const id = postId.value
  if (!id) {
    error.value = 'Invalid post'
    loading.value = false
    return
  }
  if (!auth.user?.id) {
    router.replace({ name: 'login' })
    return
  }
  const [p, catRes] = await Promise.all([
    postsStore.fetchPost(id),
    supabase.from('categories').select('*').order('slug'),
  ])
  post.value = p ?? null
  categories.value = (catRes.data ?? []) as Category[]
  if (!p) {
    error.value = 'Post not found'
    loading.value = false
    return
  }
  if (p.user_id !== auth.user?.id) {
    error.value = "You can't edit this post"
    loading.value = false
    return
  }
  title.value = p.title
  description.value = p.description ?? ''
  const cats = (p as Post & { categories?: string[] }).categories
  selectedCategories.value = Array.isArray(cats) && cats.length > 0 ? [...cats] : p.category ? [p.category] : []
  location.value = { lat: p.lat, lng: p.lng }
  addressLabel.value = p.address_label ?? ''
  keptImagePaths.value = p.image_urls?.length ? [...p.image_urls] : []
  loading.value = false
})

async function submit() {
  error.value = ''
  if (!title.value.trim()) {
    error.value = 'Enter a title'
    return
  }
  if (selectedCategories.value.length === 0) {
    error.value = 'Select at least one category'
    return
  }
  const coords = location.value
  if (!coords) {
    error.value = 'Set your location on the map.'
    return
  }
  const id = post.value?.id
  if (!id) return

  saving.value = true
  const primaryCategory = selectedCategories.value[0] ?? 'other'
  const updates = {
    title: title.value.trim(),
    description: description.value.trim() || null,
    category: primaryCategory,
    categories: selectedCategories.value,
    lat: coords.lat,
    lng: coords.lng,
    address_label: addressLabel.value.trim() || null,
  }

  try {
    let newPaths: string[] = []
    const uploadRef = imageUploadRef.value
    if (uploadRef && uploadRef.getFiles().length > 0) {
      newPaths = await uploadRef.uploadToBucket(id)
    }
    const image_urls = [...keptImagePaths.value, ...newPaths]
    const { error: updateErr } = await postsStore.updatePost(id, { ...updates, image_urls })
    if (updateErr) throw updateErr
    await router.push({ name: 'post', params: { id } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="edit-post-view">
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="error && !post" class="error-msg" role="alert">{{ error }}</div>
    <div v-else class="edit-card">
      <h1 class="title">Edit post</h1>
      <p class="subtitle">Update your swap listing.</p>

      <form class="form" @submit.prevent="submit">
        <div v-if="error" class="error-msg" role="alert">{{ error }}</div>

        <div class="field">
          <label class="label">Title</label>
          <input v-model="title" type="text" class="input" placeholder="e.g. Floral summer dress" required />
        </div>

        <div class="field">
          <label class="label">Description (optional)</label>
          <textarea v-model="description" class="textarea" placeholder="Size, condition, what you're looking for..." rows="3" />
        </div>

        <CategoryMultiSelect v-model="selectedCategories" :categories="categories" :disabled="saving" />

        <div class="field">
          <label class="label">Location</label>
          <p class="hint">Drag the pin on the map to set where you're swapping from.</p>
          <LocationMapPicker v-model="location" v-model:address-label="addressLabel" />
          <input
            v-model="addressLabel"
            type="text"
            class="input address-input"
            placeholder="e.g. Downtown, Seattle (optional label)"
          />
        </div>

        <div class="field">
          <label class="label">Images</label>
          <div v-if="existingImageUrls.length > 0" class="existing-images">
            <div v-for="(url, i) in existingImageUrls" :key="i" class="preview-wrap">
              <img :src="url" :alt="`Image ${i + 1}`" class="preview-img" />
              <button type="button" class="remove-btn" aria-label="Remove" @click="removeExistingImage(i)">×</button>
            </div>
          </div>
          <ImageUpload ref="imageUploadRef" />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.edit-post-view {
  padding: 1.5rem 1rem 3rem;
}

.edit-card {
  max-width: 32rem;
  margin: 0 auto;
  background: var(--surface-elevated);
  border-radius: var(--radius-card);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.title {
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text);
}

.subtitle {
  margin: 0 0 1.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.address-input {
  margin-top: 0.5rem;
}

.input,
.textarea {
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  border: 2px solid var(--border);
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;
}

.input:focus,
.textarea:focus {
  border-color: var(--accent);
}

.textarea {
  resize: vertical;
  min-height: 4rem;
}

.existing-images {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.preview-wrap {
  position: relative;
  width: 6rem;
  height: 6rem;
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--border);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.error-msg {
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.btn {
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-btn);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.1s, box-shadow 0.2s;
}

.btn-primary {
  background: var(--accent);
  color: white;
  margin-top: 0.5rem;
  box-shadow: var(--shadow-card);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: var(--shadow-card-hover);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}
</style>
