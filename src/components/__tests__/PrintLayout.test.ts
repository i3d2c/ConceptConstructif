import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import PrintLayout from '../PrintLayout.vue'
import { defaultPrintConfig } from '../../print/PrintConfig'
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

function mountWithUsedAndUnusedOuvrages() {
  const store = useProjectStore()
  store.project.ouvrages.push(usedOuvrage, unusedOuvrage)
  store.project.constituents.push(usedConstituent, unusedConstituent)
  const zone = store.project.zones[0]
  zone.scale = { pixelLength: 100, realLength: 5, ratio: 0.05, tracePoints: [[0, 0], [100, 0]] }
  zone.colorAssignments.push(colorAssignment)
  zone.traces.push(drawnTrace)

  return mount(PrintLayout, {
    props: { config: defaultPrintConfig(), canvas2DImage: null, canvas3DImage: null },
  })
}

describe('PrintLayout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Récapitulatif par constituant', () => {
    it('Should not list a constituent from an ouvrage that has no trace in the active zone', () => {
      const wrapper = mountWithUsedAndUnusedOuvrages()

      expect(wrapper.text()).not.toContain(unusedConstituent.name)
    })

    it('Should still list a constituent from an ouvrage that has a trace in the active zone', () => {
      const wrapper = mountWithUsedAndUnusedOuvrages()

      expect(wrapper.text()).toContain(usedConstituent.name)
    })
  })

  describe('Devis section', () => {
    it('Should list an ouvrage that has a trace in the active zone, with its description shown beneath its name and its own price', () => {
      const wrapper = mountWithUsedAndUnusedOuvrages()
      const section = wrapper.find('[data-testid="devis-section"]')
      const row = section.findAll('tbody tr').find(r => r.text().includes(usedOuvrage.name))

      expect(row).toBeTruthy()
      expect(row!.text()).toContain(usedOuvrage.description)
      expect(row!.text()).toContain('€')
    })

    it('Should not have a separate "Description" column', () => {
      const wrapper = mountWithUsedAndUnusedOuvrages()
      const section = wrapper.find('[data-testid="devis-section"]')

      expect(section.find('thead').text()).not.toContain('Description')
    })

    it('Should not list an ouvrage that has no trace in the active zone', () => {
      const wrapper = mountWithUsedAndUnusedOuvrages()
      const section = wrapper.find('[data-testid="devis-section"]')

      expect(section.text()).not.toContain(unusedOuvrage.name)
    })

    it('Should not show constituent detail rows in the Devis section', () => {
      const wrapper = mountWithUsedAndUnusedOuvrages()
      const section = wrapper.find('[data-testid="devis-section"]')

      expect(section.text()).not.toContain(usedConstituent.name)
    })

    it('Should label the overall total "Total" instead of "Total général"', () => {
      const wrapper = mountWithUsedAndUnusedOuvrages()
      const section = wrapper.find('[data-testid="devis-section"]')

      expect(section.text()).toContain('Total')
      expect(section.text()).not.toContain('Total général')
    })

    it('Should use the récap par constituant total, including formulaRecap rounding, as the overall total', () => {
      const wrapper = mountWithUsedAndUnusedOuvrages()
      const section = wrapper.find('[data-testid="devis-section"]')
      const roundedQty = Math.ceil(5 / 3)
      const expectedTotal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .format(roundedQty * usedConstituent.unitPrice)

      expect(section.text()).toContain(`${expectedTotal} €`)
    })
  })

  describe('Devis section - per-ouvrage price distribution', () => {
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

    function mountWithTwoOuvragesSharingAConstituent() {
      const store = useProjectStore()
      store.project.ouvrages.push(ouvrageA, ouvrageB)
      store.project.constituents.push(sharedConstituent)
      const zone = store.project.zones[0]
      zone.scale = { pixelLength: 100, realLength: 5, ratio: 0.05, tracePoints: [[0, 0], [100, 0]] }
      zone.colorAssignments.push(caA, caB)
      zone.traces.push(traceA, traceB)

      return mount(PrintLayout, {
        props: { config: defaultPrintConfig(), canvas2DImage: null, canvas3DImage: null },
      })
    }

    it('Should scale each ouvrage price proportionally so their sum equals the rounded total', () => {
      const wrapper = mountWithTwoOuvragesSharingAConstituent()
      const section = wrapper.find('[data-testid="devis-section"]')

      const rawA = 5 / 5
      const rawB = 5 / 2
      const roundedTotalQty = Math.ceil(rawA + rawB)
      const ratio = roundedTotalQty / (rawA + rawB)

      const rowA = section.findAll('tbody tr').find(r => r.text().includes(ouvrageA.name))!
      const rowB = section.findAll('tbody tr').find(r => r.text().includes(ouvrageB.name))!

      expect(rowA.text()).toContain(`${fmt(rawA * ratio)} €`)
      expect(rowB.text()).toContain(`${fmt(rawB * ratio)} €`)
      expect(section.text()).toContain(`${fmt(roundedTotalQty)} €`)
    })
  })
})
