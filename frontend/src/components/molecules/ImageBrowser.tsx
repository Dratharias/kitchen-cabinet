import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Check } from 'lucide-react';
import { ImagesService, ImageFile } from '@/services/images';

interface ImageBrowserProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
  currentImage?: string | null;
}

export const ImageBrowser: React.FC<ImageBrowserProps> = ({
  onSelect,
  onClose,
  currentImage,
}) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await ImagesService.listImages();
      if (response.success && response.data) {
        setImages(response.data.images);
      } else {
        setError(response.error || 'Failed to load images');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (image: ImageFile) => {
    onSelect(ImagesService.getImageUrl(image.name));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] border border-neutral-700 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-gray-200">
              Bibliothèque d'images
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-neutral-700/50 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Chargement des images...
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64 text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && images.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ImageIcon size={48} className="mb-4 opacity-50" />
              <p>Aucune image disponible</p>
              <p className="text-sm mt-2">
                Ajoutez des images dans le dossier ./images
              </p>
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => {
                const imageUrl = ImagesService.getImageUrl(image.name);
                const isSelected = currentImage === imageUrl;

                return (
                  <button
                    key={image.name}
                    onClick={() => handleSelect(image)}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/50'
                        : 'border-neutral-600 hover:border-amber-400'
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-sm font-medium px-2 text-center break-all">
                        {image.name}
                      </div>
                    </div>

                    {/* Default badge */}
                    {image.isDefault && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-amber-600 text-white text-xs rounded-md font-medium">
                        Défaut
                      </div>
                    )}

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-700 flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {images.length} image(s) disponible(s)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-neutral-600 text-gray-300 hover:bg-neutral-700/50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
