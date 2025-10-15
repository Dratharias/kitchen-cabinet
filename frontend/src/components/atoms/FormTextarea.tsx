import React from "react";

interface FormTextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-400">
          {label}
          {required && <span className="text-amber-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="px-3 py-2 rounded-md border border-gray-600 bg-[#292929] text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
      />
    </div>
  );
};
