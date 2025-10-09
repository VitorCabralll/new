import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['pdfjs-dist', 'jspdf', 'docx'] // Removido 'tesseract.js'
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // React core em chunk separado
              'react-vendor': ['react', 'react-dom'],

              // Bibliotecas de exportação e PDF
              'document-libs': ['jspdf', 'docx', 'pdfjs-dist'],
            }
          }
        },
        chunkSizeWarningLimit: 600
      }
    };
});
