<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Ouvrage, OuvrageConstituent } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'
import { findUnpublishedConstituents } from '../../domain/services/LibraryImportService'
import OuvrageConstituentRow from './OuvrageConstituentRow.vue'
import CategoryInput from './CategoryInput.vue'
import type { Scope } from './scope'

const props = defineProps<{
  editingOuvrage: Ouvrage | null
  constituentOptions: Constituent[]
  defaultConstituentId: string
  categorySuggestions: string[]
  publishedConstituentIds: Set<string>
  isLinkedToLibrary: boolean
}>()

const emit = defineEmits<{
  save: [data: Ouvrage, isNew: boolean, scope: Scope]
  updateFromLibrary: []
}>()

const showFormulaHelp = ref(false)
const oSaveMsg = ref('')
const oSaveError = ref('')
let oSaveMsgTimer: ReturnType<typeof setTimeout> | null = null

const oName = ref(props.editingOuvrage?.name ?? '')
const oCategory = ref(props.editingOuvrage?.category ?? 'À catégoriser')
const oDesc = ref(props.editingOuvrage?.description ?? '')
const oEp = ref<number | ''>(props.editingOuvrage?.defaultEpaisseur ?? '')
const oH = ref<number | ''>(props.editingOuvrage?.defaultHauteur ?? '')
const oConstituents = ref<OuvrageConstituent[]>(
  props.editingOuvrage ? JSON.parse(JSON.stringify(props.editingOuvrage.constituents)) : []
)

function saveOuvrage(scope: Scope) {
  if (!oName.value) return
  const id = props.editingOuvrage?.id ?? crypto.randomUUID()
  const data: Ouvrage = {
    id,
    name: oName.value,
    description: oDesc.value,
    defaultEpaisseur: oEp.value !== '' ? Number(oEp.value) : undefined,
    defaultHauteur: oH.value !== '' ? Number(oH.value) : undefined,
    constituents: oConstituents.value,
    category: oCategory.value,
  }

  if (scope === 'library') {
    const missing = findUnpublishedConstituents(data, props.constituentOptions, props.publishedConstituentIds)
    if (missing.length > 0) {
      oSaveError.value = `À publier d'abord dans la bibliothèque : ${missing.map(c => c.name).join(', ')}`
      return
    }
  }
  oSaveError.value = ''

  emit('save', data, props.editingOuvrage === null, scope)
  oSaveMsg.value = '✓ Enregistré'
  if (oSaveMsgTimer) clearTimeout(oSaveMsgTimer)
  oSaveMsgTimer = setTimeout(() => { oSaveMsg.value = '' }, 2000)
}

function addOC() {
  const pos = oConstituents.value.length + 1
  oConstituents.value.push({
    id: crypto.randomUUID(),
    constituentId: props.defaultConstituentId,
    position: pos,
    formula: '',
    disabled: false,
    hideIfZero: false,
    hideIfPriceZero: false,
    hideFromRecapOuvrage: false,
    hideFromRecapConstituent: false,
  })
}

function removeOC(idx: number) {
  oConstituents.value.splice(idx, 1)
  oConstituents.value.forEach((oc, i) => { oc.position = i + 1 })
}

// ── Popover "flags" (options d'affichage par constituant) ────────────────
const openFlagsId = ref<string | null>(null)
const flagsPopoverPos = ref({ top: 0, right: 0 })
const currentFlagsOC = computed(() => oConstituents.value.find(oc => oc.id === openFlagsId.value) ?? null)

function toggleFlags(id: string, e: MouseEvent) {
  e.stopPropagation()
  if (openFlagsId.value === id) { openFlagsId.value = null; return }
  const btn = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  flagsPopoverPos.value = { top: rect.bottom + 4, right: window.innerWidth - rect.right }
  openFlagsId.value = id
}

function onWindowClick(e: MouseEvent) {
  if (openFlagsId.value === null) return
  const target = e.target as HTMLElement
  if (!target.closest('.flags-popover-global') && !target.closest('.flags-btn')) {
    openFlagsId.value = null
  }
}

function onAnyScroll() { openFlagsId.value = null }

onMounted(() => {
  window.addEventListener('click', onWindowClick)
  window.addEventListener('scroll', onAnyScroll, true)
})
onUnmounted(() => {
  window.removeEventListener('click', onWindowClick)
  window.removeEventListener('scroll', onAnyScroll, true)
})
</script>

