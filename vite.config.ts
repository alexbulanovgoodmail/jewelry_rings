import fs from 'fs'
import { defineConfig } from 'vite'
import { resolve, basename } from 'path'
import { fileURLToPath, URL } from 'node:url'
import { checker } from 'vite-plugin-checker'

const root = resolve(__dirname, './src')
const outDir = resolve(__dirname, './dist')

const pages = fs
  .readdirSync(root)
  .filter((file) => file.endsWith('.html'))
  .reduce<Record<string, string>>((obj, file) => {
    const name = basename(file, '.html')
    obj[name] = resolve(root, file)
    return obj
  }, {})

export default defineConfig({
  plugins: [
    checker({
      eslint: {
        useFlatConfig: true,
        lintCommand: `eslint "${resolve(__dirname, 'src')}/**/*.{js,mjs,jsx,ts,mts,tsx}"`,
      },
      stylelint: {
        lintCommand: `stylelint "${resolve(__dirname, 'src')}/**/*.{css,scss}"`,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  root,
  base: './',
  publicDir: '../public',
  build: {
    outDir,
    emptyOutDir: true,
    cssCodeSplit: true,
    sourcemap: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      input: pages,
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  preview: {
    port: 4173,
    open: true,
  },
})
