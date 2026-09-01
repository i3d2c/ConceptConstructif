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
  id: 'c-used', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie',
}
const unusedConstituent: Constituent = {
  id: 'c-unused', name: 'Peinture', unit: 'litre', unitPrice: 12, category: 'Finition',
}

const usedOuvrage: Ouvrage = {
  id: 'o-used', name: 'Mur brique', description: '', category: 'Maçonnerie',
  constituents: [{ id: 'oc-used', constituentId: usedConstituent.id, position: 1, formula: 'L' }],
}
const unusedOuvrage: Ouvrage = {
  id: 'o-unused', name: 'Peinture murale', description: '', category: 'Finition',
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

async function mountOnConstituentTab() {
  setupZoneWithUsedAndUnusedOuvrages()
  const wrapper = mount(ChiffrageFloat)
  await wrapper.findAll('button')[2].trigger('click')
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
})
