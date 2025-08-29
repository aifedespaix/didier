<script setup lang="ts">
import ThreeViewport from '~/features/three/ThreeViewport.vue'

definePageMeta({
  layout: 'home',
})

const online = useOnline()
</script>

<template>
  <div>
    <Logos mb-6 />
    <ClientOnly>
      <Suspense>
        <PageView v-if="online" />
        <div v-else text-gray:80>
          You're offline
        </div>
        <template #fallback>
          <div op50 italic>
            <span animate-pulse>Loading...</span>
          </div>
        </template>
      </Suspense>
      <template #fallback>
        <div op50>
          <span animate-pulse>...</span>
        </div>
      </template>
    </ClientOnly>
    <InputEntry />
    <ClientOnly>
      <ThreeViewport class="mt-8 h-80 w-full" />
    </ClientOnly>
  </div>
</template>
