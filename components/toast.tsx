'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Toast notification component
 */
export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-[var(--status-success)] text-white',
    error: 'bg-[var(--status-error)] text-white',
    info: 'bg-[var(--status-info)] text-white',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-4">
      <div
        className={`
          flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] shadow-lg
          ${typeStyles[type]}
        `}
        role="alert"
      >
        <span className="text-lg">{icons[type]}</span>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for managing toast state
 */
export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  return {
    toast,
    showToast,
    hideToast,
  };
}
