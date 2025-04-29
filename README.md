# ローカルの動かし方
rm -rf .nuxt dist .output && \
npm run generate && npx http-server .output/public

# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## フォントについて

このプロジェクトでは「Zen Maru Gothic（ZEN丸ゴシック）」フォントを使用しています。
このフォントは[SIL Open Font License (OFL) 1.1](https://scripts.sil.org/OFL)の下で提供されています。

- デザイン: Yoshimichi Ohira
- 提供: 株式会社ゼンフォント / Google Fonts

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
