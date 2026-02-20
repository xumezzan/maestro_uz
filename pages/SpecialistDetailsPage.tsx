import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Star, BadgeCheck, MessageSquare, Heart, ArrowLeft,
    Share2, Shield, Clock, Image as ImageIcon, Check, UserCheck, ChevronRight, AlertCircle, Banknote, Sparkles, X, Send
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

interface Review {
    id: number;
    author_name: string;
    author_avatar?: string;
    text: string;
    score_overall: number;
    score_punctuality: number;
    score_quality: number;
    score_friendliness: number;
    score_honesty: number;
    created_at: string;
}

export const SpecialistDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser, toggleFavorite, startChat, conversations, specialists } = useAppContext();
    const { t } = useLanguage();

    const specialist = specialists.find(s => s.id === id) ||
        (currentUser?.role === 'SPECIALIST' && currentUser.specialistProfile?.id === id ? currentUser.specialistProfile : null);

    const [activeTab, setActiveTab] = useState<'about' | 'services' | 'reviews' | 'portfolio'>('services');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        text: '', score_overall: 5, score_punctuality: 5,
        score_quality: 5, score_friendliness: 5, score_honesty: 5
    });
    const [submittingReview, setSubmittingReview] = useState(false);

    const existingConversation = conversations.find(c => c.participantId === id);
    const [isSelected, setIsSelected] = useState(!!existingConversation);

    useEffect(() => {
        setIsSelected(!!existingConversation);
    }, [existingConversation]);

    useEffect(() => {
        if (id && activeTab === 'reviews') {
            setLoadingReviews(true);
            fetch(`http://localhost:8000/api/reviews/?specialist=${id}`)
                .then(r => r.json())
                .then(data => setReviews(Array.isArray(data) ? data : data.results || []))
                .catch(() => { })
                .finally(() => setLoadingReviews(false));
        }
    }, [id, activeTab]);

    const handleSubmitReview = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) { navigate('/login'); return; }
        setSubmittingReview(true);
        try {
            const res = await fetch('http://localhost:8000/api/reviews/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...reviewForm, specialist: parseInt(id || '0') })
            });
            if (res.ok) {
                const newReview = await res.json();
                setReviews(prev => [newReview, ...prev]);
                setShowReviewModal(false);
            }
        } catch (e) { }
        finally { setSubmittingReview(false); }
    };

    if (!specialist) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 page-bg">
                <h2 className="text-2xl font-bold text-heading mb-2">{t('specialistNotFound')}</h2>
                <button onClick={() => navigate(-1)} className="text-fiverr-green hover:underline">{t('goBack')}</button>
            </div>
        );
    }

    const isFavorite = currentUser?.favorites?.includes(specialist.id);

    const handleToggleFavorite = () => {
        if (!currentUser) { navigate('/login'); return; }
        toggleFavorite(specialist.id);
    };

    const handleSelectSpecialist = () => {
        if (!currentUser) { navigate('/login'); return; }
        setIsSelected(true);
    };

    const handleStartChat = () => {
        if (!currentUser) { navigate('/login'); return; }
        startChat(specialist.id);
        const existing = conversations.find(c => c.participantId === specialist.id);
        if (existing) navigate(`/messages?id=${existing.id}`);
        else navigate(`/messages?participantId=${specialist.id}`);
    };

    const mockServices = [
        { name: t('consultation'), price: t('free') || 'Бесплатно' },
        { name: t('homeVisit'), price: `${t('from') || 'от'} 50 000 UZS` },
        { name: t('diagnostic'), price: `${t('from') || 'от'} 80 000 UZS` },
        { name: t('mainWork'), price: `${new Intl.NumberFormat('ru-RU').format(specialist.priceStart)} UZS` },
        { name: t('urgent'), price: '+ 50%' },
    ];

    const ratingDistribution = [
        { stars: 5, count: specialist.reviewsCount - 2, percent: '85%' },
        { stars: 4, count: 2, percent: '10%' },
        { stars: 3, count: 0, percent: '0%' },
        { stars: 2, count: 0, percent: '0%' },
        { stars: 1, count: 0, percent: '0%' },
    ];

    const mockReviews = Array.from({ length: 3 }).map((_, i) => ({
        id: i,
        author: ['Азиз К.', 'Мадина Р.', 'Дмитрий В.'][i],
        rating: 5,
        date: ['2 дня назад', '12 августа', '30 июля'][i],
        task: ['Установка смесителя', 'Уборка квартиры', 'Ремонт розетки'][i],
        text: ['Отличный специалист! Сделал все быстро и качественно.', 'Рекомендую, очень вежливый и профессиональный подход.', 'Цена соответствует качеству. Спасибо!'][i]
    }));

    const mockPortfolio = [1, 2, 3, 4, 5, 6].map(i => `https://picsum.photos/400/300?random=${parseInt(specialist.id) * 10 + i}`);

    return (
        <div className="min-h-screen pb-24 md:pb-12 page-bg">

            {/* Top Bar */}
            <div className="sticky top-0 z-30 border-b border-fiverr-border page-bg">
                <div className="fiverr-container h-14 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-fiverr-text-muted hover:text-heading transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">{t('back') || 'Назад'}</span>
                    </button>
                    <div className="font-bold text-heading truncate max-w-[200px] sm:max-w-md">{specialist.name}</div>
                    <button className="p-2 text-fiverr-text-muted hover:text-heading rounded-lg hover:bg-white/5 transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="fiverr-container py-6 grid lg:grid-cols-12 gap-6">

                {/* Sidebar */}
                <div className="lg:col-span-4">
                    <div className="fiverr-card p-6 sticky top-20">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="relative mb-4">
                                <img
                                    src={specialist.avatarUrl}
                                    alt={specialist.name}
                                    className="w-28 h-28 rounded-full object-cover ring-4 ring-fiverr-border"
                                />
                                {specialist.verified && (
                                    <div className="absolute bottom-0 right-0 bg-fiverr-card rounded-full p-1 shadow-sm border border-fiverr-border">
                                        <BadgeCheck className="w-6 h-6 text-fiverr-green fill-fiverr-darker" />
                                    </div>
                                )}
                            </div>

                            <h1 className="text-xl font-bold text-heading mb-1">{specialist.name}</h1>
                            <p className="text-fiverr-text-muted text-sm font-medium mb-3">{t(specialist.category)}</p>

                            <div className="flex items-center gap-2 text-sm text-fiverr-text-dim mb-4">
                                <MapPin className="w-4 h-4" />
                                {t(specialist.location)}
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap justify-center gap-2 mb-2">
                                <span className="fiverr-badge fiverr-badge-green">
                                    <Shield className="w-3 h-3" /> {t('verifiedPassport')}
                                </span>
                                <span className="fiverr-badge fiverr-badge-blue">
                                    <Check className="w-3 h-3" /> {t('verifiedPhone')}
                                </span>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden lg:block space-y-3 pt-4 border-t border-fiverr-border">
                            <div className="text-center mb-4">
                                <span className="text-3xl font-black text-white">{specialist.rating}</span>
                                <div className="flex justify-center text-fiverr-yellow my-1">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                                </div>
                                <span className="text-sm text-fiverr-text-muted">{specialist.reviewsCount} {t('reviewsCount')}</span>
                            </div>

                            {!isSelected ? (
                                <button
                                    onClick={handleSelectSpecialist}
                                    className="w-full fiverr-btn fiverr-btn-primary py-3.5"
                                >
                                    <UserCheck className="w-5 h-5" />
                                    {t('selectSpecialist')}
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleStartChat}
                                        className="w-full fiverr-btn fiverr-btn-primary py-3.5"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        {t('writeToChat')}
                                    </button>
                                    <div className="text-fiverr-text-dim px-4 py-2 rounded-lg text-center text-xs bg-white/5 border border-fiverr-border">
                                        {t('chatNotice')}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleToggleFavorite}
                                className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium border ${isFavorite
                                    ? 'text-fiverr-red border-fiverr-red/30 bg-fiverr-red/5'
                                    : 'text-fiverr-text-muted border-fiverr-border hover:border-fiverr-green hover:text-fiverr-green'
                                    }`}
                            >
                                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                                {isFavorite ? t('inFavorites') : t('addToFavorites')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Tabs */}
                    <div className="fiverr-card overflow-hidden">
                        <div className="flex border-b border-fiverr-border overflow-x-auto">
                            {[
                                { id: 'services', label: t('tabServices') || 'Услуги' },
                                { id: 'reviews', label: `${t('tabReviews') || 'Отзывы'} ${specialist.reviewsCount}` },
                                { id: 'portfolio', label: t('tabPortfolio') || 'Портфолио' },
                                { id: 'about', label: t('tabAbout') || 'О специалисте' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 min-w-[100px] px-5 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-fiverr-green text-fiverr-green'
                                        : 'border-transparent text-fiverr-text-muted hover:text-heading'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 sm:p-8 min-h-[300px]">

                            {activeTab === 'services' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-heading">{t('priceList') || 'Прайс-лист'}</h3>
                                        <Banknote className="w-5 h-5 text-fiverr-text-dim" />
                                    </div>

                                    <div className="divide-y divide-fiverr-border">
                                        {mockServices.map((service, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-4 hover:bg-white/3 -mx-4 px-4 rounded-lg transition-colors">
                                                <span className="text-fiverr-text font-medium">{service.name}</span>
                                                <span className="font-bold text-heading">{service.price}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-fiverr-blue/10 border border-fiverr-blue/20 p-4 rounded-xl flex gap-3 text-sm text-fiverr-blue mt-6">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p>{t('priceDisclaimer')}</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'about' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h3 className="text-lg font-bold text-heading mb-3">{t('aboutSpecialist') || 'О специалисте'}</h3>
                                        <p className="text-fiverr-text-muted leading-relaxed whitespace-pre-line">
                                            {t(specialist.description) || t('noDescription')}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-fiverr-text-dim uppercase tracking-wider mb-3">{t('skills') || 'Навыки'}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {specialist.tags.map(tag => (
                                                <span key={tag} className="fiverr-tag">{t(tag) || tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'portfolio' && (
                                <div className="animate-fade-in">
                                    <h3 className="text-xl font-bold text-heading mb-6">{t('photos') || 'Фото'} ({mockPortfolio.length})</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {mockPortfolio.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-fiverr-card group relative cursor-zoom-in border border-fiverr-border">
                                                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-8 animate-fade-in">
                                    {/* Rating Summary */}
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="flex flex-col items-center justify-center bg-white/5 border border-fiverr-border p-6 rounded-2xl min-w-[140px]">
                                            <span className="text-4xl font-black text-white mb-2">{specialist.rating}</span>
                                            <div className="flex text-fiverr-yellow mb-1">
                                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                                            </div>
                                            <span className="text-sm text-fiverr-text-muted">{specialist.reviewsCount || reviews.length} {t('reviews') || 'отзывов'}</span>
                                        </div>

                                        {/* Sub-score bars */}
                                        <div className="flex-1 w-full space-y-3">
                                            {[
                                                { label: '⏰ Пунктуальность', key: 'score_punctuality' },
                                                { label: '🏆 Качество', key: 'score_quality' },
                                                { label: '😊 Вежливость', key: 'score_friendliness' },
                                                { label: '🤝 Честность', key: 'score_honesty' },
                                            ].map(({ label, key }) => {
                                                const avg = reviews.length > 0
                                                    ? reviews.reduce((sum, r) => sum + (r[key as keyof Review] as number), 0) / reviews.length
                                                    : 5;
                                                return (
                                                    <div key={key} className="flex items-center gap-3 text-sm">
                                                        <div className="w-36 font-medium text-fiverr-text-muted text-xs">{label}</div>
                                                        <div className="flex-1 h-2 bg-fiverr-card border border-fiverr-border rounded-full overflow-hidden">
                                                            <div className="h-full bg-fiverr-green rounded-full transition-all duration-500" style={{ width: `${(avg / 5) * 100}%` }} />
                                                        </div>
                                                        <div className="w-8 text-fiverr-text-dim text-right font-bold">{avg.toFixed(1)}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Leave Review button (clients only) */}
                                    {currentUser?.role === 'CLIENT' && (
                                        <button
                                            onClick={() => setShowReviewModal(true)}
                                            className="w-full py-3 fiverr-btn fiverr-btn-primary flex items-center justify-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Оставить отзыв
                                        </button>
                                    )}

                                    {/* Review list */}
                                    <div className="space-y-6">
                                        {loadingReviews && <p className="text-center text-fiverr-text-dim py-4">Загрузка...</p>}
                                        {!loadingReviews && reviews.length === 0 && (
                                            <p className="text-center text-fiverr-text-dim py-8">Отзывов пока нет. Будьте первым!</p>
                                        )}
                                        {reviews.map((review) => (
                                            <div key={review.id} className="border-b border-fiverr-border last:border-0 pb-6 last:pb-0">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-fiverr-green/20 flex items-center justify-center text-fiverr-green font-bold">
                                                            {review.author_name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-heading">{review.author_name || 'Аноним'}</div>
                                                            <div className="flex text-fiverr-yellow mt-0.5">
                                                                {[...Array(review.score_overall)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-fiverr-text-dim">
                                                        {new Date(review.created_at).toLocaleDateString('ru-RU')}
                                                    </span>
                                                </div>
                                                <p className="text-fiverr-text-muted text-sm leading-relaxed mb-3">{review.text}</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-fiverr-text-dim">
                                                    <span>⏰ {review.score_punctuality}/5</span>
                                                    <span>🏆 {review.score_quality}/5</span>
                                                    <span>😊 {review.score_friendliness}/5</span>
                                                    <span>🤝 {review.score_honesty}/5</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Footer */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-fiverr-border p-4 lg:hidden z-40 page-bg"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
                <div className="flex gap-3 max-w-lg mx-auto">
                    {!isSelected ? (
                        <button
                            onClick={handleSelectSpecialist}
                            className="flex-1 fiverr-btn fiverr-btn-primary py-3"
                        >
                            {t('selectSpecialist')}
                        </button>
                    ) : (
                        <button
                            onClick={handleStartChat}
                            className="flex-1 fiverr-btn fiverr-btn-primary py-3"
                        >
                            <MessageSquare className="w-5 h-5" />
                            {t('write') || 'Написать'}
                        </button>
                    )}
                    <button
                        onClick={handleToggleFavorite}
                        className={`p-3 rounded-xl border-2 transition-colors ${isFavorite
                            ? 'border-fiverr-red/30 bg-fiverr-red/10 text-fiverr-red'
                            : 'border-fiverr-border text-fiverr-text-muted'
                            }`}
                    >
                        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ===== Leave Review Modal ===== */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-fiverr-card border border-fiverr-border rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-heading flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-fiverr-green" /> Оставить отзыв
                            </h3>
                            <button onClick={() => setShowReviewModal(false)} className="text-fiverr-text-dim hover:text-heading">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: '⭐ Общая оценка', key: 'score_overall' },
                                { label: '⏰ Пунктуальность', key: 'score_punctuality' },
                                { label: '🏆 Качество работы', key: 'score_quality' },
                                { label: '😊 Вежливость', key: 'score_friendliness' },
                                { label: '🤝 Честность', key: 'score_honesty' },
                            ].map(({ label, key }) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-sm text-fiverr-text-muted">{label}</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setReviewForm(prev => ({ ...prev, [key]: val }))}
                                                className={`w-8 h-8 rounded-lg text-lg transition-transform hover:scale-110 ${(reviewForm[key as keyof typeof reviewForm] as number) >= val
                                                        ? 'text-fiverr-yellow'
                                                        : 'text-fiverr-border'
                                                    }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <textarea
                                value={reviewForm.text}
                                onChange={e => setReviewForm(prev => ({ ...prev, text: e.target.value }))}
                                placeholder="Расскажите подробнее о работе специалиста..."
                                className="w-full fiverr-input resize-none mt-2"
                                rows={3}
                            />
                        </div>

                        <button
                            onClick={handleSubmitReview}
                            disabled={submittingReview}
                            className="w-full fiverr-btn fiverr-btn-primary py-3 mt-6 flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {submittingReview ? 'Отправка...' : 'Отправить отзыв'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};