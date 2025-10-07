// Declara as variáveis globais que são configuradas no main.tsx
declare global {
  interface Window {
    pdfjsLib: any;
    Tesseract: any;
  }
}

/**
 * Extrai o texto de um arquivo PDF usando OCR no lado do cliente.
 * @param file O arquivo PDF a ser processado.
 * @param signal Um AbortSignal para cancelar a operação.
 * @param onProgress Um callback opcional para relatar o progresso do processamento.
 * @returns Uma promessa que resolve para uma string contendo o texto extraído.
 */
export const extractTextFromPdf = async (
  file: File, 
  signal: AbortSignal,
  onProgress?: (data: { page: number, totalPages: number }) => void
): Promise<string> => {
  // FIX: Replace `Tesseract.Worker` with `any` to fix "Cannot find namespace 'Tesseract'".
  // The Tesseract library is loaded via CDN, so its types are not available at compile time.
  let worker: any | null = null;
  try {
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (err) => reject(err);
      reader.onabort = () => reject(new DOMException('Leitura do arquivo cancelada.', 'AbortError'));
      
      signal.addEventListener('abort', () => reader.abort());
      reader.readAsArrayBuffer(file);
    });
    if (signal.aborted) throw new DOMException('Operação cancelada.', 'AbortError');

    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
    const numPages = pdf.numPages;
    let fullText = '';

    worker = await window.Tesseract.createWorker('por');

    for (let i = 1; i <= numPages; i++) {
      if (signal.aborted) throw new DOMException('Operação cancelada.', 'AbortError');
      onProgress?.({ page: i, totalPages: numPages });
      
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); 
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
          throw new Error('Não foi possível obter o contexto 2D do canvas.');
      }
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      const { data: { text } } = await worker.recognize(canvas);
      fullText += text + '\n\n';
    }

    await worker.terminate();
    worker = null;
    return fullText;

  } catch (error) {
    if (worker) {
      await worker.terminate();
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error; // Repassa o erro de cancelamento
    }
    console.error("Erro durante o OCR no cliente:", error);
    throw new Error("Falha ao extrair texto do PDF. O arquivo pode estar corrompido ou em um formato não suportado.");
  }
};