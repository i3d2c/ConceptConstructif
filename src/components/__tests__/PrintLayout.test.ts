import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import { useSettingsStore } from '../../stores/settingsStore'
import PrintLayout from '../PrintLayout.vue'
import { defaultPrintConfig } from '../../print/PrintConfig'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'
import type { ColorAssignment } from '../../domain/models/Zone'
import type { LineTrace } from '../../domain/models/Trace'

const usedConstituent: Constituent = {
  id: 'c-used', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie', formulaRecap: 'ceil(X)',
}
const usedOuvrage: Ouvrage = {
  id: 'o-used', name: 'Mur brique', description: 'Mur en brique pleine porteuse', category: 'Maçonnerie',
  constituents: [{ id: 'oc-used', constituentId: usedConstituent.id, position: 1, formula: 'L/3' }],
}
const colorAssignment: ColorAssignment = {
  id: 'ca-1', color: '#ff0000', ouvrageId: usedOuvrage.id, epaisseur: 0.2, hauteur: 2.5,
}
const drawnTrace: LineTrace = {
  id: 't-1', number: 1, type: 'line', colorAssignmentId: colorAssignment.id, up: 0,
  points: [[0, 0], [100, 0]],
}

function mountWithUsedOuvrage() {
  const store = useProjectStore()
  store.project.ouvrages.push(usedOuvrage)
  store.project.constituents.push(usedConstituent)
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

  describe('Devis section', () => {
    it('Should show the ouvrage description beneath its name and its price', () => {
      const wrapper = mountWithUsedOuvrage()
      const section = wrapper.find('[data-testid="devis-section"]')
      const row = section.findAll('tbody tr').find(r => r.text().includes(usedOuvrage.name))

      expect(row).toBeTruthy()
      expect(row!.text()).toContain(usedOuvrage.description)
      expect(row!.text()).toContain('€')
    })

    it('Should not have a separate "Description" column', () => {
      const wrapper = mountWithUsedOuvrage()
      const section = wrapper.find('[data-testid="devis-section"]')

      expect(section.find('thead').text()).not.toContain('Description')
    })

    it('Should not show constituent detail rows', () => {
      const wrapper = mountWithUsedOuvrage()
      const section = wrapper.find('[data-testid="devis-section"]')

      expect(section.text()).not.toContain(usedConstituent.name)
    })

    it('Should label the overall total "Total" instead of "Total général"', () => {
      const wrapper = mountWithUsedOuvrage()
      const section = wrapper.find('[data-testid="devis-section"]')

      expect(section.text()).toContain('Total')
      expect(section.text()).not.toContain('Total général')
    })
  })

  describe('company header', () => {
    it('Should show the company name, contact, phone and email when config.title is true', () => {
      const settingsStore = useSettingsStore()
      settingsStore.companyProfile.companyName = 'Concept Constructif'
      settingsStore.companyProfile.contactName = 'Guillaume Dubus'
      settingsStore.companyProfile.phone = '06 00 00 00 00'
      settingsStore.companyProfile.email = 'contact@example.com'

      const wrapper = mountWithUsedOuvrage()
      const header = wrapper.find('[data-testid="print-header"]')

      expect(header.text()).toContain('Concept Constructif')
      expect(header.text()).toContain('Guillaume Dubus')
      expect(header.text()).toContain('06 00 00 00 00')
      expect(header.text()).toContain('contact@example.com')
    })

    it('Should not render the header at all when config.title is false', () => {
      const store = useProjectStore()
      store.project.ouvrages.push(usedOuvrage)
      store.project.constituents.push(usedConstituent)

      const wrapper = mount(PrintLayout, {
        props: { config: { ...defaultPrintConfig(), title: false }, canvas2DImage: null, canvas3DImage: null },
      })

      expect(wrapper.find('[data-testid="print-header"]').exists()).toBe(false)
    })
  })

  describe('plan visuals legend', () => {
    function setUpZoneWithTrace() {
      const store = useProjectStore()
      store.project.ouvrages.push(usedOuvrage)
      store.project.constituents.push(usedConstituent)
      const zone = store.project.zones[0]
      zone.scale = { pixelLength: 100, realLength: 5, ratio: 0.05, tracePoints: [[0, 0], [100, 0]] }
      zone.colorAssignments.push(colorAssignment)
      zone.traces.push(drawnTrace)
    }

    it('Should show a legend row with the color and ouvrage name when a 2D image is provided', () => {
      setUpZoneWithTrace()

      const wrapper = mount(PrintLayout, {
        props: { config: defaultPrintConfig(), canvas2DImage: 'data:image/png;base64,abc', canvas3DImage: null },
      })

      const legend = wrapper.find('[data-testid="print-legend"]')
      expect(legend.text()).toContain(usedOuvrage.name)
      const dot = legend.find('.legend-dot')
      // jsdom normalizes inline hex colors to rgb()
      expect((dot.element as HTMLElement).style.background).toBe('rgb(255, 0, 0)')
    })

    it('Should show a legend row alongside the 3D view when only a 3D image is provided', () => {
      setUpZoneWithTrace()

      const wrapper = mount(PrintLayout, {
        props: { config: { ...defaultPrintConfig(), show3D: true }, canvas2DImage: null, canvas3DImage: 'data:image/png;base64,xyz' },
      })

      expect(wrapper.find('[data-testid="print-legend"]').text()).toContain(usedOuvrage.name)
    })

    it('Should not show a legend when neither the 2D nor the 3D image is shown', () => {
      setUpZoneWithTrace()
      const wrapper = mountWithUsedOuvrage()

      expect(wrapper.find('[data-testid="print-legend"]').exists()).toBe(false)
    })
  })
})
