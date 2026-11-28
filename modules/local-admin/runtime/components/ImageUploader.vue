<template>
  <!--
    画像のアップロード待ち一覧。
    画像をドロップ・貼り付け・選択すると、すぐに変換とアップロードを始め、
    そのあいだに代替テキスト（alt）を入力してもらう。終わったら「記事に挿入」で Markdown を入れる。
    「この記事の画像」では、すでに R2 にあるこの記事の画像を選んで、同じ流れで挿入できる。
  -->
  <div class="border-t border-gray-300 bg-gray-50 text-sm">
    <div class="px-3 py-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
        :disabled="!ready"
        @click="fileInput?.click()"
      >
        画像を追加
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"
        multiple
        class="hidden"
        @change="onSelect"
      >
      <button
        type="button"
        class="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
        :class="{ 'bg-gray-200': libraryOpen }"
        :disabled="!configReady"
        :aria-expanded="libraryOpen"
        @click="toggleLibrary"
      >
        この記事の画像<template v-if="library">（{{ library.length }}）</template>
      </button>
      <span v-if="statusMessage" class="text-xs text-amber-700">{{ statusMessage }}</span>
      <span v-else class="text-xs text-gray-500">
        エディタに画像をドロップ・貼り付けしてもアップロードできます（HEIC 可）
      </span>
    </div>

    <!-- この記事のフォルダ（articles/<記事>/）にある画像。選ぶと下の一覧に入る -->
    <div v-if="libraryOpen" class="px-3 pb-3">
      <p v-if="libraryLoading" class="text-xs text-gray-500">R2 から読み込み中…</p>
      <p v-else-if="libraryError" class="text-xs text-red-600">{{ libraryError }}</p>
      <p v-else-if="library && library.length === 0" class="text-xs text-gray-500">
        この記事の画像はまだありません（{{ libraryPrefix }}）
      </p>
      <ul v-else-if="library" class="max-h-48 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2">
        <li v-for="image in library" :key="image.key">
          <button
            type="button"
            class="group relative block w-full aspect-square bg-gray-100 rounded overflow-hidden border border-gray-200 hover:ring-2 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :title="`${image.name}（${formatSize(image.size)}）を選ぶ`"
            @click="pick(image)"
          >
            <img :src="image.url" :alt="image.name" loading="lazy" class="w-full h-full object-cover">
            <span class="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 truncate text-left">
              {{ image.name }}
            </span>
            <span
              v-if="usedInArticle(image.url)"
              class="absolute top-0.5 right-0.5 bg-green-600 text-white text-[10px] rounded px-1"
            >使用中</span>
          </button>
        </li>
      </ul>
    </div>

    <ul v-if="items.length > 0" class="max-h-56 overflow-y-auto px-3 pb-3 space-y-2">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-start gap-3 bg-white rounded border border-gray-200 p-2"
      >
        <div class="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center text-[10px] text-gray-400">
          <img v-if="item.result" :src="item.result.url" alt="" class="w-full h-full object-cover">
          <span v-else>{{ item.name.split(".").pop()?.toUpperCase() }}</span>
        </div>
        <div class="flex-grow min-w-0 space-y-1">
          <p class="truncate text-xs text-gray-500">
            {{ item.name }}
            <template v-if="item.state === 'uploading'"> ・ 変換してアップロード中…</template>
            <template v-else-if="item.reused"> ・ アップロード済みの画像</template>
            <template v-else-if="item.state === 'done' && item.result">
              ・ {{ formatSize(item.originalSize) }} → {{ formatSize(item.result.size) }}（{{ item.result.width }}×{{ item.result.height }}）
            </template>
          </p>
          <p v-if="item.state === 'error'" class="text-xs text-red-600">{{ item.error }}</p>
          <form v-else class="flex gap-2" @submit.prevent="insert(item)">
            <input
              v-model="item.alt"
              type="text"
              placeholder="画像の説明（alt）を入力"
              class="flex-grow min-w-0 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              :data-upload-id="item.id"
            >
            <button
              type="submit"
              class="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              :disabled="item.state !== 'done'"
            >
              記事に挿入
            </button>
          </form>
          <p v-if="item.result" class="truncate text-[11px] text-gray-400">{{ item.result.url }}</p>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-700 text-xs"
          title="一覧から外す（アップロード済みの画像は R2 に残ります）"
          @click="remove(item)"
        >
          ✕
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";

const props = defineProps<{
  file: string;
  /** エディタの Markdown。「使用中」の表示に使う */
  source?: string;
}>();
const emit = defineEmits<{ insert: [markdown: string] }>();

