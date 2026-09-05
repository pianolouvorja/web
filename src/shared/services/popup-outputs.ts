/**
 * Output registry — popups do navegador como "telas" nomeadas (WT-4b).
 *
 * Cada popup viva é um output: { slot, label, module, alive }. Rótulos
 * persistidos em localStorage; `alive` é runtime (atualizado pelo heartbeat
 * de report-bounds que cada popup já envia a cada 2s).
 */

import type { PopupRoutableModule } from './popup-routing'

const LABELS_KEY = 'louvorja-popup-output-labels-v1'

export interface PopupOutput {
  slot: number
  label: string
  module: PopupRoutableModule | ''
  alive: boolean
}

type LabelMap = Record<string, string>

function loadLabels(): LabelMap {
  try {
    const raw = localStorage.getItem(LABELS_KEY)
    return raw ? (JSON.parse(raw) as LabelMap) : {}
  } catch {
    return {}
  }
}

function saveLabels(labels: LabelMap): void {
  try {
    localStorage.setItem(LABELS_KEY, JSON.stringify(labels))
  } catch {
    // ignore
  }
}

export function getOutputLabel(slot: number): string {
  const labels = loadLabels()
  return labels[String(slot)] ?? ''
}

export function setOutputLabel(slot: number, label: string): void {
  const labels = loadLabels()
  labels[String(slot)] = label
  saveLabels(labels)
}

/** Rótulo de exibição: persistido ou fallback "Tela N". */
export function displayLabel(slot: number): string {
  return getOutputLabel(slot) || `Tela ${slot}`
}
