<script setup lang="ts">
defineProps<{
  modelValue: string
  suggestions: string[]
  listId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    :list="listId"
    placeholder="ex: Placo, Isolation..."
  />
  <datalist :id="listId">
    <option v-for="s in suggestions" :key="s" :value="s" />
  </datalist>
</template>
