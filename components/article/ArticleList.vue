<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ title }}</h2>

    <ul class="space-y-6">
      <ArticleListItem
        v-for="(article, index) in articles"
        :key="article._path || index"
        :article="article"
      />
    </ul>
    <div v-if="showMoreLink" class="text-center mt-8">
      <nuxt-link
        :to="moreLink"
        class="inline-block px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
      >
        {{ moreLinkText }}
      </nuxt-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import ArticleListItem from './ArticleListItem.vue';

interface Article {
  _path?: string;
  title: string;
  date?: string;
  description?: string;
  thumbnail?: string;
  [key: string]: any; // その他のプロパティを許容
}

const props = defineProps<{
  title: string;
  articles: Article[];
  showMoreLink?: boolean;
  moreLink?: string;
  moreLinkText?: string;
}>();
</script>
