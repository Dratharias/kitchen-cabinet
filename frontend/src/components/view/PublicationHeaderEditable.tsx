import React from 'react';
import { InlineEditField } from './InlineEditField';

interface PublicationHeaderEditableProps {
  title: string;
  isAuthenticated: boolean;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onChange: (value: string) => void;
}

export const PublicationHeaderEditable: React.FC<PublicationHeaderEditableProps> = ({
  title,
  isAuthenticated,
  isEditing,
  editValue,
  onStartEdit,
  onCancel,
  onConfirm,
  onChange,
}) => {
  return (
    <header className="text-center mb-6">
      {isAuthenticated ? (
        <InlineEditField
          fieldId="title"
          value={title}
          isEditing={isEditing}
          editValue={editValue}
          onStartEdit={onStartEdit}
          onCancel={onCancel}
          onConfirm={onConfirm}
          onChange={onChange}
          className="text-3xl font-bold text-white inline-block"
        />
      ) : (
        <h1 className="text-3xl font-bold text-white">{title}</h1>
      )}
    </header>
  );
};