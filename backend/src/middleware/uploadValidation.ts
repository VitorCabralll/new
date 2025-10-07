import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

/**
 * Middleware para validar arquivos enviados via upload
 * Verifica tipo, tamanho e validade do PDF
 */

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = ['application/pdf'];
const ALLOWED_EXTENSIONS = ['.pdf'];

/**
 * Valida se o arquivo é um PDF válido verificando o header
 */
function validatePDFHeader(filePath: string): boolean {
  try {
    const buffer = fs.readFileSync(filePath);
    // PDFs começam com "%PDF-"
    const header = buffer.toString('utf8', 0, 5);
    return header === '%PDF-';
  } catch (error) {
    console.error('Erro ao validar header do PDF:', error);
    return false;
  }
}

/**
 * Sanitiza o nome do arquivo removendo caracteres perigosos
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Substitui caracteres especiais por _
    .substring(0, 255); // Limita a 255 caracteres
}

/**
 * Middleware principal de validação de upload
 */
export function validateUpload(req: Request, res: Response, next: NextFunction) {
  const file = req.file;

  // 1. Verificar se arquivo foi enviado
  if (!file) {
    return res.status(400).json({
      message: 'Nenhum arquivo enviado.',
      code: 'NO_FILE'
    });
  }

  // 2. Verificar MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    // Limpar arquivo inválido
    fs.unlinkSync(file.path);
    return res.status(400).json({
      message: 'Tipo de arquivo não permitido. Apenas PDFs são aceitos.',
      code: 'INVALID_MIME_TYPE',
      received: file.mimetype
    });
  }

  // 3. Verificar extensão do arquivo
  const fileExtension = file.originalname.toLowerCase().match(/\.[^.]*$/)?.[0] || '';
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    fs.unlinkSync(file.path);
    return res.status(400).json({
      message: 'Extensão de arquivo não permitida. Use .pdf',
      code: 'INVALID_EXTENSION',
      received: fileExtension
    });
  }

  // 4. Verificar tamanho do arquivo
  if (file.size > MAX_FILE_SIZE) {
    fs.unlinkSync(file.path);
    return res.status(400).json({
      message: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      code: 'FILE_TOO_LARGE',
      size: file.size,
      maxSize: MAX_FILE_SIZE
    });
  }

  // 5. Verificar se é realmente um PDF válido
  if (!validatePDFHeader(file.path)) {
    fs.unlinkSync(file.path);
    return res.status(400).json({
      message: 'Arquivo corrompido ou não é um PDF válido.',
      code: 'INVALID_PDF'
    });
  }

  // Todas as validações passaram
  // Nota: Não modificamos file.originalname para manter o nome original para logs
  next();
}

/**
 * Middleware de tratamento de erros do Multer
 */
export function handleMulterError(err: any, req: Request, res: Response, next: NextFunction) {
  if (err) {
    // Erros do Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Arquivo muito grande',
        code: 'FILE_TOO_LARGE'
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Campo de arquivo inesperado',
        code: 'UNEXPECTED_FIELD'
      });
    }

    // Erro genérico do Multer
    return res.status(400).json({
      message: 'Erro no upload do arquivo',
      code: 'UPLOAD_ERROR',
      error: err.message
    });
  }

  next();
}
