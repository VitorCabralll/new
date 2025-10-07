import fs from 'fs';
import { createWorker } from 'tesseract.js';

/**
 * Service for extracting text from PDF files using a hybrid approach:
 * 1. First try pdf-parse for text-based PDFs (faster)
 * 2. If that fails or returns poor results, fall back to OCR (slower but works with scanned PDFs)
 */

interface ExtractionResult {
  text: string;
  method: 'pdf-parse' | 'ocr';
  confidence?: number;
}

/**
 * Extracts text from a PDF file using pdf-parse
 */
async function extractWithPdfParse(filePath: string): Promise<string> {
  const pdf = (await import('pdf-parse')).default;
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

/**
 * Extracts text from a PDF file using OCR (Tesseract.js) with pdf-poppler
 */
async function extractWithOCR(filePath: string): Promise<string> {
  const worker = await createWorker('por', 1, {
    logger: m => console.log(m)
  });

  try {
    // Configure tesseract for better accuracy
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüý0123456789.,;:!?()[]{}"\'-/\n\r\t ',
      tessedit_pageseg_mode: 1 as any, // Automatic page segmentation with OSD
      preserve_interword_spaces: '1'
    });

    // Try to use pdf-poppler for better image conversion
    let text = '';
    try {
      const poppler = (await import('pdf-poppler')).default;
      const options = {
        format: 'png',
        out_dir: '/tmp',
        out_prefix: 'page',
        page: null, // All pages
        scale: 2.0 // Higher resolution for better OCR
      };

      const pages = await poppler.convert(filePath, options);

      // OCR each page and combine results
      for (const page of pages) {
        const { data: { text: pageText } } = await worker.recognize(page);
        text += pageText + '\n\n';
        // Clean up temporary image
        try {
          fs.unlinkSync(page);
        } catch (e) {
          console.warn('Failed to cleanup temp file:', page);
        }
      }
    } catch (popplerError) {
      console.log('pdf-poppler failed, using direct OCR:', popplerError);
      // Fallback to direct OCR on PDF
      const { data: { text: directText } } = await worker.recognize(filePath);
      text = directText;
    }

    return text.trim();
  } finally {
    await worker.terminate();
  }
}

/**
 * Determines if the extracted text is of good quality
 */
function isGoodQuality(text: string): boolean {
  // Enhanced heuristics to determine if text extraction was successful
  const trimmed = text.trim();

  // Check if we have substantial text
  if (trimmed.length < 100) return false;

  // Check if text has reasonable word-to-character ratio
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  if (words.length < 20) return false; // Need minimum number of words

  const avgWordLength = trimmed.length / words.length;

  // If average word length is too high, it might be garbled text
  if (avgWordLength > 15 || avgWordLength < 3) return false;

  // Check if we have reasonable amount of spaces (indicates proper word separation)
  const spaceRatio = (trimmed.match(/\s/g) || []).length / trimmed.length;
  if (spaceRatio < 0.08 || spaceRatio > 0.4) return false;

  // Check for legal document indicators
  const legalTerms = ['juiz', 'vara', 'processo', 'requer', 'manifestação', 'crédito', 'art', 'lei'];
  const hasLegalTerms = legalTerms.some(term =>
    trimmed.toLowerCase().includes(term.toLowerCase())
  );

  // Check for suspicious patterns (OCR artifacts)
  const suspiciousPatterns = /[{}\[\]<>|\\]{3,}|[^\w\s.,;:!?()"'-]{5,}/g;
  const hasSuspiciousPatterns = suspiciousPatterns.test(trimmed);

  // Check for reasonable sentence structure
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const hasSentences = sentences.length >= 3;

  return hasLegalTerms && !hasSuspiciousPatterns && hasSentences;
}

/**
 * Main text extraction function with hybrid approach
 */
export async function extractTextFromPDF(filePath: string): Promise<ExtractionResult> {
  try {
    // First attempt: Try pdf-parse (faster for text-based PDFs)
    console.log('Attempting text extraction with pdf-parse...');
    const pdfParseText = await extractWithPdfParse(filePath);

    if (isGoodQuality(pdfParseText)) {
      console.log('Successfully extracted text with pdf-parse');
      return {
        text: pdfParseText,
        method: 'pdf-parse'
      };
    }

    console.log('pdf-parse result was poor quality, falling back to OCR...');
  } catch (error) {
    console.log('pdf-parse failed, falling back to OCR...', error);
  }

  // Fallback: Use OCR for scanned PDFs
  try {
    console.log('Attempting text extraction with OCR...');
    const ocrText = await extractWithOCR(filePath);

    return {
      text: ocrText,
      method: 'ocr'
    };
  } catch (error) {
    console.error('Both pdf-parse and OCR failed:', error);
    throw new Error('Failed to extract text from PDF using both methods');
  }
}