<script setup lang="ts">
import type { Category } from '@/types/database'

const props = defineProps<{
  modelValue: string[]
  categories: Category[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

function toggleSlug(slug: string) {
  if (props.modelValue.includes(slug)) {
    emit('update:modelValue', props.modelValue.filter((s) => s !== slug))
  } else {
    emit('update:modelValue', [...props.modelValue, slug])
  }
}
</script>

<template>
  <div class="category-multi-select">
    <label class="label">Categories (select all that apply)</label>
    <div class="pills">
      <button
        v-for="cat in categories"
        :key="cat.slug"
        type="button"
        class="pill"
        :class="{ active: modelValue.includes(cat.slug) }"
        :disabled="disabled"
        @click="toggleSlug(cat.slug)"
      >
        {{ cat.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-multi-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pill {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-btn);
  font-size: 0.9rem;
  font-weight: 500;
  background: white;
  border: 2px solid var(--border);
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
}

.pill:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.pill.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.pill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
