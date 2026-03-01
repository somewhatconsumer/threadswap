<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { getDefaultCenter } from '@/lib/geolocation'
import CategoryMultiSelect from '@/components/CategoryMultiSelect.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import LocationMapPicker from '@/components/LocationMapPicker.vue'
import type { Category } from '@/types/database'

const router = useRouter()
const auth = useAuthStore()

const categories = ref<Category[]>([])
const title = ref('')
const description = ref('')
const selectedCategories = ref<string[]>([])
const location = ref<{ lat: number; lng: number } | null>(null)
const addressLabel = ref('')
const imageUploadRef = ref<InstanceType<typeof ImageUpload> | null>(null)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  const { data } = await supabase.from('categories').select('*').order('slug')
  categories.value = (data ?? []) as Category[]
  location.value = getDefaultCenter()
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
  const uid = auth.user?.id
  if (!uid) {
    error.value = 'You must be logged in'
    return
  }

  loading.value = true
  const timeoutMs = 25_000
  const primaryCategory = selectedCategories.value[0] ?? 'other'

  async function doSubmit() {
    const coords = location.value
    if (!coords) throw new Error('Set your location on the map.')
    const payload = {
      user_id: uid,
      title: title.value.trim(),
      description: description.value.trim() || null,
      category: primaryCategory,
      categories: selectedCategories.value,
      lat: coords.lat,
      lng: coords.lng,
      address_label: addressLabel.value.trim() || null,
      image_urls: [],
    }
    let result = await supabase.from('posts').insert(payload).select('id').single()
    if (result.error && result.error.message?.includes('categories')) {
      const { categories: _c, ...payloadWithoutCategories } = payload
      result = await supabase.from('posts').insert(payloadWithoutCategories).select('id').single()
    }
    const { data: post, error: insertErr } = result

    if (insertErr) throw insertErr
    if (!post?.id) throw new Error('Could not create post. Please try again.')
    const postId = post.id

    const uploadRef = imageUploadRef.value
    let imageUrls: string[] = []
    if (uploadRef && uploadRef.getFiles().length > 0) {
      try {
        imageUrls = await uploadRef.uploadToBucket(postId)
      } catch {
        await router.push({ name: 'post', params: { id: postId } })
        throw new Error('Post created, but some images could not be uploaded.')
      }
    }

    if (imageUrls.length > 0) {
      await supabase.from('posts').update({ image_urls: imageUrls }).eq('id', postId)
    }

    await router.push({ name: 'post', params: { id: postId } })
  }

  try {
    await Promise.race([
      doSubmit(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('This is taking too long. Check your connection and try again.')), timeoutMs)
      ),
    ])
  } catch (e) {
    if (e && typeof e === 'object' && 'message' in e) {
      const err = e as { message: string; details?: string }
      error.value = err.message + (err.details ? ` (${err.details})` : '')
    } else {
      error.value = e instanceof Error ? e.message : 'Failed to create post'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="create-post-view">
    <div class="create-card">
      <h1 class="title">New swap post</h1>
      <p class="subtitle">Add photos, categories, and pin your location on the map.</p>

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

        <CategoryMultiSelect v-model="selectedCategories" :categories="categories" :disabled="loading" />

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

        <ImageUpload ref="imageUploadRef" />

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create post' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.create-post-view {
  padding: 1.5rem 1rem 3rem;
}

.create-card {
  max-width: 32rem;
  margin: 0 auto;
  background: var(--surface-elevated);
  border-radius: var(--radius-card);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
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
