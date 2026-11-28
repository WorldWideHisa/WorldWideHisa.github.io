<template>
  <!--
    記事ページ（pages/[...slug].vue）と同じ見た目で表示するためのプレビュー。
    クラス名は記事ページと揃えているので、記事ページのデザインを変えたらここも合わせる。
  -->
  <div class="max-w-3xl mx-auto px-4 py-10">
    <div class="mb-12">
      <h1 class="text-4xl font-bold mb-6">{{ doc.title }}</h1>
      <p v-if="doc.description" class="text-lg text-gray-700 mb-4">
        {{ doc.description }}
      </p>
      <p class="text-sm text-gray-500">
        {{ formatDate(doc.date || "") }}
      </p>
      <div v-if="doc.tags && doc.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="tag in doc.tags"
          :key="tag"
          class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
        >
          #{{ tag }}
        </span>
      </div>
      <hr class="my-8 border-gray-200">
    </div>

    <article class="prose prose-lg max-w-none prose-h1:text-3xl prose-h1:font-semibold prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-semibold prose-h4:text-lg prose-h4:font-semibold prose-a:break-words prose-a:break-all">
      <ContentRenderer :value="doc" />
    </article>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from "~/components/utils/DateFormatter";

defineProps<{
  // biome-ignore lint/suspicious/noExplicitAny: Nuxt Content のパース結果をそのまま受け取る
  doc: Record<string, any>;
}>();
</script>
