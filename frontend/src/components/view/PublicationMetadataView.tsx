import React from 'react';
import type { Publication } from '../../types';
import { Tag, User, Hash, Clock } from 'lucide-react';

interface PublicationMetadataViewProps {
    publication: Publication | null;
}

const MetadataItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 bg-[#2a2a2a]/60 p-2 rounded-md border border-neutral-700">
            <div className="text-amber-500">{icon}</div>
            <div className="text-sm text-gray-300">
                <span className="font-semibold">{label}:</span> {value}
            </div>
        </div>
    );
};

export const PublicationMetadataView: React.FC<PublicationMetadataViewProps> = ({ publication }) => {
    if (!publication) return null;

    const totalPrepTime = publication.contents?.reduce((acc, content) => acc + (content.total_prep_time || 0), 0);

    return (
        <div className="p-4 border border-gray-700 rounded-lg bg-[#1F1F1F]/80 my-6">
            <h2 className="text-xl font-semibold text-white mb-3">Métadonnées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <MetadataItem icon={<User size={16} />} label="Auteur" value={publication.author?.str_value} />
                <MetadataItem icon={<Hash size={16} />} label="Style" value={publication.style?.str_value} />
                <MetadataItem icon={<Hash size={16} />} label="Type" value={publication.type?.str_value} />
                {totalPrepTime && totalPrepTime > 0 ? <MetadataItem icon={<Clock size={16} />} label="Temps total" value={`${totalPrepTime} min`} /> : null}

                {publication.tags && publication.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 bg-[#2a2a2a]/60 p-2 rounded-md border border-neutral-700 md:col-span-2 lg:col-span-1">
                        <div className="text-amber-500"><Tag size={16} /></div>
                        <span className="text-sm font-semibold text-gray-300 mr-2">Tags:</span>
                        <div className="flex flex-wrap gap-1.5">
                        {publication.tags.map(tag => (
                            <span key={tag.category_id} className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-full">{tag.str_value}</span>
                        ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

