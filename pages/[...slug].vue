<template>
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

// SEO用のmetaタグを設定
if (article.value) {
  const siteUrl = 'https://worldwidehisa.net';
  const articleUrl = `${siteUrl}/${slugPath}`;
  const imageUrl = article.value.thumbnail ? `${siteUrl}${article.value.thumbnail}` : `${siteUrl}/icons/apple-touch-icon.png`;

  useSeoMeta({
    title: article.value.title,
    description: article.value.description || `${article.value.title}についての記事です`,
    ogTitle: article.value.title,
    ogDescription: article.value.description || `${article.value.title}についての記事です`,
    ogImage: imageUrl,
    ogUrl: articleUrl,
    ogType: 'article',
    ogSiteName: 'WorldWide Hisa',
    twitterCard: 'summary_large_image',
    twitterTitle: article.value.title,
    twitterDescription: article.value.description || `${article.value.title}についての記事です`,
    twitterImage: imageUrl,
  });
}
</script>
