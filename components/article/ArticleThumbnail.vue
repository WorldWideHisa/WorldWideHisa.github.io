<template>
  <div class="w-24 h-24 bg-gray-200 rounded overflow-hidden">
    <!-- リンクがある場合はNuxtLinkでラップ -->
    <nuxt-link v-if="to" :to="to" class="block w-full h-full">
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
    </nuxt-link>

    <!-- リンクがない場合は従来通り -->
    <template v-else>
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
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  src?: string;
  alt?: string;
  to?: string; // 記事ページへのパス（_path）
}>();
</script>
