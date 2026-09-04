import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue'

import type { WebScreen } from '@shared/services/display-service-web'

import {
  buildMonitorLayout,
  canvasDeltaToVirtual,
  type ArrangementSlot,
  type MonitorLayoutPlan,
  type MonitorLayoutTile,
} from '../services/monitor-layout'

type DragState = {
  displayId: string
  pointerId: number
  startClientX: number
  startClientY: number
  originVirtualX: number
  originVirtualY: number
  offsetX: number
  offsetY: number
}

const STORAGE_KEY = 'louvorja-monitor-arrangement-v1'

function loadArrangement(): ArrangementSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ArrangementSlot[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Canvas de arranjo físico: posiciona pelos bounds e permite arrastar
 * monitores, persistindo o layout customizado.
 * Port literal de ~/piano-app composables/useMonitorArrangement.ts (WT-5K).
 */
export function useMonitorArrangement(
  stageRef: Ref<HTMLElement | null>,
  displays: Ref<WebScreen[]>,
) {
  const arrangement = ref<ArrangementSlot[]>(loadArrangement())
  const stageWidth = ref(640)
  const stageHeight = ref(352)
  const draggingId = ref<string | null>(null)
  const dragOffset = ref({ x: 0, y: 0 })

  let drag: DragState | null = null
  let resizeObserver: ResizeObserver | null = null

  function persist(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arrangement.value)) } catch { /* private mode */ }
  }

  const hasCustomArrangement = computed(() => arrangement.value.length > 0)

  const baseLayout = computed<MonitorLayoutPlan>(() =>
    buildMonitorLayout(
      displays.value,
      arrangement.value,
      stageWidth.value,
      stageHeight.value,
    ),
  )

  const tiles = computed<MonitorLayoutTile[]>(() => {
    const list = baseLayout.value.tiles
    if (draggingId.value == null) return list
    return list.map((tile) => {
      if (tile.id !== draggingId.value) return tile
      return {
        ...tile,
        left: tile.left + dragOffset.value.x,
        top: tile.top + dragOffset.value.y,
      }
    })
  })

  function measureStage() {
    const el = stageRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    stageWidth.value = Math.max(240, Math.floor(rect.width))
    stageHeight.value = Math.max(220, Math.floor(rect.height))
  }

  function findTile(displayId: string): MonitorLayoutTile | undefined {
    return baseLayout.value.tiles.find((tile) => tile.id === displayId)
  }

  function onPointerDown(event: PointerEvent, displayId: string) {
    if (event.button !== 0) return
    const tile = findTile(displayId)
    if (!tile) return

    event.preventDefault()
    ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)

    drag = {
      displayId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originVirtualX: tile.virtual.x,
      originVirtualY: tile.virtual.y,
      offsetX: 0,
      offsetY: 0,
    }
    draggingId.value = displayId
    dragOffset.value = { x: 0, y: 0 }
  }

  function onPointerMove(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return
    const offsetX = event.clientX - drag.startClientX
    const offsetY = event.clientY - drag.startClientY
    drag.offsetX = offsetX
    drag.offsetY = offsetY
    dragOffset.value = { x: offsetX, y: offsetY }
  }

  function commitDrag() {
    if (!drag) {
      draggingId.value = null
      dragOffset.value = { x: 0, y: 0 }
      return
    }

    const delta = canvasDeltaToVirtual(
      drag.offsetX,
      drag.offsetY,
      baseLayout.value.scale,
    )

    arrangement.value = [
      ...arrangement.value.filter((slot) => slot.displayId !== drag!.displayId),
      {
        displayId: drag.displayId,
        x: Math.round(drag.originVirtualX + delta.x),
        y: Math.round(drag.originVirtualY + delta.y),
      },
    ]
    persist()

    drag = null
    draggingId.value = null
    dragOffset.value = { x: 0, y: 0 }
  }

  function onPointerUp(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return
    commitDrag()
  }

  function onPointerCancel(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return
    drag = null
    draggingId.value = null
    dragOffset.value = { x: 0, y: 0 }
  }

  function resetLayout() {
    arrangement.value = []
    persist()
  }

  onMounted(() => {
    void nextTick(() => {
      measureStage()
      if (typeof ResizeObserver === 'undefined' || !stageRef.value) return
      resizeObserver = new ResizeObserver(() => measureStage())
      resizeObserver.observe(stageRef.value)
    })
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  watch(displays, () => {
    void nextTick(() => measureStage())
  })

  return {
    tiles,
    draggingId,
    hasCustomArrangement,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    resetLayout,
  }
}
