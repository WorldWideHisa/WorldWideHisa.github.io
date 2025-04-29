<template>
  <li class="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <!-- サムネイル（左側） -->
    <ArticleThumbnail
      :src="article.thumbnail"
      :alt="article.title"
      :to="article._path"
    />
    <!-- 記事情報（右側） -->
    <div class="flex-grow">
      <!-- 日付 -->
      <p class="text-sm text-gray-500 mb-1">{{ formattedDate }}</p>

      <!-- タイトル -->
      <h3 class="font-medium mb-1">
        <nuxt-link v-if="article._path" :to="article._path" class="hover:text-blue-600">
          {{ article.title }}
        </nuxt-link>
        <span v-else>{{ article.title }}</span>
      </h3>

      <!-- 要約（descriptionがあれば表示） -->
      <p v-if="article.description" class="text-sm text-gray-700">
        {{ article.description }}
      </p>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDate } from '../utils/DateFormatter';
import ArticleThumbnail from './ArticleThumbnail.vue';

interface Article {
  _path?: string;
  title: string;
  date?: string;
  description?: string;
  thumbnail?: string;
  [key: string]: any; // その他のプロパティを許容
}

const props = defineProps<{
  article: Article;
}>();

// 日付のフォーマット
const formattedDate = computed(() => {
  return formatDate(props.article.date || '');
});
</script>
