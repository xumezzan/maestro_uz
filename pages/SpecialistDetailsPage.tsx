import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Star, BadgeCheck, MessageSquare, Heart, ArrowLeft, 
  Share2, Shield, Clock, Image as ImageIcon, Check, UserCheck, ChevronRight, AlertCircle, Banknote
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export const SpecialistDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, toggleFavorite, startChat, conversations, specialists } = useAppContext();
  const { t } = useLanguage();
  
  const specialist = specialists.find(s => s.id === id) || 
                     (currentUser?.role === 'SPECIALIST' && currentUser.specialistProfile?.id === id ? currentUser.specialistProfile : null);

  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'reviews' | 'portfolio'>('services');
  
  const existingConversation = conversations.find(c => c.participantId === id);
  const [isSelected, setIsSelected] = useState(!!existingConversation);

  useEffect(() => {
    setIsSelected(!!existingConversation);
  }, [existingConversation]);

  if (!specialist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 text-center p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('specialistNotFound')}</h2>
        <button 
          onClick={() => navigate(-1)}
          className="text-primary-600 hover:underline"
        >
          {t('goBack')}
        </button>
      </div>
    );
  }

  const isFavorite = currentUser?.favorites?.includes(specialist.id);

  const handleToggleFavorite = () => {
    if (!currentUser) {
        navigate('/login');
        return;
    }
    toggleFavorite(specialist.id);
  };

  const handleSelectSpecialist = () => {
    if (!currentUser) {
        navigate('/login');
        return;
    }
    setIsSelected(true);
  };

  const handleStartChat = () => {
    if (!currentUser) {
        navigate('/login');
        return;
    }
    startChat(specialist.id);
    const existing = conversations.find(c => c.participantId === specialist.id);
    if (existing) {
        navigate(`/messages?id=${existing.id}`);
    } else {
        navigate(`/messages?participantId=${specialist.id}`);
    }
  };

  // --- MOCK DATA FOR PROFI.RU FEEL ---

  // Mock Price List (Essential for Profi feel)
  const mockServices = [
      { name: t('consultation'), price: t('free') },
      { name: t('homeVisit'), price: `${t('from')} 50 000 UZS` },
      { name: t('diagnostic'), price: `${t('from')} 80 000 UZS` },
      { name: t('mainWork'), price: `${new Intl.NumberFormat('ru-RU').format(specialist.priceStart)} UZS` },
      { name: t('urgent'), price: '+ 50%' },
  ];

  // Mock Rating Distribution
  const ratingDistribution = [
      { stars: 5, count: specialist.reviewsCount - 2, percent: '85%' },
      { stars: 4, count: 2, percent: '10%' },
      { stars: 3, count: 0, percent: '0%' },
      { stars: 2, count: 0, percent: '0%' },
      { stars: 1, count: 0, percent: '0%' },
  ];

  // Mock Reviews
  const mockReviews = Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      author: ['Азиз К.', 'Мадина Р.', 'Дмитрий В.'][i],
      rating: 5,
      date: ['2 дня назад', '12 августа', '30 июля'][i],
      task: ['Установка смесителя', 'Уборка квартиры', 'Ремонт розетки'][i],
      text: ['Отличный специалист! Сделал все быстро и качественно. Инструменты свои, мусор за собой убрал.', 'Рекомендую, очень вежливый и профессиональный подход.', 'Цена соответствует качеству. Спасибо большое за оперативность!'][i]
  }));

  const mockPortfolio = [1, 2, 3, 4, 5, 6].map(i => `https://picsum.photos/400/300?random=${parseInt(specialist.id) * 10 + i}`);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24 md:pb-12 transition-colors duration-200">
      
      {/* Mobile Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 md:top-16 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t('back')}</span>
          </button>
          <div className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
            {specialist.name}
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Sidebar Info (4 cols) */}
        <div className="lg:col-span-4">
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 sticky top-32">
              
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="relative mb-4">
                    <img 
                        src={specialist.avatarUrl} 
                        alt={specialist.name} 
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 dark:border-slate-700 shadow-md"
                    />
                    {specialist.verified && (
                        <div className="absolute bottom-1 right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm" title={t('verifiedPassport')}>
                            <BadgeCheck className="w-7 h-7 text-green-500 fill-white dark:fill-slate-900" />
                        </div>
                    )}
                 </div>
                 
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{specialist.name}</h1>
                 <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">{t(specialist.category)}</p>
                 
                 <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <MapPin className="w-4 h-4" />
                    {t(specialist.location)}
                 </div>

                 {/* Trust Badges (Profi style) */}
                 <div className="flex flex-wrap justify-center gap-2 mb-2">
                     <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-md">
                         <Shield className="w-3 h-3" /> {t('verifiedPassport')}
                     </span>
                     <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-md">
                         <Check className="w-3 h-3" /> {t('verifiedPhone')}
                     </span>
                 </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden lg:block space-y-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">{specialist.rating}</span>
                      <div className="flex justify-center text-yellow-400 my-1">
                          {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                      </div>
                      <span className="text-sm text-gray-400">{specialist.reviewsCount} {t('reviewsCount')}</span>
                  </div>

                  {!isSelected ? (
                      <button 
                        onClick={handleSelectSpecialist}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-600/20 active:scale-95"
                      >
                          <UserCheck className="w-5 h-5" />
                          {t('selectSpecialist')}
                      </button>
                  ) : (
                      <div className="space-y-3">
                          <button 
                            onClick={handleStartChat}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20"
                          >
                              <MessageSquare className="w-5 h-5" />
                              {t('writeToChat')}
                          </button>
                          <div className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-center text-xs">
                             {t('chatNotice')}
                          </div>
                      </div>
                  )}
                  
                  <button 
                    onClick={handleToggleFavorite}
                    className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-medium ${
                        isFavorite 
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' 
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                      {isFavorite ? t('inFavorites') : t('addToFavorites')}
                  </button>
              </div>

           </div>
        </div>

        {/* Right Column: Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs (Profi Style: Underline) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto hide-scrollbar">
                    {[
                        { id: 'services', label: t('tabServices') },
                        { id: 'reviews', label: `${t('tabReviews')} ${specialist.reviewsCount}` },
                        { id: 'portfolio', label: t('tabPortfolio') },
                        { id: 'about', label: t('tabAbout') },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-bold text-center border-b-2 transition-colors ${
                                activeTab === tab.id 
                                ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' 
                                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 sm:p-8 min-h-[300px]">
                    
                    {activeTab === 'services' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('priceList')}</h3>
                                <Banknote className="w-5 h-5 text-gray-400" />
                             </div>
                             
                             <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                 {mockServices.map((service, idx) => (
                                     <div key={idx} className="flex justify-between items-center py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 -mx-4 px-4 rounded-lg transition-colors">
                                         <span className="text-gray-700 dark:text-gray-200 font-medium">{service.name}</span>
                                         <span className="font-bold text-gray-900 dark:text-white">{service.price}</span>
                                     </div>
                                 ))}
                             </div>
                             
                             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 text-sm text-blue-800 dark:text-blue-200 mt-6">
                                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                 <p>{t('priceDisclaimer')}</p>
                             </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{t('aboutSpecialist')}</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-base">
                                    {t(specialist.description) || t('noDescription')}
                                </p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('skills')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {specialist.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium">
                                            {t(tag) || tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'portfolio' && (
                         <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('photos')} ({mockPortfolio.length})</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {mockPortfolio.map((img, idx) => (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 group relative cursor-zoom-in">
                                        <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}

                    {activeTab === 'reviews' && (
                         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Rating Summary Block */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700/50 p-6 rounded-2xl min-w-[160px]">
                                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2">{specialist.rating}</span>
                                    <div className="flex text-yellow-400 mb-1">
                                        {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                                    </div>
                                    <span className="text-sm text-gray-500">{specialist.reviewsCount} {t('reviews')}</span>
                                </div>

                                <div className="flex-1 w-full space-y-2">
                                    {ratingDistribution.map((row) => (
                                        <div key={row.stars} className="flex items-center gap-3 text-sm">
                                            <div className="w-8 font-bold text-gray-600 dark:text-gray-400 text-right">{row.stars}</div>
                                            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-400 rounded-full" style={{ width: row.percent }}></div>
                                            </div>
                                            <div className="w-8 text-gray-400 text-right">{row.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {mockReviews.map((review) => (
                                    <div key={review.id} className="border-b border-gray-100 dark:border-slate-700 last:border-0 pb-6 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white text-base">{review.author}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{review.task}</div>
                                            </div>
                                            <span className="text-xs text-gray-400">{review.date}</span>
                                        </div>
                                        <div className="flex text-yellow-400 mb-3">
                                            {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{review.text}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <button className="w-full py-3 text-gray-700 dark:text-gray-300 font-medium bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                {t('showMoreReviews')}
                            </button>
                         </div>
                    )}

                </div>
            </div>
        </div>

      </div>

      {/* Mobile Sticky Footer Actions (Profi Style) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 lg:hidden z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 max-w-lg mx-auto">
              {!isSelected ? (
                  <button 
                      onClick={handleSelectSpecialist}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                  >
                      {t('selectSpecialist')}
                  </button>
              ) : (
                  <button 
                      onClick={handleStartChat}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                  >
                      <MessageSquare className="w-5 h-5" />
                      {t('write')}
                  </button>
              )}
              <button 
                onClick={handleToggleFavorite}
                className={`p-3 rounded-xl border-2 transition-colors ${
                    isFavorite 
                    ? 'border-red-100 bg-red-50 text-red-500' 
                    : 'border-gray-200 bg-transparent text-gray-400'
                }`}
              >
                 <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
          </div>
      </div>

    </div>
  );
};