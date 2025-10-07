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
        include: ['pdfjs-dist', 'tesseract.js', 'jspdf', 'docx']
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // React core em chunk separado
              'react-vendor': ['react', 'react-dom'],

              // Bibliotecas de processamento de documentos (pesadas)
              'pdf-processing': ['pdfjs-dist', 'tesseract.js'],

              // Bibliotecas de exportação
              'document-export': ['jspdf', 'docx'],

              // Google Gemini SDK
              'genai': ['@google/genai']
            }
          }
        },
        chunkSizeWarningLimit: 600
      }
    };
});
