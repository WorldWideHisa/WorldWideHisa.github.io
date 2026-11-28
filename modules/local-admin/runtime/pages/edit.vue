<template>
  <div class="h-screen flex flex-col bg-gray-50 text-gray-900">
    <!-- ツールバー -->
    <header class="bg-gray-800 text-white flex-shrink-0">
      <div class="px-4 py-2 flex flex-wrap items-center gap-3 text-sm">
        <NuxtLink to="/_admin" class="text-gray-300 hover:text-white">← 一覧</NuxtLink>
        <span class="font-mono truncate">{{ file }}</span>
        <span v-if="parsed?._draft" class="text-xs bg-yellow-400 text-gray-900 rounded px-1.5 py-0.5">下書き</span>
        <span class="flex-grow" />
        <span class="text-xs" :class="statusClass">{{ statusText }}</span>
        <a
          v-if="parsed?._path"
          :href="parsed._path"
          target="_blank"
          class="text-gray-300 hover:text-white"
        >実際のページを開く</a>
        <button
          class="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          :disabled="!dirty || saving || loadError !== ''"
          @click="save"
        >
          保存（Ctrl+S）
        </button>
      </div>
    </header>

    <p v-if="loadError" class="p-4 text-red-600 text-sm">{{ loadError }}</p>

    <!-- 左: エディタ / 右: プレビュー -->
    <div v-else class="flex-grow flex flex-col md:flex-row min-h-0">
      <div class="md:w-1/2 h-1/2 md:h-auto border-b md:border-b-0 md:border-r border-gray-300 flex flex-col min-h-0">
        <textarea
          ref="editor"
          v-model="source"
          class="flex-grow w-full p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none bg-white"
          :class="{ 'ring-2 ring-inset ring-blue-400': dragging }"
          spellcheck="false"
          :disabled="loading"
          @keydown="onKeydown"
          @dragover="onDragOver"
          @dragleave="dragging = false"
          @drop="onDrop"
          @paste="onPaste"
        />
        <ImageUploader ref="uploader" :file="file" @insert="insertAtCursor" />
      </div>
      <div class="md:w-1/2 h-1/2 md:h-auto overflow-y-auto bg-gray-50">
        <p v-if="previewError" class="m-4 p-3 text-sm text-red-700 bg-red-50 rounded">
          プレビューを作れませんでした（frontmatter の書き方などを確認してください）: {{ previewError }}
        </p>
        <ArticlePreview v-if="parsed" :doc="parsed" :class="{ 'opacity-50': previewError }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {
  definePageMeta,
  onBeforeRouteLeave,
  useHead,
  useRoute,
} from "#imports";
import ArticlePreview from "../components/ArticlePreview.vue";
// biome-ignore lint/style/useImportType: テンプレートでコンポーネントとして使うため（Biome は .vue のテンプレートを見ない）
import ImageUploader from "../components/ImageUploader.vue";

definePageMeta({ layout: false });

const route = useRoute();
const file = computed(() => String(route.query.file ?? ""));
useHead({
  title: () => `編集: ${file.value}`,
  meta: [{ name: "robots", content: "noindex" }],
});

const source = ref("");
const savedSource = ref("");
const loading = ref(true);
const loadError = ref("");
const saving = ref(false);
const savedAt = ref<Date | null>(null);
const saveError = ref("");
// biome-ignore lint/suspicious/noExplicitAny: Nuxt Content のパース結果
const parsed = ref<Record<string, any> | null>(null);
const previewError = ref("");

const dirty = computed(() => source.value !== savedSource.value);

const statusText = computed(() => {
  if (saveError.value) return `保存に失敗しました: ${saveError.value}`;
  if (saving.value) return "保存中…";
  if (dirty.value) return "未保存の変更があります";
  if (savedAt.value)
    return `保存しました（${savedAt.value.toLocaleTimeString("ja-JP")}）`;
  return "保存済み";
});
const statusClass = computed(() => {
  if (saveError.value) return "text-red-300";
  if (dirty.value) return "text-yellow-300";
  return "text-gray-300";
});

