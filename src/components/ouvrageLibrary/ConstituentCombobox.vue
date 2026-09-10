<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Constituent } from '../../domain/models/Constituent'
import { useCategoryFilter } from './useCategoryFilter'

const props = defineProps<{
  modelValue: string
  constituentOptions: Constituent[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const MIN_DROPDOWN_WIDTH = 280

const query = ref('')
const isOpen = ref(false)
const highlightedIndex = ref(-1)
const dropdownPos = ref({ top: 0, left: 0, width: 0 })

const { categoryFilter, categories, filteredItems: categoryFilteredOptions } = useCategoryFilter(
  computed(() => props.constituentOptions)
)

const selectedConstituent = computed(() =>
  props.constituentOptions.find(c => c.id === props.modelValue) ?? null
)

const displayValue = computed(() =>
  isOpen.value ? query.value : (selectedConstituent.value?.name ?? '')
)

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase()
  return categoryFilteredOptions.value.filter(c => !q || c.name.toLowerCase().includes(q))
})

function updateDropdownPos() {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  const width = Math.max(rect.width, MIN_DROPDOWN_WIDTH)
  const left = Math.min(rect.left, window.innerWidth - width - 8)
  dropdownPos.value = { top: rect.bottom + 4, left: Math.max(left, 8), width }
}

function open() {
  query.value = ''
  categoryFilter.value = ''
  highlightedIndex.value = -1
  isOpen.value = true
  updateDropdownPos()
}

function close() {
  isOpen.value = false
  query.value = ''
  categoryFilter.value = ''
  highlightedIndex.value = -1
}

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  highlightedIndex.value = -1
}

function selectOption(c: Constituent) {
  emit('update:modelValue', c.id)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isOpen.value) { open(); return }
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (isOpen.value && highlightedIndex.value >= 0) {
      selectOption(filteredOptions.value[highlightedIndex.value])
    }
  } else if (e.key === 'Escape') {
    close()
  }
}

function onWindowClick(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as HTMLElement
  if (!target.closest('.cc-combobox') && !target.closest('.cc-dropdown')) {
    close()
  }
}

function onAnyScroll(e: Event) {
  if (!isOpen.value) return
  const target = e.target as HTMLElement
  if (target instanceof HTMLElement && target.closest('.cc-dropdown')) return
  close()
}

function onInputClick() {
  if (!isOpen.value) open()
}

function isInsideComboboxOrDropdown(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.closest('.cc-combobox') !== null || el.closest('.cc-dropdown') !== null)
}

function onFocusOut(e: FocusEvent) {
  if (!isOpen.value) return
  if (!isInsideComboboxOrDropdown(e.target)) return
  if (isInsideComboboxOrDropdown(e.relatedTarget)) return
  close()
}

onMounted(() => {
  window.addEventListener('click', onWindowClick)
  window.addEventListener('scroll', onAnyScroll, true)
  document.addEventListener('focusout', onFocusOut)
})
onUnmounted(() => {
  window.removeEventListener('click', onWindowClick)
  window.removeEventListener('scroll', onAnyScroll, true)
  document.removeEventListener('focusout', onFocusOut)
})

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<template>
  <div class="cc-combobox">
    <input
      ref="inputRef"
      :value="displayValue"
      @focus="open"
      @click="onInputClick"
      @input="onInput"
      @keydown="onKeydown"
    />
  </div>

  <Teleport to="body">
    <div
      v-if="isOpen"
      class="cc-dropdown"
      :style="{ top: dropdownPos.top + 'px', left: dropdownPos.left + 'px', width: dropdownPos.width + 'px' }"
      @click.stop
    >
      <select v-model="categoryFilter" class="cc-category-filter">
        <option value="">Toutes catégories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <ul class="cc-list">
        <li
          v-for="(c, i) in filteredOptions" :key="c.id"
          :class="{ 'cc-highlighted': i === highlightedIndex }"
          @mousedown.prevent
          @click="selectOption(c)"
        >{{ c.name }}</li>
      </ul>
    </div>
  </Teleport>
</template>

<style scoped>
.cc-combobox { flex: 1; }
.cc-combobox input { width: 100%; }
</style>

<style>
.cc-dropdown {
  position: fixed;
  z-index: 9999;
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.cc-category-filter { font-size: 11px; }
.cc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.cc-list li {
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
.cc-list li:hover, .cc-list li.cc-highlighted {
  background: var(--surface2, #2a2a3a);
}
</style>
