<script setup lang="ts">
import { onMounted, provide } from 'vue';
import { RouterView } from 'vue-router';
// import { translate, TRANSLATE } from './utils/translate';

// provide(TRANSLATE, translate);

onMounted(() => {
  if (globalThis.__deregisterInitializationErrorHandling) {
    globalThis.__deregisterInitializationErrorHandling();
  }
});
</script>

<template>
  <RouterView/>
</template>
