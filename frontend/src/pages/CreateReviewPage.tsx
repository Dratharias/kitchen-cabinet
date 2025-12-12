import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, MessageSquare, Send } from 'lucide-react';
import { DotGrid } from '@/components/ui/DotGrid';
import { FormTextarea } from '@/components/atoms/FormTextarea';
import { ReviewsService } from '@/services/reviews';

export function CreateReviewPage() {
  const { publicationId } = useParams<{ publicationId: string }>();
  const navigate = useNavigate();

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!publicationId) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        publication_id: publicationId,
        rating: rating || null,
        comment: comment.trim() ? [comment.trim()] : [],
        description: description.trim() ? [description.trim()] : [],
      };

      const response = await ReviewsService.create(payload);

      if (response.success) {
        // Redirect back to publication
        navigate(`/publication/${publicationId}`);
      } else {
        setError(response.error || 'Failed to create review');
      }
    } catch (error: any) {
      console.error('Failed to create review:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const dotGridProps = {
    dotSize: 10,
    gap: 15,
    baseColor: '#292929',
    activeColor: '#5B4853',
    proximity: 120,
    shockRadius: 250,
    shockStrength: 5,
    resistance: 750,
    returnDuration: 1.5,
    className: 'bg-[#1F1F1F] min-h-screen py-8',
  };

  return (
    <DotGrid {...dotGridProps}>
      <div className="relative z-20 mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-8 h-8 text-amber-400" />
          <h1 className="text-3xl font-bold text-white">Créer un avis</h1>
        </div>

        <div className="bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Note (optionnel)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-all hover:scale-110 hover:cursor-pointer"
                >
                  <Star
                    size={32}
                    className={
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-600'
                    }
                  />
                </button>
              ))}
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="ml-2 text-sm text-gray-500 hover:text-gray-300 hover:cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <FormTextarea
              label="Commentaire (optionnel)"
              value={comment}
              onChange={setComment}
              placeholder="Partagez votre expérience avec cette recette..."
              rows={4}
            />
          </div>

          {/* Description */}
          <div>
            <FormTextarea
              label="Description détaillée (optionnel)"
              value={description}
              onChange={setDescription}
              placeholder="Notes, modifications apportées, conseils..."
              rows={4}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-red-900/20 border border-red-700/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-neutral-700">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-md border border-neutral-700 text-gray-300 text-sm font-medium hover:bg-neutral-700/50 transition-colors hover:cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:cursor-pointer"
            >
              <Send size={16} />
              {loading ? 'Publication...' : 'Publier l\'avis'}
            </button>
          </div>
        </div>
      </div>
    </DotGrid>
  );
}
