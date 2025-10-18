import React from "react";

interface FormInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  required?: boolean;
  disabled?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-400">
          {label}
          {required && <span className="text-amber-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="px-3 py-2 rounded-md border border-gray-600 bg-[#292929] text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-700/50 disabled:cursor-not-allowed"
      />
    </div>
  );
};
