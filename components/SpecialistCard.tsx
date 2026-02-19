import React from 'react';
import { Star, MapPin, BadgeCheck, Heart, ChevronRight } from 'lucide-react';
import { Specialist } from '../types';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  specialist: Specialist;
}

export const SpecialistCard: React.FC<Props> = ({ specialist }) => {
  const { currentUser, toggleFavorite } = useAppContext();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const isFavorite = currentUser?.favorites?.includes(specialist.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentUser) {
          navigate('/login');
          return;
      }
      toggleFavorite(specialist.id);
  };

  const handleSelect = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Navigate to details page where the actual selection logic happens
      navigate(`/specialist/${specialist.id}`);
  };

  const goToDetails = () => {
    navigate(`/specialist/${specialist.id}`);
  };

  const formattedPrice = new Intl.NumberFormat('ru-RU').format(specialist.priceStart);

  return (
    <div 
        onClick={goToDetails}
        className="relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-2xl dark:hover:shadow-slate-900/60 hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 ease-out flex flex-col md:flex-row gap-5 cursor-pointer group"
    >
        
        {/* Favorite Button (Absolute Top Right) */}
        <button 
            onClick={handleToggleFavorite}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors z-10"
            title={isFavorite ? t('removeFromFavoritesTooltip') : t('addToFavoritesTooltip')}
        >
            <Heart 
                className={`w-5 h-5 transition-colors ${
                    isFavorite 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                }`} 
            />
        </button>

        <div className="flex-shrink-0 flex flex-col items-center md:items-start">
          <div className="relative">
            <img 
              src={specialist.avatarUrl} 
              alt={specialist.name} 
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-100 dark:border-slate-600 transition-transform duration-300 group-hover:scale-105"
            />
            {specialist.verified && (
              <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 rounded-full p-0.5" title={t('verifiedPassport')}>
                 <BadgeCheck className="w-6 h-6 text-blue-500 fill-white dark:fill-slate-800" />
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-1 text-yellow-500 font-bold">
             <Star className="w-4 h-4 fill-current" />
             <span>{specialist.rating}</span>
             <span className="text-gray-400 dark:text-gray-500 text-sm font-normal">({specialist.reviewsCount})</span>
          </div>
        </div>

        <div className="flex-grow pr-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{specialist.name}</h3>
            <span className="text-primary-600 dark:text-primary-400 font-bold text-lg md:text-base mt-1 md:mt-0">
              {t('priceFrom').replace('{{price}}', formattedPrice)}
            </span>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {t(specialist.location)}
          </p>

          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2 md:line-clamp-none">
            {t(specialist.description)}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {specialist.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                {t(tag) || tag}
              </span>
            ))}
          </div>

          <div className="flex gap-3">
              <button 
                onClick={handleSelect}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary-600/20"
              >
                  {t('viewProfile')}
                  <ChevronRight className="w-4 h-4" />
              </button>
          </div>
        </div>
      </div>
  );
};