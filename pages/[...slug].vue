<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
      <!-- 戻るボタン -->
      <div class="mb-8">
        <button
          @click="$router.push('/articles')"
          class="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm font-medium"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          記事一覧に戻る
        </button>
      </div>

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

        <!-- タグ（小さい文字で控えめに表示） -->
        <div v-if="article.tags && article.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="tag in article.tags"
            :key="tag"
            class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
          >
            #{{ tag }}
          </span>
        </div>

        <!-- 区切り線 -->
        <hr class="my-8 border-gray-200">
      </div>

      <!-- 記事本文 -->
      <article class="prose prose-lg max-w-none prose-h1:text-3xl prose-h1:font-semibold prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-semibold prose-h4:text-lg prose-h4:font-semibold prose-a:break-words prose-a:break-all">
        <ContentDoc :path="`/${slugPath}`" />
      </article>
  </div>

  <!-- スクロールトップボタン -->
  <ScrollToTopButton />
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import ScrollToTopButton from '~/components/ui/ScrollToTopButton.vue';
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

// SEO用のmetaタグを設定
const siteUrl = 'https://worldwidehisa.net';
const articleUrl = `${siteUrl}${route.path}`;

useHead(() => {
  if (!article.value) return {};

  let imageUrl = `${siteUrl}/images/ogp-default.png`;
  const hasValidThumbnail = article.value.thumbnail && article.value.thumbnail.trim() !== '';

  if (hasValidThumbnail) {
    if (article.value.thumbnail.startsWith('http://') || article.value.thumbnail.startsWith('https://')) {
      imageUrl = article.value.thumbnail;
    } else if (article.value.thumbnail.startsWith('/')) {
      imageUrl = `${siteUrl}${article.value.thumbnail}`;
    } else {
      imageUrl = `${siteUrl}/images/${article.value.thumbnail}`;
    }
  }

  return {
    title: article.value.title,
    meta: [
      { name: 'description', content: article.value.description || `${article.value.title}についての記事です` },
      { property: 'og:title', content: article.value.title },
      { property: 'og:description', content: article.value.description || `${article.value.title}についての記事です` },
      { property: 'og:image', content: imageUrl },
      { property: 'og:url', content: articleUrl },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'World Wide Hisa' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: article.value.title },
      { name: 'twitter:description', content: article.value.description || `${article.value.title}についての記事です` },
      { name: 'twitter:image', content: imageUrl },
    ]
  };
});
</script>
