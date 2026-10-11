import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { HUXT_FORECAST_PAGE, HUXT_VIDEO_URL, getHuxtStatus } from './src/utils/huxtStatus.js';

function huxtStatusDevelopmentApi() {
  return {
    name: 'huxt-status-development-api',
    configureServer(server) {
      server.middlewares.use('/api/huxt-status', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');

        if (request.method !== 'GET') {
          response.statusCode = 405;
          response.setHeader('Allow', 'GET');
          response.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          response.end(JSON.stringify(await getHuxtStatus()));
        } catch (error) {
          response.statusCode = 502;
          response.end(JSON.stringify({
            available: false,
            sourceUrl: HUXT_VIDEO_URL,
            forecastPage: HUXT_FORECAST_PAGE,
            checkedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unable to check the HUXt source',
          }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    huxtStatusDevelopmentApi(),
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
