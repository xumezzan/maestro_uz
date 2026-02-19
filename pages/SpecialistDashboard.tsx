import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MapPin, Calendar, Clock, DollarSign, Filter, X, CheckCircle, Search, SlidersHorizontal, Sparkles, Loader2, Tag, Coins } from 'lucide-react';
import { Task, TaskStatus, ServiceCategory, AIAnalysisResult, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { CITIES } from '../constants';
import { analyzeServiceRequest } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';

export const SpecialistDashboard: React.FC = () => {
    const { tasks, currentUser, addResponse, taskResponses } = useAppContext();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterCity, setFilterCity] = useState<string>('ALL');
    const [minPrice, setMinPrice] = useState<string>('');

    // AI Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // State for Response Modal
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [responsePrice, setResponsePrice] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const handleAiSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSelectedTags([]); // Reset tags on new search
        try {
            // Reset manual filters to allow AI to drive discovery
            setFilterCategory('ALL');

            const result = await analyzeServiceRequest(searchQuery);
            setAiAnalysis(result);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setAiAnalysis(null);
        setSelectedTags([]);
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    if (!currentUser) return null;

    // Filter tasks logic
    const filteredTasks = tasks.filter(t => {
        // 1. Must be OPEN
        if (t.status !== TaskStatus.OPEN) return false;

        // 2. Filter by Category (Manual)
        if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;

        // 3. Filter by City (Location contains the city name)
        if (filterCity !== 'ALL' && !t.location.includes(filterCity)) return false;

        // 4. Filter by Min Price
        if (minPrice) {
            const taskPrice = parseInt(t.budget.replace(/\D/g, '')) || 0;
            const filterPriceVal = parseInt(minPrice) || 0;
            if (taskPrice < filterPriceVal) return false;
        }

        // 5. AI Search Logic
        if (aiAnalysis) {
            // If tags are selected manually, enforce them
            if (selectedTags.length > 0) {
                const hasSelectedTag = selectedTags.some(tag =>
                    t.title.toLowerCase().includes(tag.toLowerCase()) ||
                    t.description.toLowerCase().includes(tag.toLowerCase()) ||
                    t.category.toLowerCase().includes(tag.toLowerCase())
                );
                if (!hasSelectedTag) return false;
            }

            // General AI Matching: Category OR Tags OR Text
            const matchesCategory = t.category === aiAnalysis.category;
            const matchesTags = aiAnalysis.relevantTags.some(tag =>
                t.title.toLowerCase().includes(tag.toLowerCase()) ||
                t.description.toLowerCase().includes(tag.toLowerCase())
            );
            const matchesDirectText = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase());

            // If no specific manual tags selected, require at least one AI match
            if (selectedTags.length === 0) {
                if (!matchesCategory && !matchesTags && !matchesDirectText) return false;
            }
        } else if (searchQuery && !aiAnalysis) {
            // Fallback simple text search if AI wasn't triggered or failed
            const matchesDirectText = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesDirectText) return false;
        }

        return true;
    });

    const resetFilters = () => {
        setFilterCategory('ALL');
        setFilterCity('ALL');
        setMinPrice('');
        clearSearch();
    };

    const handleOpenResponseModal = (task: Task) => {
        setSelectedTask(task);
        setResponsePrice('');
        setResponseMessage(t('coverLetterPlaceholder')); // Use translated default
    };

    const handleSubmitResponse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;

        setIsSubmitting(true);
        // Simulate network delay
        setTimeout(() => {
            addResponse(selectedTask.id, responseMessage, parseInt(responsePrice) || 0);
            setIsSubmitting(false);
            setSelectedTask(null);
            // Optional: Show a toast or success feedback
            // alert(t('responseSent'));
        }, 800);
    };

    const hasResponded = (taskId: string) => {
        return taskResponses.some(r => r.taskId === taskId && r.specialistId === currentUser.specialistProfile?.id);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-12 transition-colors duration-200">
            <div className="max-w-6xl mx-auto px-4 pt-8">

                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('taskBoard')}</h1>
                            <p className="text-gray-500 dark:text-gray-400">{t('foundActiveOrders').replace('{{count}}', filteredTasks.length.toString())}</p>
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors shadow-sm whitespace-nowrap ${showFilters
                                    ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-slate-700 dark:border-slate-600 dark:text-white'
                                    : 'bg-white border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                            <span>{showFilters ? t('hideFilters') : t('showFilters')}</span>
                        </button>
                    </div>

                    {/* Smart Search Bar */}
                    <form onSubmit={handleAiSearch} className="relative w-full max-w-3xl">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                                <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('smartSearchPlaceholder')}
                                    className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isSearching || !searchQuery}
                                    className="m-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    <span className="hidden sm:inline">{t('aiSearch')}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm mb-8 animate-in fade-in slide-in-from-top-2">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="ALL">{t('allCategories')}</option>
                                    {Object.values(ServiceCategory).map(cat => (
                                        <option key={cat} value={cat}>{t(cat)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('city')}</label>
                                <select
                                    value={filterCity}
                                    onChange={(e) => setFilterCity(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="ALL">{t('allUzbekistan')}</option>
                                    {CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('minBudget')}</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        placeholder={t('exampleBudget') || "100000"}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={resetFilters}
                                className="text-sm text-gray-500 hover:text-primary-600 underline"
                            >
                                {t('resetAll')}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-4 gap-6">

                    {/* Sidebar with AI Analysis & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* AI Analysis Card */}
                        {aiAnalysis && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-primary-100 dark:border-slate-700 shadow-sm p-5 sticky top-24 transition-colors duration-200 animate-in fade-in slide-in-from-left-2">
                                <div className="flex items-center gap-2 mb-4 text-primary-700 dark:text-primary-400">
                                    <Sparkles className="w-5 h-5 fill-current" />
                                    <span className="font-bold text-sm uppercase tracking-wide">{t('aiMatching')}</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">{t('category')}</span>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{t(aiAnalysis.category)}</p>
                                    </div>

                                    <div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">{t('aiPriceRef')}</span>
                                        <div className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-2 rounded-lg shadow-sm text-center font-bold flex items-center justify-center gap-2 text-xs">
                                            <Coins className="w-3 h-3 opacity-90" />
                                            <span>{aiAnalysis.estimatedPriceRange}</span>
                                        </div>
                                    </div>

                                    {/* Tags Filter */}
                                    {aiAnalysis.relevantTags.length > 0 && (
                                        <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase flex items-center gap-1">
                                                    <Filter className="w-3 h-3" /> {t('tags')}
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
                                                {aiAnalysis.relevantTags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleTag(tag)}
                                                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 ${selectedTags.includes(tag)
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

                        {!aiAnalysis && (
                            <div className="bg-gradient-to-br from-violet-600 to-indigo-900 rounded-2xl p-6 text-white">
                                <h3 className="text-xl font-bold mb-2">{t('getMoreOrders')}</h3>
                                <p className="text-indigo-100 mb-4 text-sm">{t('verifyDocsDesc')}</p>
                                <button className="w-full bg-white text-primary-700 font-bold py-2 rounded-lg text-sm hover:bg-primary-50 transition-colors">
                                    {t('getVerified')}
                                </button>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 hidden lg:block">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('statistics')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{t('availableResponses')}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {taskResponses.filter(r => r.specialistId === currentUser.specialistProfile?.id).length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{t('profileViews')}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">0</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{t('rating')}</span>
                                    <span className="font-bold text-yellow-500 flex items-center gap-1">
                                        {currentUser.specialistProfile?.rating ? (
                                            <>
                                                {currentUser.specialistProfile.rating.toFixed(1)}
                                                <span className="text-gray-400 text-xs">({currentUser.specialistProfile.reviewsCount})</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-sm font-normal">{t('noRatingsYet')}</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="lg:col-span-3 space-y-4">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map(task => {
                                const responded = hasResponded(task.id);
                                return (
                                    <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all group relative">
                                        {responded && (
                                            <div className="absolute top-4 right-4 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                {t('youResponded')}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                                                {t(task.category)}
                                            </span>
                                            <span className="text-sm text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(task.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
                                            {task.title}
                                        </h3>

                                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                                            {task.description}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <MapPin className="w-4 h-4" />
                                                {task.location}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Calendar className="w-4 h-4" />
                                                {task.date || 'По договоренности'}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                                            <div className="font-bold text-lg text-primary-600 dark:text-primary-400">
                                                {task.budget}
                                            </div>
                                            {/* Only show respond button for SPECIALISTS */}
                                            {currentUser?.role === UserRole.SPECIALIST && (
                                                !responded ? (
                                                    <button
                                                        onClick={() => handleOpenResponseModal(task)}
                                                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        {t('respond')}
                                                    </button>
                                                ) : (
                                                    <button disabled className="bg-gray-100 dark:bg-slate-700 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                                                        {t('responseSent')}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-slate-700">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <Search className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('noTasksFound')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">
                                    {aiAnalysis
                                        ? t('aiNoTasksDesc')
                                        : t('noTasksFilterDesc')}
                                </p>
                                <button onClick={resetFilters} className="text-primary-600 font-bold hover:underline">
                                    {t('resetFilters')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Response Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('responseToTask')}</h3>
                            <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{selectedTask.title}</h4>
                                <span className="text-xs text-primary-600 dark:text-primary-400 font-bold">{selectedTask.budget}</span>
                            </div>

                            <form onSubmit={handleSubmitResponse} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('offerPrice')}</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            required
                                            value={responsePrice}
                                            onChange={(e) => setResponsePrice(e.target.value)}
                                            placeholder="100000"
                                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('coverLetter')}</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={responseMessage}
                                        onChange={(e) => setResponseMessage(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                        placeholder={t('coverLetterPlaceholder')}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? t('sending') : t('sendResponse')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};