<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  createCustomCollection,
  createCustomLyric,
  createCustomMusic,
  customFileUrl,
  deleteCustomCollection,
  deleteCustomLyric,
  deleteCustomMusic,
  listCustomCollections,
  listCustomMusics,
  updateCustomLyric,
  updateCustomMusic,
  uploadCustomFile,
} from '../services/custom-catalog'
import type { CustomCollectionSummary } from '../services/custom-catalog'
import { buildSlja, parseSlja } from '../../../shared/services/slja'

/**
 * Editor de letras v1 (web)
 * - Lista coletâneas customizadas (Minhas Coletâneas)
 * - Cria coletânea / música / estrofes
 * - Timing por estrofe (time) e background (image_url por estrofe)
 * v1: salvamento direto na API a cada ação (sem draft local)
 */

type EditorLyric = {
  id: number | null
  lyric: string
  time: string
  imageUrl: string
}

type EditorMusic = {
  id: number
  name: string
  lyrics: EditorLyric[]
}

const router = useRouter()

const collections = ref<CustomCollectionSummary[]>([])
const selectedCollectionId = ref<number | null>(null)
const musics = ref<Array<{ id: number; name: string }>>([])
const selectedMusicId = ref<number | null>(null)
const musicName = ref('')
const lyrics = ref<EditorLyric[]>([])
const loading = ref(false)
const saving = ref(false)
const statusMessage = ref('')
const newCollectionName = ref('')
const newMusicName = ref('')
/** Assets de imagem upados no último import .slja (path → url) */
const uploadedAssets = ref<Array<{ path: string; url: string; idFile: number }>>([])

const hasSelection = computed(() => selectedMusicId.value != null)

async function refreshCollections(): Promise<void> {
  loading.value = true
  try {
    collections.value = await listCustomCollections()
  } finally {
    loading.value = false
  }
}

async function onCollectionChange(): Promise<void> {
  selectedMusicId.value = null
  lyrics.value = []
  musicName.value = ''
  if (selectedCollectionId.value == null) {
    musics.value = []
    return
  }
  loading.value = true
  try {
    musics.value = await listCustomMusics(selectedCollectionId.value)
  } finally {
    loading.value = false
  }
}

async function onCreateCollection(): Promise<void> {
  const name = newCollectionName.value.trim()
  if (!name) return
  saving.value = true
  try {
    const result = await createCustomCollection(name)
    if (result) {
      newCollectionName.value = ''
      await refreshCollections()
      selectedCollectionId.value = result.id
      await onCollectionChange()
      statusMessage.value = 'Coletânea criada'
    } else {
      statusMessage.value = 'Falha ao criar coletânea (API indisponível?)'
    }
  } finally {
    saving.value = false
  }
}

async function onCreateMusic(): Promise<void> {
  const name = newMusicName.value.trim()
  if (!name || selectedCollectionId.value == null) return
  saving.value = true
  try {
    const result = await createCustomMusic(selectedCollectionId.value, { name })
    if (result) {
      newMusicName.value = ''
      await onCollectionChange()
      selectedMusicId.value = result.id
      musicName.value = name
      lyrics.value = []
      statusMessage.value = 'Música criada'
    } else {
      statusMessage.value = 'Falha ao criar música'
    }
  } finally {
    saving.value = false
  }
}

async function onAddStanza(): Promise<void> {
  if (selectedMusicId.value == null) return
  saving.value = true
  try {
    const result = await createCustomLyric(selectedMusicId.value, {
      lyric: 'Nova estrofe',
      time: '00:00',
    })
    if (result) {
      lyrics.value.push({ id: result.id, lyric: 'Nova estrofe', time: '00:00', imageUrl: '' })
      statusMessage.value = 'Estrofe adicionada'
    } else {
      statusMessage.value = 'Falha ao adicionar estrofe'
    }
  } finally {
    saving.value = false
  }
}

