<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
    <main class="flex-grow">
      <slot />
    </main>
    <footer class="bg-gray-700 py-4 border-t border-gray-200">
      <nav class="flex justify-center space-x-8">
        <NuxtLink to="/about" class="text-gray-300 hover:text-white">About</NuxtLink>
        <NuxtLink to="/articles" class="text-gray-300 hover:text-white">Articles</NuxtLink>
      </nav>
      <p class="text-center text-sm text-gray-500 mt-4">©2025 World Wide Hisa</p>
    </footer>
  </div>
</template>