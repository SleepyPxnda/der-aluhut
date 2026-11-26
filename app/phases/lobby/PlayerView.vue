<script setup lang="ts">
const { me } = await useGame()
</script>

<template>
  <p class="say note raised"><strong>Hallo, {{ me?.name }}!</strong>Gleich geht's los.</p>
</template>
