<script setup lang="ts">
defineProps<{
  modelValue: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const options = [5, 10, 25, 50, 100]

function select(km: number) {
  emit('update:modelValue', km)
}
</script>

<template>
  <div class="radius-filter">
    <label class="label">Within</label>
    <div class="options">
      <button
        v-for="km in options"
        :key="km"
        type="button"
        class="option"
        :class="{ active: modelValue === km }"
        :disabled="disabled"
        @click="select(km)"
      >
        {{ km }} km
      </button>
    </div>
  </div>
</template>

<style scoped>
.radius-filter {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.option {
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-btn);
  font-size: 0.9rem;
  font-weight: 500;
  background: white;
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
}

.option.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.option:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
