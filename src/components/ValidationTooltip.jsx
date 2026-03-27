import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ValidationTooltip({ message, position, onClose }) {
  return (
    <div 
      className="validation-tooltip animate-fade-in"
      style={{ 
        left: position.x - 150, 
        top: position.y - 60 
      }}
    >
      <div className="flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-200">Connection Invalid</p>
          <p className="text-xs text-red-300 mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-red-300 hover:text-red-200 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}