<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import EulaDialog from '@shared/components/EulaDialog.vue'
import { useEula } from '@shared/composables/useEula'

const { isAccepted } = useEula()

// WT-5G: popup de projeção NÃO passa pelo gate legal. O aceite é da janela
// do operador (perfil/sessionStorage é por aba em alguns contextos); popup
// recém-aberta sem flag própria ficava presa no EULA = tela branca/preta.
const isPopupWindow = computed(
  () =>
    window.name.startsWith('PopupWindow') ||
    window.name === 'LiturgyWebControl' ||
    route.path.startsWith('/popup'),
)
const route = useRoute()
const showEula = computed(() => !isAccepted.value && !isPopupWindow.value)
const showApp = computed(() => isAccepted.value || isPopupWindow.value)
</script>

<template>
  <EulaDialog v-if="showEula" />
  <RouterView v-if="showApp" />
</template>
