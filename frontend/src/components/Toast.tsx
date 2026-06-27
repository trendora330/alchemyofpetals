'use client';
import { useEffect } from 'react';
import useStore from '../app/store/useStore';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function Toast() {
  const toast = useStore((state) => state.toast);
  const clearToast = useStore((state) => state.clearToast);

  // Auto-dismiss the popup window after 3.5 seconds cleanly
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const styles = {
    success: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: <CheckCircle className="w-5 h-5 text-emerald-600" /> },
    error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: <XCircle className="w-5 h-5 text-red-600" /> },
    info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: <AlertCircle className="w-5 h-5 text-blue-600" /> }
  };

  const currentStyle = styles[toast.type] || styles.success;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] animate-slide-in-up">
      <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg max-w-sm transition-all duration-300 ${currentStyle.bg}`}>
        <div className="flex-shrink-0">{currentStyle.icon}</div>
        <p className={`text-xs font-bold font-sans pr-4 leading-normal ${currentStyle.text}`}>
          {toast.message}
        </p>
        <button 
          onClick={clearToast}
          className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}