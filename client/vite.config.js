import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development every request to /api is forwarded to the Express server,
// so the React app and the API behave as if they were on the same origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
