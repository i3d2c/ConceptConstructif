import { describe, it, expect } from 'vitest'
import { computed, ref } from 'vue'
import { useCategoryFilter } from '../useCategoryFilter'

interface Item { id: string; category: string }

const items = ref<Item[]>([
  { id: '1', category: 'Placo' },
  { id: '2', category: 'Maçonnerie' },
  { id: '3', category: 'Placo' },
])

describe('useCategoryFilter', () => {
  describe('categories', () => {
    it('Should return the deduplicated, alphabetically sorted list of categories', () => {
      const { categories } = useCategoryFilter(computed(() => items.value))
      expect(categories.value).toEqual(['Maçonnerie', 'Placo'])
    })
  })

  describe('filteredItems', () => {
    it('Should return every item when no category is selected', () => {
      const { filteredItems } = useCategoryFilter(computed(() => items.value))
      expect(filteredItems.value).toEqual(items.value)
    })

    it('Should return only items matching the selected category', () => {
      const { categoryFilter, filteredItems } = useCategoryFilter(computed(() => items.value))
      categoryFilter.value = 'Placo'
      expect(filteredItems.value.map(i => i.id)).toEqual(['1', '3'])
    })
  })
})
