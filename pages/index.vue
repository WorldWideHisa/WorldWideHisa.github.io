<template>
  <div class="bg-gray-50 min-h-screen flex flex-col">
    <!-- メイン -->
    <div class="pt-32 pb-10 text-center">
      <h1 class="text-4xl font-bold mb-4">Hello World</h1>
      <p class="text-lg">ここは説明文など</p>

      <!-- 疑似的にコンテンツが長い状態を再現 -->
      <div class="h-[1200px]"></div>
    </div>
    <!-- フッター -->
    <footer class="bg-gray-700 py-4 border-t border-gray-200">
      <nav class="flex justify-center space-x-8">
        <nuxt-link to="/about" class="text-gray-300 hover:text-white">About</nuxt-link>
        <nuxt-link to="/articles" class="text-gray-300 hover:text-white">Articles</nuxt-link>
      </nav>
      <p class="text-center text-sm text-gray-500 mt-4">©2025 World Wide Hisa</p>
    </footer>
  </div>
</template>