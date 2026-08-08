import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest: we own the service worker file (src/sw.js) since it
      // also handles Firebase Cloud Messaging push notifications. The plugin
      // just injects the Workbox precache manifest into it at build time,
      // rather than generating a separate service worker that would conflict
      // with the FCM one for control of the root scope.
      strategies: 'injectManifest',
      srcDir: 'src',
      // Output filename matches what src/lib/messaging.js registers
      // ('/firebase-messaging-sw.js'), so no other code needs to change.
      filename: 'firebase-messaging-sw.js',
      registerType: 'autoUpdate',
      // Without this, the service worker (and therefore FCM push — both
      // background AND foreground, since getToken() needs a registered SW
      // to obtain a push subscription) simply doesn't exist while running
      // `npm run dev`. It's only built during `vite build`. This makes it
      // available locally too, so push can actually be tested pre-deploy.
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'ScholarQ',
        short_name: 'ScholarQ',
        description: 'Smarter school, better future — fee management, attendance, and parent communication for Nigerian schools.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#022448',
        theme_color: '#022448',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})