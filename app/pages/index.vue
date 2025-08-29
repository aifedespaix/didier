<script setup lang="ts">
import ThreeViewport from '~/features/three/ThreeViewport.vue'

definePageMeta({
  layout: 'default',
})

const online = useOnline()
</script>

<template>
    <ClientOnly>
      <ThreeViewport class="h-full w-full" />
    </ClientOnly>
</template>
