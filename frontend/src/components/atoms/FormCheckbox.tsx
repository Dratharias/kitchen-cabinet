import React from "react";

interface FormCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  checked,
  onChange,
}) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-600 bg-[#292929] text-amber-600 focus:ring-2 focus:ring-amber-500 hover:cursor-pointer"
      />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
};
