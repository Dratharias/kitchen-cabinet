import React from "react";

interface PublicationInfoViewProps {
  description: string[];
  notes: string[];
}

export const PublicationInfoView: React.FC<PublicationInfoViewProps> = ({ description, notes }) => {
  return (
    <div className="mb-4 text-gray-300 space-y-6">
      {description && description.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-2 border-b border-neutral-700 pb-2">Description</h2>
          <div className="mt-3 space-y-2">
            {description.map((line, i) => <p key={`desc-${i}`} className="whitespace-pre-line leading-relaxed">{line}</p>)}
          </div>
        </div>
      )}
      {notes && notes.length > 0 && (
        <div>
            <h2 className="text-xl font-semibold text-white mb-2 border-b border-neutral-700 pb-2">Notes</h2>
            <div className="mt-3 space-y-2">
                {notes.map((line, i) => <p key={`note-${i}`} className="whitespace-pre-line leading-relaxed text-gray-400">{line}</p>)}
            </div>
        </div>
      )}
    </div>
  );
};
