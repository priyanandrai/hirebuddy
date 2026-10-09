import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading data...', size = 'default' }) {
  const sizeMap = {
    small: 'h-5 w-5',
    default: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Loader2 className={`animate-spin text-blue-500 ${sizeMap[size] || sizeMap.default}`} />
      {text && <p className="mt-3 text-sm font-medium text-slate-400">{text}</p>}
    </div>
  );
}
