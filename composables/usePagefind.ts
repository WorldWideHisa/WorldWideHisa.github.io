/**
 * Pagefind（静的サイト向け全文検索）をブラウザから使うための composable
 *
 * 仕組み:
 *   1. `npm run generate` の最後に Pagefind が HTML を読み、
 *      検索インデックスと検索用スクリプトを /pagefind/ に書き出す。
 *   2. ブラウザはこの composable 経由で /pagefind/pagefind.js を読み込み、
 *      必要なインデックスの断片だけをダウンロードして検索する（サーバー不要）。
 *
 * `npm run dev` では /pagefind/ が存在しないため、読み込みは失敗する
 * （呼び出し側で、タイトル・タグ・年の絞り込みだけに切り替える）。
 * 動作確認は `npm run generate && npx http-server .output/public` で行う。
 */

/** 検索結果 1 件ぶんのデータ（Pagefind の result.data() の必要な部分だけ） */
export interface PagefindResultData {
  url: string;
  /** 一致箇所の前後を抜き出した文。一致語は <mark> で囲まれた HTML */
  excerpt: string;
  meta: {
    title?: string;
    date?: string;
    image?: string;
    [key: string]: string | undefined;
  };
}

interface PagefindSearchResult {
  results: { id: string; data: () => Promise<PagefindResultData> }[];
}

interface PagefindModule {
  init: () => Promise<void>;
  debouncedSearch: (
    term: string,
    options?: Record<string, unknown>,
    debounceTimeoutMs?: number,
  ) => Promise<PagefindSearchResult | null>;
}

export interface SearchItem {
  /** サイト内リンク用のパス（末尾の / を外したもの） */
  path: string;
  title: string;
  date?: string;
  excerpt: string;
}

// ページを移動しても読み込み直さないよう、モジュールはひとつだけ保持する
let pagefindPromise: Promise<PagefindModule> | null = null;

const loadPagefind = (): Promise<PagefindModule> => {
  if (!pagefindPromise) {
    // ・ビルド時には存在しないファイルなので、Vite に解決させないよう変数経由で読み込む
    // ・"/pagefind/..." のままだと、Nuxt の JS の置き場所（cdnURL）基準で解決されるため、
    //   いま開いているサイトの origin を明示して、そのサイトのインデックスを使う
    const pagefindUrl = `${window.location.origin}/pagefind/pagefind.js`;
    pagefindPromise = import(/* @vite-ignore */ pagefindUrl)
      .then(async (mod: PagefindModule) => {
        await mod.init();
        return mod;
      })
      .catch((error) => {
        pagefindPromise = null; // 失敗したら次回また読み込みを試す
        throw error;
      });
  }
  return pagefindPromise;
};

/**
 * Pagefind の URL（例: /articles/foo/）を Nuxt のルート（/articles/foo）にそろえる。
 * ・origin 付きの URL が返ることもあるので、パス部分だけを取り出す
 *   （origin 付きのままだと NuxtLink が外部リンク扱いにしてページ全体を読み直す）
 * ・末尾の / が付いたままだと、記事ページの slug がずれるため外す
 */
const toRoutePath = (url: string): string => {
  const { pathname } = new URL(url, window.location.origin);
  const path = pathname.replace(/\/index\.html$/, "/");
  return path.length > 1 ? path.replace(/\/$/, "") : path;
};

export const usePagefind = () => {
  /**
   * キーワードで検索する。
   * 入力中に次の検索が始まった場合は null を返す（古い結果で上書きしないため）。
   * 記事一覧の絞り込みに使うので、既定ではヒットした記事を 100 件まで取る。
   */
  const search = async (
    term: string,
    limit = 100,
  ): Promise<{ total: number; items: SearchItem[] } | null> => {
    const pagefind = await loadPagefind();
    const result = await pagefind.debouncedSearch(term, {}, 300);
    if (result === null) return null;

    const data = await Promise.all(
      result.results.slice(0, limit).map((r) => r.data()),
    );
    return {
      total: result.results.length,
      items: data.map((d) => ({
        path: toRoutePath(d.url),
        title: d.meta.title ?? d.url,
        date: d.meta.date,
        excerpt: d.excerpt,
      })),
    };
  };

  return { search };
};
