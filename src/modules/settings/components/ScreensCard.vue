<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { GlassCard } from '@design-system/index'

import { getPopupCount, setPopupCount } from '@shared/services/projection-preferences'
import { getPopupRefs } from '@shared/services/popup-registry'
import { closeScreenPopups, openPopupModule } from '@shared/services/popup-windows'
import {
  useDesktopPalcoSession,
  type PalcoSlotInfo,
  type PalcoStatusInfo,
} from '../../remote/services/desktop-palco-session'
import { useStageRelay } from '../../remote/services/stage-relay'

/**
 * Paridade 1:1 com PalcoCard + PalcoSlotsCard do desktop.
 * No web as "telas" são popups deste navegador: dot verde quando a popup
 * está aberta, selecionada = alvo do projeto, play = abrir/fechar popup.
 * Roteamento por módulo embaixo, igual "Espelhar (todas) ou uma tela".
 */

const { t } = useI18n()
const popupCount = ref(getPopupCount())
const activeId = ref('1')
const tick = ref(0)

const {
  connected: desktopConnected,
  fetchStatus,
  fetchSlots,
  turnOn,
  turnOff,
  idle,
  createTv,
  removeTv,
  startTv,
  stopTv,
} = useDesktopPalcoSession()

const tvLoading = ref(false)
const tvStatus = ref<PalcoStatusInfo | null>(null)
const tvSlots = ref<PalcoSlotInfo[]>([])
const tvError = ref('')

// WT-5c: modo cloud — quando o desktop não conecta, o relay da API assume.
const relay = useStageRelay()
const cloudInput = ref('')
const cloudMode = computed(() => !desktopConnected.value)
// WT-5 (criar sessão): web gera o código — TV só consome.
const creatingSession = ref(false)
const cloudQr = ref('')

async function connectCloud(): Promise<void> {
  tvError.value = ''
  const ok = await relay.attachCode(cloudInput.value)
  if (!ok) tvError.value = t('settings.palco.statusError')
}

async function createSession(): Promise<void> {
  tvError.value = ''
  creatingSession.value = true
  try {
    const ok = await relay.createSession()
    if (!ok) tvError.value = t('settings.palco.statusError')
  } finally {
    creatingSession.value = false
  }
}

// QR com a URL do receiver cloud — aponta a câmera do celular ou informa o
// caminho; na TV o código se digita no overlay da tecla vermelha.
watch(
  () => [relay.connected.value, relay.code.value] as const,
  async ([on, c]) => {
    cloudQr.value = ''
    if (!on || !c) return
    try {
      const { default: QRCode } = await import('qrcode')
      const api = import.meta.env.DEV
        ? 'http://localhost:5173'
        : window.location.origin
      cloudQr.value = await QRCode.toDataURL(`${api}/palco-receiver?code=${c}`, {
        width: 132,
        margin: 1,
      })
    } catch { /* QR é melhor-effort — código em texto sempre visível */ }
  },
  { immediate: true },
)

async function refreshTvs(): Promise<void> {
  if (tvLoading.value) return
  tvLoading.value = true
  try {
    if (relay.connected.value) {
      tvStatus.value = await relay.fetchStatus()
      tvSlots.value = await relay.fetchSlots()
    } else if (desktopConnected.value) {
      const [st, sl] = await Promise.all([fetchStatus(), fetchSlots()])
      tvStatus.value = st
      tvSlots.value = sl
    }
  } catch {
    tvError.value = t('settings.palco.statusError')
  } finally {
    tvLoading.value = false
  }
}

async function addTv(): Promise<void> {
  if (!desktopConnected.value) return
  const label = `${t('settings.palco.tv')} ${tvSlots.value.length + 1}`
  await createTv(label)
  await refreshTvs()
}

async function removeTvSlot(id: string): Promise<void> {
  if (id === '0') return
  await removeTv(id)
  await refreshTvs()
}

async function toggleTv(slot: PalcoSlotInfo): Promise<void> {
  if (slot.running) await stopTv(slot.id)
  else await startTv(slot.id)
  await refreshTvs()
}

const aliveSlots = computed(() => {
  void tick.value
  return new Set(getPopupRefs().map((p) => String(p.__popupSlot ?? '')))
})

