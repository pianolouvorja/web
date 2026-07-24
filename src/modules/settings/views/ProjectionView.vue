<script setup lang="ts">
</script>

<template>
  <div class="projection-view">
    <PopupScreensCard />
    <ProjectionOptionsCard />
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
