export type PopupWindowRef = Window & {
  __popupSlot?: number
}

let popupRefs: PopupWindowRef[] = []

export function getPopupRefs(): PopupWindowRef[] {
  popupRefs = popupRefs.filter((popup) => popup && !popup.closed)
  return popupRefs
}

export function setPopupRefs(popups: PopupWindowRef[] | null | undefined): PopupWindowRef[] {
  popupRefs = (popups || []).filter((popup) => popup && !popup.closed)
  return popupRefs
}

export function hasOpenPopups(): boolean {
  return getPopupRefs().length > 0
}
