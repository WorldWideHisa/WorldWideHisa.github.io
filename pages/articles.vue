<template>
  <div>
    <div class="max-w-4xl mx-auto px-4 py-16">
      <h1 class="text-3xl font-bold mb-8"></h1>
      <ArticleList
        title=""
        :articles="articles"
        :show-more-link="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ArticleList from '~/components/article/ArticleList.vue';

interface Article {
  _path?: string;
  title: string;
  date?: string;
  description?: string;
  thumbnail?: string;
  [key: string]: any;
}

// すべての記事を取得（制限なし）
const { data: allArticles } = await useAsyncData("allArticles", () =>
  queryContent("/articles")
    .sort({ date: -1 }) // 日付の降順でソート
    .find()
);

// nullの場合は空配列を使用
const articles = computed(() => {
  return (allArticles.value || []) as Article[];
});
</script>
