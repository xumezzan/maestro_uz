import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DETAILED_DIRECTORY } from '../constants';
import { ArrowRight, Search, LayoutGrid } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCategoryClick = (category: string) => {
    navigate(`/search?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-12 transition-colors duration-200">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 pt-8 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4 text-primary-600 dark:text-primary-400">
             <LayoutGrid className="w-6 h-6" />
             <span className="font-bold uppercase tracking-wider text-sm">{t('catalogLabel')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
            {t('catalogTitle')}
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl">
            {t('catalogSubtitle')}
          </p>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DETAILED_DIRECTORY.map((category, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-slate-700 p-6 transition-all duration-300 group flex flex-col h-full"
            >
              <div 
                onClick={() => handleCategoryClick(category.title)}
                className="cursor-pointer mb-4"
              >
                <div className="flex justify-between items-baseline mb-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                    {t(category.title)}
                  </h2>
                  <span className="text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">
                    {category.count.toLocaleString()}
                  </span>
                </div>
                <div className="w-12 h-1 bg-gray-100 dark:bg-slate-700 rounded-full group-hover:bg-primary-500 transition-colors duration-500"></div>
              </div>

              <ul className="space-y-3 flex-grow">
                {category.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    <button 
                      onClick={() => handleCategoryClick(item)}
                      className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center gap-2 transition-colors w-full text-left group/item"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600 group-hover/item:bg-primary-400 transition-colors"></span>
                      {t(item)}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-gray-50 dark:border-slate-700">
                 <button 
                    onClick={() => handleCategoryClick(category.title)}
                    className="text-primary-600 dark:text-primary-400 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
                 >
                    {t('viewAll')} <ArrowRight className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO / Bottom Promo */}
      <div className="max-w-7xl mx-auto px-4 mt-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('notFoundTitle')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto">
          {t('notFoundDesc')}
        </p>
        <button 
           onClick={() => navigate('/create-task')}
           className="bg-gray-900 dark:bg-white text-white dark:text-slate-900 hover:bg-gray-800 hover:dark:bg-gray-100 px-8 py-3 rounded-xl font-bold transition-colors inline-flex items-center gap-2"
        >
            <Search className="w-5 h-5" />
            {t('createOrder')}
        </button>
      </div>

    </div>
  );
};