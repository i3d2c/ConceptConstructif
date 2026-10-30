import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import ZoneGroupsDialog from '../ZoneGroupsDialog.vue'
import { useProjectStore } from '../../../stores/projectStore'

function setupTwoZones() {
  const store = useProjectStore()
  store.addZone({ ...store.project.zones[0], id: 'z-annex', name: 'Annexe' })
  return store
}

describe('ZoneGroupsDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('Should create a group containing every zone when clicking "+ Nouveau groupe"', async () => {
    const store = setupTwoZones()
    const wrapper = mount(ZoneGroupsDialog)

    await wrapper.find('[data-testid="add-group"]').trigger('click')

    expect(store.project.zoneGroups).toHaveLength(1)
    expect(store.project.zoneGroups[0]).toMatchObject({
      name: 'Groupe 1',
      zoneIds: store.project.zones.map(z => z.id),
    })
  })

  it('Should rename a group', async () => {
    const store = setupTwoZones()
    store.addZoneGroup({ id: 'g-1', name: 'Groupe 1', zoneIds: [] })
    const wrapper = mount(ZoneGroupsDialog)

    await wrapper.find('[data-testid="group-name"]').setValue('Maison complète')

    expect(store.project.zoneGroups[0].name).toBe('Maison complète')
  })

  it('Should add or remove a zone from a group with its checkbox', async () => {
    const store = setupTwoZones()
    const [mainZone, annex] = store.project.zones
    store.addZoneGroup({ id: 'g-1', name: 'Groupe 1', zoneIds: [mainZone.id] })
    const wrapper = mount(ZoneGroupsDialog)
    const checkbox = (zoneId: string) => wrapper.find(`[data-testid="group-zone-${zoneId}"]`)

    await checkbox(annex.id).setValue(true)
    expect(store.project.zoneGroups[0].zoneIds).toEqual([mainZone.id, annex.id])

    await checkbox(mainZone.id).setValue(false)
    expect(store.project.zoneGroups[0].zoneIds).toEqual([annex.id])
  })

  it('Should delete a group', async () => {
    const store = setupTwoZones()
    store.addZoneGroup({ id: 'g-1', name: 'Groupe 1', zoneIds: [] })
    const wrapper = mount(ZoneGroupsDialog)

    await wrapper.find('[data-testid="remove-group"]').trigger('click')

    expect(store.project.zoneGroups).toEqual([])
  })
})
