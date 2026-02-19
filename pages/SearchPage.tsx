import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Sparkles, Filter, AlertCircle, Coins, ChevronLeft, ChevronRight, X, Tag, Map, List } from 'lucide-react';
import { SpecialistCard } from '../components/SpecialistCard';
import { MapComponent } from '../components/MapComponent';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeServiceRequest } from '../services/geminiService';
import { AIAnalysisResult, Specialist, ServiceCategory } from '../types';

const ITEMS_PER_PAGE = 4;

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const categoryParam = searchParams.get('category');
  const { specialists } = useAppContext(); // Get dynamic list
  const { t } = useLanguage();
  
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>(specialists);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Reset filtered list when global specialists list changes (e.g. user updates profile)
  useEffect(() => {
     setFilteredSpecialists(specialists);
  }, [specialists]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setSelectedTags([]); // Reset tags on new search

      try {
        if (query) {
          // AI Search Flow
          const result = await analyzeServiceRequest(query);
          setAnalysis(result);
          
          const matched = specialists.filter(s => {
             // AI Category Match
             if (s.category === result.category) return true;
             // Tag Match from AI result
             if (result.relevantTags.some(tag => s.tags.includes(tag))) return true;
             return false; 
          });
          setFilteredSpecialists(matched);
        } else if (categoryParam) {
           // Category / Tag Click Flow
           const term = categoryParam.toLowerCase();
           
           const matched = specialists.filter(s => {
                // Direct Enum Match
                if (s.category === categoryParam) return true;
                
                // Tag Match (Partial)
                if (s.tags.some(t => t.toLowerCase().includes(term))) return true;

                // Keyword Mapping for Hero Cards
                const isRepair = term.includes('сантех') || term.includes('электр') || term.includes('плиточ') || term.includes('двери') || term.includes('ремонт');
                if (isRepair && s.category === ServiceCategory.REPAIR) return true;

                const isTutor = term.includes('математ') || term.includes('английс') || term.includes('русский') || term.includes('язык') || term.includes('репетитор');
                if (isTutor && s.category === ServiceCategory.TUTORS) return true;

                const isBeauty = term.includes('маникюр') || term.includes('красота') || term.includes('волос');
                if (isBeauty && s.category === ServiceCategory.BEAUTY) return true;

                // Fallback: Name or Description match
                if (s.name.toLowerCase().includes(term) || s.description.toLowerCase().includes(term)) return true;

                return false;
           });

           setFilteredSpecialists(matched);
           
           // Mock Analysis for visual consistency
           setAnalysis({
             category: ServiceCategory.OTHER, 
             suggestedTitle: `${t('specialist')}: ${t(categoryParam) || categoryParam}`,
             suggestedDescription: "...",
             estimatedPriceRange: "...",
             relevantTags: [categoryParam]
           });
        } else {
            setFilteredSpecialists(specialists);
        }
      } catch (err) {
        setError("AI Error");
        setFilteredSpecialists(specialists);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, categoryParam, specialists]); // Re-run if specialists change

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  // Apply Tag Filters to the base filtered list
  const visibleSpecialists = filteredSpecialists.filter(specialist => {
    if (selectedTags.length === 0) return true;
    // Check if specialist has ANY of the selected tags (Case insensitive)
    return selectedTags.some(selected => 
      specialist.tags.some(specTag => specTag.toLowerCase().includes(selected.toLowerCase())) ||
      specialist.category.toLowerCase().includes(selected.toLowerCase())
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(visibleSpecialists.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedSpecialists = visibleSpecialists.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-md w-full transition-colors duration-200">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('aiSearchLoading')}</h3>
                <p className="text-gray-500 dark:text-gray-400">{t('aiSearchAnalyzing')}</p>
             </div>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="grid lg:grid-cols-4 gap-6">
            
            {/* Sidebar / AI Summary */}
            <div className="lg:col-span-1 space-y-4">
              {analysis && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-primary-100 dark:border-slate-700 shadow-sm p-5 sticky top-24 transition-colors duration-200">
                  <div className="flex items-center gap-2 mb-4 text-primary-700 dark:text-primary-400">
                    <Sparkles className="w-5 h-5 fill-current" />
                    <span className="font-bold text-sm uppercase tracking-wide">{t('aiSummary')}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">{t('aiRequest')}</span>
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{analysis.suggestedTitle}</p>
                    </div>

                    <div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">{t('aiPriceRef')}</span>
                      <div className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-2 rounded-lg shadow-sm text-center font-bold flex items-center justify-center gap-2 text-sm">
                        <Coins className="w-4 h-4 opacity-90" />
                        <span>{analysis.estimatedPriceRange}</span>
                      </div>
                    </div>

                    {/* Tags Filter */}
                    {analysis.relevantTags.length > 0 && (
                      <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase flex items-center gap-1">
                             <Filter className="w-3 h-3" /> {t('aiFilters')}
                           </span>
                           {selectedTags.length > 0 && (
                             <button 
                               onClick={() => setSelectedTags([])}
                               className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                             >
                               <X className="w-3 h-3" /> {t('reset')}
                             </button>
                           )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.relevantTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 ${
                                selectedTags.includes(tag)
                                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                  : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-slate-500'
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
                </div>
              )}
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-6">
               <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                   {t('foundSpecialists').replace('{{count}}', visibleSpecialists.length.toString())}
                 </h2>
                 
                 {/* View Toggle */}
                 <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'list' 
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        <List className="w-4 h-4" />
                        <span>{t('viewList')}</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'map' 
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        <Map className="w-4 h-4" />
                        <span>{t('viewMap')}</span>
                    </button>
                 </div>
               </div>

               {viewMode === 'map' ? (
                   // MAP VIEW
                   <div className="animate-in fade-in duration-300">
                       <MapComponent specialists={visibleSpecialists} />
                   </div>
               ) : (
                   // LIST VIEW
                   <>
                       {visibleSpecialists.length === 0 ? (
                         <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-gray-200 dark:border-slate-700 text-center transition-colors duration-200">
                            <AlertCircle className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-400">
                              {selectedTags.length > 0 
                                ? t('noSpecialistsTags')
                                : t('noSpecialistsFound')}
                            </p>
                            {selectedTags.length > 0 && (
                              <button 
                                onClick={() => setSelectedTags([])}
                                className="mt-4 text-primary-600 font-bold hover:underline"
                              >
                                {t('resetFilters')}
                              </button>
                            )}
                         </div>
                       ) : (
                         <div className="space-y-4">
                           {displayedSpecialists.map(specialist => (
                             <SpecialistCard key={specialist.id} specialist={specialist} />
                           ))}
                         </div>
                       )}

                       {/* Pagination Controls (Only for List view) */}
                       {totalPages > 1 && (
                         <div className="flex items-center justify-center gap-2 mt-8 py-4">
                           <button 
                             onClick={() => handlePageChange(currentPage - 1)}
                             disabled={currentPage === 1}
                             className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             <ChevronLeft className="w-5 h-5" />
                           </button>
                           
                           <div className="flex gap-2">
                             {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                               <button
                                 key={page}
                                 onClick={() => handlePageChange(page)}
                                 className={`w-10 h-10 rounded-lg font-medium transition-colors flex items-center justify-center ${
                                   currentPage === page
                                     ? 'bg-primary-600 text-white shadow-md'
                                     : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300'
                                 }`}
                               >
                                 {page}
                               </button>
                             ))}
                           </div>

                           <button 
                             onClick={() => handlePageChange(currentPage + 1)}
                             disabled={currentPage === totalPages}
                             className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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