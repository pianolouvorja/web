import { ref, computed, onMounted, onUnmounted, type ComputedRef } from 'vue'

export type NavPanel = 'books' | 'chapters' | null

export interface UseBibleNavCollapse {
  isMobile: ComputedRef<boolean>
  activePanel: ComputedRef<NavPanel>
  booksCollapsed: ComputedRef<boolean>
  chaptersCollapsed: ComputedRef<boolean>
  onBookSelected: () => void
  onChapterSelected: () => void
  toggleBooks: () => void
  toggleChapters: () => void
}

/**
 * Controla o colapso dos paineis de livros e capitulos no mobile.
 *
 * Desktop (>768px): sem colapso, tudo visivel.
 * Mobile (<=768px): um painel aberto por vez, auto-colapsa ao selecionar.
 */
export function useBibleNavCollapse(): UseBibleNavCollapse {
  const MOBILE_BREAKPOINT = 768
  const mediaQuery = typeof window !== 'undefined'
    ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    : null

  const isMobileRef = ref(mediaQuery?.matches ?? false)
  const activePanelRef = ref<NavPanel>('books')

  function onMediaChange(e: MediaQueryListEvent) {
    isMobileRef.value = e.matches
    if (!e.matches) {
      activePanelRef.value = null
    } else if (activePanelRef.value === null) {
      activePanelRef.value = 'books'
    }
  }

  onMounted(() => {
    mediaQuery?.addEventListener('change', onMediaChange)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', onMediaChange)
  })

  const isMobile = computed(() => isMobileRef.value)
  const activePanel = computed(() =>
    isMobileRef.value ? activePanelRef.value : null,
  )

  const booksCollapsed = computed(() => {
    if (!isMobileRef.value) return false
    return activePanelRef.value !== 'books'
  })

  const chaptersCollapsed = computed(() => {
    if (!isMobileRef.value) return false
    return activePanelRef.value !== 'chapters'
  })

  function onBookSelected() {
    if (!isMobileRef.value) return
    activePanelRef.value = 'chapters'
  }

  function onChapterSelected() {
    if (!isMobileRef.value) return
    activePanelRef.value = null
  }

  function toggleBooks() {
    if (!isMobileRef.value) return
    activePanelRef.value = activePanelRef.value === 'books' ? null : 'books'
  }

  function toggleChapters() {
    if (!isMobileRef.value) return
    activePanelRef.value = activePanelRef.value === 'chapters' ? null : 'chapters'
  }

  return {
    isMobile,
    activePanel,
    booksCollapsed,
    chaptersCollapsed,
    onBookSelected,
    onChapterSelected,
    toggleBooks,
    toggleChapters,
  }
}
