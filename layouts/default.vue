<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
    <main class="flex-grow">
      <slot />
    </main>
    <footer class="bg-gray-700 py-3 border-t border-gray-200">
      <nav class="flex justify-center space-x-8">
        <NuxtLink to="/" class="text-gray-300 hover:text-white">Home</NuxtLink>
        <NuxtLink to="/articles" class="text-gray-300 hover:text-white">Articles</NuxtLink>
        <NuxtLink to="/about" class="text-gray-300 hover:text-white">About</NuxtLink>
      </nav>
      <p class="text-center text-sm text-gray-500 mt-3">©2025 World Wide Hisa</p>
    </footer>
  </div>
</template>
