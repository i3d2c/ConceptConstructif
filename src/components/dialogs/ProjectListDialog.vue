<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listProjects, deleteProject } from '../../storage/ProjectStore'
import { useProjectStore } from '../../stores/projectStore'

const emit = defineEmits<{ close: [] }>()
const store = useProjectStore()

type Meta = { id: string; name: string; updatedAt: string }
const projects = ref<Meta[]>([])
const loading = ref(true)

onMounted(async () => {
  projects.value = (await listProjects()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
  loading.value = false
})

async function openProject(id: string) {
  await store.load(id)
  localStorage.setItem('cc_last_project', id)
  emit('close')
}

async function newProject() {
  await store.save()
  store.reset()
  localStorage.setItem('cc_last_project', store.project.id)
  emit('close')
}

async function removeProject(id: string) {
  if (id === store.project.id) return
  if (!confirm('Supprimer définitivement ce projet ?')) return
  await deleteProject(id)
  projects.value = projects.value.filter(p => p.id !== id)
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <span>Mes projets</span>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="dialog-body">
        <button class="active new-btn" @click="newProject">+ Nouveau projet</button>

        <div v-if="loading" class="hint">Chargement…</div>
        <div v-else-if="projects.length === 0" class="hint">Aucun projet sauvegardé.</div>

        <ul v-else class="project-list">
          <li
            v-for="p in projects"
            :key="p.id"
            :class="{ current: p.id === store.project.id }"
          >
            <div class="project-info">
              <span class="project-name">{{ p.name }}</span>
              <span class="project-date">{{ fmt(p.updatedAt) }}</span>
            </div>
            <div class="project-actions">
              <button
                v-if="p.id !== store.project.id"
                class="active small"
                @click="openProject(p.id)"
              >Ouvrir</button>
              <span v-else class="current-label">En cours</span>
              <button
                class="danger small"
                :disabled="p.id === store.project.id"
                @click="removeProject(p.id)"
              >✕</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 900;
}
.dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 480px;
  max-height: 70vh;
  display: flex; flex-direction: column;
}
.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-weight: 600; font-size: 13px;
  flex-shrink: 0;
}
.close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; }
.dialog-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.new-btn { align-self: flex-start; }
.hint { font-size: 12px; color: var(--text-muted); padding: 8px 0; }
.project-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.project-list li {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
}
.project-list li.current { border-color: var(--accent); }
.project-info { display: flex; flex-direction: column; gap: 2px; }
.project-name { font-size: 13px; font-weight: 500; }
.project-date { font-size: 10px; color: var(--text-muted); }
.project-actions { display: flex; align-items: center; gap: 6px; }
.current-label { font-size: 11px; color: var(--accent); }
.small { padding: 3px 10px; font-size: 11px; }
button.danger { background: #7f1d1d; color: #fca5a5; border-color: #991b1b; }
button.danger:hover:not(:disabled) { background: #991b1b; }
button:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
