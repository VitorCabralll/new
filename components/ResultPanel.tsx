import React, { useState } from 'react';
import { exportAsTxt, exportAsDocx, exportAsPdf } from '../services/fileExportService';
import { CopyIcon } from './icons/CopyIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { EditIcon } from './icons/EditIcon';
import { Tooltip } from './Tooltip';
import { FileTypeIcon } from './icons/FileTypeIcon';

interface ResultPanelProps {
  resultText: string;
  onReset: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ resultText, onReset }) => {
  const [editedText, setEditedText] = useState(resultText);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };
  
  const safeFileName = `manifestacao-${new Date().toISOString().split('T')[0]}`;

  return (
    <div className="glass-card p-8 rounded-2xl shadow-xl animate-scaleIn">
      <header className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-2">Manifestação Gerada</h2>
          <p className="text-sm text-gray-600">Revise, edite e exporte o documento final.</p>
        </div>
        <button
          onClick={onReset}
          className="btn-secondary px-5 py-2 text-sm font-semibold rounded-xl transition-all"
        >
          Gerar Novo
        </button>
      </header>

      <div className="relative mb-6">
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="w-full h-96 p-5 bg-white/95 border-2 border-gray-200 rounded-xl resize-y focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
          aria-label="Resultado da Manifestação"
        />
        <div className="absolute top-4 right-4 flex space-x-2">
           <Tooltip text={copyStatus === 'copied' ? 'Copiado!' : 'Copiar Texto'}>
            <button
              onClick={handleCopy}
              className={`p-3 rounded-xl transition-all duration-300 ${
                copyStatus === 'copied'
                  ? 'gradient-success text-white glow-success'
                  : 'bg-white/90 hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-600 text-gray-600 hover:text-white shadow-md hover:shadow-lg'
              }`}
            >
                <CopyIcon className="h-5 w-5" />
            </button>
           </Tooltip>
        </div>
      </div>

      <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/20 pt-6">
         <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm">
            <EditIcon className="h-5 w-5 text-purple-500"/>
            <span className="font-medium">Editável diretamente</span>
         </div>
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-700 mr-2">Exportar:</span>
          <Tooltip text="Exportar como TXT">
            <button
              onClick={() => exportAsTxt(editedText, `${safeFileName}.txt`)}
              className="gradient-success flex items-center space-x-2 px-4 py-2.5 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-semibold"
            >
              <DownloadIcon className="h-4 w-4" /> <FileTypeIcon type="TXT" />
            </button>
          </Tooltip>
          <Tooltip text="Exportar como DOCX">
            <button
              onClick={() => exportAsDocx(editedText, `${safeFileName}.docx`)}
              className="gradient-info flex items-center space-x-2 px-4 py-2.5 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-semibold"
            >
              <DownloadIcon className="h-4 w-4" /> <FileTypeIcon type="DOCX" />
            </button>
          </Tooltip>
          <Tooltip text="Exportar como PDF">
            <button
              onClick={() => exportAsPdf(editedText, `${safeFileName}.pdf`)}
              className="gradient-danger flex items-center space-x-2 px-4 py-2.5 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-semibold"
            >
              <DownloadIcon className="h-4 w-4" /> <FileTypeIcon type="PDF" />
            </button>
          </Tooltip>
        </div>
      </footer>
    </div>
  );
};

export default ResultPanel;
