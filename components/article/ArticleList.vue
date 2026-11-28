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
        :excerpt="excerptFor(article)"
      />
    </ul>

    <!-- 検索しても1件も無いとき（本文検索の結果待ちの間は出さない） -->
    <p
      v-if="trimmedQuery && filteredArticles.length === 0 && !isBodySearching"
      class="text-sm text-gray-600"
    >
      「{{ trimmedQuery }}」に一致する記事は見つかりませんでした。
    </p>
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
import { ref, computed, watch } from 'vue';

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
const trimmedQuery = computed(() => searchQuery.value.trim());

/*
 * 本文の全文検索（Pagefind）
 * - 入力のたびに Pagefind で本文も検索し、一致した記事のパスと抜粋を覚えておく
 * - 結果は「どのキーワードの結果か」と一緒に持ち、今の入力と同じときだけ使う
 *   （入力を変えた直後に、前のキーワードの結果が混ざらないようにするため）
 * - `npm run dev` など検索インデックスが無い環境では読み込みに失敗するので、
 *   以降は本文検索をやめて、タイトル・タグ・年の絞り込みだけで動かす
 */
const { search } = usePagefind();
const bodyResult = ref<{ term: string; excerpts: Map<string, string> } | null>(null);
const bodySearchingTerm = ref('');
let isPagefindAvailable = true;

const isBodySearching = computed(
  () => bodySearchingTerm.value !== '' && bodySearchingTerm.value === trimmedQuery.value,
);

const bodyMatches = computed(() =>
  bodyResult.value && bodyResult.value.term === trimmedQuery.value
    ? bodyResult.value.excerpts
    : null,
);

watch(trimmedQuery, async (term) => {
  if (!term || !props.showSearch || !isPagefindAvailable) {
    bodySearchingTerm.value = '';
    return;
  }

  bodySearchingTerm.value = term;
  try {
    const result = await search(term);
    // 入力が続いて新しい検索に置き換わったときは何もしない
    if (result === null || term !== trimmedQuery.value) return;
    bodyResult.value = {
      term,
      excerpts: new Map(result.items.map((item) => [item.path, item.excerpt])),
    };
  } catch (error) {
    isPagefindAvailable = false;
    console.info('[search] 検索インデックスが無いため、タイトル・タグ・年での絞り込みのみ行います', error);
  } finally {
    if (bodySearchingTerm.value === term) bodySearchingTerm.value = '';
  }
});

// 本文検索で一致した記事には、一致箇所の抜粋を表示する
const excerptFor = (article: Article): string | undefined =>
  article._path ? bodyMatches.value?.get(article._path) : undefined;

// キーワードでフィルタリングされた記事（タイトル、タグ、年、本文で検索）
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

    // 本文検索（Pagefind）で一致
    const bodyMatch = !!article._path && !!bodyMatches.value?.has(article._path);

    return titleMatch || tagMatch || yearMatch || bodyMatch;
  });
});
</script>
