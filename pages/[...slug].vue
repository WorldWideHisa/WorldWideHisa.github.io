<template>
  <div>
    <div class="max-w-3xl mx-auto px-4 py-16">
      <!-- 記事のメタ情報 -->
      <div v-if="article" class="mb-12">
        <!-- タイトル（左揃え） -->
        <h1 class="text-4xl font-bold mb-6">{{ article.title }}</h1>

        <!-- 説明文（左揃え） -->
        <p v-if="article.description" class="text-lg text-gray-700 mb-4">
          {{ article.description }}
        </p>

        <!-- 日付（左揃え） -->
        <p class="text-sm text-gray-500">
          {{ formatDate(article.date) }}
        </p>

        <!-- 区切り線 -->
        <hr class="my-8 border-gray-200">
      </div>

      <!-- 記事本文 -->
      <article class="prose prose-lg max-w-none prose-h1:text-3xl prose-h1:font-semibold prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-semibold prose-h4:text-lg prose-h4:font-semibold">
        <ContentDoc :path="`/${slugPath}`" />
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { formatDate } from '~/components/utils/DateFormatter';

const route = useRoute();
const slug = route.params.slug;

// slugが配列かどうかをチェック
const slugPath = Array.isArray(slug) ? slug.join('/') : slug;

// 記事データを取得
const { data: article } = await useAsyncData(`article-${slugPath}`, () =>
  queryContent(slugPath)
    .findOne()
);
</script>
