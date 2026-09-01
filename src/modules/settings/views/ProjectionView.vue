<script setup lang="ts">
import ScreensCard from '../components/ScreensCard.vue'
import ProjectionOptionsCard from '../components/ProjectionOptionsCard.vue'
import StageCustomizationCard from '../components/StageCustomizationCard.vue'
</script>

<template>
  <div class="projection-view">
    <ScreensCard />
    <ProjectionOptionsCard />
    <StageCustomizationCard only-scope="global" />
  </div>
</template>

<style scoped lang="scss">
.projection-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 37.5rem;
  margin: 0 auto;
  padding-bottom: 1rem;
}
</style>
