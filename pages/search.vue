<template>
  <div class="max-w-3xl mx-auto px-4 py-14">
    <div class="mb-8">
      <h1 class="text-2xl font-bold mb-2">記事を検索</h1>
      <p class="text-sm text-gray-600">記事のタイトルと本文から探します。</p>
    </div>

    <!-- 検索フォーム（Enter で送信してもページ遷移しない） -->
    <form role="search" class="relative mb-8" @submit.prevent>
      <label for="site-search" class="sr-only">検索キーワード</label>
      <input
        id="site-search"
        v-model="query"
        type="search"
        placeholder="キーワードを入力..."
        autocomplete="off"
        class="w-full pl-10 pr-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </form>

    <!-- 状態表示（スクリーンリーダーにも読み上げられるよう aria-live） -->
    <p id="search-status" class="text-sm text-gray-600 mb-4" aria-live="polite">
      <template v-if="status === 'error'">
        検索の準備ができませんでした。時間をおいて再読み込みしてください。
      </template>
      <template v-else-if="status === 'loading'">検索中...</template>
      <template v-else-if="status === 'done' && total === 0">
        「{{ searchedTerm }}」に一致する記事は見つかりませんでした。
      </template>
      <template v-else-if="status === 'done'">
        「{{ searchedTerm }}」の検索結果: {{ total }} 件
        <span v-if="total > items.length">（上位 {{ items.length }} 件を表示）</span>
      </template>
    </p>

    <ul v-if="status === 'done' && items.length > 0" class="space-y-4">
      <li
        v-for="item in items"
        :key="item.path"
        class="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <p v-if="item.date" class="text-sm text-gray-500 mb-1">{{ item.date }}</p>
        <h2 class="font-medium mb-1">
          <NuxtLink :to="item.path" class="hover:text-blue-600">{{ item.title }}</NuxtLink>
        </h2>
        <!-- excerpt は Pagefind が本文をエスケープした上で一致語を <mark> で囲んだ HTML -->
        <p
          class="text-sm text-gray-700 [&_mark]:bg-yellow-100 [&_mark]:text-gray-900 [&_mark]:px-0.5 [&_mark]:rounded"
          v-html="item.excerpt"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { SearchItem } from "~/composables/usePagefind";

useSeoMeta({
  title: "検索 | World Wide Hisa",
  description: "World Wide Hisaの記事を検索します",
  // 検索結果ページは検索エンジンに載せない（中身が入力次第で変わるため）
  robots: "noindex, follow",
});

const route = useRoute();
const router = useRouter();
const { search } = usePagefind();

// URL の ?q= と入力欄を同期させ、検索結果のリンクを共有・ブラウザバックできるようにする
const query = ref(typeof route.query.q === "string" ? route.query.q : "");
const searchedTerm = ref("");
const status = ref<"idle" | "loading" | "done" | "error">("idle");
const total = ref(0);
const items = ref<SearchItem[]>([]);

const runSearch = async (term: string) => {
  const trimmed = term.trim();
  router.replace({ query: trimmed ? { q: trimmed } : {} });

  if (!trimmed) {
    status.value = "idle";
    items.value = [];
    total.value = 0;
    return;
  }

  status.value = "loading";
  try {
    const result = await search(trimmed);
    if (result === null) return; // 入力が続いて新しい検索に置き換わった
    searchedTerm.value = trimmed;
    total.value = result.total;
    items.value = result.items;
    status.value = "done";
  } catch (error) {
    console.error("[search] Pagefind の読み込みに失敗しました", error);
    status.value = "error";
  }
};

watch(query, (term) => runSearch(term));

// 検索は静的 HTML の生成時ではなく、ブラウザで開いたときに行う
onMounted(() => {
  if (query.value) runSearch(query.value);
});
</script>
