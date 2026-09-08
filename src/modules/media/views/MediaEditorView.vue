<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  createCustomCollection,
  createCustomLyric,
  createCustomMusic,
  listCustomCollections,
  listCustomMusics,
  updateCustomLyric,
} from '../services/custom-catalog'
import type { CustomCollectionSummary } from '../services/custom-catalog'

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
        </template>
      </aside>

      <div class="editor__main">
        <template v-if="hasSelection">
          <h2 class="editor__section-title">
            {{ musicName || 'Música' }}
          </h2>
          <ul class="editor__stanzas">
            <li
              v-for="(stanza, index) in lyrics"
              :key="stanza.id ?? index"
              class="editor__stanza"
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
              </div>
              <textarea
                v-model="stanza.lyric"
                class="editor__textarea"
                rows="4"
                placeholder="Letra da estrofe…"
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
</style>
