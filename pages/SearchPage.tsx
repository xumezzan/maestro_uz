import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Sparkles, Filter, AlertCircle, Coins, ChevronLeft, ChevronRight, X, Tag, Map, List, Grid3X3, SlidersHorizontal } from 'lucide-react';
import { SpecialistCard } from '../components/SpecialistCard';
import { MapComponent } from '../components/MapComponent';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeServiceRequest } from '../services/geminiService';
import { AIAnalysisResult, Specialist, ServiceCategory } from '../types';
import { matchSpecialists } from '../services/matchingAlgorithm';

const ITEMS_PER_PAGE = 6;

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const categoryParam = searchParams.get('category');
  const { specialists } = useAppContext();
  const { t } = useLanguage();

  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>(specialists);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setFilteredSpecialists(specialists);
  }, [specialists]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setSelectedTags([]);

      try {
        if (query) {
          const result = await analyzeServiceRequest(query);
          setAnalysis(result);

          const matched = matchSpecialists(specialists, {
            aiAnalysis: result,
            keyword: query
          });

          setFilteredSpecialists(matched);
        } else if (categoryParam) {
          const term = categoryParam.toLowerCase();

          const mockAnalysis = {
            category: ServiceCategory.OTHER,
            suggestedTitle: `${t('specialist')}: ${t(categoryParam) || categoryParam}`,
            suggestedDescription: "...",
            estimatedPriceRange: "...",
            relevantTags: [categoryParam]
          };

          // Hardcode mappings or use AI, but fallback to manual keyword match
          const isRepair = term.includes('сантех') || term.includes('электр') || term.includes('плиточ') || term.includes('двери') || term.includes('ремонт');
          if (isRepair) Object.assign(mockAnalysis, { category: ServiceCategory.REPAIR });

          const isTutor = term.includes('математ') || term.includes('английс') || term.includes('русский') || term.includes('язык') || term.includes('репетитор');
          if (isTutor) Object.assign(mockAnalysis, { category: ServiceCategory.TUTORS });

          const isBeauty = term.includes('маникюр') || term.includes('красота') || term.includes('волос');
          if (isBeauty) Object.assign(mockAnalysis, { category: ServiceCategory.BEAUTY });

          const matched = matchSpecialists(specialists, {
            category: mockAnalysis.category,
            keyword: term,
            tags: [term]
          });

          setFilteredSpecialists(matched.length > 0 ? matched : specialists);
          setAnalysis(mockAnalysis);
        } else {
          setFilteredSpecialists(specialists.sort((a, b) => b.rating - a.rating));
        }
      } catch (err) {
        setError("AI Error");
        setFilteredSpecialists(specialists);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, categoryParam, specialists]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const visibleSpecialists = filteredSpecialists.filter(specialist => {
    if (selectedTags.length === 0) return true;
    return selectedTags.some(selected =>
      specialist.tags.some(specTag => specTag.toLowerCase().includes(selected.toLowerCase())) ||
      specialist.category.toLowerCase().includes(selected.toLowerCase())
    );
  });

  const totalPages = Math.ceil(visibleSpecialists.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedSpecialists = visibleSpecialists.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-20 page-bg">
      <div className="fiverr-container pt-6">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="fiverr-card p-8 max-w-md w-full">
              <Loader2 className="w-10 h-10 text-fiverr-green animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold text-heading mb-2">{t('aiSearchLoading') || 'Ищем специалистов...'}</h3>
              <p className="text-fiverr-text-muted">{t('aiSearchAnalyzing') || 'AI анализирует ваш запрос'}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="grid lg:grid-cols-4 gap-6">

            {/* Sidebar */}
            <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {analysis && (
                <div className="fiverr-card p-5 sticky top-24 space-y-5">
                  <div className="flex items-center gap-2 text-fiverr-green">
                    <Sparkles className="w-5 h-5 fill-current" />
                    <span className="font-bold text-sm uppercase tracking-wide">{t('aiSummary') || 'AI Анализ'}</span>
                  </div>

                  <div>
                    <span className="text-xs text-fiverr-text-dim font-bold uppercase">{t('aiRequest') || 'Запрос'}</span>
                    <p className="text-sm text-heading font-medium mt-1">{analysis.suggestedTitle}</p>
                  </div>

                  <div>
                    <span className="text-xs text-fiverr-text-dim font-bold uppercase">{t('aiPriceRef') || 'Цена'}</span>
                    <div className="mt-2 bg-fiverr-green/10 border border-fiverr-green/20 text-fiverr-green px-3 py-2 rounded-lg text-center font-bold flex items-center justify-center gap-2 text-sm">
                      <Coins className="w-4 h-4 opacity-90" />
                      <span>{analysis.estimatedPriceRange}</span>
                    </div>
                  </div>

                  {analysis.relevantTags.length > 0 && (
                    <div className="pt-4 border-t border-fiverr-border">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-fiverr-text-dim font-bold uppercase flex items-center gap-1">
                          <Filter className="w-3 h-3" /> {t('aiFilters') || 'Фильтры'}
                        </span>
                        {selectedTags.length > 0 && (
                          <button
                            onClick={() => setSelectedTags([])}
                            className="text-xs text-fiverr-red hover:text-fiverr-red/80 font-medium flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> {t('reset') || 'Сбросить'}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.relevantTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${selectedTags.includes(tag)
                              ? 'bg-fiverr-green text-white border-fiverr-green'
                              : 'bg-transparent text-fiverr-text-muted border-fiverr-border hover:border-fiverr-green hover:text-fiverr-green'
                              }`}
                          >
                            <Tag className="w-3 h-3" />
                            {t(tag) || tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-heading">
                  {t('foundSpecialists')?.replace('{{count}}', visibleSpecialists.length.toString()) || `Найдено: ${visibleSpecialists.length}`}
                </h2>

                <div className="flex items-center gap-2">
                  {/* Mobile filter toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium fiverr-card hover:border-fiverr-green transition-colors text-fiverr-text-muted"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>

                  {/* View Toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-fiverr-border">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 text-sm transition-colors ${viewMode === 'grid' ? 'bg-fiverr-green text-white' : 'text-fiverr-text-muted hover:text-heading bg-fiverr-card'}`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 text-sm transition-colors ${viewMode === 'list' ? 'bg-fiverr-green text-white' : 'text-fiverr-text-muted hover:text-heading bg-fiverr-card'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`px-3 py-2 text-sm transition-colors ${viewMode === 'map' ? 'bg-fiverr-green text-white' : 'text-fiverr-text-muted hover:text-heading bg-fiverr-card'}`}
                    >
                      <Map className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'map' ? (
                <div className="animate-fade-in">
                  <MapComponent specialists={visibleSpecialists} />
                </div>
              ) : (
                <>
                  {visibleSpecialists.length === 0 ? (
                    <div className="fiverr-card p-10 text-center">
                      <AlertCircle className="w-10 h-10 text-fiverr-text-dim mx-auto mb-3" />
                      <p className="text-fiverr-text-muted">
                        {selectedTags.length > 0
                          ? t('noSpecialistsTags') || 'Не найдено по фильтрам'
                          : t('noSpecialistsFound') || 'Специалисты не найдены'}
                      </p>
                      {selectedTags.length > 0 && (
                        <button
                          onClick={() => setSelectedTags([])}
                          className="mt-4 text-fiverr-green font-bold hover:underline"
                        >
                          {t('resetFilters') || 'Сбросить фильтры'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4'}>
                      {displayedSpecialists.map(specialist => (
                        <SpecialistCard key={specialist.id} specialist={specialist} />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 py-4">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg fiverr-card text-fiverr-text-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-fiverr-green transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors flex items-center justify-center text-sm ${currentPage === page
                              ? 'bg-fiverr-green text-white'
                              : 'fiverr-card text-fiverr-text-muted hover:border-fiverr-green'
                              }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg fiverr-card text-fiverr-text-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-fiverr-green transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};