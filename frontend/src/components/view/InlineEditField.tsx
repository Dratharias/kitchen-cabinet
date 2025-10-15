import React from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface InlineEditFieldProps {
  fieldId: string;
  value: string;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
}

export const InlineEditField: React.FC<InlineEditFieldProps> = ({
  fieldId,
  value,
  isEditing,
  editValue,
  onStartEdit,
  onCancel,
  onConfirm,
  onChange,
  multiline = false,
  className = '',
}) => {
  if (!isEditing) {
    return (
      <div className={`group relative ${className}`}>
        <div className="mr-12">{value}</div>
        <button
          onClick={onStartEdit}
          className="absolute rounded-md right-0 mt-1 bg-neutral-700/80 top-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500 hover:text-amber-400 hover:cursor-pointer"
        >
          <Edit2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {multiline ? (
        <textarea
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-[#2a2a2a] mr-4 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500"
          rows={3}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-[#2a2a2a] mr-4 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-amber-500"
          autoFocus
        />
      )}
      <button
        onClick={onConfirm}
        className="p-2 rounded-md text-green-500 mr-4 bg-neutral-700/60 hover:text-green-400 transition-colors hover:cursor-pointer"
      >
        <Check size={18} />
      </button>
      <button
        onClick={onCancel}
        className="p-2 rounded-md text-red-500 bg-neutral-700/60 hover:text-red-400 transition-colors hover:cursor-pointer"
      >
        <X size={18} />
      </button>
    </div>
  );
};