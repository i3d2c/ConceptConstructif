<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import type { ProfilePoint } from '../../domain/models/Trace'
import { defaultProfile, insertProfilePoint, moveProfilePoint, removeProfilePoint } from '../../domain/services/WallProfile'
import { wallProfileOutline } from '../../scene3d/wallProfileOutline'
import { createProfileViewport, profileViewHeight, PROFILE_FRAME } from './profileViewport'
import { snapHeight, snapPosition } from './profileSnap'

const props = defineProps<{
  profile: ProfilePoint[]
  baseHeight: number
  wallLength: number
}>()

const emit = defineEmits<{ commit: [profile: ProfilePoint[]] }>()

const MAGNET_PX = 8

const svgRef = ref<SVGSVGElement | null>(null)
const draft = shallowRef<ProfilePoint[] | null>(null)
const dragIndex = ref<number | null>(null)
const selectedIndex = ref<number | null>(null)

const shown = computed(() => draft.value ?? props.profile)
const view = computed(() =>
  createProfileViewport(props.wallLength, profileViewHeight(props.profile, props.baseHeight), PROFILE_FRAME),
)

const outline = computed(() =>
  wallProfileOutline(shown.value, props.baseHeight, props.wallLength, 0, 1)
    .map(([x, h]) => view.value.toSvg(x, h).join(','))
    .join(' '),
)
const selectedPoint = computed(() =>
  selectedIndex.value === null ? undefined : shown.value[selectedIndex.value],
)

const selectedIsEnd = computed(() =>
  selectedIndex.value === 0 || selectedIndex.value === props.profile.length - 1,
)

const handles = computed(() =>
  shown.value.map(p => view.value.toSvg(p.at * props.wallLength, props.baseHeight + p.offset)),
)

function wallPointOf(e: MouseEvent): [number, number] {
  const rect = svgRef.value!.getBoundingClientRect()
  const toView = PROFILE_FRAME.width / rect.width
  return view.value.toWall((e.clientX - rect.left) * toView, (e.clientY - rect.top) * toView)
}

function snappedAt(x: number): number {
  return snapPosition(x, props.wallLength, MAGNET_PX / view.value.scale) / props.wallLength
}

function commit(profile: ProfilePoint[]) {
  if (profile !== props.profile) emit('commit', profile)
}

function addPoint(e: MouseEvent) {
  const at = snappedAt(wallPointOf(e)[0])
  const profile = insertProfilePoint(props.profile, at)
  selectedIndex.value = profile.findIndex(p => p.at === at)
  commit(profile)
}

function removePoint(index: number) {
  selectedIndex.value = null
  commit(removeProfilePoint(props.profile, index))
}

function flatten() {
  selectedIndex.value = null
  commit(defaultProfile())
}

function parseMeters(input: EventTarget | null): number | null {
  const value = parseFloat((input as HTMLInputElement).value.replace(',', '.'))
  return isNaN(value) || value < 0 ? null : value
}

function setHeight(e: Event) {
  const height = parseMeters(e.target)
  if (height === null || !selectedPoint.value) return
  commit(moveProfilePoint(props.profile, selectedIndex.value!, selectedPoint.value.at, height - props.baseHeight))
}

function setPosition(e: Event) {
  const position = parseMeters(e.target)
  if (position === null || !selectedPoint.value) return
  commit(moveProfilePoint(props.profile, selectedIndex.value!, position / props.wallLength, selectedPoint.value.offset))
}

function startDrag(index: number, e: PointerEvent) {
  svgRef.value!.setPointerCapture?.(e.pointerId)
  selectedIndex.value = index
  dragIndex.value = index
  draft.value = props.profile
}

function drag(e: PointerEvent) {
  if (dragIndex.value === null || !draft.value) return
  const [x, h] = wallPointOf(e)
  draft.value = moveProfilePoint(draft.value, dragIndex.value, snappedAt(x), snapHeight(h) - props.baseHeight)
}

function endDrag() {
  if (draft.value) commit(draft.value)
  dragIndex.value = null
  draft.value = null
}
</script>

<template>
  <div class="wall-profile">
    <svg
      ref="svgRef"
      class="profile-view"
      :viewBox="`0 0 ${PROFILE_FRAME.width} ${PROFILE_FRAME.height}`"
      @pointermove="drag"
      @pointerup="endDrag"
    >
      <polygon class="wall" :points="outline" />
      <polyline class="top-edge" :points="handles.map(h => h.join(',')).join(' ')" @dblclick="addPoint" />
      <circle
        v-for="([cx, cy], i) in handles"
        :key="i"
        :cx="cx"
        :cy="cy"
        r="5"
        class="handle"
        :class="{ selected: i === selectedIndex }"
        @pointerdown="startDrag(i, $event)"
        @dblclick="removePoint(i)"
      />
    </svg>

    <div v-if="selectedPoint" class="point-row">
      <label>Position (m)</label>
      <input
        data-testid="point-position"
        type="text"
        class="dim-input"
        :value="(selectedPoint.at * wallLength).toFixed(2)"
        :disabled="selectedIsEnd"
        @change="setPosition"
      />
      <button
        v-if="!selectedIsEnd"
        data-testid="remove-point"
        class="small"
        title="Supprimer ce point"
        @click="removePoint(selectedIndex!)"
      >×</button>
    </div>
    <div v-if="selectedPoint" class="point-row">
      <label>Hauteur (m)</label>
      <input
        data-testid="point-height"
        type="text"
        class="dim-input"
        :value="(baseHeight + selectedPoint.offset).toFixed(2)"
        @change="setHeight"
      />
    </div>

    <div class="profile-actions">
      <span class="hint">Glissez les points ; double-clic sur le haut du mur pour en ajouter un.</span>
      <button data-testid="flatten-profile" class="small" @click="flatten">Hauteur uniforme</button>
    </div>
  </div>
</template>

<style scoped>
.profile-view { width: 100%; height: auto; display: block; touch-action: none; user-select: none; }
.wall { fill: var(--accent); fill-opacity: 0.25; stroke: var(--accent); stroke-width: 1.5; }
.top-edge { fill: none; stroke: transparent; stroke-width: 12; cursor: copy; }
.handle { fill: var(--surface); stroke: var(--accent); stroke-width: 2; cursor: grab; }
.handle.selected { fill: var(--accent); }
.wall-profile { display: flex; flex-direction: column; gap: 6px; }
.point-row { display: flex; align-items: center; gap: 8px; }
.point-row label { width: 70px; font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
.profile-actions { display: flex; align-items: center; gap: 8px; }
.hint { flex: 1; font-size: 10px; color: var(--text-muted); }
.small { padding: 3px 10px; font-size: 11px; }
.dim-input { width: 90px; font-size: 12px; text-align: right; }
</style>
