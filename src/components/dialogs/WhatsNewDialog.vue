<script setup lang="ts">
const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <h3>Nouveautés</h3>
      <ul>
        <li>Réordonnancement des constituants d'un ouvrage, avec sécurisation des formules en cascade.</li>
        <li>Récap des constituants recentré sur les ouvrages réellement dessinés dans la zone.</li>
        <li>Duplication d'un ouvrage pour en créer un nouveau à partir de celui-ci.</li>
        <li>Alerte avant de perdre un brouillon non enregistré (ouvrage/constituant).</li>
      </ul>
      <div class="dialog-actions">
        <button @click="emit('close')">Fermer</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  display: flex; flex-direction: column; gap: 12px;
}
h3 { font-size: 14px; }
ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 8px; }
li { font-size: 12px; color: var(--text-muted); }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>
