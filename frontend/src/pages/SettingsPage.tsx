import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, Bot, LogOut, Check, X, AlertCircle, Copy, Sparkles, ArrowLeft } from 'lucide-react';
import { DotGrid } from '@/components/ui/DotGrid';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { ClaudeCodeService, ClaudeCodeStatus } from '@/services/claude-code';
import { AIService } from '@/services/ai';

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'ai-providers'>('profile');
  const [claudeStatus, setClaudeStatus] = useState<ClaudeCodeStatus | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [claudeInstructions, setClaudeInstructions] = useState<any>(null);
  const [geminiInstructions, setGeminiInstructions] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (activeTab === 'ai-providers') {
      checkAIStatus();
    }
  }, [activeTab]);

  const checkAIStatus = async () => {
    setLoadingStatus(true);
    try {
      // Check Claude Code
      const claudeResponse = await ClaudeCodeService.getStatus();
      if (claudeResponse.success && claudeResponse.data) {
        setClaudeStatus(claudeResponse.data.claudeCode);
      }

      // Check Gemini Code
      const aiHealth = await AIService.getHealth();
      if (aiHealth) {
        setGeminiStatus(aiHealth.geminiCode || null);
      }
    } catch (error) {
      console.error('Failed to check AI providers status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleGetClaudeInstructions = async () => {
    try {
      const response = await ClaudeCodeService.triggerLogin();
      if (response.success && response.data) {
        setClaudeInstructions(response.data);
      }
    } catch (error) {
      console.error('Failed to get Claude login instructions:', error);
    }
  };

  const handleGetGeminiInstructions = () => {
    setGeminiInstructions({
      message: "Pour authentifier Gemini CLI, exécutez la commande suivante:",
      command: "podman exec -it meal-ticket-ai-service gemini-cli",
      steps: [
        "Ouvrez un terminal sur votre machine hôte",
        "Exécutez la commande ci-dessus",
        "Choisissez 'Login with Google' dans le menu",
        "Suivez les instructions OAuth dans votre navigateur",
        "Une fois authentifié, le service AI utilisera votre compte Google",
        "Si vous avez Google One AI Premium, les limites seront plus élevées",
        "Rafraîchissez le statut pour vérifier l'authentification",
      ],
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      <div className="relative z-20 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-400 hover:text-white hover:bg-neutral-700/50 transition-colors hover:cursor-pointer"
            title="Retour à l'accueil"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Settings className="w-8 h-8 text-amber-400" />
          <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-700 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all hover:cursor-pointer ${
              activeTab === 'profile'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <User size={18} />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('ai-providers')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all hover:cursor-pointer ${
              activeTab === 'ai-providers'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Sparkles size={18} />
            Fournisseurs IA
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-4">
                  Gestion du compte
                </h2>
                <p className="text-gray-400 mb-6">
                  Gérez vos paramètres de compte et déconnexion.
                </p>
              </div>

              <div className="border-t border-neutral-700 pt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors hover:cursor-pointer"
                >
                  <LogOut size={18} />
                  Se déconnecter
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Vous serez redirigé vers la page d'accueil
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ai-providers' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-2">
                  Fournisseurs IA
                </h2>
                <p className="text-gray-400 text-sm">
                  Configurez vos outils CLI pour utiliser vos propres abonnements
                </p>
              </div>

              {/* Claude Code Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-gray-200">Claude Code CLI</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Utilisez votre abonnement Anthropic pour la migration de recettes
                </p>

                {/* Claude Status Card */}
                <div className="border border-neutral-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-200">État de l'authentification</h4>
                    <button
                      onClick={checkAIStatus}
                      disabled={loadingStatus}
                      className="px-3 py-1 text-sm rounded-md bg-neutral-700 text-gray-300 hover:bg-neutral-600 transition-colors disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed"
                    >
                      {loadingStatus ? 'Vérification...' : 'Rafraîchir'}
                    </button>
                  </div>

                  {claudeStatus && (
                    <div
                      className={`flex items-start gap-3 p-3 rounded-md ${
                        claudeStatus.status === 'authenticated'
                          ? 'bg-green-900/20 border border-green-700/30'
                          : 'bg-yellow-900/20 border border-yellow-700/30'
                      }`}
                    >
                      {claudeStatus.status === 'authenticated' ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            claudeStatus.status === 'authenticated'
                              ? 'text-green-300'
                              : 'text-yellow-300'
                          }`}
                        >
                          {claudeStatus.status === 'authenticated'
                            ? 'Authentifié'
                            : 'Non authentifié'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {claudeStatus.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Claude Login Instructions */}
                {claudeStatus?.status !== 'authenticated' && (
                  <div className="space-y-4">
                    <button
                      onClick={handleGetClaudeInstructions}
                      className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors hover:cursor-pointer"
                    >
                      Afficher les instructions de connexion
                    </button>

                    {claudeInstructions && (
                      <div className="border border-purple-700/30 bg-purple-900/20 rounded-lg p-4 space-y-4">
                        <p className="text-sm text-purple-300">
                          {claudeInstructions.message}
                        </p>

                        <div className="bg-black/30 rounded-md p-3 font-mono text-sm text-gray-300 flex items-center justify-between">
                          <code>{claudeInstructions.command}</code>
                          <button
                            onClick={() => copyToClipboard(claudeInstructions.command)}
                            className="p-1 hover:bg-white/10 rounded transition-colors hover:cursor-pointer"
                            title="Copier"
                          >
                            <Copy size={16} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-purple-300">Étapes :</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                            {claudeInstructions.steps.map((step: string, index: number) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Gemini Code Section */}
              <div className="space-y-4 pt-6 border-t border-neutral-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-200">Gemini Code Assist</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Utilisez votre compte Google pour la migration de recettes
                </p>

                {/* Gemini Status Card */}
                <div className="border border-neutral-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-200">État de l'authentification</h4>
                    <button
                      onClick={checkAIStatus}
                      disabled={loadingStatus}
                      className="px-3 py-1 text-sm rounded-md bg-neutral-700 text-gray-300 hover:bg-neutral-600 transition-colors disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed"
                    >
                      {loadingStatus ? 'Vérification...' : 'Rafraîchir'}
                    </button>
                  </div>

                  {geminiStatus && (
                    <div
                      className={`flex items-start gap-3 p-3 rounded-md ${
                        geminiStatus.status === 'authenticated'
                          ? 'bg-green-900/20 border border-green-700/30'
                          : 'bg-yellow-900/20 border border-yellow-700/30'
                      }`}
                    >
                      {geminiStatus.status === 'authenticated' ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            geminiStatus.status === 'authenticated'
                              ? 'text-green-300'
                              : 'text-yellow-300'
                          }`}
                        >
                          {geminiStatus.status === 'authenticated'
                            ? 'Authentifié'
                            : 'Non authentifié'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {geminiStatus.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gemini Login Instructions */}
                {geminiStatus?.status !== 'authenticated' && (
                  <div className="space-y-4">
                    <button
                      onClick={handleGetGeminiInstructions}
                      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors hover:cursor-pointer"
                    >
                      Afficher les instructions de connexion
                    </button>

                    {geminiInstructions && (
                      <div className="border border-blue-700/30 bg-blue-900/20 rounded-lg p-4 space-y-4">
                        <p className="text-sm text-blue-300">
                          {geminiInstructions.message}
                        </p>

                        <div className="bg-black/30 rounded-md p-3 font-mono text-sm text-gray-300 flex items-center justify-between">
                          <code>{geminiInstructions.command}</code>
                          <button
                            onClick={() => copyToClipboard(geminiInstructions.command)}
                            className="p-1 hover:bg-white/10 rounded transition-colors hover:cursor-pointer"
                            title="Copier"
                          >
                            <Copy size={16} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-blue-300">Étapes :</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                            {geminiInstructions.steps.map((step: string, index: number) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DotGrid>
  );
}
