import React from "react";
import { InlineEditField } from "./InlineEditField";

interface PublicationDescriptionEditableProps {
  description: string[];
  isAuthenticated: boolean;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onChange: (value: string) => void;
}

export const PublicationDescriptionEditable: React.FC<
  PublicationDescriptionEditableProps
> = ({
  description,
  isAuthenticated,
  isEditing,
  editValue,
  onStartEdit,
  onCancel,
  onConfirm,
  onChange,
}) => {
  if (description.length === 0) return null;

  const fullDescription = description.join("\n");

  return (
    <div className="mb-4">
      {isAuthenticated ? (
        <InlineEditField
          fieldId="description"
          value={fullDescription}
          isEditing={isEditing}
          editValue={editValue}
          onStartEdit={onStartEdit}
          onCancel={onCancel}
          onConfirm={onConfirm}
          onChange={onChange}
          multiline
          className="text-gray-300"
        />
      ) : (
        <ul className="space-y-1 text-gray-300">
          {description.map((line: string, i: number) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
