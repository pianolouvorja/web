<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import {
  DEFAULT_LITURGY_WEB_RUNTIME,
  LITURGY_WEB_RUNTIME_CHANNEL,
  LITURGY_WEB_RUNTIME_STORAGE_KEY,
  normalizeLiturgyWebRuntime,
  readLiturgyWebRuntimeFromStorage,
  type LiturgyWebProjectionRuntime,
} from '../services/liturgy-web-runtime'

const runtime = ref<LiturgyWebProjectionRuntime>({
  ...DEFAULT_LITURGY_WEB_RUNTIME,
})
const imageIndex = ref(0)
let runtimeChannel: BroadcastChannel | null = null
let imageTimer: ReturnType<typeof setInterval> | null = null

const showContent = computed(
  () => runtime.value.active && Boolean(runtime.value.url),
)

const imageUrls = computed(() => {
  if (runtime.value.kind !== 'image') return []
  return runtime.value.urls.length > 0
    ? runtime.value.urls
    : runtime.value.url
      ? [runtime.value.url]
      : []
})

const currentImage = computed(
  () => imageUrls.value[imageIndex.value] ?? imageUrls.value[0] ?? '',
)

const frameSrc = computed(() => {
  if (!showContent.value) return ''
  const url = runtime.value.url
  if (runtime.value.kind === 'video' || runtime.value.kind === 'image') {
    return ''
  }
  if (runtime.value.kind === 'pdf') return url
  if (runtime.value.kind !== 'youtube') return url

  try {
    const parsed = new URL(url)
    parsed.searchParams.set('autoplay', '1')
    parsed.searchParams.set('controls', '1')
    parsed.searchParams.set('rel', '0')
    parsed.searchParams.set('fs', '1')
    parsed.searchParams.set('playsinline', '1')
    parsed.searchParams.set('modestbranding', '1')
    parsed.searchParams.delete('mute')
    parsed.searchParams.delete('controls')
    parsed.searchParams.set('controls', '1')
    return parsed.toString()
  } catch {
    return url
  }
})

function ensureReferrerMeta() {
  const existing = document.querySelector('meta[name="referrer"]')
  if (existing) {
    existing.setAttribute('content', 'strict-origin-when-cross-origin')
    return
  }
  const meta = document.createElement('meta')
  meta.name = 'referrer'
  meta.content = 'strict-origin-when-cross-origin'
  document.head.appendChild(meta)
}

function stopImageRotation() {
  if (imageTimer != null) {
    clearInterval(imageTimer)
    imageTimer = null
  }
}

function startImageRotation() {
  stopImageRotation()
  imageIndex.value = 0
  if (imageUrls.value.length <= 1) return
  imageTimer = setInterval(() => {
    imageIndex.value = (imageIndex.value + 1) % imageUrls.value.length
  }, 8000)
}

function refreshRuntime() {
  runtime.value = readLiturgyWebRuntimeFromStorage()
  if (runtime.value.kind === 'image') {
    startImageRotation()
  } else {
    stopImageRotation()
  }
}

function onStorage(event: StorageEvent) {
  if (event.key === LITURGY_WEB_RUNTIME_STORAGE_KEY) {
    refreshRuntime()
  }
}

function onRuntimeMessage(event: MessageEvent<unknown>) {
  runtime.value = normalizeLiturgyWebRuntime(event.data)
  if (runtime.value.kind === 'image') {
    startImageRotation()
  } else {
    stopImageRotation()
  }
}

onMounted(() => {
  ensureReferrerMeta()
  refreshRuntime()
  window.addEventListener('storage', onStorage)

  try {
    runtimeChannel = new BroadcastChannel(LITURGY_WEB_RUNTIME_CHANNEL)
    runtimeChannel.addEventListener('message', onRuntimeMessage)
  } catch {
    runtimeChannel = null
  }
})

onUnmounted(() => {
  window.removeEventListener('storage', onStorage)
  stopImageRotation()
  runtimeChannel?.removeEventListener('message', onRuntimeMessage)
  runtimeChannel?.close()
  runtimeChannel = null
})
</script>

<template>
  <div class="liturgy-web-projection">
    <video
      v-if="showContent && runtime.kind === 'video'"
      :key="runtime.url"
      class="liturgy-web-projection__media"
      :src="runtime.url"
      :title="runtime.title || 'Projeção'"
      autoplay
      controls
      playsinline
    />
    <img
      v-else-if="showContent && runtime.kind === 'image' && currentImage"
      :key="currentImage"
      class="liturgy-web-projection__media"
      :src="currentImage"
      :alt="runtime.title || 'Projeção'"
    >
    <iframe
      v-else-if="showContent && frameSrc"
      :key="frameSrc"
      class="liturgy-web-projection__frame"
      :src="frameSrc"
      :title="runtime.title || 'Projeção'"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
      loading="eager"
    />
    <div
      v-else
      class="liturgy-web-projection__empty"
    />
  </div>
</template>

<style scoped lang="scss">
.liturgy-web-projection {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.liturgy-web-projection__frame,
.liturgy-web-projection__media {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #000;
  object-fit: contain;
}

.liturgy-web-projection__empty {
  width: 100%;
  height: 100%;
  background: #000;
}
</style>
