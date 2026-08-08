<script setup lang="ts">
import { RouterView } from 'vue-router'

import EulaDialog from '@shared/components/EulaDialog.vue'
import { useEula } from '@shared/composables/useEula'

const { isAccepted } = useEula()
</script>

<template>
  <EulaDialog v-if="!isAccepted" />
  <RouterView v-show="isAccepted" />
</template>
