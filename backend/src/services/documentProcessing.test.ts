
import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractTextFromPDF } from './textExtractor.js';
import { processDocumentWithChunking } from './documentChunker.js';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Document Processing Pipeline', () => {
  const testFiles = [
    { name: '1040464-06.2024.8.11.0041-1734122764279-4062496-processo.pdf', type: 'processo_completo' },
    { name: '1016035-72.2024.8.11.0041 - CBA - Hab. Crédito Trab - intimação.pdf', type: 'manifestacao' },
    { name: '1028881-24.2024.8.11.0041 - CBA - Hab. Crédito - fav. ao pedido.pdf', type: 'manifestacao' },
    { name: '1028910-74.2024.8.11.0041 - CBA - Hab. Crédito Trab - Favorável + Honorarios.pdf', type: 'manifestacao' }
  ];

  for (const file of testFiles) {
    it(`should process document: ${file.name}`, async () => {
      const documentPath = path.resolve(__dirname, '..', '..', 'test', 'data', file.name);

      // 1. Test Text Extraction
      const extractionResult = await extractTextFromPDF(documentPath);
      
      expect(extractionResult).toBeDefined();
      expect(extractionResult.text).toBeTypeOf('string');
      expect(extractionResult.text.length).toBeGreaterThan(100); // Basic check for non-empty content

      // 2. Test Document Chunking
      const chunkingResult = await processDocumentWithChunking(extractionResult.text, 'default');

      expect(chunkingResult).toBeDefined();
      expect(chunkingResult.strategy).toBeDefined();
      expect(chunkingResult.chunks).toBeInstanceOf(Array);
      expect(chunkingResult.chunks.length).toBeGreaterThan(0);
      expect(chunkingResult.totalTokens).toBeGreaterThan(0);

      // Example of a more specific assertion
      if (file.name.includes('1040464-06')) {
        // Based on the previous manual run, we expect a lot of chunks for this one.
        expect(chunkingResult.chunks.length).toBe(11); 
      }
    });
  }
});
