import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import ChiffrageFloat from '../ChiffrageFloat.vue'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'
import type { ColorAssignment } from '../../domain/models/Zone'
import type { LineTrace } from '../../domain/models/Trace'

const usedConstituent: Constituent = {
  id: 'c-used', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie', formulaRecap: 'ceil(X)',
}
const unusedConstituent: Constituent = {
  id: 'c-unused', name: 'Peinture', unit: 'litre', unitPrice: 12, category: 'Finition',
}

const usedOuvrage: Ouvrage = {
  id: 'o-used', name: 'Mur brique', description: 'Mur en brique pleine porteuse', category: 'Maçonnerie',
  constituents: [{ id: 'oc-used', constituentId: usedConstituent.id, position: 1, formula: 'L/3' }],
}
const unusedOuvrage: Ouvrage = {
  id: 'o-unused', name: 'Peinture murale', description: 'Peinture murale deux couches', category: 'Finition',
  constituents: [{ id: 'oc-unused', constituentId: unusedConstituent.id, position: 1, formula: 'L' }],
}

const colorAssignment: ColorAssignment = {
  id: 'ca-1', color: '#ff0000', ouvrageId: usedOuvrage.id, epaisseur: 0.2, hauteur: 2.5,
}

const drawnTrace: LineTrace = {
  id: 't-1', number: 1, type: 'line', colorAssignmentId: colorAssignment.id, up: 0,
  points: [[0, 0], [100, 0]],
}

function setupZoneWithUsedAndUnusedOuvrages() {
  const store = useProjectStore()
  store.project.ouvrages.push(usedOuvrage, unusedOuvrage)
  store.project.constituents.push(usedConstituent, unusedConstituent)
  const zone = store.project.zones[0]
  zone.scale = { pixelLength: 100, realLength: 5, ratio: 0.05, tracePoints: [[0, 0], [100, 0]] }
  zone.colorAssignments.push(colorAssignment)
  zone.traces.push(drawnTrace)
  return store
}

async function clickTab(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper.findAll('button').find(b => b.text() === label)
  await button!.trigger('click')
}

async function mountOnConstituentTab() {
  setupZoneWithUsedAndUnusedOuvrages()
  const wrapper = mount(ChiffrageFloat)
  await clickTab(wrapper, 'Récap/Constituant')
  return wrapper
}

async function mountOnDevisTab() {
  setupZoneWithUsedAndUnusedOuvrages()
  const wrapper = mount(ChiffrageFloat)
  await clickTab(wrapper, 'Devis')
  return wrapper
}

