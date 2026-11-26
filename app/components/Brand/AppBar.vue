<script setup lang="ts">
defineProps<{ title: string; tag: string }>()
</script>

<template>
  <header class="bar">
    <BrandAluhutHat class="hat" />
    {{ title }}
    <small>{{ tag }}</small>
  </header>
</template>
