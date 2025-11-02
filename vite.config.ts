
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// configures vite dev server, forwards requests to /backend to localhost:3000
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
        ws: true,
		    rewrite: (p) => p.replace(/^\/backend/, ''),                    
      },

    }
  }
});
