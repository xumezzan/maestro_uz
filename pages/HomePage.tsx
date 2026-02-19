import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, Wrench, BookOpen, Palette, Monitor, Truck, Zap, Shield, HeartHandshake, UserCheck, Search, Star, ArrowRight
} from 'lucide-react';
import { HERO_CARDS, POPULAR_REQUESTS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';

export const HomePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser } = useAppContext();

  // Redirect Specialists to their Dashboard immediately
  useEffect(() => {
    if (currentUser?.role === UserRole.SPECIALIST) {
        navigate('/specialist-dashboard');
    }
  }, [currentUser, navigate]);

  // If redirected, don't render content to prevent flash
  if (currentUser?.role === UserRole.SPECIALIST) {
      return null; 
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleCategoryClick = (cat: string) => {
      navigate(`/search?category=${encodeURIComponent(cat)}`);
  };

  const displayCity = currentUser?.location ? currentUser.location.split(',')[0] : t('tashkent');

  return (
    <div className="flex flex-col min-h-screen font-sans">
      
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-slate-900 pt-12 md:pt-20 pb-12 transition-colors duration-200 overflow-hidden">
        
        {/* Animated Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-40">
            <div className="absolute top-[-10%] left-[20%] w-[60%] h-[60%] bg-violet-100 dark:bg-violet-900/10 rounded-full filter blur-[100px] animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[20%] w-[60%] h-[60%] bg-indigo-50 dark:bg-indigo-900/10 rounded-full filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.1] whitespace-pre-line">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {t('heroSubtitle')} <span className="text-primary-600 font-bold border-b-2 border-primary-600/20">{displayCity}</span>
            </p>
          </div>

          {/* Big Search Bar - Profi Style */}
          <div className="max-w-3xl mx-auto mb-16">
              <form onSubmit={handleSearch} className="relative shadow-2xl shadow-violet-200/50 dark:shadow-none rounded-2xl group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <Search className="h-6 w-6 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-16 pr-40 py-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-transparent focus:border-primary-500 outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400 transition-all font-medium"
                    placeholder={t('searchPlaceholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-700 text-white px-8 rounded-xl font-bold text-lg transition-all active:scale-95"
                  >
                    {t('find')}
                  </button>
              </form>

              {/* Popular Tags (Pills) */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="text-sm text-gray-400 py-1.5">{t('popular')}</span>
                  {POPULAR_REQUESTS.map((req, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleCategoryClick(req)}
                        className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 transition-colors shadow-sm"
                      >
                          {t(req)}
                      </button>
                  ))}
              </div>
          </div>

          {/* Hero Cards Grid (Profi Style) */}
          <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-6 px-2">
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('popularCategories')}</h2>
                   <button 
                     onClick={() => navigate('/categories')}
                     className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
                   >
                       {t('allServices')} <ArrowRight className="w-4 h-4" />
                   </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
                 {HERO_CARDS.map((card) => (
                     <div 
                        key={card.id}
                        onClick={() => handleCategoryClick(card.title)}
                        className={`${card.color} dark:opacity-90 rounded-2xl h-32 md:h-40 relative overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}
                     >
                         <div className="absolute top-4 left-4 right-4 z-20">
                             <h3 className="font-bold text-gray-900 text-lg leading-tight tracking-tight">
                                {t(card.title)}
                             </h3>
                         </div>
                         <img 
                            src={card.img} 
                            alt={t(card.title)}
                            className="absolute -right-4 -bottom-4 w-24 h-24 md:w-28 md:h-28 object-cover rounded-tl-[2rem] shadow-sm group-hover:scale-110 transition-transform duration-500 z-10" 
                         />
                     </div>
                 ))}
              </div>
          </div>

          {/* Trust Blocks */}
          <div className="mb-24 bg-gray-50 dark:bg-slate-800 rounded-3xl p-8 md:p-12 border border-gray-100 dark:border-slate-700">
             <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-10">{t('trustTitle')}</h2>
             <div className="grid md:grid-cols-3 gap-8">
                 <div className="flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-green-500 mb-4 shadow-sm">
                         <Shield className="w-8 h-8" />
                     </div>
                     <h3 className="font-bold text-lg mb-2 dark:text-white">{t('trust1Title')}</h3>
                     <p className="text-gray-600 dark:text-gray-400 text-sm">{t('trust1Desc')}</p>
                 </div>
                 <div className="flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-yellow-500 mb-4 shadow-sm">
                         <Star className="w-8 h-8 fill-current" />
                     </div>
                     <h3 className="font-bold text-lg mb-2 dark:text-white">{t('trust2Title')}</h3>
                     <p className="text-gray-600 dark:text-gray-400 text-sm">{t('trust2Desc')}</p>
                 </div>
                 <div className="flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-blue-500 mb-4 shadow-sm">
                         <HeartHandshake className="w-8 h-8" />
                     </div>
                     <h3 className="font-bold text-lg mb-2 dark:text-white">{t('trust3Title')}</h3>
                     <p className="text-gray-600 dark:text-gray-400 text-sm">{t('trust3Desc')}</p>
                 </div>
             </div>
          </div>
        
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
             <div className="font-extrabold text-2xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4 inline-block">Maestro</div>
             <p className="text-gray-400 text-sm mb-8">{t('footerDesc')}</p>
             <div className="flex justify-center gap-6 mb-8 text-sm font-medium text-gray-500">
                 <a href="#" className="hover:text-primary-600">{t('aboutService')}</a>
                 <a href="#" className="hover:text-primary-600">{t('becomeSpecialist')}</a>
                 <a href="#" className="hover:text-primary-600">{t('help')}</a>
                 <a href="#" className="hover:text-primary-600">{t('rules')}</a>
             </div>
            <p className="text-gray-400 text-xs">&copy; 2026 Maestro. {t('rights')}</p>
        </div>
      </footer>
    </div>
  );
};