import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg'],
      workbox: {
        // 新 SW 安装好立即激活，不用等所有 tab 关闭
        skipWaiting: true,
        clientsClaim: true,
        // index.html 走网络优先，确保 HTML 永远是最新的（这样新 JS/CSS 哈希才能被引用）
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
            },
          },
        ],
        // 静态资源（带哈希）继续走默认 precache
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'CashFlow',
        short_name: 'CashFlow',
        description: '个人消费管理',
        theme_color: '#0F0F1A',
        background_color: '#0F0F1A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: { host: true, port: 5173 },
})
