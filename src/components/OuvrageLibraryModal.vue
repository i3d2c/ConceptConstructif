<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'
import type { Ouvrage, OuvrageConstituent } from '../domain/models/Ouvrage'
import type { Constituent } from '../domain/models/Constituent'

const store = useProjectStore()
const emit = defineEmits<{ close: [] }>()

type Tab = 'ouvrages' | 'constituents'
const tab = ref<Tab>('ouvrages')
const editingOuvrage = ref<Ouvrage | null>(null)
const editingConstituent = ref<Constituent | null>(null)
const showFormulaHelp = ref(false)

// Suggestions autocomplete
const existingUnits = computed(() =>
  [...new Set(store.project.constituents.map(c => c.unit).filter(Boolean))]
)
const existingSuppliers = computed(() =>
  [...new Set(store.project.constituents.map(c => c.supplier).filter((s): s is string => !!s))]
)

// ── Ouvrage form ──────────────────────────────────────────────────────────
const oName = ref('')
const oDesc = ref('')
const oEp = ref<number | ''>('')
const oH = ref<number | ''>('')
const oConstituents = ref<OuvrageConstituent[]>([])

function openNewOuvrage() {
  editingOuvrage.value = null
  oName.value = ''
  oDesc.value = ''
  oEp.value = ''
  oH.value = ''
  oConstituents.value = []
}

function openEditOuvrage(o: Ouvrage) {
  editingOuvrage.value = o
  oName.value = o.name
  oDesc.value = o.description
  oEp.value = o.defaultEpaisseur ?? ''
  oH.value = o.defaultHauteur ?? ''
  oConstituents.value = JSON.parse(JSON.stringify(o.constituents))
}

function saveOuvrage() {
  if (!oName.value) return
  const data: Ouvrage = {
    id: editingOuvrage.value?.id ?? crypto.randomUUID(),
    name: oName.value,
    description: oDesc.value,
    defaultEpaisseur: oEp.value !== '' ? Number(oEp.value) : undefined,
    defaultHauteur: oH.value !== '' ? Number(oH.value) : undefined,
    constituents: oConstituents.value,
  }
  if (editingOuvrage.value) {
    store.updateOuvrage(data.id, data)
  } else {
    store.addOuvrage(data)
  }
  editingOuvrage.value = null
}

function deleteOuvrage(id: string) {
  if (!confirm('Supprimer cet ouvrage ?')) return
  store.removeOuvrage(id)
}

function addOC() {
  const pos = oConstituents.value.length + 1
  oConstituents.value.push({
    id: crypto.randomUUID(),
    constituentId: store.project.constituents[0]?.id ?? '',
    position: pos,
    formula: '',
  })
}

function removeOC(idx: number) {
  oConstituents.value.splice(idx, 1)
  oConstituents.value.forEach((oc, i) => { oc.position = i + 1 })
}

// ── Constituent form ──────────────────────────────────────────────────────
const cName = ref('')
const cCode = ref('')
const cUnit = ref('')
const cPrice = ref(0)
const cSupplier = ref('')
const cUrl = ref('')

function openNewConstituent() {
  editingConstituent.value = null
  cName.value = ''
  cCode.value = ''
  cUnit.value = ''
  cPrice.value = 0
  cSupplier.value = ''
  cUrl.value = ''
}

function openEditConstituent(c: Constituent) {
  editingConstituent.value = c
  cName.value = c.name
  cCode.value = c.code ?? ''
  cUnit.value = c.unit
  cPrice.value = c.unitPrice
  cSupplier.value = c.supplier ?? ''
  cUrl.value = c.url ?? ''
}

function saveConstituent() {
  if (!cName.value) return
  const data: Constituent = {
    id: editingConstituent.value?.id ?? crypto.randomUUID(),
    name: cName.value,
    code: cCode.value || undefined,
    unit: cUnit.value,
    unitPrice: cPrice.value,
    supplier: cSupplier.value || undefined,
    url: cUrl.value || undefined,
  }
  if (editingConstituent.value) {
    store.updateConstituent(data.id, data)
  } else {
    store.addConstituent(data)
  }
  editingConstituent.value = null
}

