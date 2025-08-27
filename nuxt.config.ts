import { resolve } from "node:path";
import { globSync } from "glob";

const getContentRoutes = (): string[] => {
  const contentPath = resolve("content/**/*.md");
  const routeNames = globSync(contentPath).map((f) => {
    // パスを整形して返す
    const pattern = /.*\/content/;
    return f.replace(pattern, "").replace(".md", "");
  });

  return [...routeNames];
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: getContentRoutes(),
    },
    logLevel: "debug",
  },

  devtools: { enabled: true },

  app: {
    baseURL: "/",
    cdnURL:
      process.env.NODE_ENV === "test" ? "/" : "https://worldwidehisa.net/",
    head: {
      link: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/icons/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "48x48",
          href: "/icons/favicon-48x48.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "64x64",
          href: "/icons/favicon-64x64.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/icons/apple-touch-icon.png",
        },
        { rel: "manifest", href: "/icons/site.webmanifest" },
      ],
      meta: [{ name: "theme-color", content: "#ffffff" }],
    },
  },

  modules: ["@nuxt/content", "@nuxtjs/tailwindcss"],

  typescript: {
    shim: false, // VScodeの拡張機能を使うためにfalse
    strict: true, // 型チェックの厳格化
    typeCheck: false, // 開発、build時の型チェックを有効に。vue-tscとtypescriptのインストールが必要
  },

  tailwindcss: {
    cssPath: ["~/assets/css/tailwind.css", { injectPosition: "first" }],
    configPath: "tailwind.config",
  },

  content: {
    sources: {
      content: {
        driver: "fs",
        prefix: "/articles",
        base: resolve(__dirname, "content", "articles"),
        exclude: ["README.md", "template/**"],
      },
    },
  },

  compatibilityDate: "2025-04-27",
});