<template>
  <div class="form-col">
    <div class="form-title-row">
      <div class="form-title">{{ editingOuvrage ? 'Modifier' : 'Nouvel' }} ouvrage</div>
      <button v-if="editingOuvrage !== null && isLinkedToLibrary" class="help-btn" @click="emit('updateFromLibrary')">
        ⟳ Mettre à jour depuis la bibliothèque
      </button>
    </div>

    <label>Nom *</label>
    <input v-model="oName" placeholder="ex: Mur brique 1 brique" />

    <label>Catégorie</label>
    <CategoryInput v-model="oCategory" :suggestions="categorySuggestions" list-id="ouvrage-category-list" />

    <label>Description</label>
    <textarea v-model="oDesc" rows="2" />

    <div class="field-row">
      <div>
        <label>E par défaut (m)</label>
        <input v-model.number="oEp" type="number" step="0.001" />
      </div>
      <div>
        <label>H par défaut (m)</label>
        <input v-model.number="oH" type="number" step="0.1" />
      </div>
    </div>

    <div class="oc-section">
      <div class="oc-header">
        <span>Constituants</span>
        <div style="display:flex;gap:6px">
          <button class="help-btn" @click="showFormulaHelp = !showFormulaHelp">? Variables</button>
          <button @click="addOC">+ Ajouter</button>
        </div>
      </div>

      <!-- Aide formules -->
      <div v-if="showFormulaHelp" class="formula-help">
        <div class="help-grid">
          <span class="hk">L</span><span>Longueur (m) — trait : Σ segments ; surface : étendue X bounding box</span>
          <span class="hk">H</span><span>Hauteur (m) — trait : valeur CA ; surface : étendue Y bounding box</span>
          <span class="hk">E</span><span>Épaisseur (m) — depuis la couleur</span>
          <span class="hk">S</span><span>Surface (m²) — trait : L×H ; surface : aire réelle (corrigée angle)</span>
          <span class="hk">V</span><span>Volume (m³) = S × E</span>
          <span class="hk">Cn</span><span>Quantité du constituant en position n (cascade)</span>
        </div>
        <div class="help-fns">Fonctions : <code>floor() ceil() round() sqrt() abs() min() max() pow()</code></div>
        <div class="help-fns">Conditionnel : <code>if(condition; valeur_si_vrai; valeur_si_faux)</code> — ex : <code>if(L > 3; L * 2; L)</code></div>
      </div>

      <OuvrageConstituentRow
        v-for="(oc, idx) in oConstituents" :key="oc.id"
        :oc="oc"
        :constituent-options="constituentOptions"
        @remove="removeOC(idx)"
        @toggle-flags="toggleFlags"
      />
      <div v-if="oConstituents.length === 0" class="oc-empty">
        Aucun constituant. Cliquez "+ Ajouter" pour en ajouter un avec une formule.
      </div>
    </div>

    <div v-if="oSaveError" class="save-error">{{ oSaveError }}</div>

    <div class="form-actions">
      <span v-if="oSaveMsg" class="save-msg">{{ oSaveMsg }}</span>
      <button @click="saveOuvrage('project')">Enregistrer pour ce projet</button>
      <button class="active" @click="saveOuvrage('library')">Enregistrer dans la bibliothèque</button>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="openFlagsId !== null && currentFlagsOC !== null"
      class="flags-popover-global"
      :style="{ top: flagsPopoverPos.top + 'px', right: flagsPopoverPos.right + 'px' }"
      @click.stop
    >
      <label title="Toujours calculé pour le cascade Cn, mais jamais affiché ni compté dans les totaux">
        <input type="checkbox" v-model="currentFlagsOC.disabled" />
        <span>Technique (masqué partout)</span>
      </label>
      <label title="Masquer si la quantité est 0 (liste : par tracé ; récaps : quantité agrégée)">
        <input type="checkbox" v-model="currentFlagsOC.hideIfZero" />
        <span>Masquer si quantité = 0</span>
      </label>
      <label title="Masquer si le prix unitaire du constituant est 0€">
        <input type="checkbox" v-model="currentFlagsOC.hideIfPriceZero" />
        <span>Masquer si prix = 0€</span>
      </label>
      <label title="Masquer du récapitulatif par ouvrage">
        <input type="checkbox" v-model="currentFlagsOC.hideFromRecapOuvrage" />
        <span>Masquer récap/O</span>
      </label>
      <label title="Masquer du récapitulatif par constituant">
        <input type="checkbox" v-model="currentFlagsOC.hideFromRecapConstituent" />
        <span>Masquer récap/C</span>
      </label>
    </div>
  </Teleport>
</template>

<style scoped>
.form-col {
  flex: 1; padding: 16px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 8px;
}
.form-title-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.form-title { font-weight: 600; font-size: 13px; }
.field-row { display: flex; gap: 10px; }
.field-row > div { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.oc-section { display: flex; flex-direction: column; gap: 6px; }
.oc-header { display: flex; justify-content: space-between; align-items: center; }
.oc-empty { color: var(--text-muted); font-size: 11px; }
.help-btn { font-size: 10px; padding: 2px 7px; }
.formula-help {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 11px;
  display: flex; flex-direction: column; gap: 6px;
}
.help-grid {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 2px 8px;
}
.hk {
  font-family: monospace;
  font-weight: bold;
  color: var(--accent);
  font-size: 12px;
}
.help-fns { color: var(--text-muted); }
.help-fns code { color: var(--accent); font-family: monospace; }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; align-items: center; margin-top: 8px; }
.save-msg { font-size: 11px; color: #4ade80; margin-right: auto; }
.save-error { font-size: 11px; color: #f87171; }
textarea { resize: vertical; min-height: 40px; }
</style>

<style>
.flags-popover-global {
  position: fixed;
  z-index: 9999;
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  min-width: 210px;
}
.flags-popover-global label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.flags-popover-global label input[type="checkbox"] {
  flex-shrink: 0;
  width: auto;
  margin: 0;
  cursor: pointer;
}
.flags-popover-global label span {
  color: var(--text, #ccc);
  white-space: nowrap;
}
</style>
