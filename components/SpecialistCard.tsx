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

  const goToDetails = () => {
    navigate(`/specialist/${specialist.id}`);
  };

  const formattedPrice = new Intl.NumberFormat('ru-RU').format(specialist.priceStart);

  return (
    <div
      onClick={goToDetails}
      className="fiverr-card overflow-hidden cursor-pointer group"
    >
      {/* Image Header */}
      <div className="relative aspect-[16/10] bg-fiverr-dark overflow-hidden">
        <img
          src={specialist.avatarUrl}
          alt={specialist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-fiverr-darker/80 via-transparent to-transparent" />

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all z-10"
          title={isFavorite ? t('removeFromFavoritesTooltip') : t('addToFavoritesTooltip')}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFavorite
              ? 'fill-fiverr-red text-fiverr-red'
              : 'text-white/80'
              }`}
          />
        </button>

        {/* Verified badge on image */}
        {specialist.verified && (
          <div className="absolute top-3 left-3 fiverr-badge fiverr-badge-green">
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>{t('verifiedPassport') || 'Проверен'}</span>
          </div>
        )}

        {/* Category tag */}
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white/90 text-xs font-medium">
            {t(specialist.category) || specialist.category}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Seller Info Row */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={specialist.avatarUrl}
            alt={specialist.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-fiverr-border"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-heading truncate group-hover:text-fiverr-green transition-colors">
              {specialist.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-fiverr-text-muted">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{t(specialist.location)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-fiverr-text-muted mb-3 line-clamp-2 leading-relaxed min-h-[40px]">
          {t(specialist.description)}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {specialist.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-white/5 border border-fiverr-border rounded text-[11px] text-fiverr-text-dim font-medium">
              {t(tag) || tag}
            </span>
          ))}
        </div>

        {/* Footer: Rating + Price */}
        <div className="flex items-center justify-between pt-3 border-t border-fiverr-border">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-fiverr-yellow text-fiverr-yellow" />
            <span className="text-sm font-bold text-heading">{specialist.rating}</span>
            <span className="text-xs text-fiverr-text-dim">({specialist.reviewsCount})</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wide text-fiverr-text-dim font-medium">{t('priceFrom').split('{{')[0] || 'от'}</span>
            <span className="block text-sm font-bold text-heading">{formattedPrice} UZS</span>
          </div>
        </div>
      </div>
    </div>
  );
};