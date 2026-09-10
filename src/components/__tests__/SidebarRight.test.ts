import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useProjectStore } from '../../stores/projectStore'
import SidebarRight from '../SidebarRight.vue'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { ColorAssignment } from '../../domain/models/Zone'
import type { LineTrace } from '../../domain/models/Trace'
import type { Scale } from '../../domain/models/Scale'

const scale: Scale = { pixelLength: 100, realLength: 5, ratio: 0.05, tracePoints: [[0, 0], [100, 0]] }

const ouvrage: Ouvrage = {
  id: 'o-1', name: 'Mur brique', description: '', category: 'Maçonnerie',
  constituents: [{ id: 'oc-1', constituentId: 'c-1', position: 1, formula: 'L' }],
}

const colorAssignment: ColorAssignment = {
  id: 'ca-1', color: '#ff0000', ouvrageId: ouvrage.id, epaisseur: 0.2, hauteur: 2.5,
}

const trace: LineTrace = {
  id: 't-1', number: 1, type: 'line', colorAssignmentId: colorAssignment.id, up: 0,
  points: [[0, 0], [100, 0]],
}

describe('SidebarRight', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('empty state — nothing selected', () => {
    it('Should show the getting-started tutorial when the zone is not fully set up yet', () => {
      const wrapper = mount(SidebarRight)

      const text = wrapper.text()
      expect(text).toContain('Importer un plan')
      expect(text).toContain('Créer une échelle')
      expect(text).toContain('Tracer les traits')
    })

    it('Should mark the scale step done once the zone has a scale', () => {
      const store = useProjectStore()
      store.activeZone!.scale = scale

      const wrapper = mount(SidebarRight)

      expect(wrapper.find('[data-step="scale"]').classes()).toContain('done')
    })

    it('Should mark the optional background-image step done without it blocking the other steps', () => {
      const store = useProjectStore()
      store.activeZone!.backgroundImage = 'data:image/png;base64,xxx'

      const wrapper = mount(SidebarRight)

      expect(wrapper.find('[data-step="background"]').classes()).toContain('done')
      expect(wrapper.find('[data-testid="getting-started-checklist"]').exists()).toBe(true)
    })

    it('Should show a plain selection hint once scale, an ouvrage, a color assignment and a trace all exist — even without a background image', () => {
      const store = useProjectStore()
      store.project.ouvrages.push(ouvrage)
      store.activeZone!.scale = scale
      store.activeZone!.colorAssignments.push(colorAssignment)
      store.activeZone!.traces.push(trace)

      const wrapper = mount(SidebarRight)

      expect(wrapper.find('[data-testid="getting-started-checklist"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('Sélectionnez un tracé')
    })
  })

  describe('selected trace', () => {
    function setupSelectedTrace() {
      const store = useProjectStore()
      store.project.ouvrages.push(ouvrage)
      store.activeZone!.scale = scale
      store.activeZone!.colorAssignments.push(colorAssignment)
      store.activeZone!.traces.push(trace)
      store.selectedTraceId = trace.id
      return store
    }

    it('Should display the assigned ouvrage name', () => {
      setupSelectedTrace()

      const wrapper = mount(SidebarRight)

      expect(wrapper.text()).toContain(ouvrage.name)
    })

    it('Should display the computed dimensions section when the zone has a scale', () => {
      setupSelectedTrace()

      const wrapper = mount(SidebarRight)

      expect(wrapper.text()).toContain('Dimensions calculées')
    })

    it('Should delete the trace and clear the selection when clicking "Supprimer"', async () => {
      const store = setupSelectedTrace()
      const wrapper = mount(SidebarRight)

      await wrapper.find('button.danger').trigger('click')

      expect(store.activeZone!.traces).toHaveLength(0)
      expect(store.selectedTraceId).toBeNull()
    })

    it('Should duplicate the trace and select the new one when clicking "Dupliquer"', async () => {
      const store = setupSelectedTrace()
      const wrapper = mount(SidebarRight)

      await wrapper.find('button.duplicate').trigger('click')

      expect(store.activeZone!.traces).toHaveLength(2)
      expect(store.selectedTraceId).not.toBe(trace.id)
      expect(store.selectedTraceId).toBe(store.activeZone!.traces[1].id)
    })

    describe('live drag preview', () => {
      it('Should use store.liveTracePoints instead of the committed trace points while a drag is in progress', async () => {
        setupSelectedTrace()
        const store = useProjectStore()
        const wrapper = mount(SidebarRight)
        expect(wrapper.text()).toContain('5 m')

        store.liveTracePoints = [[0, 0], [200, 0]]
        await wrapper.vm.$nextTick()

        expect(wrapper.text()).toContain('10 m')
      })

      it('Should fall back to the committed trace points once liveTracePoints is cleared', async () => {
        setupSelectedTrace()
        const store = useProjectStore()
        const wrapper = mount(SidebarRight)
        store.liveTracePoints = [[0, 0], [200, 0]]
        await wrapper.vm.$nextTick()

        store.liveTracePoints = null
        await wrapper.vm.$nextTick()

        expect(wrapper.text()).toContain('5 m')
        expect(wrapper.text()).not.toContain('10 m')
      })
    })
  })
})
