import { ref, computed, type ComputedRef } from 'vue'

export function useCategoryFilter<T extends { category: string }>(items: ComputedRef<T[]>) {
  const categoryFilter = ref('')

  const categories = computed(() =>
    [...new Set(items.value.map(i => i.category))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'))
  )

  const filteredItems = computed(() =>
    items.value.filter(i => !categoryFilter.value || i.category === categoryFilter.value)
  )

  return { categoryFilter, categories, filteredItems }
}
