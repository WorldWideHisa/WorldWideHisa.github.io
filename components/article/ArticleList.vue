<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">{{ title }}</h2>

      <!-- 検索入力欄（showSearch=falseの場合は非表示） -->
      <div class="relative" v-if="showSearch">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="キーワードで検索..."
          class="pl-8 pr-4 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <!-- 虫眼鏡アイコン -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <ul class="space-y-6">
      <ArticleListItem
        v-for="(article, index) in filteredArticles"
        :key="article._path || index"
        :article="article"
      />
    </ul>
    <div v-if="showMoreLink" class="text-center mt-8">
      <nuxt-link
        :to="moreLink"
        class="inline-flex items-center text-gray-600 hover:text-gray-900 border-b border-gray-300 hover:border-gray-600 transition-colors pb-1"
      >
        {{ moreLinkText }}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </nuxt-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import ArticleListItem from './ArticleListItem.vue';
import { ref, computed } from 'vue';

interface Article {
  _path?: string;
  title: string;
  date?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  [key: string]: any; // その他のプロパティを許容
}

// デフォルト値の設定
const props = withDefaults(defineProps<{
  title: string;
  articles: Article[];
  showMoreLink?: boolean;
  moreLink?: string;
  moreLinkText?: string;
  showSearch?: boolean;
}>(), {
  showSearch: true
});

// 検索関連
const searchQuery = ref('');

// キーワードでフィルタリングされた記事（タイトル、タグ、年で検索）
const filteredArticles = computed(() => {
  if (!searchQuery.value) {
    return props.articles;
  }

  const query = searchQuery.value.toLowerCase();

  return props.articles.filter(article => {
    // タイトル検索
    const titleMatch = article.title.toLowerCase().includes(query);

    // タグ検索
    const tagMatch = article.tags &&
      article.tags.some(tag => tag.toLowerCase().includes(query));

    // 年検索（日付から年を抽出）
    const yearMatch = article.date && article.date.includes(query);

    return titleMatch || tagMatch || yearMatch;
  });
});
</script>
