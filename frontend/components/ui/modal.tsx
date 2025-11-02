'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Modal({ isOpen, onClose, children, title, className = '' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={`relative bg-gray-900/95 border border-gray-700 backdrop-blur-sm rounded-lg shadow-2xl max-h-[90vh] overflow-hidden ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
          {children}
        </div>

        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800 z-10"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
}