const slots = computed(() =>
  Array.from({ length: popupCount.value }, (_, i) => ({
    id: String(i + 1),
    alive: aliveSlots.value.has(String(i + 1)),
  })),
)

let pollTimer: ReturnType<typeof setInterval> | null = null
pollTimer = setInterval(() => {
  popupCount.value = getPopupCount()
  tick.value++
  if (desktopConnected.value || relay.connected.value) void refreshTvs()
}, 3000)
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

function addScreen(): void {
  popupCount.value = setPopupCount(popupCount.value + 1)
}

function removeScreen(): void {
  popupCount.value = setPopupCount(popupCount.value - 1)
}

function selectSlot(id: string): void {
  activeId.value = id
}

function toggleSlot(slotId: string): void {
  const n = Number.parseInt(slotId, 10)
  if (aliveSlots.value.has(slotId)) {
    closeScreenPopups()
  } else {
    void openPopupModule('media', { slots: [n] })
  }
}

let timer: ReturnType<typeof setInterval> | null = null
timer = setInterval(() => {
  popupCount.value = getPopupCount()
}, 3000)
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <GlassCard class="palco-slots-card" :padding="false">
    <div class="palco-slots-card__header">
      <div>
        <h3>{{ t('settings.screens.screensOfStage') }}</h3>
        <p>{{ t('settings.screens.screensHint') }}</p>
      </div>
      <button
        type="button"
        class="palco-slots-card__add"
        @click="addScreen"
      >
        <i
          class="ti ti-plus"
          aria-hidden="true"
        />
        {{ t('settings.screens.addScreen') }}
      </button>
    </div>

    <div class="palco-slots-card__list">
      <div
        v-for="slot in slots"
        :key="slot.id"
        class="palco-slot"
        :class="{ 'palco-slot--active': activeId === slot.id }"
      >
        <button
          type="button"
          class="palco-slot__select"
          @click="selectSlot(slot.id)"
        >
          <span
            class="palco-slot__dot"
            :class="{ 'palco-slot__dot--on': slot.alive }"
          />
          <span>
            <strong>{{ slot.id === '1' ? t('settings.screens.mainScreen') : t('settings.screens.screenN', { n: slot.id }) }}</strong>
            <small>{{ t('settings.screens.waitingScreen') }}</small>
          </span>
        </button>
        <span
          v-if="activeId === slot.id"
          class="palco-slot__badge"
        >{{ t('settings.screens.selected') }}</span>
        <button
          type="button"
          class="palco-slot__power"
          :aria-label="slot.alive ? t('settings.palco.stop') : t('settings.screens.openScreen')"
          @click="toggleSlot(slot.id)"
        >
          <i
            class="ti"
            :class="slot.alive ? 'ti-player-stop' : 'ti-player-play'"
            aria-hidden="true"
          />
        </button>
        <button
          v-if="slot.id !== '1'"
          type="button"
          class="palco-slot__remove"
          :aria-label="t('settings.screens.removeScreen')"
          @click="removeScreen"
        >
          <i
            class="ti ti-trash"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <!-- ═══ TVs (desktop OU cloud WT-5c) ═══ -->
    <div
      class="palco-slots-card__tv"
      :class="{ 'palco-slots-card__tv--off': !desktopConnected && !relay.connected.value }"
    >
      <div class="palco-slots-card__tv-head">
        <span class="palco-slots-card__tv-label">
          <i class="ti ti-device-tv" aria-hidden="true" />
          {{ t('settings.palco.tvsPlain') }}
          <span
            class="palco-slot__dot"
            :class="{ 'palco-slot__dot--on': desktopConnected || relay.connected.value }"
          />
        </span>
        <button
          v-if="desktopConnected"
          type="button"
          class="palco-slots-card__add"
          :disabled="!desktopConnected"
          @click="addTv"
        >
          <i class="ti ti-plus" aria-hidden="true" />
          {{ t('settings.palco.addTv') }}
        </button>
      </div>

      <!-- Modo cloud: sem código → criar sessão (gera o código) ou conectar
           numa existente. Com código ativo → exibir código + QR pra TV. -->
      <div
        v-if="cloudMode && !relay.connected.value"
        class="palco-slots-card__cloud"
      >
        <button
          type="button"
          class="palco-slots-card__add"
          :disabled="creatingSession"
          @click="createSession"
        >
          <i class="ti ti-qrcode" aria-hidden="true" />
          {{ t('settings.palco.cloudCreate') }}
        </button>
        <input
          v-model="cloudInput"
          class="palco-slots-card__cloud-input"
          maxlength="6"
          placeholder="ABC123"
          @keydown.enter="connectCloud"
        >
        <button
          type="button"
          class="palco-slots-card__add"
          @click="connectCloud"
        >
          {{ t('settings.palco.cloudConnect') }}
        </button>
      </div>

      <!-- Sessão cloud ativa: código grande + QR pra digitar/scanear na TV -->
      <div
        v-if="cloudMode && relay.connected.value && relay.code.value"
        class="palco-slots-card__cloud-active"
      >
        <img
          v-if="cloudQr"
          :src="cloudQr"
          :alt="t('settings.palco.cloudQrAlt')"
          class="palco-slots-card__cloud-qr"
        >
        <div class="palco-slots-card__cloud-info">
          <small>{{ t('settings.palco.cloudCodeLabel') }}</small>
          <strong class="palco-slots-card__cloud-code">{{ relay.code.value }}</strong>
          <small>{{ t('settings.palco.cloudHowTo') }}</small>
        </div>
        <button
          type="button"
          class="palco-slots-card__remove"
          :aria-label="t('settings.palco.cloudEnd')"
          @click="relay.detach()"
        >
          <i class="ti ti-x" aria-hidden="true" />
        </button>
      </div>

      <div
        v-if="desktopConnected || relay.connected.value"
        class="palco-slots-card__list"
      >
        <div
          v-for="slot in tvSlots"
          :key="slot.id"
          class="palco-slot"
          :class="{ 'palco-slot--active': slot.running }"
        >
          <button
            type="button"
            class="palco-slot__select"
          >
            <span
              class="palco-slot__dot"
              :class="{ 'palco-slot__dot--on': slot.running && slot.clients > 0 }"
            />
            <span>
              <strong>{{ slot.id === '0' ? t('settings.palco.mainTv') : slot.label }}</strong>
              <small>:{{ slot.httpPort }} · {{ slot.clients ? t('settings.palco.connected', { count: slot.clients }) : t('settings.palco.waiting') }}</small>
            </span>
          </button>
          <button
            type="button"
            class="palco-slot__power"
            :aria-label="slot.running ? t('settings.palco.stop') : t('settings.palco.start')"
            @click="toggleTv(slot)"
          >
            <i
              class="ti"
              :class="slot.running ? 'ti-player-stop' : 'ti-player-play'"
              aria-hidden="true"
            />
          </button>
          <button
            v-if="slot.id !== '0'"
            type="button"
            class="palco-slot__remove"
            :aria-label="t('settings.palco.removeTv')"
            @click="removeTvSlot(slot.id)"
          >
            <i class="ti ti-trash" aria-hidden="true" />
          </button>
        </div>
        <p
          v-if="!tvSlots.length"
          class="palco-slots-card__hint"
        >
          {{ t('settings.palco.noSlots') }}
        </p>
      </div>
      <p
        v-if="!desktopConnected && !relay.connected.value"
        class="palco-slots-card__hint"
      >
        {{ t('settings.palco.tvHowTo') }}
      </p>
      <p
        v-if="tvError"
        class="palco-slots-card__error"
        role="alert"
      >
        {{ tvError }}
      </p>
    </div>

    <p class="palco-slots-card__note">
      {{ t('settings.screens.moduleHint') }}
    </p>


    <p class="palco-slots-card__foot">
      {{ t('settings.screens.localNote') }}
    </p>
  </GlassCard>
