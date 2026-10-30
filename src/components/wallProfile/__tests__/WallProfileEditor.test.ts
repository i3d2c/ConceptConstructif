import { describe, it, expect } from 'vitest'
import { mount, type DOMWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import WallProfileEditor from '../WallProfileEditor.vue'
import { createProfileViewport, profileViewHeight, PROFILE_FRAME } from '../profileViewport'
import type { ProfilePoint } from '../../../domain/models/Trace'

const BASE_HEIGHT = 2.5
const WALL_LENGTH = 10
const flatWithMiddle: ProfilePoint[] = [{ at: 0, offset: 0 }, { at: 0.5, offset: 0 }, { at: 1, offset: 0 }]

function mountEditor(profile: ProfilePoint[] = flatWithMiddle) {
  const wrapper = mount(WallProfileEditor, { props: { profile, baseHeight: BASE_HEIGHT, wallLength: WALL_LENGTH } })
  const svg = wrapper.find('svg').element
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: PROFILE_FRAME.width, height: PROFILE_FRAME.height }) as DOMRect
  const view = createProfileViewport(WALL_LENGTH, profileViewHeight(profile, BASE_HEIGHT), PROFILE_FRAME)
  const client = (x: number, h: number) => {
    const [clientX, clientY] = view.toSvg(x, h)
    return { clientX, clientY }
  }
  return { wrapper, client }
}

async function pointer(target: DOMWrapper<Element>, type: string, coords: { clientX: number; clientY: number } = { clientX: 0, clientY: 0 }) {
  target.element.dispatchEvent(new PointerEvent(type, { ...coords, bubbles: true }))
  await nextTick()
}

function committed(wrapper: ReturnType<typeof mountEditor>['wrapper']) {
  return wrapper.emitted<[ProfilePoint[]]>('commit')?.map(args => args[0])
}

