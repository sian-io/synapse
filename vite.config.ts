import devServer, { defaultOptions } from '@hono/vite-dev-server';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devServer({
      entry: 'server.ts',
      exclude: [
        ...defaultOptions.exclude,
        /^\/(?!api\/).*/,
      ],
    }),
  ],
  server: {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
