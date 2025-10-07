import React from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-white/20 flex justify-between items-center">
          <h2 className="text-xl font-bold gradient-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-600 hover:text-white text-gray-500 transition-all"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="p-6 text-center">
          {/* Warning Icon com Pulse */}
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full gradient-danger animate-pulse-soft glow-danger">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <p className="text-gray-700 text-base leading-relaxed">{message}</p>
        </div>

        <footer className="p-5 bg-white/50 backdrop-blur-sm border-t border-white/20 rounded-b-2xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary px-5 py-2.5 text-sm font-semibold rounded-xl"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="gradient-danger px-5 py-2.5 border-transparent rounded-xl text-sm font-semibold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;
