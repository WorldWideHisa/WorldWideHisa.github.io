<template>
  <Transition
    enter-active-class="transition-all duration-300"
    enter-from-class="opacity-0 scale-75"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition-all duration-300"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-75"
  >
    <button
      v-if="showButton"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 p-4 rounded-full shadow-md hover:shadow-lg border border-gray-200 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gray-300 z-50"
      aria-label="ページトップに戻る"
    >
      <!-- シンプルな上矢印アイコン -->
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 14l5-5 5 5"
        />
      </svg>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const showButton = ref(false);

const handleScroll = () => {
  showButton.value = window.scrollY > 400;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>
