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
    <div className="min-h-screen py-8 md:py-12 page-bg">
      <div className="max-w-2xl mx-auto px-4">

        {/* Progress */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${step >= s ? 'bg-fiverr-green' : 'bg-fiverr-border'}`} />
          ))}
        </div>

        <div className="fiverr-card overflow-hidden min-h-[500px] flex flex-col">

          {/* STEP 1: Smart Input */}
          {step === 1 && (
            <div className="p-8 flex-1 flex flex-col">
              <h2 className="text-2xl font-black text-heading mb-2">{t('findSpecialistTitle') || 'Найти специалиста'}</h2>
              <p className="text-fiverr-text-muted mb-6">{t('describeTask') || 'Опишите задачу'}</p>

              <div className="flex-1">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('taskPlaceholder') || 'Что нужно сделать?'}
                  className="w-full h-40 p-4 rounded-xl bg-fiverr-darker border-2 border-fiverr-border text-heading focus:border-fiverr-green outline-none resize-none transition-all text-lg mb-4 placeholder-fiverr-text-dim"
                />

                <div className="flex flex-wrap gap-2 mb-6">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(s)}
                      className="fiverr-tag"
                    >
                      {t(s)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAIAnalysis}
                disabled={!query.trim() || loadingAI}
                className="w-full fiverr-btn fiverr-btn-primary py-4 text-base mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAI ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('analyze') || 'Анализ...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t('continue') || 'Продолжить'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: Details Form */}
          {step === 2 && (
            <form onSubmit={handleNextToMatching} className="p-8 flex-1 flex flex-col">
              <h2 className="text-2xl font-bold text-heading mb-6">{t('taskDetails') || 'Детали задачи'}</h2>

              <div className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">{t('taskName') || 'Название'}</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="fiverr-input"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-fiverr-text-muted">{t('taskDesc') || 'Описание'}</label>
                    <button
                      type="button"
                      onClick={handleRegenerateDescription}
                      disabled={isRegenerating}
                      className="text-xs text-fiverr-green hover:text-fiverr-green-dark font-bold flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> {t('aiImprove') || 'Улучшить AI'}
                    </button>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="fiverr-input resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">{t('budget') || 'Бюджет'}</label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-3.5 w-4 h-4 text-fiverr-text-dim" />
                      <input
                        type="text"
                        value={formData.budget}
                        onChange={e => setFormData({ ...formData, budget: e.target.value })}
                        className="fiverr-input pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">{t('district') || 'Район'}</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-fiverr-text-dim" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="fiverr-input pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3 mt-auto">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl text-fiverr-text-muted font-bold border border-fiverr-border hover:border-fiverr-green hover:text-fiverr-green transition-colors"
                >
                  {t('back') || 'Назад'}
                </button>
                <button
                  type="submit"
                  className="flex-1 fiverr-btn fiverr-btn-primary py-3"
                >
                  {t('findMasters') || 'Найти мастеров'} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Matching */}
          {step === 3 && (
            <div className="p-8 flex-1 flex flex-col">
              {matchingAI ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 text-fiverr-green animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-heading">{t('matchingPros') || 'Ищем специалистов...'}</h3>
                </div>
              ) : (
                <div className="flex flex-col h-full animate-fade-in">
                  <h2 className="text-2xl font-bold text-heading mb-6 text-center">{t('recommendedPros') || 'Рекомендованные'}</h2>

                  <div className="space-y-3 mb-6 overflow-y-auto max-h-[400px]">
                    {recommendedPros.map(pro => (
                      <div
                        key={pro.id}
                        onClick={() => toggleSpecialistSelection(pro.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedProIds.includes(pro.id)
                          ? 'border-fiverr-green bg-fiverr-green/5'
                          : 'border-fiverr-border bg-fiverr-card hover:border-fiverr-green/50'
                          }`}
                      >
                        <img src={pro.avatarUrl} alt={pro.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-fiverr-border" />
                        <div className="flex-1">
                          <div className="font-bold text-heading">{pro.name}</div>
                          <div className="text-sm text-fiverr-text-muted">{pro.rating} ★ ({pro.reviewsCount} {t('reviews') || 'отзывов'})</div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedProIds.includes(pro.id) ? 'border-fiverr-green bg-fiverr-green text-white' : 'border-fiverr-border'}`}>
                          {selectedProIds.includes(pro.id) && <CheckCircle className="w-4 h-4" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleFinalPublish}
                    className="w-full fiverr-btn fiverr-btn-primary py-4 text-base mt-auto"
                  >
                    <Send className="w-5 h-5" />
                    {selectedProIds.length > 0 ? `${t('sendToMasters') || 'Отправить'} (${selectedProIds.length})` : t('publishAll') || 'Опубликовать'}
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