function deleteConstituent(id: string) {
  if (!confirm('Supprimer ce constituant ?')) return
  store.removeConstituent(id)
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <div class="tabs">
          <button :class="{ active: tab === 'ouvrages' }" @click="tab = 'ouvrages'">Ouvrages</button>
          <button :class="{ active: tab === 'constituents' }" @click="tab = 'constituents'">Constituants</button>
        </div>
        <button class="icon" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">

        <!-- ── OUVRAGES ── -->
        <template v-if="tab === 'ouvrages'">
          <div class="list-col">
            <div class="list-header">
              <span>Ouvrages</span>
              <button @click="openNewOuvrage">+ Nouveau</button>
            </div>
            <div
              v-for="o in store.project.ouvrages" :key="o.id"
              class="list-item"
              :class="{ selected: editingOuvrage?.id === o.id }"
              @click="openEditOuvrage(o)"
            >
              <span>{{ o.name }}</span>
              <button class="icon small" @click.stop="deleteOuvrage(o.id)">✕</button>
            </div>
          </div>

          <div class="form-col" v-if="editingOuvrage !== undefined">
            <div class="form-title">{{ editingOuvrage ? 'Modifier' : 'Nouvel' }} ouvrage</div>

            <label>Nom *</label>
            <input v-model="oName" placeholder="ex: Mur brique 1 brique" />

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
                <div class="help-fns">formulaRecap : variable <code>X</code> = total brut de la zone. Ex : <code>ceil(X)</code></div>
              </div>

              <div v-for="(oc, idx) in oConstituents" :key="oc.id" class="oc-row">
                <span class="oc-pos">C{{ oc.position }}</span>
                <select v-model="oc.constituentId" style="flex:1">
                  <option v-for="c in store.project.constituents" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <div class="oc-formulas">
                  <input v-model="oc.formula" placeholder="ex: L*H/(0.22*0.05)" title="Formule par tracé" />
                  <input v-model="oc.formulaRecap" placeholder="récap (opt) ex: ceil(X)" title="Formule récapitulatif (variable X)" />
                </div>
                <button class="icon small" @click="removeOC(idx)">✕</button>
              </div>
              <div v-if="oConstituents.length === 0" class="oc-empty">
                Aucun constituant. Cliquez "+ Ajouter" pour en ajouter un avec une formule.
              </div>
            </div>

            <div class="form-actions">
              <button @click="editingOuvrage = null; openNewOuvrage()">Annuler</button>
              <button class="active" @click="saveOuvrage">Enregistrer</button>
            </div>
          </div>
        </template>

        <!-- ── CONSTITUANTS ── -->
        <template v-else>
          <div class="list-col">
            <div class="list-header">
              <span>Constituants</span>
              <button @click="openNewConstituent">+ Nouveau</button>
            </div>
            <div
              v-for="c in store.project.constituents" :key="c.id"
              class="list-item"
              :class="{ selected: editingConstituent?.id === c.id }"
              @click="openEditConstituent(c)"
            >
              <div>
                <div>{{ c.name }}</div>
                <div v-if="c.code" class="item-code">{{ c.code }}</div>
              </div>
              <button class="icon small" @click.stop="deleteConstituent(c.id)">✕</button>
            </div>
          </div>

          <div class="form-col" v-if="editingConstituent !== undefined">
            <div class="form-title">{{ editingConstituent ? 'Modifier' : 'Nouveau' }} constituant</div>

            <label>Nom *</label>
            <input v-model="cName" placeholder="ex: Brique pleine" />

            <label>Code produit</label>
            <input v-model="cCode" placeholder="ex: REF-001 (facultatif)" />

            <div class="field-row">
              <div>
                <label>Unité *</label>
                <input v-model="cUnit" list="unit-list" placeholder="ex: unité, sac 25kg, h" />
                <datalist id="unit-list">
                  <option v-for="u in existingUnits" :key="u" :value="u" />
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
              <option v-for="s in existingSuppliers" :key="s" :value="s" />
            </datalist>

            <label>URL fiche produit</label>
            <input v-model="cUrl" placeholder="https://..." />

            <div class="form-actions">
              <button @click="editingConstituent = null; openNewConstituent()">Annuler</button>
              <button class="active" @click="saveConstituent">Enregistrer</button>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 500;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 900px; height: 640px;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex; align-items: center;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  padding: 6px 10px; gap: 8px;
}
.tabs { display: flex; gap: 4px; flex: 1; }
.modal-body { display: flex; flex: 1; overflow: hidden; }
.list-col {
  width: 240px; border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow-y: auto;
}
.list-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.list-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; cursor: pointer; font-size: 12px;
  border-bottom: 1px solid var(--border);
}
.list-item:hover { background: var(--surface2); }
.list-item.selected { background: var(--surface2); border-left: 3px solid var(--accent); }
.item-code { font-size: 10px; color: var(--text-muted); }
.small { padding: 2px 5px; font-size: 10px; }
.form-col {
  flex: 1; padding: 16px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 8px;
}
.form-title { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.field-row { display: flex; gap: 10px; }
.field-row > div { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.oc-section { display: flex; flex-direction: column; gap: 6px; }
.oc-header { display: flex; justify-content: space-between; align-items: center; }
.oc-row { display: flex; align-items: center; gap: 6px; }
.oc-formulas { display: flex; flex-direction: column; gap: 3px; flex: 3; }
.oc-formulas input { font-size: 11px; }
.oc-pos { width: 24px; text-align: right; color: var(--text-muted); font-size: 11px; flex-shrink: 0; }
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
.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
textarea { resize: vertical; min-height: 40px; }
</style>
