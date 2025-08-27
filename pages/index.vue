<template>
  <div class="max-w-3xl mx-auto px-4 py-14">
    <!-- ヘッダーセクション -->
    <div class="mb-10 text-center">
      <h1 class="text-4xl font-bold mb-4">World Wide Hisa</h1>
      <p class="text-lg text-gray-700">WEB技術や趣味のことをひっそりと書いておくところです</p>
    </div>
    <!-- 最新記事リスト -->
    <div>
      <ArticleList
        title="最新記事"
        :articles="articles"
        :show-more-link="true"
        more-link="/articles"
        more-link-text="すべての記事を見る"
        :show-search="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ArticleList from '~/components/article/ArticleList.vue';

// ArticleList.vueと同じ型定義を使用
interface Article {
  _path: string;
  title: string;
  date?: string;
  description?: string;
  thumbnail?: string;
}

// 最新の5つの記事を取得
const { data: latestArticles } = await useAsyncData("latestArticles", () =>
  queryContent("/articles")
    .sort({ date: -1 }) // 日付の降順でソート
    .limit(3) // 3件に制限
    .find()
);

// nullの場合は空配列を使用
const articles = computed(() => {
  return (latestArticles.value || []) as Article[];
});
</script>
