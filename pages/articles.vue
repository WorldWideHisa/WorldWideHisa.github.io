<template>
  <div class="max-w-3xl mx-auto px-4 py-14">
    <!-- 記事リスト（タグ検索機能付き） -->
    <ArticleList
      title="記事一覧"
      :articles="articles"
      :show-more-link="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Article {
  _path?: string;
  title: string;
  date?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  [key: string]: any;
}

// すべての記事を取得
const { data: allArticles } = await useAsyncData("allArticles", () =>
  queryContent("/articles")
    .sort({ date: -1 }) // 日付の降順でソート
    .find(),
);

// 記事データ
const _articles = computed(() => {
  return (allArticles.value || []) as Article[];
});
</script>
