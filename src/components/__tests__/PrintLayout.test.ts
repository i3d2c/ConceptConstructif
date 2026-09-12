import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import { useSettingsStore } from '../../stores/settingsStore'
import PrintLayout from '../PrintLayout.vue'
import { defaultPrintConfig } from '../../print/PrintConfig'
import type { PrintConfig } from '../../print/PrintConfig'
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

    it('Should label the overall total "TOTAL" instead of "TOTAL GÉNÉRAL"', () => {
      const wrapper = mountWithUsedOuvrage()
      const section = wrapper.find('[data-testid="devis-section"]')

      expect(section.text()).toContain('TOTAL')
      expect(section.text()).not.toContain('TOTAL GÉNÉRAL')
    })

    it('Should show table headers in uppercase', () => {
      const wrapper = mountWithUsedOuvrage()
      const section = wrapper.find('[data-testid="devis-section"]')

      expect(section.find('thead').text()).toBe('OUVRAGEPRIX')
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

  describe('company logo layout', () => {
    it('Should apply the side-by-side layout when the logo is square', () => {
      const settingsStore = useSettingsStore()
      settingsStore.companyProfile.logo = 'data:image/png;base64,abc'
      settingsStore.companyProfile.logoAspectRatio = 1

      const wrapper = mountWithUsedOuvrage()

      expect(wrapper.find('[data-testid="company-block"]').classes()).toContain('layout-side')
    })

    it('Should apply the side-by-side layout when the logo is up to twice as wide as tall', () => {
      const settingsStore = useSettingsStore()
      settingsStore.companyProfile.logo = 'data:image/png;base64,abc'
      settingsStore.companyProfile.logoAspectRatio = 2

      const wrapper = mountWithUsedOuvrage()

      expect(wrapper.find('[data-testid="company-block"]').classes()).toContain('layout-side')
    })

    it('Should apply the stacked layout when the logo is more than twice as wide as tall', () => {
      const settingsStore = useSettingsStore()
      settingsStore.companyProfile.logo = 'data:image/png;base64,abc'
      settingsStore.companyProfile.logoAspectRatio = 2.5

      const wrapper = mountWithUsedOuvrage()

      expect(wrapper.find('[data-testid="company-block"]').classes()).toContain('layout-stacked')
    })

    it('Should apply the stacked layout when there is no logo at all', () => {
      const wrapper = mountWithUsedOuvrage()

      expect(wrapper.find('[data-testid="company-block"]').classes()).toContain('layout-stacked')
    })
  })

  describe('devis number', () => {
    it('Should show "DEVIS" followed by a number next to the project info', () => {
      const wrapper = mountWithUsedOuvrage()
      const header = wrapper.find('[data-testid="print-header"]')

      expect(header.text()).toMatch(/DEVIS \d+/)
    })
  })

  describe('page assembly', () => {
    function mountWithConfig(
      configOverrides: Partial<PrintConfig>,
      images: { canvas2DImage?: string | null; canvas3DImage?: string | null } = {},
    ) {
      const store = useProjectStore()
      store.project.ouvrages.push(usedOuvrage)
      store.project.constituents.push(usedConstituent)
      const zone = store.project.zones[0]
      zone.scale = { pixelLength: 100, realLength: 5, ratio: 0.05, tracePoints: [[0, 0], [100, 0]] }
      zone.colorAssignments.push(colorAssignment)
      zone.traces.push(drawnTrace)

      return mount(PrintLayout, {
        props: {
          config: { ...defaultPrintConfig(), ...configOverrides },
          canvas2DImage: images.canvas2DImage ?? null,
          canvas3DImage: images.canvas3DImage ?? null,
        },
      })
    }

    it('Should show the devis table as the primary content when Devis is checked, even if recap tables are also checked', () => {
      const wrapper = mountWithConfig({ showDevis: true, showRecapOuvrage: true, showRecapConstituent: true, showList: true })

      expect(wrapper.find('[data-testid="primary-content"] [data-testid="devis-section"]').exists()).toBe(true)
    })

    it('Should use recap ouvrage as the primary content when Devis is unchecked but recap ouvrage is checked', () => {
      const wrapper = mountWithConfig({ showDevis: false, showRecapOuvrage: true, showRecapConstituent: true, showList: true })

      const primary = wrapper.find('[data-testid="primary-content"]')
      expect(primary.text()).toContain('RÉCAPITULATIF PAR OUVRAGE')
      const trailing = wrapper.find('[data-testid="trailing-content"]')
      expect(trailing.text()).not.toContain('RÉCAPITULATIF PAR OUVRAGE')
      expect(trailing.text()).toContain('RÉCAPITULATIF PAR CONSTITUANT')
      expect(trailing.text()).toContain('LISTE DÉTAILLÉE PAR TRACÉ')
    })

    it('Should use recap constituent as the primary content when Devis and recap ouvrage are unchecked', () => {
      const wrapper = mountWithConfig({ showDevis: false, showRecapOuvrage: false, showRecapConstituent: true, showList: true })

      const primary = wrapper.find('[data-testid="primary-content"]')
      expect(primary.text()).toContain('RÉCAPITULATIF PAR CONSTITUANT')
      const trailing = wrapper.find('[data-testid="trailing-content"]')
      expect(trailing.text()).not.toContain('RÉCAPITULATIF PAR CONSTITUANT')
      expect(trailing.text()).toContain('LISTE DÉTAILLÉE PAR TRACÉ')
    })

    it('Should never use the detailed list as the primary content', () => {
      const wrapper = mountWithConfig({ showDevis: false, showRecapOuvrage: false, showRecapConstituent: false, showList: true })

      expect(wrapper.find('[data-testid="primary-content"]').exists()).toBe(false)
      const trailing = wrapper.find('[data-testid="trailing-content"]')
      expect(trailing.text()).toContain('LISTE DÉTAILLÉE PAR TRACÉ')
    })

    it('Should show nothing beyond the header when nothing is checked', () => {
      const wrapper = mountWithConfig({
        showDevis: false, showRecapOuvrage: false, showRecapConstituent: false, showList: false, show2D: false, show3D: false,
      })

      expect(wrapper.find('[data-testid="primary-content"]').exists()).toBe(false)
    })

    it('Should not repeat a table used as primary content in the trailing pages', () => {
      const wrapper = mountWithConfig({ showDevis: true, showRecapOuvrage: true, showRecapConstituent: false, showList: false })

      expect(wrapper.findAll('[data-testid="devis-section"]').length).toBe(1)
      const recapOuvrageHeadings = wrapper.findAll('h3').filter(h => h.text() === 'RÉCAPITULATIF PAR OUVRAGE')
      expect(recapOuvrageHeadings.length).toBe(1)
    })

    it('Should show the plans page on its own forced page break', () => {
      const wrapper = mountWithConfig({ showDevis: true }, { canvas2DImage: 'data:image/png;base64,abc' })

      const plansPage = wrapper.find('[data-testid="plans-page"]')
      expect(plansPage.exists()).toBe(true)
      expect((plansPage.element as HTMLElement).style.pageBreakBefore).toBe('always')
    })

    it('Should show the plan titles in uppercase', () => {
      const wrapper = mountWithConfig(
        { showDevis: true, show3D: true },
        { canvas2DImage: 'data:image/png;base64,abc', canvas3DImage: 'data:image/png;base64,xyz' },
      )

      const plansPage = wrapper.find('[data-testid="plans-page"]')
      expect(plansPage.text()).toContain('PLAN 2D')
      expect(plansPage.text()).toContain('VUE 3D')
    })

    it('Should force a page break before the trailing tables that follow the plans page', () => {
      const wrapper = mountWithConfig({ showDevis: true, showRecapOuvrage: true })

      const trailing = wrapper.find('[data-testid="trailing-content"]')
      expect(trailing.exists()).toBe(true)
      expect((trailing.element as HTMLElement).style.pageBreakBefore).toBe('always')
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
