<script setup lang="ts">
import { ref } from 'vue'
import type { Constituent } from '../../domain/models/Constituent'
import CategoryInput from './CategoryInput.vue'
import type { Scope } from './scope'

const props = defineProps<{
  editingConstituent: Constituent | null
  units: string[]
  suppliers: string[]
  categorySuggestions: string[]
  isLinkedToLibrary: boolean
}>()

const emit = defineEmits<{
  save: [data: Constituent, isNew: boolean, scope: Scope]
  updateFromLibrary: []
}>()

const cName = ref(props.editingConstituent?.name ?? '')
const cCategory = ref(props.editingConstituent?.category ?? 'À catégoriser')
const cCode = ref(props.editingConstituent?.code ?? '')
const cUnit = ref(props.editingConstituent?.unit ?? '')
const cPrice = ref(props.editingConstituent?.unitPrice ?? 0)
const cSupplier = ref(props.editingConstituent?.supplier ?? '')
const cUrl = ref(props.editingConstituent?.url ?? '')
const cFormulaRecap = ref(props.editingConstituent?.formulaRecap ?? '')
const showRecapHelp = ref(false)
const cSaveMsg = ref('')
let cSaveMsgTimer: ReturnType<typeof setTimeout> | null = null

function saveConstituent(scope: Scope) {
  if (!cName.value) return
  const id = props.editingConstituent?.id ?? crypto.randomUUID()
  const data: Constituent = {
    id,
    name: cName.value,
    code: cCode.value || undefined,
    unit: cUnit.value,
    unitPrice: cPrice.value,
    supplier: cSupplier.value || undefined,
    url: cUrl.value || undefined,
    formulaRecap: cFormulaRecap.value || undefined,
    category: cCategory.value,
  }
  emit('save', data, props.editingConstituent === null, scope)
  cSaveMsg.value = '✓ Enregistré'
  if (cSaveMsgTimer) clearTimeout(cSaveMsgTimer)
  cSaveMsgTimer = setTimeout(() => { cSaveMsg.value = '' }, 2000)
}
</script>

<template>
  <div class="form-col">
    <div class="form-title-row">
      <div class="form-title">{{ editingConstituent ? 'Modifier' : 'Nouveau' }} constituant</div>
      <button v-if="editingConstituent !== null && isLinkedToLibrary" class="help-btn" @click="emit('updateFromLibrary')">
        ⟳ Mettre à jour depuis la bibliothèque
      </button>
    </div>

    <label>Nom *</label>
    <input v-model="cName" placeholder="ex: Brique pleine" />

    <label>Catégorie</label>
    <CategoryInput v-model="cCategory" :suggestions="categorySuggestions" list-id="constituent-category-list" />

    <label>Code produit</label>
    <input v-model="cCode" placeholder="ex: REF-001 (facultatif)" />

    <div class="field-row">
      <div>
        <label>Unité *</label>
        <input v-model="cUnit" list="unit-list" placeholder="ex: unité, sac 25kg, h" />
        <datalist id="unit-list">
          <option v-for="u in units" :key="u" :value="u" />
        </datalist>
      </div>
      <div>
        <label>Prix unitaire (€)</label>
        <input v-model.number="cPrice" type="number" step="0.01" min="0" />
      </div>
    </div>

    <label>Fournisseur</label>
    <input v-model="cSupplier" list="supplier-list" placeholder="ex: BricoMax" />
    <datalist id="supplier-list">
      <option v-for="s in suppliers" :key="s" :value="s" />
    </datalist>

    <label>URL fiche produit</label>
    <input v-model="cUrl" placeholder="https://..." />

    <div class="recap-section">
      <div class="recap-header">
        <label>Formule récapitulatif (opt.)</label>
        <button class="help-btn" @click="showRecapHelp = !showRecapHelp">? Variables</button>
      </div>
      <input v-model="cFormulaRecap" placeholder="ex: ceil(X)" title="Appliquée au total agrégé dans le récap/constituant. X = somme brute de toutes les quantités." />
      <div v-if="showRecapHelp" class="formula-help">
        <div class="help-grid">
          <span class="hk">X</span><span>Total brut agrégé de ce constituant sur tous les tracés</span>
        </div>
        <div class="help-fns">Fonctions : <code>ceil(X)</code> <code>floor(X)</code> <code>round(X)</code></div>
        <div class="help-fns">Exemple : <code>ceil(X)</code> → arrondit au supérieur pour commander des quantités entières</div>
      </div>
    </div>

    <div class="form-actions">
      <span v-if="cSaveMsg" class="save-msg">{{ cSaveMsg }}</span>
      <button @click="saveConstituent('project')">Enregistrer pour ce projet</button>
      <button class="active" @click="saveConstituent('library')">Enregistrer dans la bibliothèque</button>
    </div>
  </div>
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
.recap-section { display: flex; flex-direction: column; gap: 4px; }
.recap-header { display: flex; justify-content: space-between; align-items: center; }
</style>
