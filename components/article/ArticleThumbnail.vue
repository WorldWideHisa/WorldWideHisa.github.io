<template>
  <div class="w-24 h-24 bg-gray-200 rounded overflow-hidden">
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="w-full h-full object-cover"
    />
    <div
      v-else
      class="w-full h-full flex items-center justify-center text-gray-400"
    >
      No Image
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  src?: string;
  alt?: string;
}>();
</script>