</template>

<style scoped lang="scss">
.palco-slots-card { overflow: hidden; }
.palco-slots-card__header { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1rem 1.25rem .75rem; }
.palco-slots-card h3 { margin:0; color:var(--ds-color-on-surface); font-size:1rem; }
.palco-slots-card__header p { margin:.2rem 0 0; color:var(--ds-color-on-surface-variant); font-size:.75rem; }
.palco-slots-card__list { display:flex; flex-direction:column; gap:.35rem; padding:.5rem 1.25rem 1rem; }
.palco-slot { display:flex; align-items:center; gap:.5rem; padding:.55rem .65rem; border:1px solid transparent; border-radius:.5rem 0 .5rem 0; background:color-mix(in srgb,var(--ds-color-on-surface) 5%,transparent); }
.palco-slot--active { border-color:color-mix(in srgb,var(--ds-color-primary) 45%,transparent); background:color-mix(in srgb,var(--ds-color-primary) 8%,transparent); }
.palco-slot__select { display:flex; align-items:center; gap:.65rem; min-width:0; flex:1; border:0; background:none; color:var(--ds-color-on-surface); text-align:left; cursor:pointer; }
.palco-slot__select strong,.palco-slot__select small { display:block; }
.palco-slot__select small { margin-top:.15rem; color:var(--ds-color-on-surface-variant); font-size:.7rem; }
.palco-slot__dot { width:.55rem; height:.55rem; flex:none; border-radius:50%; background:var(--ds-color-on-surface-variant); opacity:.45; }
.palco-slot__dot--on { background:#39c56b; opacity:1; box-shadow:0 0 0 3px color-mix(in srgb,#39c56b 18%,transparent); }
.palco-slot__badge { color:var(--ds-color-primary); font-size:.65rem; }
.palco-slot__power { display:flex; align-items:center; justify-content:center; width:1.8rem; height:1.8rem; border:0; border-radius:.35rem; background:transparent; color:var(--ds-color-on-surface-variant); cursor:pointer; }
.palco-slot__power:hover { color:var(--ds-color-primary); background:color-mix(in srgb,var(--ds-color-primary) 12%,transparent); }
.palco-slots-card__add { display:flex; align-items:center; gap:.35rem; padding:.45rem .7rem; border:1px solid color-mix(in srgb,var(--ds-color-primary) 50%,transparent); border-radius:.5rem 0 .5rem 0; background:transparent; color:var(--ds-color-primary); cursor:pointer; font-size:.75rem; }
.palco-slot__remove { display:flex; align-items:center; justify-content:center; width:1.8rem; height:1.8rem; border:0; border-radius:.35rem; background:transparent; color:var(--ds-color-on-surface-variant); cursor:pointer; }
.palco-slot__remove:hover { color:#e65c66; }
.palco-slots-card__tv { display:flex; flex-direction:column; gap:.5rem; padding:.75rem 1.25rem; border-top:1px solid color-mix(in srgb,var(--ds-color-on-surface) 8%,transparent); }
.palco-slots-card__cloud{display:flex;gap:8px;align-items:center;margin:8px 0}
.palco-slots-card__cloud-input{width:110px;padding:8px 10px;border-radius:8px;border:1px solid var(--glass-border,rgba(255,255,255,.2));background:transparent;color:inherit;font:inherit;text-transform:uppercase;letter-spacing:3px;text-align:center}
.palco-slots-card__cloud-active{display:flex;gap:14px;align-items:center;margin:10px 0;padding:12px 14px;border-radius:12px;border:1px solid var(--glass-border,rgba(255,255,255,.15));background:rgba(255,255,255,.04)}
.palco-slots-card__cloud-qr{width:96px;height:96px;border-radius:8px;background:#fff;padding:4px;flex-shrink:0}
.palco-slots-card__cloud-info{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.palco-slots-card__cloud-info small{font-size:.72rem;opacity:.7;color:var(--ds-color-on-surface-variant)}
.palco-slots-card__cloud-code{font-size:1.6rem;font-weight:800;letter-spacing:.35em;color:var(--ds-color-primary);line-height:1.2}
.palco-slots-card__tv--off { opacity:.75; }
.palco-slots-card__tv-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
.palco-slots-card__tv-label { display:inline-flex; align-items:center; gap:.5rem; font-size:.9rem; font-weight:600; color:var(--ds-color-on-surface); }
.palco-slots-card__tv-label .ti-device-tv { color:var(--ds-color-primary); }
.palco-slots-card__tv .palco-slot__select strong { font-size:.86rem; }
.palco-slots-card__note { padding:0 1.25rem .5rem; font-size:.75rem; color:var(--ds-color-on-surface-variant); }


.palco-slots-card__foot { padding:0 1.25rem 1rem; font-size:.7rem; color:var(--ds-color-on-surface-variant); opacity:.75; }
</style>