async function onSaveStanza(index: number): Promise<void> {
  const stanza = lyrics.value[index]
  if (stanza?.id == null) return
  saving.value = true
  try {
    const ok = await updateCustomLyric(stanza.id, {
      lyric: stanza.lyric,
      time: stanza.time,
    })
    statusMessage.value = ok ? 'Estrofe salva' : 'Falha ao salvar estrofe'
  } finally {
    saving.value = false
  }
}

async function onSelectMusic(id: number): Promise<void> {
  selectedMusicId.value = id
  loading.value = true
  statusMessage.value = ''
  try {
    const response = await fetch(`/v1/custom/musics/${id}`)
    if (response.ok) {
      const data = (await response.json()) as {
        name: string
        audio_url?: string | null
        lyrics?: Array<{
          id_lyric: number
          lyric: string
          time: string
          image_url?: string | null
        }>
      }
      musicName.value = data.name
      lyrics.value = (data.lyrics ?? []).map((row) => ({
        id: row.id_lyric,
        lyric: row.lyric,
        time: row.time?.slice(0, 5) ?? '00:00',
        imageUrl: row.image_url ?? '',
      }))
      loadAudioForMusic(data.audio_url ?? null)
    } else {
      statusMessage.value = 'Falha ao carregar música'
    }
  } catch {
    statusMessage.value = 'API indisponível'
  } finally {
    loading.value = false
  }
}

function onBack(): void {
  void router.push('/media')
}

/* ---------- Import / Export .slja ---------- */

const fileInputEl = ref<HTMLInputElement | null>(null)

function onImportSlja(): void {
  fileInputEl.value?.click()
}

async function onImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  loading.value = true
  statusMessage.value = ''
  try {
    const buffer = await file.arrayBuffer()
    const archive = await parseSlja(buffer)

    // Nome da música: título do arquivo .slja, mas ignora fallbacks genéricos do
    // parser (v<versao> / "Sem título") — nesses casos usa o nome do arquivo.
    const genericTitle = /^v[\d.]+$/.test(archive.title?.trim() ?? '') || !archive.title?.trim()
    const name = genericTitle
      ? file.name.replace(/\.slja$/i, '')
      : archive.title.trim()

    // Garante coletânea de importação: reaproveita a primeira "Importações .slja"
    // existente; só cria se ainda não houver nenhuma.
    let collectionId = selectedCollectionId.value
    if (collectionId == null) {
      const existing = collections.value.find((c) => c.name === 'Importações .slja')
      if (existing) {
        collectionId = existing.id
      } else {
        const created = await createCustomCollection('Importações .slja')
        if (!created) {
          statusMessage.value = 'Falha ao criar coletânea de importação'
          return
        }
        collectionId = created.id
      }
      await refreshCollections()
      selectedCollectionId.value = collectionId
    }

    const createdMusic = await createCustomMusic(collectionId, { name })
    if (!createdMusic) {
      statusMessage.value = 'Falha ao criar música a partir do .slja'
      return
    }
    selectedMusicId.value = createdMusic.id
    musicName.value = name
    lyrics.value = []

    // Upload de mídia embutida no .slja (áudio + imagens de fundo).
    // Falha de upload não aborta o import — segue só com texto.
    if (archive.audio?.bytes?.length) {
      const audio = await uploadCustomFile(
        archive.audio.bytes,
        archive.audio.name,
        'audio',
      )
      if (audio) {
        await updateCustomMusic(createdMusic.id, { id_file_audio: audio.idFile })
        statusMessage.value = `Importado: ${file.name} (com áudio)`
      } else {
        statusMessage.value = `Importado: ${file.name} (áudio falhou no upload)`
      }
    }
    if (archive.assets?.length) {
      const uploaded: Array<{ path: string; url: string; idFile: number }> = []
      for (const asset of archive.assets) {
        const up = await uploadCustomFile(asset.bytes, asset.path, 'imagens')
        if (up) uploaded.push({ path: asset.path, url: up.url, idFile: up.idFile })
      }
      uploadedAssets.value = uploaded
    }

    /** imageUrl → id_file, pro createCustomLyric (API espera id, não url) */
    const imageIdByUrl = new Map(uploadedAssets.value.map((a) => [a.url, a.idFile]))

    // CAPA vira estrofe 1 (se tiver texto), demais slides na ordem
    const slides = [...archive.slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    for (const slide of slides) {
      const text = slide.lyric.trim()
      if (!text) continue
      // Background do slide: se o .slja referencia imagem, usa a URL upada
      let imageUrl = ''
      if (slide.image?.name && uploadedAssets.value.length) {
        const match = uploadedAssets.value.find((a) =>
          slide.image!.name.toLowerCase().includes(a.path.toLowerCase())
          || a.path.toLowerCase().includes(slide.image!.name.toLowerCase()),
        )
        if (match) imageUrl = match.url
      }
      const created = await createCustomLyric(createdMusic.id, {
        lyric: text,
        time: formatMsAsTime(slide.timeMs),
        id_file_image: imageIdByUrl.get(imageUrl),
      })
      if (created) {
        lyrics.value.push({
          id: created.id,
          lyric: text,
          time: formatMsAsTime(slide.timeMs),
          imageUrl,
        })
      }
    }
    if (!statusMessage.value) {
      statusMessage.value = `Importado: ${slides.filter((s) => s.lyric.trim()).length} estrofes de ${file.name}`
    }
  } catch (error) {
    console.error('Falha ao importar .slja', error)
    statusMessage.value = 'Arquivo .slja inválido'
  } finally {
    loading.value = false
  }
}