describe('WallProfileEditor', () => {
  it('Should commit the new profile when the ridge point is dragged up and released', async () => {
    const { wrapper, client } = mountEditor()

    await pointer(wrapper.findAll('circle')[1], 'pointerdown', client(5, 2.5))
    await pointer(wrapper.find('svg'), 'pointermove', client(5.1, 5))
    await pointer(wrapper.find('svg'), 'pointerup')

    expect(committed(wrapper)).toEqual([
      [{ at: 0, offset: 0 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 }],
    ])
  })

  it('Should not commit anything when a point is clicked without being moved', async () => {
    const { wrapper, client } = mountEditor()

    await pointer(wrapper.findAll('circle')[1], 'pointerdown', client(5, 2.5))
    await pointer(wrapper.find('svg'), 'pointerup')

    expect(committed(wrapper)).toBeUndefined()
  })

  it('Should add a point with an interpolated height when the top edge is double-clicked', async () => {
    const raking: ProfilePoint[] = [{ at: 0, offset: 0 }, { at: 1, offset: 1 }]
    const { wrapper, client } = mountEditor(raking)

    await pointer(wrapper.find('.top-edge'), 'dblclick', client(2.5, 2.75))

    expect(committed(wrapper)).toEqual([
      [{ at: 0, offset: 0 }, { at: 0.25, offset: 0.25 }, { at: 1, offset: 1 }],
    ])
  })

  it('Should remove an intermediate point when it is double-clicked', async () => {
    const { wrapper } = mountEditor()

    await pointer(wrapper.findAll('circle')[1], 'dblclick')

    expect(committed(wrapper)).toEqual([[{ at: 0, offset: 0 }, { at: 1, offset: 0 }]])
  })

  it('Should commit the height typed for the selected point', async () => {
    const { wrapper, client } = mountEditor()
    await pointer(wrapper.findAll('circle')[1], 'pointerdown', client(5, 2.5))
    await pointer(wrapper.find('svg'), 'pointerup')

    await wrapper.find('[data-testid="point-height"]').setValue('5')

    expect(committed(wrapper)).toEqual([
      [{ at: 0, offset: 0 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 }],
    ])
  })

  it('Should commit the position typed for the selected point, in metres from the start', async () => {
    const { wrapper, client } = mountEditor()
    await pointer(wrapper.findAll('circle')[1], 'pointerdown', client(5, 2.5))
    await pointer(wrapper.find('svg'), 'pointerup')

    await wrapper.find('[data-testid="point-position"]').setValue('4')

    expect(committed(wrapper)).toEqual([
      [{ at: 0, offset: 0 }, { at: 0.4, offset: 0 }, { at: 1, offset: 0 }],
    ])
  })

  it('Should not let the position of the wall start be edited', async () => {
    const { wrapper, client } = mountEditor()
    await pointer(wrapper.findAll('circle')[0], 'pointerdown', client(0, 2.5))
    await pointer(wrapper.find('svg'), 'pointerup')

    expect(wrapper.find('[data-testid="point-position"]').attributes('disabled')).toBeDefined()
  })

  it('Should remove the selected intermediate point with the delete button', async () => {
    const { wrapper, client } = mountEditor()
    await pointer(wrapper.findAll('circle')[1], 'pointerdown', client(5, 2.5))
    await pointer(wrapper.find('svg'), 'pointerup')

    await wrapper.find('[data-testid="remove-point"]').trigger('click')

    expect(committed(wrapper)).toEqual([[{ at: 0, offset: 0 }, { at: 1, offset: 0 }]])
  })

  it('Should select the point it just added so its height can be typed right away', async () => {
    const { wrapper, client } = mountEditor([{ at: 0, offset: 0 }, { at: 1, offset: 0 }])

    await pointer(wrapper.find('.top-edge'), 'dblclick', client(5, 2.5))
    await wrapper.setProps({ profile: committed(wrapper)![0] })

    expect((wrapper.find('[data-testid="point-position"]').element as HTMLInputElement).value).toBe('5.00')
  })

  it('Should clear the selection once the selected point is removed', async () => {
    const { wrapper, client } = mountEditor()
    await pointer(wrapper.findAll('circle')[1], 'pointerdown', client(5, 2.5))
    await pointer(wrapper.find('svg'), 'pointerup')

    await wrapper.find('[data-testid="remove-point"]').trigger('click')
    await wrapper.setProps({ profile: committed(wrapper)![0] })

    expect(wrapper.find('[data-testid="point-height"]').exists()).toBe(false)
  })

  it('Should flatten the wall back to its assigned height with the "Hauteur uniforme" button', async () => {
    const { wrapper } = mountEditor([{ at: 0, offset: 0 }, { at: 0.5, offset: 2.5 }, { at: 1, offset: 0 }])

    await wrapper.find('[data-testid="flatten-profile"]').trigger('click')

    expect(committed(wrapper)).toEqual([[{ at: 0, offset: 0 }, { at: 1, offset: 0 }]])
  })

  it('Should stop a dragged point 5 cm before its neighbour instead of letting it pass', async () => {
    const { wrapper, client } = mountEditor()

    await pointer(wrapper.findAll('circle')[1], 'pointerdown', client(5, 2.5))
    await pointer(wrapper.find('svg'), 'pointermove', client(12, 4))
    await pointer(wrapper.find('svg'), 'pointerup')

    expect(committed(wrapper)![0][1].at).toBeCloseTo(0.995)
  })

  it('Should stop a point typed beyond its neighbour 5 cm before it', async () => {
    const { wrapper, client } = mountEditor()
    await pointer(wrapper.findAll('circle')[1], 'pointerdown', client(5, 2.5))
    await pointer(wrapper.find('svg'), 'pointerup')

    await wrapper.find('[data-testid="point-position"]').setValue('15')

    expect(committed(wrapper)![0][1].at).toBeCloseTo(0.995)
  })
})
