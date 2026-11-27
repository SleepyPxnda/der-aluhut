<script setup lang="ts">
const { me } = await useGame()
</script>

<template>
  <p class="say note raised"><strong>Danke fürs Mitspielen, {{ me?.name }}!</strong></p>
</template>