describe('ChiffrageFloat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Récap/Constituant tab', () => {
    it('Should not list a constituent from an ouvrage that has no trace in the active zone', async () => {
      const wrapper = await mountOnConstituentTab()

      expect(wrapper.text()).not.toContain(unusedConstituent.name)
    })

    it('Should still list a constituent from an ouvrage that has a trace in the active zone', async () => {
      const wrapper = await mountOnConstituentTab()

      expect(wrapper.text()).toContain(usedConstituent.name)
    })
  })

  describe('Devis tab', () => {
    it('Should list an ouvrage that has a trace in the active zone, with its description shown beneath its name and its own price', async () => {
      const wrapper = await mountOnDevisTab()
      const panel = wrapper.find('[data-testid="devis-panel"]')
      const row = panel.findAll('tbody tr').find(r => r.text().includes(usedOuvrage.name))

      expect(row).toBeTruthy()
      expect(row!.text()).toContain(usedOuvrage.description)
      expect(row!.text()).toContain('€')
    })

    it('Should not have a separate "Description" column', async () => {
      const wrapper = await mountOnDevisTab()
      const panel = wrapper.find('[data-testid="devis-panel"]')

      expect(panel.find('thead').text()).not.toContain('Description')
    })

    it('Should not list an ouvrage that has no trace in the active zone', async () => {
      const wrapper = await mountOnDevisTab()
      const panel = wrapper.find('[data-testid="devis-panel"]')

      expect(panel.text()).not.toContain(unusedOuvrage.name)
    })

    it('Should not show constituent detail rows in the Devis tab', async () => {
      const wrapper = await mountOnDevisTab()
      const panel = wrapper.find('[data-testid="devis-panel"]')

      expect(panel.text()).not.toContain(usedConstituent.name)
    })

    it('Should label the overall total "Total" instead of "Total général"', async () => {
      const wrapper = await mountOnDevisTab()
      const panel = wrapper.find('[data-testid="devis-panel"]')

      expect(panel.text()).toContain('Total')
      expect(panel.text()).not.toContain('Total général')
    })

    it('Should use the récap par constituant total, including formulaRecap rounding, as the overall total', async () => {
      const wrapper = await mountOnDevisTab()
      const panel = wrapper.find('[data-testid="devis-panel"]')
      const roundedQty = Math.ceil(5 / 3)
      const expectedTotal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .format(roundedQty * usedConstituent.unitPrice)

      expect(panel.text()).toContain(`${expectedTotal} €`)
    })
  })

  describe('Devis tab - per-ouvrage price distribution', () => {
    const sharedConstituent: Constituent = {
      id: 'c-shared', name: 'Constituant partagé', unit: 'unité', unitPrice: 1, category: 'Test', formulaRecap: 'ceil(X)',
    }
    const ouvrageA: Ouvrage = {
      id: 'o-a', name: 'Ouvrage A', description: '', category: 'Test',
      constituents: [{ id: 'oc-a', constituentId: sharedConstituent.id, position: 1, formula: 'L/5' }],
    }
    const ouvrageB: Ouvrage = {
      id: 'o-b', name: 'Ouvrage B', description: '', category: 'Test',
      constituents: [{ id: 'oc-b', constituentId: sharedConstituent.id, position: 1, formula: 'L/2' }],
    }
    const caA: ColorAssignment = { id: 'ca-a', color: '#111111', ouvrageId: ouvrageA.id, epaisseur: 0.2, hauteur: 2.5 }
    const caB: ColorAssignment = { id: 'ca-b', color: '#222222', ouvrageId: ouvrageB.id, epaisseur: 0.2, hauteur: 2.5 }
    const traceA: LineTrace = { id: 't-a', number: 1, type: 'line', colorAssignmentId: caA.id, up: 0, points: [[0, 0], [100, 0]] }
    const traceB: LineTrace = { id: 't-b', number: 2, type: 'line', colorAssignmentId: caB.id, up: 0, points: [[0, 0], [100, 0]] }

    function fmt(n: number) {
      return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
    }

    async function mountWithTwoOuvragesSharingAConstituent() {
      const store = useProjectStore()
      store.project.ouvrages.push(ouvrageA, ouvrageB)
      store.project.constituents.push(sharedConstituent)
      const zone = store.project.zones[0]
      zone.scale = { pixelLength: 100, realLength: 5, ratio: 0.05, tracePoints: [[0, 0], [100, 0]] }
      zone.colorAssignments.push(caA, caB)
      zone.traces.push(traceA, traceB)
      const wrapper = mount(ChiffrageFloat)
      await clickTab(wrapper, 'Devis')
      return wrapper
    }

    it('Should scale each ouvrage price proportionally so their sum equals the rounded total', async () => {
      const wrapper = await mountWithTwoOuvragesSharingAConstituent()
      const panel = wrapper.find('[data-testid="devis-panel"]')

      const rawA = 5 / 5
      const rawB = 5 / 2
      const roundedTotalQty = Math.ceil(rawA + rawB)
      const ratio = roundedTotalQty / (rawA + rawB)

      const rowA = panel.findAll('tbody tr').find(r => r.text().includes(ouvrageA.name))!
      const rowB = panel.findAll('tbody tr').find(r => r.text().includes(ouvrageB.name))!

      expect(rowA.text()).toContain(`${fmt(rawA * ratio)} €`)
      expect(rowB.text()).toContain(`${fmt(rawB * ratio)} €`)
      expect(panel.text()).toContain(`${fmt(roundedTotalQty)} €`)
    })
  })
})
