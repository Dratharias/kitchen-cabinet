import React from 'react';
import { Edit, Save, X, Eye, Info } from 'lucide-react';
import { Dock } from '../ui/Dock';
import type { DockItemData } from '../ui/Dock';

interface PublicationActionsProps {
    isEditMode: boolean;
    isAuthenticated: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onToggleMetadata?: () => void;
    showMetadata?: boolean;
}

export const PublicationActions: React.FC<PublicationActionsProps> = ({
    isEditMode,
    isAuthenticated,
    onEdit,
    onSave,
    onCancel,
    onToggleMetadata,
    showMetadata,
}) => {
    if (!isAuthenticated) return null;

    const dockItems: DockItemData[] = [];

    if (isEditMode) {
        dockItems.push(
            { icon: <X />, label: 'Annuler', onClick: onCancel, className: "bg-red-500/20 border-red-500/50" },
            { icon: <Save />, label: 'Sauvegarder', onClick: onSave, className: "bg-green-500/20 border-green-500/50" },
        );
    } else {
        dockItems.push(
            { icon: <Edit />, label: 'Modifier', onClick: onEdit }
        );
        if (onToggleMetadata) {
            dockItems.push(
                { icon: <Info />, label: showMetadata ? 'Cacher Métadonnées' : 'Afficher Métadonnées', onClick: onToggleMetadata }
            );
        }
    }

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 h-26 w-fit backdrop-blur-md bg-black/10 p-4 rounded-lg">
            <Dock items={dockItems} />
        </div>
    );
};

