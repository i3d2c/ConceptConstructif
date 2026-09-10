<script setup lang="ts">
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

const props = defineProps<{
  show3d: boolean
  showChiffrage: boolean
}>()

const emit = defineEmits<{
  toggle3d: []
  toggleChiffrage: []
}>()
</script>

<template>
  <div class="options-section">
    <div class="section-label">Options</div>
    <div class="option-btns">
      <button
        data-tour="tour-3d"
        :class="{ active: props.show3d }"
        title="Afficher/masquer la vue 3D"
        @click="emit('toggle3d')"
      >3D</button>
      <button
        data-tour="tour-chiffrage"
        :class="{ active: props.showChiffrage }"
        title="Afficher/masquer le chiffrage"
        @click="emit('toggleChiffrage')"
      >Chiffrage</button>
      <button
        :class="{ active: store.showNumbers }"
        :title="store.showNumbers ? 'Masquer les numéros' : 'Afficher les numéros'"
        @click="store.showNumbers = !store.showNumbers"
      >Numéros</button>
    </div>
  </div>
</template>

<style scoped>
.section-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
.option-btns { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
.option-btns button { padding: 6px 4px; }
</style>
