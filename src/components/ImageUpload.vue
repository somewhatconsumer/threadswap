<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const emit = defineEmits<{
  upload: [paths: string[]]
}>()

const input = ref<HTMLInputElement | null>(null)
const previews = ref<string[]>([])
const files = ref<File[]>([])
const uploading = ref(false)

const maxFiles = 5
const maxSizeMb = 5

function trigger() {
  input.value?.click()
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const selected = Array.from(el.files ?? [])
  const valid: File[] = []
  for (const f of selected) {
    if (!f.type.startsWith('image/')) continue
    if (f.size > maxSizeMb * 1024 * 1024) continue
    valid.push(f)
    if (valid.length >= maxFiles) break
  }
  files.value = valid
  previews.value = valid.map((f) => URL.createObjectURL(f))
  el.value = ''
}

function remove(i: number) {
  const url = previews.value[i]
  if (url) URL.revokeObjectURL(url)
  previews.value = previews.value.filter((_, j) => j !== i)
  files.value = files.value.filter((_, j) => j !== i)
}

defineExpose({
  getFiles: () => files.value,
  clear() {
    previews.value.forEach((url) => URL.revokeObjectURL(url))
    previews.value = []
    files.value = []
  },
  async uploadToBucket(postId: string): Promise<string[]> {
    if (files.value.length === 0) return []
    uploading.value = true
    const paths: string[] = []
    try {
      for (let i = 0; i < files.value.length; i++) {
        const file = files.value[i]
        if (!file) continue
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${postId}/${crypto.randomUUID()}.${ext}`
        const { error } = await supabase.storage.from('post-images').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })
        if (error) throw error
        paths.push(path)
      }
      emit('upload', paths)
      return paths
    } finally {
      uploading.value = false
    }
  },
})
</script>

<template>
  <div class="image-upload">
    <label class="label">Images (up to {{ maxFiles }}, {{ maxSizeMb }}MB each)</label>
    <input
      ref="input"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @input="onInput"
    />
    <div class="previews">
      <div
        v-for="(url, i) in previews"
        :key="i"
        class="preview-wrap"
      >
        <img :src="url" :alt="`Preview ${i + 1}`" class="preview-img" />
        <button type="button" class="remove-btn" aria-label="Remove" @click="remove(i)">×</button>
      </div>
      <button
        v-if="previews.length < maxFiles"
        type="button"
        class="add-btn"
        :disabled="uploading"
        @click="trigger"
      >
        + Add photo
      </button>
    </div>
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.hidden {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.previews {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
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
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.add-btn {
  width: 6rem;
  height: 6rem;
  border-radius: 0.75rem;
  border: 2px dashed var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  cursor: pointer;
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
