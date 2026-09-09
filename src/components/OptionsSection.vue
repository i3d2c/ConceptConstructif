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
    <label class="switch-row" title="Afficher/masquer la vue 3D">
      <span class="switch-label">3D</span>
      <button
        data-tour="tour-3d"
        type="button"
        role="switch"
        :aria-checked="props.show3d"
        class="switch"
        :class="{ on: props.show3d }"
        @click="emit('toggle3d')"
      >
        <span class="switch-knob" />
      </button>
    </label>
    <label class="switch-row" title="Afficher/masquer le chiffrage">
      <span class="switch-label">Chiffrage</span>
      <button
        data-tour="tour-chiffrage"
        type="button"
        role="switch"
        :aria-checked="props.showChiffrage"
        class="switch"
        :class="{ on: props.showChiffrage }"
        @click="emit('toggleChiffrage')"
      >
        <span class="switch-knob" />
      </button>
    </label>
    <label class="switch-row" :title="store.showNumbers ? 'Masquer les numéros' : 'Afficher les numéros'">
      <span class="switch-label">Numéros</span>
      <button
        type="button"
        role="switch"
        :aria-checked="store.showNumbers"
        class="switch"
        :class="{ on: store.showNumbers }"
        @click="store.showNumbers = !store.showNumbers"
      >
        <span class="switch-knob" />
      </button>
    </label>
  </div>
</template>

<style scoped>
.section-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 6px; }
.switch-row { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; font-size: 11px; }
.switch-row:first-of-type { margin-top: 0; }
.switch-label { color: var(--text); }
.switch {
  position: relative; width: 30px; height: 16px; border-radius: 8px;
  background: var(--surface2); border: 1px solid var(--border);
  padding: 0; cursor: pointer; flex-shrink: 0; transition: background 0.15s;
}
.switch.on { background: var(--accent); border-color: var(--accent); }
.switch-knob {
  position: absolute; top: 1px; left: 1px; width: 12px; height: 12px;
  border-radius: 50%; background: #fff; transition: left 0.15s;
}
.switch.on .switch-knob { left: 15px; }
</style>
