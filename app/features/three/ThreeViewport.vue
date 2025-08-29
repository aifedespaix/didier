<script setup lang="ts">
import type { ThreeApp } from './threeApp'
import { onMounted, onUnmounted, ref } from 'vue'
import { createThreeApp } from './threeApp'
import { useKeybindStore } from '@/stores/keybinds'

const container = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let app: ThreeApp | null = null

onMounted(() => {
  if (canvas.value && container.value)
    app = createThreeApp(canvas.value, container.value, useKeybindStore().bindings)
})

onUnmounted(() => {
  app?.dispose()
  app = null
})
</script>

<template>
  <div ref="container" class="w-full h-full relative">
    <canvas ref="canvas" class="block w-full h-full" />
  </div>
</template>
