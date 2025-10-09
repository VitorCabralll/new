/**
 * Application configuration
 * Centralizes all environment-dependent settings
 */

// API Base URL - defaults to localhost in development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API Endpoints
export const API_ENDPOINTS = {
  generate: `${API_BASE_URL}/api/generate`,
  userAgents: `${API_BASE_URL}/api/training/user-agents`, // Endpoint para listar UserAgents
  sessions: `${API_BASE_URL}/api/sessions`,
  audit: `${API_BASE_URL}/api/audit`,
} as const;

// Request timeouts (in milliseconds)
export const TIMEOUTS = {
  default: 120000, // 2 minutes
  generation: 300000, // 5 minutes for AI generation
  ocr: 180000, // 3 minutes for OCR
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
} as const;
