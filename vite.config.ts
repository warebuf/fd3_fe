
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: true,          // so LAN/devices can access if needed
    port: 5173,
    cors: false,         // let the proxy handle it
    proxy: {
		
      '^/backend($|/)': {
        target: 'http://localhost:3000',  
        changeOrigin: true,
        secure: false,
		rewrite: (p) => p.replace(/^\/backend/, ''),                    
      },

      '^/ws($|/)': {
        target: 'ws://localhost:3000',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