interface UploadResult {
  key: string;
  url: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
}
interface UploadItem {
  id: number;
  name: string;
  originalSize: number;
  state: "uploading" | "done" | "error";
  alt: string;
  result?: UploadResult;
  error?: string;
  /** 「この記事の画像」から選んだもの（新しくアップロードしていない） */
  reused?: boolean;
}
interface LibraryImage {
  key: string;
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

const items = ref<UploadItem[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const status = ref<{
  missingConfig: string[];
  converterReady: boolean;
  converterUrl: string;
} | null>(null);
let nextId = 1;

const configReady = computed(
  () => status.value !== null && status.value.missingConfig.length === 0,
);
const ready = computed(
  () => configReady.value && !!status.value?.converterReady,
);
const statusMessage = computed(() => {
  if (!status.value) return "";
  if (status.value.missingConfig.length > 0) {
    return `画像アップロードを使うには .env に ${status.value.missingConfig.join(", ")} を設定してください`;
  }
  if (!status.value.converterReady) {
    return `hisa-compress（${status.value.converterUrl}）が起動していません。npm run dev:admin で起動できます`;
  }
  return "";
});

async function refreshStatus() {
  try {
    status.value = await $fetch("/api/_admin/images/status");
  } catch {
    status.value = null;
  }
}
onMounted(refreshStatus);

// biome-ignore lint/suspicious/noExplicitAny: $fetch のエラー型
function errorMessage(e: any) {
  return e?.data?.statusMessage ?? e?.data?.message ?? e?.message ?? String(e);
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

const IMAGE_NAME = /\.(png|jpe?g|webp|heic|heif)$/i;

/** ドロップ・貼り付け・選択された画像を受け付ける。画像が 1 つ以上あれば true */
async function addFiles(files: File[]) {
  const images = files.filter(
    (f) => f.type.startsWith("image/") || IMAGE_NAME.test(f.name),
  );
  if (images.length === 0) return false;
  await refreshStatus();

  for (const image of images) {
    const item: UploadItem = {
      id: nextId++,
      // 貼り付けた画像は名前が "image.png" などになるので、そのまま使う
      name: image.name || "image.png",
      originalSize: image.size,
      state: "uploading",
      alt: "",
    };
    items.value.push(item);
    const reactiveItem = items.value[items.value.length - 1];
    upload(reactiveItem, image);
  }
  // 最初の入力欄にカーソルを移して、すぐ説明を書けるようにする
  await nextTick();
  const firstId = items.value.find((i) => i.state !== "error" && !i.alt)?.id;
  document
    .querySelector<HTMLInputElement>(`input[data-upload-id="${firstId}"]`)
    ?.focus();
  return true;
}

async function upload(item: UploadItem, image: File) {
  if (!ready.value) {
    item.state = "error";
    item.error =
      statusMessage.value || "画像アップロードの準備ができていません";
    return;
  }
  const form = new FormData();
  form.append("image", image, item.name);
  form.append("file", props.file);
  try {
    item.result = await $fetch<UploadResult>("/api/_admin/images", {
      method: "POST",
      headers: { "x-local-admin": "1" },
      body: form,
    });
    item.state = "done";
    // 一覧を開いていれば、新しい画像も一覧に出す
    if (libraryOpen.value) loadLibrary();
  } catch (e) {
    item.state = "error";
    item.error = errorMessage(e);
  }
}

function insert(item: UploadItem) {
  if (item.state !== "done" || !item.result) return;
  // alt の中の [ ] は Markdown の記号なので取り除く
  const alt = item.alt.trim().replace(/[[\]]/g, "");
  emit("insert", `![${alt}](${item.result.url})`);
  remove(item);
}

function remove(item: UploadItem) {
  items.value = items.value.filter((i) => i.id !== item.id);
}

// ---- この記事の画像（R2 の一覧） ----
const libraryOpen = ref(false);
const libraryLoading = ref(false);
const libraryError = ref("");
const library = ref<LibraryImage[] | null>(null);
const libraryPrefix = ref("");

async function loadLibrary() {
  libraryLoading.value = library.value === null;
  libraryError.value = "";
  try {
    const res = await $fetch<{ prefix: string; images: LibraryImage[] }>(
      "/api/_admin/images",
      { query: { file: props.file } },
    );
    library.value = res.images;
    libraryPrefix.value = res.prefix;
  } catch (e) {
    libraryError.value = errorMessage(e);
  } finally {
    libraryLoading.value = false;
  }
}

function toggleLibrary() {
  libraryOpen.value = !libraryOpen.value;
  // R2 の一覧取得は無料枠を使うので、開いたときに 1 回だけ読む
  if (libraryOpen.value && library.value === null) loadLibrary();
}

function usedInArticle(url: string) {
  return !!props.source?.includes(url);
}

/** 一覧から選んだ画像を、アップロード待ちの一覧に「完了」の状態で入れる（alt を書いて挿入） */
async function pick(image: LibraryImage) {
  const existing = items.value.find((i) => i.result?.url === image.url);
  const id = existing?.id ?? nextId++;
  if (!existing) {
    items.value.push({
      id,
      name: image.name,
      originalSize: image.size,
      state: "done",
      alt: "",
      reused: true,
      result: {
        key: image.key,
        url: image.url,
        width: 0,
        height: 0,
        size: image.size,
        originalSize: image.size,
      },
    });
  }
  await nextTick();
  document
    .querySelector<HTMLInputElement>(`input[data-upload-id="${id}"]`)
    ?.focus();
}

function onSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  addFiles(Array.from(input.files ?? []));
  input.value = "";
}

defineExpose({ addFiles });
</script>
