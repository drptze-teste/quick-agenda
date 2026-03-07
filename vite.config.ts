import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  // 🚀 A CHAVE PARA RESOLVER A TELA BRANCA:
  // Força o navegador a procurar os arquivos (CSS/JS) no caminho relativo correto
  base: './', 
  
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: false, // HMR is disabled by the platform
  },
  build: {
    // Garante que o build seja limpo e organizado para o Google Cloud
    outDir: 'dist',
    emptyOutDir: true,
  }
});