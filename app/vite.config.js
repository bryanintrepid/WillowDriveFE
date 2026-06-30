import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules'],
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'slash-div'],
      },
    },
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  server: {
    // host:true binds 0.0.0.0 so a tablet on the same LAN can reach the dev server.
    host: true,
    // Forward /api to the local .NET API. secure:false accepts the API's dev
    // self-signed cert, so the tablet never has to trust it directly -- it only
    // talks plain HTTP to Vite, which proxies to https://localhost:7077 here.
    proxy: {
      '/api': {
        target: 'https://localhost:7077',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
