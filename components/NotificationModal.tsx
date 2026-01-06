'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faTimes, 
  faExclamationTriangle, 
  faInfoCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useEffect } from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function NotificationModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoClose = true,
  autoCloseDelay = 3000
}: NotificationModalProps) {
  useEffect(() => {
    if (isOpen && autoClose && type !== 'loading') {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose, type]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return faCheck;
      case 'error':
        return faTimes;
      case 'warning':
        return faExclamationTriangle;
      case 'info':
        return faInfoCircle;
      case 'loading':
        return faSpinner;
      default:
        return faInfoCircle;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'loading':
        return 'text-terminal-accent';
      default:
        return 'text-gray-400';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      case 'warning':
        return 'border-yellow-400';
      case 'info':
        return 'border-blue-400';
      case 'loading':
        return 'border-terminal-accent';
      default:
        return 'border-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-terminal-bg rounded-lg border-2 ${getBorderColor()} p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-100`}>
        <div className="flex items-center space-x-4">
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            <FontAwesomeIcon 
              icon={getIcon()} 
              className={`w-6 h-6 ${type === 'loading' ? 'animate-spin' : ''}`} 
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-terminal-accent mb-2">
              {title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {type !== 'loading' && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
            </button>
          )}
        </div>

        {type !== 'loading' && !autoClose && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-terminal-accent text-terminal-bg rounded hover:bg-terminal-accent/90 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        )}

        {type !== 'loading' && autoClose && (
          <div className="mt-4">
            <div className="w-full bg-terminal-border rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all ease-linear ${
                  type === 'success' ? 'bg-green-400' :
                  type === 'error' ? 'bg-red-400' :
                  type === 'warning' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`}
                style={{
                  width: '100%',
                  animation: `shrink ${autoCloseDelay}ms linear forwards`
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
