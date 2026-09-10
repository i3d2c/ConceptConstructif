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
        <li>Le panneau d'info d'un tracé est maintenant à droite (au lieu d'une fenêtre), réductible, avec les dimensions et le chiffrage qui se mettent à jour en direct pendant un redimensionnement — et un tutoriel de démarrage guidé quand rien n'est sélectionné.</li>
        <li>La sidebar gauche suit désormais l'ordre réel du workflow (plan → échelle → ouvrages/constituants → couleurs → tracer → options), avec un vrai bouton pour importer un plan.</li>
        <li>La vue 3D se centre automatiquement sur le plan dessiné, avec une vue en légère plongée.</li>
        <li>Un tracé peut être dupliqué en un clic ; le bouton Supprimer est remonté en haut du panneau.</li>
        <li>Le choix d'un constituant se fait maintenant par recherche, avec un filtre par catégorie.</li>
        <li>Nouvel onglet "Devis" (liste des ouvrages et tarifs, sans le détail des constituants), utilisable aussi à l'impression avec des raccourcis Total/Chiffrage/Devis ; la sélection d'impression est mémorisée par zone.</li>
        <li>Un champ "Infos techniques" sur l'ouvrage permet d'ajouter des notes internes non visibles du client.</li>
        <li>Une "Formule typique" sur un constituant préremplit automatiquement la formule de calcul quand on l'ajoute à un ouvrage.</li>
        <li>L'aide sur les variables de formule s'affiche désormais au survol du champ, sans avoir à cliquer.</li>
        <li>Le fond de plan garde sa position d'origine au lieu de se recentrer à chaque chargement.</li>
        <li>La ligne d'échelle peut être déplacée et ses extrémités ajustées directement à la souris.</li>
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
