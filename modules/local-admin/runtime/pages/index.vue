<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <header class="bg-gray-800 text-white">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="font-bold">ローカル管理画面</h1>
        <span class="text-xs bg-yellow-400 text-gray-900 rounded px-2 py-0.5">
          npm run dev のときだけ表示されます
        </span>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <!-- 新しい記事 -->
      <section class="bg-white rounded-lg shadow-sm p-5">
        <h2 class="text-lg font-bold mb-3">新しい記事を書く</h2>
        <form class="flex flex-wrap items-center gap-2" @submit.prevent="createArticle">
          <span class="text-sm text-gray-500">{{ articlesPrefix }}/</span>
          <input
            v-model="newSlug"
            type="text"
            placeholder="my-new-article"
            class="flex-grow min-w-[12rem] px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
          <button
            type="submit"
            class="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="creating || !newSlug"
          >
            テンプレートから作成
          </button>
        </form>
        <p class="text-xs text-gray-500 mt-2">
          半角英小文字・数字・ハイフンで入力します（例: 2025/nuxt-tips）。
          ファイルを作るだけなので、記事リポジトリに push するまでは公開されません。
        </p>
        <p v-if="createError" class="text-sm text-red-600 mt-2">{{ createError }}</p>
      </section>

      <!-- 記事一覧 -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold">記事一覧（{{ articles.length }} 件）</h2>
          <button class="text-sm text-gray-600 hover:text-gray-900" @click="refresh()">再読み込み</button>
        </div>

        <p v-if="error" class="text-sm text-red-600">記事一覧を読み込めませんでした: {{ error.message }}</p>
        <p v-else-if="articles.length === 0" class="text-sm text-gray-500">
          記事がありません。content/articles に記事リポジトリを置いているか確認してください。
        </p>

        <ul class="divide-y bg-white rounded-lg shadow-sm">
          <li v-for="article in articles" :key="article.file" class="p-4 flex items-start gap-4">
            <div class="flex-grow min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  v-if="article.draft"
                  class="text-xs bg-yellow-100 text-yellow-800 rounded px-1.5 py-0.5"
                >下書き</span>
                <span class="text-sm text-gray-500">{{ article.date || "日付なし" }}</span>
              </div>
              <p class="font-medium truncate">{{ article.title }}</p>
              <p class="text-xs text-gray-400 truncate">{{ article.file }}</p>
            </div>
            <div class="flex-shrink-0 flex gap-3 text-sm">
              <NuxtLink
                :to="{ path: '/_admin/edit', query: { file: article.file } }"
                class="text-blue-600 hover:underline"
              >
                編集
              </NuxtLink>
              <a :href="article.path" target="_blank" class="text-gray-600 hover:underline">ページを開く</a>
            </div>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { definePageMeta, navigateTo, useFetch, useHead } from "#imports";

definePageMeta({ layout: false });
useHead({
  title: "ローカル管理画面",
  meta: [{ name: "robots", content: "noindex" }],
});

interface AdminArticle {
  path: string;
  file: string;
  draft: boolean;
  title: string;
  date: string;
  description: string;
  tags: string[];
}

const articlesPrefix = "content/articles";

// 管理画面はローカル専用なので、サーバー側レンダリングせずブラウザで取得する
const { data, error, refresh } = await useFetch<AdminArticle[]>(
  "/api/_admin/articles",
  {
    server: false,
    default: () => [],
  },
);
const articles = computed(() => data.value ?? []);

const newSlug = ref("");
const creating = ref(false);
const createError = ref("");

async function createArticle() {
  creating.value = true;
  createError.value = "";
  try {
    const res = await $fetch<{ file: string }>("/api/_admin/article", {
      method: "POST",
      headers: { "x-local-admin": "1" },
      body: { slug: newSlug.value.trim() },
    });
    await navigateTo({ path: "/_admin/edit", query: { file: res.file } });
  } catch (e) {
    // biome-ignore lint/suspicious/noExplicitAny: $fetch のエラー型
    const err = e as any;
    createError.value =
      err?.data?.statusMessage ?? err?.statusMessage ?? String(e);
  } finally {
    creating.value = false;
  }
}
</script>
