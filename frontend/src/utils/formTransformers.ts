import type { Publication } from '../types';
import type { PublicationPayload } from '../types/payloadBuilder';

/**
 * Converts a Publication object from the API into a format suitable for the form state.
 * Specifically, it joins array-based text fields into newline-separated strings.
 */
export function normalizePublicationToForm(pub: Publication): any {
    if (!pub) return null;
    return {
        ...pub,
        description: (pub.description || []).join('\n'),
        note: (pub.note || []).join('\n'),
    };
}

/**
 * Converts form data back into a PublicationPayload suitable for the orchestrator.
 * It splits newline-separated strings back into arrays.
 */
export function denormalizeFormToPublication(formData: any, originalPublication: Publication): PublicationPayload {
    return {
        ...formData,
        publication_id: originalPublication.publication_id,
        description: formData.description ? formData.description.split('\n') : [],
        note: formData.note ? formData.note.split('\n') : [],
    };
}