// biome-ignore lint/suspicious/noExplicitAny: $fetch のエラー型
function errorMessage(e: any) {
  return (
    e?.data?.message ?? e?.data?.statusMessage ?? e?.statusMessage ?? String(e)
  );
}

async function load() {
  loading.value = true;
  loadError.value = "";
  try {
    const res = await $fetch<{ file: string; content: string }>(
      "/api/_admin/article",
      {
        query: { file: file.value },
      },
    );
    source.value = res.content;
    savedSource.value = res.content;
  } catch (e) {
    loadError.value = `記事を読み込めませんでした: ${errorMessage(e)}`;
  } finally {
    loading.value = false;
  }
}

// 入力が止まって少し経ったら、Nuxt Content と同じ変換でプレビューを作り直す
let previewTimer: ReturnType<typeof setTimeout> | undefined;
let previewSeq = 0;
async function updatePreview() {
  const seq = ++previewSeq;
  try {
    // biome-ignore lint/suspicious/noExplicitAny: Nuxt Content のパース結果
    const res = await $fetch<Record<string, any>>("/api/_admin/preview", {
      method: "POST",
      headers: { "x-local-admin": "1" },
      body: { file: file.value, content: source.value },
    });
    if (seq !== previewSeq) return; // 古いリクエストの結果は捨てる
    parsed.value = res;
    previewError.value = "";
  } catch (e) {
    if (seq !== previewSeq) return;
    previewError.value = errorMessage(e);
  }
}
watch(source, () => {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(updatePreview, 300);
});

async function save() {
  if (!dirty.value || saving.value) return;
  saving.value = true;
  saveError.value = "";
  const content = source.value;
  try {
    await $fetch("/api/_admin/article", {
      method: "PUT",
      headers: { "x-local-admin": "1" },
      body: { file: file.value, content },
    });
    savedSource.value = content;
    savedAt.value = new Date();
  } catch (e) {
    saveError.value = errorMessage(e);
  } finally {
    saving.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault();
    save();
  }
}

// ---- 画像のドロップ・貼り付け ----
const editor = ref<HTMLTextAreaElement | null>(null);
const uploader = ref<InstanceType<typeof ImageUploader> | null>(null);
const dragging = ref(false);

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}
function onDragOver(event: DragEvent) {
  if (!hasFiles(event)) return;
  event.preventDefault();
  dragging.value = true;
}
async function onDrop(event: DragEvent) {
  dragging.value = false;
  if (!hasFiles(event)) return;
  // ブラウザが画像をそのまま開いてしまわないようにする
  event.preventDefault();
  await uploader.value?.addFiles(Array.from(event.dataTransfer?.files ?? []));
}
async function onPaste(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files ?? []);
  if (files.length === 0) return; // 文字の貼り付けはそのまま
  event.preventDefault();
  await uploader.value?.addFiles(files);
}

/** カーソル位置（最後にエディタで選んでいた位置）に Markdown を入れる。前後は改行で区切る */
function insertAtCursor(markdown: string) {
  const el = editor.value;
  const pos = el ? el.selectionStart : source.value.length;
  const before = source.value.slice(0, pos);
  const after = source.value.slice(pos);
  const prefix = before === "" || before.endsWith("\n") ? "" : "\n";
  const suffix = after.startsWith("\n") ? "" : "\n";
  const text = `${prefix}${markdown}${suffix}`;
  source.value = before + text + after;
  nextTick(() => {
    if (!el) return;
    el.focus();
    el.selectionStart = pos + text.length;
    el.selectionEnd = pos + text.length;
  });
}

// 未保存のままタブを閉じたり、一覧へ戻ったりしないように確認する
function onBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault();
  }
}
onBeforeRouteLeave(() => {
  if (
    dirty.value &&
    !window.confirm("保存していない変更があります。破棄して移動しますか？")
  ) {
    return false;
  }
});

onMounted(async () => {
  window.addEventListener("beforeunload", onBeforeUnload);
  await load();
  if (!loadError.value) {
    await updatePreview();
  }
});
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  clearTimeout(previewTimer);
});
</script>
