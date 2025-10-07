

import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  id: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, disabled = false, id }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      onFileChange(file);
    } else {
        alert("Por favor, selecione um arquivo PDF.");
    }
  }, [onFileChange, disabled]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files && e.target.files[0];
     if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      onFileChange(file);
    } else {
        alert("Por favor, selecione um arquivo PDF.");
        e.target.value = '';
    }
  };

  const handleClick = () => {
    if (disabled) return;
    document.getElementById(id)?.click();
  }

  return (
    <div
      className={`file-upload-area p-8 text-center transition-all duration-300 ${
        isDragging ? 'dragover scale-105' : ''
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${
        fileName ? 'border-green-500 bg-green-50/30' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input type="file" id={id} className="hidden" accept=".pdf" onChange={handleFileSelect} disabled={disabled} />

      {fileName ? (
        <div className="animate-scaleIn">
          <div className="checkmark-circle mx-auto mb-4">
            <svg className="checkmark-icon w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-green-700 mb-2">Arquivo carregado com sucesso!</p>
          <div className="badge-gradient mx-auto inline-block">
            {fileName}
          </div>
        </div>
      ) : (
        <div className={isDragging ? 'animate-bounce-soft' : ''}>
          <div className="relative inline-block mb-4">
            <UploadIcon
              className={`h-14 w-14 transition-all duration-300 ${
                isDragging
                  ? 'scale-110'
                  : ''
              }`}
              style={{
                color: isDragging ? '#8b5cf6' : '#a855f7',
                filter: isDragging ? 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.6))' : 'none'
              }}
            />
          </div>
          <p className="text-base text-gray-700 font-medium mb-2">
            <span className="gradient-text font-bold">Clique para selecionar</span> ou arraste e solte
          </p>
          <p className="text-xs text-gray-500">Somente arquivos PDF • Máx. 50MB</p>
        </div>
      )}
    </div>
  );
};