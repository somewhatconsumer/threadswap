<script setup lang="ts">
import type { Category } from '@/types/database'

defineProps<{
  modelValue: string
  categories: Category[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function select(slug: string) {
  emit('update:modelValue', slug)
}
</script>

<template>
  <div class="category-select">
    <label class="label">Category</label>
    <select
      :value="modelValue"
      class="select"
      :disabled="disabled"
      @change="select(($event.target as HTMLSelectElement).value)"
    >
      <option value="">Select a category</option>
      <option v-for="cat in categories" :key="cat.id" :value="cat.slug">
        {{ cat.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.category-select {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.select {
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  font-size: 1rem;
  background: white;
  cursor: pointer;
}
</style>
