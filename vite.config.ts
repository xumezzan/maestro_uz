import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cwd } from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, cwd(), '');
  
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1';
  const wsProxyTarget = env.VITE_WS_PROXY_TARGET || apiProxyTarget;

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env so the code using process.env.API_KEY doesn't crash
      'process.env': env
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: wsProxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
