import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MapPin, Calendar, Clock, Banknote, Filter, X, CheckCircle, Search, SlidersHorizontal, Sparkles, Loader2, Tag, Coins, BarChart2, Star, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react';
import { Task, TaskStatus, ServiceCategory, AIAnalysisResult, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { CITIES } from '../constants';
import { analyzeServiceRequest } from '../services/geminiService';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const SpecialistDashboard: React.FC = () => {
    const { tasks, currentUser, addResponse, taskResponses } = useAppContext();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState<'tasks' | 'analytics'>('tasks');
    const [stats, setStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterCity, setFilterCity] = useState<string>('ALL');
    const [minPrice, setMinPrice] = useState<string>('');

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [responsePrice, setResponsePrice] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!currentUser) navigate('/login');
    }, [currentUser, navigate]);

    useEffect(() => {
        if (activeTab === 'analytics') {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            setLoadingStats(true);
            const fetchStats = async () => {
                try {
                    const response = await api.get('/specialists/my-stats/');
                    setStats(response.data);
                } catch (error) {
                    console.error("Failed to fetch stats", error);
                } finally {
                    setLoadingStats(false);
                }
            };
            fetchStats();
        }
    }, [activeTab]);

    const handleAiSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSelectedTags([]);
        try {
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

    const filteredTasks = tasks.filter(t => {
        if (t.status !== TaskStatus.OPEN) return false;
        if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
        if (filterCity !== 'ALL' && !t.location.includes(filterCity)) return false;
        if (minPrice) {
            const taskPrice = parseInt(t.budget.replace(/\D/g, '')) || 0;
            const filterPriceVal = parseInt(minPrice) || 0;
            if (taskPrice < filterPriceVal) return false;
        }
        if (aiAnalysis) {
            if (selectedTags.length > 0) {
                const hasSelectedTag = selectedTags.some(tag =>
                    t.title.toLowerCase().includes(tag.toLowerCase()) ||
                    t.description.toLowerCase().includes(tag.toLowerCase()) ||
                    t.category.toLowerCase().includes(tag.toLowerCase())
                );
                if (!hasSelectedTag) return false;
            }
            const matchesCategory = t.category === aiAnalysis.category;
            const matchesTags = aiAnalysis.relevantTags.some(tag =>
                t.title.toLowerCase().includes(tag.toLowerCase()) ||
                t.description.toLowerCase().includes(tag.toLowerCase())
            );
            const matchesDirectText = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase());
            if (selectedTags.length === 0) {
                if (!matchesCategory && !matchesTags && !matchesDirectText) return false;
            }
        } else if (searchQuery && !aiAnalysis) {
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
        setResponseMessage(t('coverLetterPlaceholder'));
    };

    const handleSubmitResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        setIsSubmitting(true);
        await addResponse(selectedTask.id, responseMessage, parseInt(responsePrice) || 0);
        setIsSubmitting(false);
        setSelectedTask(null);
    };

    const hasResponded = (taskId: string) => {
        return taskResponses.some(r => r.taskId === taskId && r.specialistId === currentUser.specialistProfile?.id);
    };

    return (
        <div className="min-h-screen pb-12 page-bg">
            <div className="fiverr-container pt-8">

                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-heading">
                                {activeTab === 'tasks' ? (t('taskBoard') || 'Доска заказов') : '📊 Аналитика'}
                            </h1>
                            <p className="text-fiverr-text-muted">
                                {activeTab === 'tasks'
                                    ? (t('foundActiveOrders')?.replace('{{count}}', filteredTasks.length.toString()) || `Активных: ${filteredTasks.length}`)
                                    : 'Ваша персональная статистика'}
                            </p>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex rounded-xl overflow-hidden border border-fiverr-border">
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-colors ${activeTab === 'tasks'
                                    ? 'bg-fiverr-green text-white'
                                    : 'text-fiverr-text-muted hover:text-heading'
                                    }`}
                            >
                                <Search className="w-4 h-4" /> Заказы
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-colors ${activeTab === 'analytics'
                                    ? 'bg-fiverr-green text-white'
                                    : 'text-fiverr-text-muted hover:text-heading'
                                    }`}
                            >
                                <BarChart2 className="w-4 h-4" /> Аналитика
                            </button>
                        </div>
                    </div>

                    {/* Search Bar — only in tasks tab */}
                    {activeTab === 'tasks' && (
                        <form onSubmit={handleAiSearch} className="relative w-full max-w-3xl">
                            <div className="flex items-center fiverr-card overflow-hidden" style={{ border: '2px solid #333355' }}>
                                <Search className="w-5 h-5 text-fiverr-text-dim ml-4 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('smartSearchPlaceholder') || 'AI поиск заказов...'}
                                    className="w-full px-4 py-3 bg-transparent border-none outline-none text-heading placeholder-fiverr-text-dim"
                                />
                                {searchQuery && (
                                    <button type="button" onClick={clearSearch} className="p-2 text-fiverr-text-muted hover:text-heading mr-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isSearching || !searchQuery}
                                    className="m-1 px-4 py-2 bg-fiverr-green hover:bg-fiverr-green-dark text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    <span className="hidden sm:inline">{t('aiSearch') || 'AI Поиск'}</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* ===== ANALYTICS PANEL ===== */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6 animate-fade-in">
                        {loadingStats && (
                            <div className="text-center py-20 text-fiverr-text-dim">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-fiverr-green" />
                                <p>Загружаем статистику...</p>
                            </div>
                        )}
                        {!loadingStats && stats && !stats.error && (
                            <>
                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { icon: <Wallet className="w-6 h-6" />, label: 'Баланс', value: `${new Intl.NumberFormat('ru-RU').format(stats.balance)} UZS`, color: 'text-fiverr-green', bg: 'bg-fiverr-green/10' },
                                        { icon: <TrendingUp className="w-6 h-6" />, label: 'Всего заработано', value: `${new Intl.NumberFormat('ru-RU').format(stats.total_earnings)} UZS`, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                        { icon: <Star className="w-6 h-6" />, label: 'Рейтинг', value: `${stats.rating} ★ (${stats.reviews_count})`, color: 'text-fiverr-yellow', bg: 'bg-fiverr-yellow/10' },
                                        { icon: <BarChart2 className="w-6 h-6" />, label: 'Конверсия', value: `${stats.conversion_rate}%`, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                                    ].map(kpi => (
                                        <div key={kpi.label} className="fiverr-card p-5 flex flex-col gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                                                {kpi.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs text-fiverr-text-dim mb-1">{kpi.label}</p>
                                                <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Conversion Funnel */}
                                <div className="fiverr-card p-6">
                                    <h3 className="font-bold text-heading mb-4 flex items-center gap-2">
                                        <ArrowUpRight className="w-5 h-5 text-fiverr-green" /> Воронка откликов
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-fiverr-text-muted">Откликов отправлено</span>
                                                <span className="font-bold text-heading">{stats.total_responses}</span>
                                            </div>
                                            <div className="h-2.5 bg-fiverr-card border border-fiverr-border rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-400 rounded-full" style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-fiverr-text-muted">Принято заказчиком</span>
                                                <span className="font-bold text-heading">{stats.accepted_responses}</span>
                                            </div>
                                            <div className="h-2.5 bg-fiverr-card border border-fiverr-border rounded-full overflow-hidden">
                                                <div className="h-full bg-fiverr-green rounded-full transition-all duration-700"
                                                    style={{ width: stats.total_responses > 0 ? `${stats.conversion_rate}%` : '0%' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-fiverr-text-dim mt-4">
                                        Конверсия: <span className="font-bold text-fiverr-green">{stats.conversion_rate}%</span>
                                        {stats.conversion_rate >= 30 ? ' 🔥 Отличный результат!' : stats.conversion_rate > 0 ? ' — есть куда расти' : ''}
                                    </p>
                                </div>

                                {/* Recent Reviews */}
                                <div className="fiverr-card p-6">
                                    <h3 className="font-bold text-heading mb-4 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-fiverr-yellow" /> Последние отзывы
                                    </h3>
                                    {stats.recent_reviews.length === 0 ? (
                                        <p className="text-fiverr-text-dim text-sm">Отзывов пока нет. Выполните первый заказ!</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {stats.recent_reviews.map((rv: any, i: number) => (
                                                <div key={i} className="flex gap-3 pb-4 border-b border-fiverr-border last:border-0 last:pb-0">
                                                    <div className="w-9 h-9 rounded-full bg-fiverr-green/20 flex items-center justify-center text-fiverr-green font-bold flex-shrink-0">
                                                        {rv.author?.[0] || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-heading text-sm">{rv.author}</span>
                                                            <span className="text-xs text-fiverr-text-dim">{rv.created_at}</span>
                                                        </div>
                                                        <div className="flex text-fiverr-yellow text-xs mb-1">
                                                            {'★'.repeat(rv.score_overall)}{'☆'.repeat(5 - rv.score_overall)}
                                                        </div>
                                                        <p className="text-fiverr-text-muted text-sm truncate">{rv.text || 'Без комментария'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {!loadingStats && stats?.error && (
                            <div className="fiverr-card p-8 text-center text-fiverr-text-dim">
                                <p>Профиль специалиста не найден. <a href="/#/onboarding" className="text-fiverr-green hover:underline">Создать профиль →</a></p>
                            </div>
                        )}
                    </div>
                )}

                {/* Filter Panel — only in tasks tab */}
                {activeTab === 'tasks' && showFilters && (

                    <div className="fiverr-card p-6 mb-8 animate-fade-in">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">{t('category') || 'Категория'}</label>
                                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                                    className="fiverr-input">
                                    <option value="ALL">{t('allCategories') || 'Все'}</option>
                                    {Object.values(ServiceCategory).map(cat => (
                                        <option key={cat} value={cat}>{t(cat)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">{t('city') || 'Город'}</label>
                                <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
                                    className="fiverr-input">
                                    <option value="ALL">{t('allUzbekistan') || 'Весь Узбекистан'}</option>
                                    {CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">{t('minBudget') || 'Мин. бюджет'}</label>
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-3 w-4 h-4 text-fiverr-text-dim" />
                                    <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                                        placeholder="100000" className="fiverr-input pl-9" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={resetFilters} className="text-sm text-fiverr-green hover:underline">{t('resetAll') || 'Сбросить'}</button>
                        </div>
                    </div>
                )}

                {/* Task board grid — only in tasks tab */}
                {activeTab === 'tasks' && (
                    <div className="grid lg:grid-cols-4 gap-6">

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {aiAnalysis && (
                                <div className="fiverr-card p-5 sticky top-24 animate-fade-in">
                                    <div className="flex items-center gap-2 mb-4 text-fiverr-green">
                                        <Sparkles className="w-5 h-5 fill-current" />
                                        <span className="font-bold text-sm uppercase tracking-wide">{t('aiMatching') || 'AI Анализ'}</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs text-fiverr-text-dim font-bold uppercase">{t('category') || 'Категория'}</span>
                                            <p className="text-sm text-heading font-medium">{t(aiAnalysis.category)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-fiverr-text-dim font-bold uppercase">{t('aiPriceRef') || 'Цена'}</span>
                                            <div className="mt-2 bg-fiverr-green/10 border border-fiverr-green/20 text-fiverr-green px-3 py-2 rounded-lg text-center font-bold flex items-center justify-center gap-2 text-xs">
                                                <Coins className="w-3 h-3" />
                                                <span>{aiAnalysis.estimatedPriceRange}</span>
                                            </div>
                                        </div>
                                        {aiAnalysis.relevantTags.length > 0 && (
                                            <div className="pt-4 border-t border-fiverr-border">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs text-fiverr-text-dim font-bold uppercase flex items-center gap-1">
                                                        <Filter className="w-3 h-3" /> {t('tags') || 'Теги'}
                                                    </span>
                                                    {selectedTags.length > 0 && (
                                                        <button onClick={() => setSelectedTags([])} className="text-xs text-fiverr-red font-medium flex items-center gap-1">
                                                            <X className="w-3 h-3" /> {t('reset') || 'Сброс'}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {aiAnalysis.relevantTags.map(tag => (
                                                        <button key={tag} onClick={() => toggleTag(tag)}
                                                            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${selectedTags.includes(tag)
                                                                ? 'bg-fiverr-green text-white border-fiverr-green'
                                                                : 'text-fiverr-text-muted border-fiverr-border hover:border-fiverr-green hover:text-fiverr-green'
                                                                }`}>
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
                                <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1dbf73 0%, #0e8c56 100%)' }}>
                                    <h3 className="text-xl font-bold mb-2">{t('getMoreOrders') || 'Больше заказов'}</h3>
                                    <p className="text-white/80 mb-4 text-sm">{t('verifyDocsDesc') || 'Подтвердите документы'}</p>
                                    <button className="w-full bg-white text-fiverr-green font-bold py-2 rounded-lg text-sm hover:bg-white/90 transition-colors">
                                        {t('getVerified') || 'Подтвердить'}
                                    </button>
                                </div>
                            )}

                            <div className="fiverr-card p-6 hidden lg:block">
                                <h3 className="font-bold text-heading mb-4">{t('statistics') || 'Статистика'}</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-fiverr-text-muted">{t('availableResponses') || 'Отклики'}</span>
                                        <span className="font-bold text-heading">{taskResponses.filter(r => r.specialistId === currentUser.specialistProfile?.id).length}</span>
                                    </div>
                                    {/* TODO: Connect to backend for actual profile views */}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-fiverr-text-muted">{t('profileViews') || 'Просмотры'}</span>
                                        <span className="font-bold text-heading">-</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-fiverr-text-muted">{t('rating') || 'Рейтинг'}</span>
                                        <span className="font-bold text-fiverr-yellow flex items-center gap-1">
                                            {currentUser.specialistProfile?.rating ? (
                                                <>
                                                    {currentUser.specialistProfile.rating.toFixed(1)}
                                                    <span className="text-fiverr-text-dim text-xs">({currentUser.specialistProfile.reviewsCount})</span>
                                                </>
                                            ) : (
                                                <span className="text-fiverr-text-dim text-sm font-normal">{t('noRatingsYet') || '—'}</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm pt-4 border-t border-fiverr-border">
                                        <span className="text-fiverr-text-muted flex items-center gap-1">
                                            <Coins className="w-4 h-4" /> {t('balance') || 'Баланс'}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-bold text-heading ${(currentUser.specialistProfile?.balance || 0) < 5000 ? 'text-fiverr-red' : ''}`}>
                                                {currentUser.specialistProfile?.balance || 0} UZS
                                            </span>
                                            <button
                                                onClick={() => navigate('/top-up')}
                                                className="text-xs bg-fiverr-green/10 text-fiverr-green hover:bg-fiverr-green hover:text-white px-2 py-1 rounded transition-colors"
                                            >
                                                {t('topUp') || 'Пополнить'}
                                            </button>
                                        </div>
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
                                        <div key={task.id} className="fiverr-card p-6 group relative">
                                            {responded && (
                                                <div className="absolute top-4 right-4 fiverr-badge fiverr-badge-green">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {t('youResponded') || 'Вы откликнулись'}
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start mb-3">
                                                <span className="fiverr-badge fiverr-badge-green text-xs">{t(task.category)}</span>
                                                <span className="text-sm text-fiverr-text-dim flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(task.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-heading mb-2 group-hover:text-fiverr-green transition-colors">
                                                {task.title}
                                            </h3>

                                            <p className="text-fiverr-text-muted text-sm mb-4 line-clamp-2">
                                                {task.description}
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                                <div className="flex items-center gap-2 text-fiverr-text-dim">
                                                    <MapPin className="w-4 h-4" />
                                                    {task.location}
                                                </div>
                                                <div className="flex items-center gap-2 text-fiverr-text-dim">
                                                    <Calendar className="w-4 h-4" />
                                                    {task.date || 'По договоренности'}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-fiverr-border">
                                                <div className="font-bold text-lg text-fiverr-green">
                                                    {task.budget}
                                                </div>
                                                {currentUser?.role === UserRole.SPECIALIST && (
                                                    !responded ? (
                                                        <button
                                                            onClick={() => handleOpenResponseModal(task)}
                                                            className="fiverr-btn fiverr-btn-primary text-sm px-5 py-2"
                                                        >
                                                            {t('respond') || 'Откликнуться'}
                                                        </button>
                                                    ) : (
                                                        <button disabled className="px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed text-fiverr-text-dim bg-white/5 border border-fiverr-border">
                                                            {t('responseSent') || 'Отклик отправлен'}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="fiverr-card p-12 text-center border-2 border-dashed border-fiverr-border">
                                    <div className="w-16 h-16 bg-fiverr-card border border-fiverr-border rounded-full flex items-center justify-center mx-auto mb-4 text-fiverr-text-dim">
                                        <Search className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-heading text-lg">{t('noTasksFound') || 'Заказов не найдено'}</h3>
                                    <p className="text-fiverr-text-muted mt-1 mb-4">
                                        {aiAnalysis ? t('aiNoTasksDesc') : t('noTasksFilterDesc') || 'Попробуйте изменить фильтры'}
                                    </p>
                                    <button onClick={resetFilters} className="text-fiverr-green font-bold hover:underline">
                                        {t('resetFilters') || 'Сбросить фильтры'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )} {/* end tasks grid */}

            </div> {/* end fiverr-container */}

            {/* Response Modal */}
            {
                selectedTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="fiverr-card w-full max-w-md overflow-hidden">
                            <div className="p-4 border-b border-fiverr-border flex justify-between items-center">
                                <h3 className="font-bold text-lg text-heading">{t('responseToTask') || 'Отклик'}</h3>
                                <button onClick={() => setSelectedTask(null)} className="text-fiverr-text-muted hover:text-heading">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-6 bg-white/5 border border-fiverr-border p-3 rounded-lg">
                                    <h4 className="font-medium text-heading text-sm mb-1">{selectedTask.title}</h4>
                                    <span className="text-xs text-fiverr-green font-bold">{selectedTask.budget}</span>
                                </div>

                                <form onSubmit={handleSubmitResponse} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">{t('offerPrice') || 'Ваша цена'}</label>
                                        <div className="relative">
                                            <Banknote className="absolute left-3 top-3 w-4 h-4 text-fiverr-text-dim" />
                                            <input
                                                type="number"
                                                required
                                                value={responsePrice}
                                                onChange={(e) => setResponsePrice(e.target.value)}
                                                placeholder="100000"
                                                className="fiverr-input pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">{t('coverLetter') || 'Сопроводительное'}</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={responseMessage}
                                            onChange={(e) => setResponseMessage(e.target.value)}
                                            className="fiverr-input resize-none"
                                            placeholder={t('coverLetterPlaceholder')}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full fiverr-btn fiverr-btn-primary py-3"
                                    >
                                        {isSubmitting ? t('sending') || 'Отправка...' : t('sendResponse') || 'Отправить отклик'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};