/** ms -> HH:MM[:SS] para o input[type=time] */
function formatMsAsTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return s !== '00' ? `${h}:${m}:${s}` : `${h}:${m}`
}

async function onExportSlja(): Promise<void> {
  if (selectedMusicId.value == null || lyrics.value.length === 0) return
  saving.value = true
  statusMessage.value = ''
  try {
    const slides = lyrics.value.map((stanza, index) => ({
      lyric: stanza.lyric,
      auxiliaryLyric: '',
      type: (index === 0 ? 'CAPA' : 'LETRA') as 'CAPA' | 'LETRA',
      timeMs: timeToMs(stanza.time),
      order: index + 1,
    }))
    const archive = {
      title: musicName.value || 'Sem título',
      version: 'piano-web-editor',
      slides,
    }
    const buffer = await buildSlja(archive as never)
    const blob = new Blob([buffer], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${musicName.value || 'apresentacao'}.slja`
    anchor.click()
    URL.revokeObjectURL(url)
    statusMessage.value = 'Exportado com sucesso'
  } catch (error) {
    console.error('Falha ao exportar .slja', error)
    statusMessage.value = 'Falha ao exportar .slja'
  } finally {
    saving.value = false
  }
}

/** HH:MM[:SS] -> ms */
function timeToMs(time: string): number {
  const parts = time.split(':').map((part) => Number.parseInt(part, 10) || 0)
  // "HH:MM:SS" (3 partes) OU "MM:SS" (2 partes, formato do .slja/DB) — nunca HH:MM
  if (parts.length === 3) return (parts[0]! * 3600 + parts[1]! * 60 + parts[2]!) * 1000
  if (parts.length === 2) return (parts[0]! * 60 + parts[1]!) * 1000
  return 0
}

/* ---------- Deleção (coletânea / música / estrofe) ---------- */

async function onDeleteCollection(): Promise<void> {
  const id = selectedCollectionId.value
  const current = collections.value.find((c) => c.id === id)
  if (id == null || !current) return
  if (!window.confirm(`Excluir a coletânea "${current.name}" e TODAS as suas músicas?`)) return
  saving.value = true
  try {
    if (await deleteCustomCollection(id)) {
      selectedMusicId.value = null
      selectedCollectionId.value = null
      lyrics.value = []
      musicName.value = ''
      await refreshCollections()
      statusMessage.value = `Coletânea "${current.name}" excluída`
    } else {
      statusMessage.value = 'Falha ao excluir coletânea'
    }
  } finally {
    saving.value = false
  }
}

async function onDeleteMusic(): Promise<void> {
  const id = selectedMusicId.value
  if (id == null) return
  if (!window.confirm(`Excluir a música "${musicName.value}"?`)) return
  saving.value = true
  try {
    if (await deleteCustomMusic(id)) {
      selectedMusicId.value = null
      lyrics.value = []
      musicName.value = ''
      await refreshMusics()
      statusMessage.value = 'Música excluída'
    } else {
      statusMessage.value = 'Falha ao excluir música'
    }
  } finally {
    saving.value = false
  }
}

async function onDeleteStanza(index: number): Promise<void> {
  const stanza = lyrics.value[index]
  if (!stanza) return
  if (!window.confirm('Excluir esta estrofe?')) return
  saving.value = true
  try {
    if (stanza.id != null && !(await deleteCustomLyric(stanza.id))) {
      statusMessage.value = 'Falha ao excluir estrofe'
      return
    }
    lyrics.value.splice(index, 1)
    statusMessage.value = 'Estrofe excluída'
  } finally {
    saving.value = false
  }
}

/* ---------- Player de áudio + sync manual ---------- */

const audioEl = ref<HTMLAudioElement | null>(null)
const audioUrl = ref<string | null>(null)
const audioSrc = ref<string | null>(null)
const isPlaying = ref(false)
const currentTimeMs = ref(0)
const activeStanzaIndex = ref(-1)

/** Índice da estrofe ativa no tempo atual (última com time <= currentTime). */
const computedActiveIndex = computed(() => {
  let active = -1
  for (let i = 0; i < lyrics.value.length; i++) {
    if (timeToMs(lyrics.value[i]!.time) <= currentTimeMs.value) active = i
    else break
  }
  return active
})

function syncStanzaHighlight(): void {
  activeStanzaIndex.value =
    activeStanzaIndexOverride.value !== null
      ? activeStanzaIndexOverride.value
      : computedActiveIndex.value
}

/** Override manual: marcar estrofe no momento do play (botão "Marcar aqui") */
const activeStanzaIndexOverride = ref<number | null>(null)

function timeLabelOf(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function onAudioPlay(): void {
  isPlaying.value = true
}

function onAudioPause(): void {
  isPlaying.value = false
}

function onAudioTimeUpdate(): void {
  const el = audioEl.value
  if (!el) return
  currentTimeMs.value = el.currentTime * 1000
  syncStanzaHighlight()
}

/** Marca o timing da estrofe com o instante atual do áudio (sync manual) */
async function onMarkStanzaTime(index: number): Promise<void> {
  const stanza = lyrics.value[index]
  if (!stanza) return
  stanza.time = timeLabelOf(currentTimeMs.value)
  await onSaveStanza(index)
}

/** Salta o áudio pro instante da estrofe */
function onSeekToStanza(index: number): void {
  const el = audioEl.value
  const stanza = lyrics.value[index]
  if (!el || !stanza) return
  el.currentTime = timeToMs(stanza.time) / 1000
  activeStanzaIndexOverride.value = index
  syncStanzaHighlight()
}

/** Preview: entra em modo preview mostrando a estrofe ativa como no /media */
const isPreviewMode = ref(false)
const activeStanza = computed(() =>
  isPreviewMode.value ? lyrics.value[activeStanzaIndex.value] ?? null : null,
)

function onTogglePreview(): void {
  isPreviewMode.value = !isPreviewMode.value
  if (!isPreviewMode.value) activeStanzaIndexOverride.value = null
}

/** Carrega o áudio vinculado à música (audio_url da API) */
function loadAudioForMusic(audioPath: string | null): void {
  audioSrc.value = audioPath ? customFileUrl(audioPath) : null
  audioUrl.value = audioPath
  currentTimeMs.value = 0
  activeStanzaIndex.value = -1
  activeStanzaIndexOverride.value = null
  isPreviewMode.value = false
}

onMounted(() => {
  void refreshCollections()
})
</script>

<template>
  <section class="editor">
    <header class="editor__toolbar">
      <button
        type="button"
        class="editor__btn"
        @click="onBack"
      >
        <i
          class="ti ti-arrow-left"
          aria-hidden="true"
        />
        Voltar
      </button>
      <h1 class="editor__title">
        Editor de Letras
      </h1>
      <input
        ref="fileInputEl"
        type="file"
        accept=".slja"
        class="editor__file-input"
        @change="onImportFile"
      >
      <button
        type="button"
        class="editor__btn"
        title="Importar arquivo .slja (LouvorJA Delphi)"
        @click="onImportSlja"
      >
        <i
          class="ti ti-file-import"
          aria-hidden="true"
        />
        Importar .slja
      </button>
      <button
        type="button"
        class="editor__btn"
        :disabled="!hasSelection || lyrics.length === 0"
        title="Exportar música atual como .slja"
        @click="onExportSlja"
      >
        <i
          class="ti ti-file-export"
          aria-hidden="true"
        />
        Exportar .slja
      </button>
      <span
        v-if="statusMessage"
        class="editor__status"
        role="status"
      >{{ statusMessage }}</span>
    </header>

    <div class="editor__body">
      <aside class="editor__aside">
        <h2 class="editor__section-title">
          Coletâneas
        </h2>
        <div class="editor__row">
          <input
            v-model="newCollectionName"
            type="text"
            class="editor__input"
            placeholder="Nova coletânea…"
            @keyup.enter="onCreateCollection"
          >
          <button
            type="button"
            class="editor__btn"
            :disabled="saving || !newCollectionName.trim()"
            @click="onCreateCollection"
          >
            <i
              class="ti ti-plus"
              aria-hidden="true"
            />
          </button>
        </div>
        <ul class="editor__list">
          <li
            v-for="collection in collections"
            :key="collection.id"
          >
            <button
              type="button"
              class="editor__list-item"
              :class="{ 'editor__list-item--active': collection.id === selectedCollectionId }"
              @click="selectedCollectionId = collection.id; onCollectionChange()"
            >
              {{ collection.name }}
              <span class="editor__count">{{ collection.musicsCount }}</span>
            </button>
          </li>
        </ul>
        <button
          v-if="selectedCollectionId != null"
          type="button"
          class="editor__btn editor__btn--danger"
          :disabled="saving"
          title="Excluir coletânea selecionada"
          @click="onDeleteCollection"
        >
          <i
            class="ti ti-trash"
            aria-hidden="true"
          />
          Excluir coletânea
        </button>
        <p
          v-if="!loading && collections.length === 0"
          class="editor__hint"
        >
          Nenhuma coletânea ainda. Crie a primeira acima.
        </p>

        <template v-if="selectedCollectionId != null">
          <h2 class="editor__section-title">
            Músicas
          </h2>
          <div class="editor__row">
            <input
              v-model="newMusicName"
              type="text"
              class="editor__input"
              placeholder="Nova música…"
              @keyup.enter="onCreateMusic"
            >
            <button
              type="button"
              class="editor__btn"
              :disabled="saving || !newMusicName.trim()"
              @click="onCreateMusic"
            >
              <i
                class="ti ti-plus"
                aria-hidden="true"
              />
            </button>
          </div>
          <ul class="editor__list">
            <li
              v-for="music in musics"
              :key="music.id"
            >
              <button
                type="button"
                class="editor__list-item"
                :class="{ 'editor__list-item--active': music.id === selectedMusicId }"
                @click="onSelectMusic(music.id)"
              >
                {{ music.name }}
              </button>
            </li>
          </ul>
          <button
            v-if="selectedMusicId != null"
            type="button"
            class="editor__btn editor__btn--danger"
            :disabled="saving"
            title="Excluir música selecionada"
            @click="onDeleteMusic"
          >
            <i
              class="ti ti-trash"
              aria-hidden="true"
            />
            Excluir música
          </button>
        </template>
      </aside>

      <div class="editor__main">
        <template v-if="hasSelection">
          <div class="editor__music-head">
            <h2 class="editor__section-title">
              {{ musicName || 'Música' }}
            </h2>
            <button
              v-if="audioSrc"
              type="button"
              class="editor__btn"
              :class="{ 'editor__btn--active': isPreviewMode }"
              title="Alternar preview (mostra o slide ativo como no player)"
              @click="onTogglePreview"
            >
              <i
                class="ti ti-eye"
                aria-hidden="true"
              />
              Preview
            </button>
          </div>

          <!-- Player de áudio (aparece se a música tem áudio vinculado) -->
          <div
            v-if="audioSrc"
            class="editor__player"
          >
            <audio
              ref="audioEl"
              class="editor__audio"
              controls
              :src="audioSrc"
              preload="metadata"
              @play="onAudioPlay"
              @pause="onAudioPause"
              @timeupdate="onAudioTimeUpdate"
            />
            <span class="editor__player-time">{{ timeLabelOf(currentTimeMs) }}</span>
          </div>
          <p
            v-else
            class="editor__hint"
          >
            Esta música não tem áudio vinculado. Importe um .slja com áudio ou o áudio
            ficará disponível na próxima importação.
          </p>

          <!-- Preview estilo /media: slide ativo em fullscreen simulado -->
          <div
            v-if="isPreviewMode && activeStanza"
            class="editor__preview"
          >
            <div
              class="editor__preview-slide"
              :style="activeStanza.imageUrl
                ? { backgroundImage: `url(${customFileUrl(activeStanza.imageUrl)})` }
                : { backgroundColor: '#000' }"
            >
              <span class="editor__preview-text">{{ activeStanza.lyric }}</span>
            </div>
          </div>

          <ul
            v-else
            class="editor__stanzas"
          >
            <li
              v-for="(stanza, index) in lyrics"
              :key="stanza.id ?? index"
              class="editor__stanza"
              :class="{ 'editor__stanza--active': index === activeStanzaIndex && isPlaying }"
            >
              <div class="editor__stanza-head">
                <span class="editor__stanza-index">#{{ index + 1 }}</span>
                <label class="editor__time-label">
                  Timing
                  <input
                    v-model="stanza.time"
                    type="time"
                    class="editor__input editor__input--time"
                    step="1"
                  >
                </label>
                <button
                  v-if="audioSrc"
                  type="button"
                  class="editor__btn editor__btn--mark"
                  :disabled="saving || !isPlaying"
                  title="Marcar o instante atual do áudio como timing desta estrofe"
                  @click="onMarkStanzaTime(index)"
                >
                  <i
                    class="ti ti-point-filled"
                    aria-hidden="true"
                  />
                  Marcar
                </button>
                <button
                  type="button"
                  class="editor__btn editor__btn--save"
                  :disabled="saving"
                  @click="onSaveStanza(index)"
                >
                  <i
                    class="ti ti-device-floppy"
                    aria-hidden="true"
                  />
                  Salvar
                </button>
                <button
                  type="button"
                  class="editor__btn editor__btn--danger editor__btn--icon"
                  :disabled="saving"
                  title="Excluir estrofe"
                  @click="onDeleteStanza(index)"
                >
                  <i
                    class="ti ti-trash"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <textarea
                v-model="stanza.lyric"
                class="editor__textarea"
                rows="4"
                placeholder="Letra da estrofe…"
                @dblclick="onSeekToStanza(index)"
              />
              <label class="editor__bg-label">
                Background (URL da imagem)
                <input
                  v-model="stanza.imageUrl"
                  type="url"
                  class="editor__input"
                  placeholder="https://…/imagem.jpg"
                >
              </label>
            </li>
          </ul>
          <button
            type="button"
            class="editor__btn editor__btn--add"
            :disabled="saving"
            @click="onAddStanza"
          >
            <i
              class="ti ti-plus"
              aria-hidden="true"
            />
            Nova estrofe
          </button>
        </template>
        <p
          v-else
          class="editor__empty"
        >
          Selecione uma música à esquerda para editar as estrofes, timing e background.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 1rem;
  gap: 1rem;
}

.editor__toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editor__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.editor__status {
  font-size: 0.85rem;
  opacity: 0.75;
}

.editor__file-input {
  display: none;
}

.editor__body {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
}

.editor__aside {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
}

.editor__main {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

.editor__section-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0.75rem 0 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.85;
}

.editor__row {
  display: flex;
  gap: 0.375rem;
}

.editor__input {
  flex: 1;
  min-width: 0;
  padding: 0.375rem 0.5rem;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
}

.editor__input--time {
  flex: 0 0 auto;
  width: 7.5rem;
}

.editor__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
}

.editor__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor__btn--save {
  margin-left: auto;
}

.editor__btn--add {
  margin-top: 0.75rem;
}

.editor__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.editor__list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.editor__list-item:hover {
  background: rgba(128, 128, 128, 0.12);
}

.editor__list-item--active {
  background: rgba(128, 128, 128, 0.2);
  border-color: rgba(128, 128, 128, 0.35);
}

.editor__count {
  font-size: 0.75rem;
  opacity: 0.6;
}

.editor__hint,
.editor__empty {
  font-size: 0.875rem;
  opacity: 0.6;
}

.editor__stanzas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor__stanza {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 8px;
}

.editor__stanza-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.editor__stanza-index {
  font-weight: 600;
  font-size: 0.875rem;
}

.editor__time-label,
.editor__bg-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  opacity: 0.85;
}

.editor__bg-label {
  flex-direction: column;
  align-items: stretch;
}

.editor__textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  resize: vertical;
}

@media (max-width: 768px) {
  .editor__body {
    flex-direction: column;
  }

  .editor__aside {
    width: 100%;
  }
}

.editor__music-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.editor__player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
}

.editor__audio {
  flex: 1;
  height: 36px;
}

.editor__player-time {
  font-variant-numeric: tabular-nums;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  min-width: 52px;
}

.editor__btn--active {
  background: var(--color-primary);
  color: #fff;
}

.editor__btn--danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}
.editor__btn--danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

.editor__btn--mark {
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
  border-color: rgba(99, 102, 241, 0.3);
}
.editor__btn--mark:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.25);
}
.editor__btn--mark:disabled {
  opacity: 0.4;
}

.editor__btn--icon {
  padding: 0.35rem 0.5rem;
  line-height: 1;
}

.editor__stanzas {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editor__stanza {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.5rem;
  transition: border-color 0.15s, background 0.15s;
}

.editor__stanza--active {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.08);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.editor__stanza-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.editor__stanza-index {
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 2.5rem;
}

.editor__time-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.editor__input--time {
  width: 80px;
}

.editor__textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
}

.editor__bg-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.editor__bg-label input {
  padding: 0.35rem 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: var(--color-text);
  font-size: 0.8rem;
}

.editor__preview {
  position: relative;
  height: 100%;
  min-height: 400px;
  border-radius: 0.5rem;
  overflow: hidden;
}

.editor__preview-slide {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  padding: 2rem;
}

.editor__preview-text {
  max-width: 90%;
  text-align: center;
  color: #fff;
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1.3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  white-space: pre-wrap;
}
</style>
