import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DETAILED_DIRECTORY } from '../constants';
import { ArrowRight, Search, LayoutGrid, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCategoryClick = (category: string) => {
    navigate(`/search?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen pb-20 page-bg">

      {/* Page Header */}
      <div className="border-b border-fiverr-border pt-8 pb-12 px-4 section-bg">
        <div className="fiverr-container">
          <div className="flex items-center gap-3 mb-4 text-fiverr-green">
            <LayoutGrid className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wider text-sm">{t('catalogLabel') || 'Каталог'}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-heading mb-4">
            {t('catalogTitle') || 'Каталог услуг'}
          </h1>
          <p className="text-lg text-fiverr-text-muted max-w-2xl">
            {t('catalogSubtitle') || 'Найдите нужного специалиста среди тысяч проверенных профессионалов'}
          </p>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="fiverr-container -mt-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
          {DETAILED_DIRECTORY.map((category, idx) => (
            <div key={idx} className="fiverr-card p-6 flex flex-col h-full group">
              <div
                onClick={() => handleCategoryClick(category.title)}
                className="cursor-pointer mb-4"
              >
                <div className="flex justify-between items-baseline mb-3">
                  <h2 className="text-lg font-bold text-heading group-hover:text-fiverr-green transition-colors">
                    {t(category.title)}
                  </h2>
                  <span className="fiverr-badge fiverr-badge-green text-xs">
                    {category.count.toLocaleString()}
                  </span>
                </div>
                <div className="w-10 h-0.5 bg-fiverr-border rounded-full group-hover:bg-fiverr-green group-hover:w-16 transition-all duration-500" />
              </div>

              <ul className="space-y-2.5 flex-grow">
                {category.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    <button
                      onClick={() => handleCategoryClick(item)}
                      className="text-fiverr-text-muted hover:text-fiverr-green text-sm flex items-center gap-2 transition-colors w-full text-left group/item"
                    >
                      <ChevronRight className="w-3 h-3 text-fiverr-border group-hover/item:text-fiverr-green transition-colors" />
                      {t(item)}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-4 border-t border-fiverr-border">
                <button
                  onClick={() => handleCategoryClick(category.title)}
                  className="text-fiverr-green text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  {t('viewAll') || 'Смотреть все'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Promo */}
      <div className="fiverr-container mt-20 text-center">
        <div className="fiverr-card p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-fiverr-green/5 to-transparent pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-black text-heading mb-4 relative z-10">{t('notFoundTitle') || 'Не нашли нужную услугу?'}</h2>
          <p className="text-fiverr-text-muted mb-8 max-w-xl mx-auto relative z-10">
            {t('notFoundDesc') || 'Опишите задачу и получите предложения от специалистов'}
          </p>
          <button
            onClick={() => navigate('/create-task')}
            className="fiverr-btn fiverr-btn-primary text-base px-8 py-3 relative z-10"
          >
            <Search className="w-5 h-5" />
            {t('createOrder') || 'Создать заказ'}
          </button>
        </div>
      </div>
    </div>
  );
};