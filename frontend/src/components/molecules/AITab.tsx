import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { AIService, AIProvider } from '@/services/ai';
import { FormTextarea } from '../atoms/FormTextarea';

interface AITabProps {
  onMigrationComplete: (payload: any) => void;
}

export const AITab: React.FC<AITabProps> = ({ onMigrationComplete }) => {
  const [rawRecipe, setRawRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');

  useEffect(() => {
    // Check available AI providers on mount
    AIService.getHealth()
      .then((health) => {
        setAvailableProviders(health.providers.available);
      })
      .catch((err) => {
        console.error('Failed to check AI service:', err);
      });
  }, []);

  const handleMigrate = async () => {
    if (!rawRecipe.trim()) {
      setError('Veuillez entrer une recette à migrer');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await AIService.migrateRecipe({
        rawRecipe,
        provider: selectedProvider as any,
      });

      if (response.success && response.data) {
        setSuccess(`Migration réussie avec ${response.data.provider} !`);

        // Call parent callback with the migrated payload
        onMigrationComplete(response.data.payload);

        // Clear form after short delay
        setTimeout(() => {
          setRawRecipe('');
          setSuccess(null);
        }, 2000);
      } else {
        setError(response.error || 'Échec de la migration');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la migration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-lg">
        <Bot className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-purple-300 mb-2">
            Migration AI de Recettes
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            Collez une recette mal formatée ci-dessous. L'IA va la restructurer
            automatiquement selon notre format avec sections, ingrédients et
            étapes bien organisés.
          </p>
        </div>
      </div>

      {/* Provider selection */}
      {availableProviders.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">Modèle IA:</label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-1.5 bg-neutral-800 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:cursor-pointer"
          >
            <option value="auto">Auto (meilleur disponible)</option>
            {availableProviders.includes('claude-code') && (
              <option value="claude-code">Claude Code CLI (Votre abonnement Anthropic)</option>
            )}
            {availableProviders.includes('gemini-code') && (
              <option value="gemini-code">Gemini Code Assist (Votre compte Google)</option>
            )}
            {availableProviders.includes('claude') && (
              <option value="claude">Anthropic Claude API</option>
            )}
            {availableProviders.includes('openai') && (
              <option value="openai">OpenAI GPT-4</option>
            )}
            {availableProviders.includes('gemini') && (
              <option value="gemini">Google Gemini API</option>
            )}
          </select>
          <span className="text-xs text-gray-500">
            {availableProviders.length} modèle(s) disponible(s)
          </span>
        </div>
      )}

      {/* Input textarea */}
      <div>
        <FormTextarea
          label="Recette brute (copier-coller)"
          value={rawRecipe}
          onChange={setRawRecipe}
          placeholder={`Exemple:

Pancakes fluffy

Ingrédients:
- 200g farine
- 2 oeufs
- 300ml lait
- 50g beurre fondu
- 2 c. à café levure
- pincée de sel
- 2 c. à soupe sucre

Préparation:
1. Mélanger farine, levure, sel et sucre
2. Battre oeufs puis ajouter lait et beurre
3. Incorporer au sec, ne pas trop mélanger
4. Cuire à la poêle jusqu'à formation de bulles
5. Retourner et cuire l'autre côté
6. Servir chaud avec sirop d'érable`}
          rows={15}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-300">{success}</p>
        </div>
      )}

      {/* Action button */}
      <div className="flex justify-end">
        <button
          onClick={handleMigrate}
          disabled={loading || !rawRecipe.trim() || availableProviders.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-purple-500/30 hover:cursor-pointer"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Migration en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Migrer avec l'IA
            </>
          )}
        </button>
      </div>

      {availableProviders.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-300">
            Aucun modèle IA configuré. Configurez au moins une clé API dans le
            service AI (.env).
          </p>
        </div>
      )}
    </div>
  );
};
