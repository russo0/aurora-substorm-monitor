import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Monitor de Subtempestade de Aurora',
        short_name: 'Aurora Monitor',
        description: 'Dashboard para monitorar subtempestades de aurora ao vivo no Ártico.',
        start_url: '.',
        display: 'standalone',
        background_color: '#183153',
        theme_color: '#32FF8F',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // Só armazena arquivos estáticos do próprio domínio.
        globPatterns: [
          '**/*.{js,css,html,png,svg,ico,webmanifest}'
        ],
        // Dados da NOAA e do Worker devem sempre vir da rede.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(?!app\.ivebeentolapland\.space).*$/,
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ]
});
