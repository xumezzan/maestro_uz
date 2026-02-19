import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle, MapPin, Calendar, Banknote, Loader2, Mail, Wallet, UserCheck, Star, Send, RefreshCw, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeServiceRequest, generateImprovedDescription } from '../services/geminiService';
import { ServiceCategory, TaskStatus, Specialist } from '../types';

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { addTask, currentUser, specialists } = useAppContext();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [matchingAI, setMatchingAI] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const [query, setQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: ServiceCategory.OTHER,
    location: t('tashkent'),
    budget: '',
    date: ''
  });

  const [recommendedPros, setRecommendedPros] = useState<Specialist[]>([]);
  const [selectedProIds, setSelectedProIds] = useState<string[]>([]);

  // Profi-like Quick Suggestions
  const suggestions = [
    "Уборка квартиры", "Починить кран", "Собрать шкаф",
    "Репетитор по английскому", "Маникюр с выездом"
  ];

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSuggestionClick = (suggestion: string) => {
    // If we clicked a suggestion, we probably want the Russian key for AI, 
    // but displayed as translated. 
    // For simplicity in this demo, suggestions are keys in translation map too.
    setQuery(t(suggestion));
  };

  const handleAIAnalysis = async () => {
    if (!query.trim()) return;

    setLoadingAI(true);
    try {
      const result = await analyzeServiceRequest(query);
      setFormData({
        ...formData,
        title: result.suggestedTitle,
        description: result.suggestedDescription,
        category: result.category,
        budget: result.estimatedPriceRange,
        location: result.location || t('tashkent')
      });
      setStep(2);
    } catch (e) {
      console.error(e);
      setStep(2);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleRegenerateDescription = async () => {
    const sourceText = query || formData.title;
    if (!sourceText) return;

    setIsRegenerating(true);
    try {
      const newDesc = await generateImprovedDescription(formData.title, sourceText);
      setFormData(prev => ({ ...prev, description: newDesc }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleNextToMatching = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
    setMatchingAI(true);

    setTimeout(() => {
      let matched = specialists.filter(s => s.category === formData.category);
      if (matched.length === 0) matched = specialists;
      const finalMatches = matched.sort((a, b) => b.rating - a.rating).slice(0, 3);

      setRecommendedPros(finalMatches);
      setSelectedProIds(finalMatches.map(m => m.id));
      setMatchingAI(false);
    }, 2000);
  };

  const toggleSpecialistSelection = (id: string) => {
    setSelectedProIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleFinalPublish = () => {
    const newTask = {
      id: Date.now().toString(),
      ...formData,
      status: TaskStatus.OPEN,
      createdAt: Date.now(),
      responsesCount: 0
    };
    addTask(newTask);
    navigate('/specialist-dashboard');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 md:py-12 transition-colors duration-200 font-sans">
      <div className="max-w-2xl mx-auto px-4">

        {/* Progress Steps - Cleaner UI */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 rounded-full flex-1 transition-all duration-500 ${step >= s ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden min-h-[500px] flex flex-col">

          {/* STEP 1: Smart Input */}
          {step === 1 && (
            <div className="p-8 flex-1 flex flex-col">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{t('findSpecialistTitle')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{t('describeTask')}</p>

              <div className="flex-1">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('taskPlaceholder')}
                  className="w-full h-40 p-4 rounded-2xl border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 outline-none resize-none transition-all text-lg mb-4"
                />

                {/* Suggestions Chips */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(s)}
                      className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
                    >
                      {t(s)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAIAnalysis}
                disabled={!query.trim() || loadingAI}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 active:scale-[0.99] mt-auto"
              >
                {loadingAI ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('analyze')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t('continue')}
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Details Form */}
          {step === 2 && (
            <form onSubmit={handleNextToMatching} className="p-8 flex-1 flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('taskDetails')}</h2>

              <div className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('taskName')}</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('taskDesc')}</label>
                    <button
                      type="button"
                      onClick={handleRegenerateDescription}
                      disabled={isRegenerating}
                      className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> {t('aiImprove')}
                    </button>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('budget')}</label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.budget}
                        onChange={e => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('district')}</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3 mt-auto">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('back')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
                >
                  {t('findMasters')} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Matching (Same as before but cleaner) */}
          {step === 3 && (
            <div className="p-8 flex-1 flex flex-col">
              {matchingAI ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('matchingPros')}</h3>
                </div>
              ) : (
                <div className="flex flex-col h-full animate-in fade-in">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">{t('recommendedPros')}</h2>

                  <div className="space-y-3 mb-6 overflow-y-auto max-h-[400px]">
                    {recommendedPros.map(pro => (
                      <div
                        key={pro.id}
                        onClick={() => toggleSpecialistSelection(pro.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedProIds.includes(pro.id)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                            : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}
                      >
                        <img src={pro.avatarUrl} alt={pro.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 dark:text-white">{pro.name}</div>
                          <div className="text-sm text-gray-500">{pro.rating} ★ ({pro.reviewsCount} {t('reviews')})</div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedProIds.includes(pro.id) ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300'}`}>
                          {selectedProIds.includes(pro.id) && <CheckCircle className="w-4 h-4" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleFinalPublish}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 mt-auto"
                  >
                    <Send className="w-5 h-5" />
                    {selectedProIds.length > 0 ? `${t('sendToMasters')} (${selectedProIds.length})` : t('publishAll')}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};