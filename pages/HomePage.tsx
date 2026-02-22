import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Star, ArrowRight, Wrench, BookOpen, Palette, Monitor, Truck, Shield, HeartHandshake, UserCheck,
  Zap, ChevronRight, Play, TrendingUp, Award, Clock, Users, CheckCircle2
} from 'lucide-react';
import { HERO_CARDS, POPULAR_REQUESTS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';

export const HomePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser, specialists, tasks } = useAppContext();
  const specialistsCount = specialists.length;
  const tasksCount = tasks.length;
  const averageRating = specialistsCount > 0
    ? (specialists.reduce((acc, s) => acc + (s.rating || 0), 0) / specialistsCount).toFixed(1)
    : "0.0";

  useEffect(() => {
    if (currentUser?.role === UserRole.SPECIALIST) {
      navigate('/specialist-dashboard');
    }
  }, [currentUser, navigate]);

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

  return (
    <div className="flex flex-col min-h-screen page-bg">

      {/* === HERO Section === */}
      <section className="relative overflow-hidden fiverr-hero-gradient">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full bg-fiverr-green/10 blur-[120px] -top-20 -left-20" />
          <div className="absolute w-80 h-80 rounded-full bg-fiverr-green/5 blur-[100px] bottom-0 right-10" />
        </div>

        <div className="relative fiverr-container pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="max-w-3xl animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1]">
              {t('heroTitle') || 'Найдите идеального'}{' '}
              <span className="text-fiverr-green">
                {t('specialist') || 'специалиста'}
              </span>{' '}
              {t('heroTitleSuffix') || 'прямо сейчас'}
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-10 max-w-xl leading-relaxed">
              {t('heroSubtitle') || 'Тысячи проверенных профессионалов готовы помочь вам с любой задачей'}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex rounded-xl overflow-hidden shadow-2xl shadow-black/30 max-w-2xl mb-6"
              style={{ border: '2px solid rgba(255,255,255,0.2)' }}>
              <input
                type="text"
                className="flex-1 px-6 py-4 md:py-5 bg-fiverr-card text-white text-base md:text-lg outline-none placeholder-fiverr-text-dim"
                placeholder={t('searchPlaceholder') || 'Попробуйте "ремонт квартиры"'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                className="px-8 md:px-10 bg-fiverr-green hover:bg-fiverr-green-dark text-white font-bold text-lg transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden md:inline">{t('find') || 'Найти'}</span>
              </button>
            </form>

            {/* Popular tags */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-white/80 font-medium">{t('popularRequests') || 'Часто ищут:'}</span>
              {POPULAR_REQUESTS.map((req, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCategoryClick(req)}
                  className="px-4 py-1.5 rounded-full border border-white/30 text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {t(req)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats floating */}
          <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 flex-col gap-4">
            <div className="fiverr-card p-5 text-center min-w-[140px] animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="text-3xl font-black text-fiverr-green">{specialistsCount}</div>
              <div className="text-xs text-fiverr-text-muted mt-1 font-medium">{t('activeSpecialists') || 'Специалистов'}</div>
            </div>
            <div className="fiverr-card p-5 text-center min-w-[140px] animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="text-3xl font-black text-fiverr-yellow">{tasksCount}</div>
              <div className="text-xs text-fiverr-text-muted mt-1 font-medium">{t('completedTasks') || 'Заказов'}</div>
            </div>
            <div className="fiverr-card p-5 text-center min-w-[140px] animate-fade-in" style={{ animationDelay: '600ms' }}>
              <div className="text-3xl font-black text-fiverr-orange">{averageRating}</div>
              <div className="text-xs text-fiverr-text-muted mt-1 font-medium">{t('averageRating') || 'Средняя оценка'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* === Popular Categories === */}
      <section className="py-16 md:py-20 page-bg">
        <div className="fiverr-container">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-heading mb-2">{t('popularCategories') || 'Популярные категории'}</h2>
              <p className="text-fiverr-text-muted">{t('exploreCat') || 'Откройте для себя нужную услугу'}</p>
            </div>
            <button
              onClick={() => navigate('/categories')}
              className="hidden md:flex items-center gap-2 text-fiverr-green font-semibold hover:text-fiverr-green-dark transition-colors"
            >
              {t('allServices') || 'Все услуги'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 stagger-children">
            {HERO_CARDS.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCategoryClick(card.title)}
                className="group relative rounded-2xl overflow-hidden cursor-pointer h-48 md:h-56 shadow-md hover:shadow-xl transition-shadow"
              >
                {/* Background image */}
                <img
                  src={card.img}
                  alt={t(card.title)}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                {/* Gradient: fixed dark gradient to ensure text is always visible regardless of theme */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity duration-300 group-hover:opacity-80" />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-5">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1 group-hover:text-fiverr-green transition-colors drop-shadow-md">
                    {t(card.title)}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: show all */}
          <div className="mt-6 md:hidden text-center">
            <button
              onClick={() => navigate('/categories')}
              className="fiverr-btn fiverr-btn-outline"
            >
              {t('allServices') || 'Все услуги'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* === How It Works === */}
      <section className="py-16 md:py-24 relative overflow-hidden page-bg border-t border-fiverr-border">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[500px] h-[500px] bg-fiverr-green/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-fiverr-blue/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="fiverr-container relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-heading mb-4 tracking-tight">
              {t('howItWorksTitle')}
            </h2>
            <p className="text-fiverr-text-muted text-lg max-w-2xl mx-auto">
              {t('howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-fiverr-border to-transparent -z-10" />

            {[
              { icon: Search, title: t('step1Title') || 'Опишите задачу', desc: t('step1Desc') || 'Расскажите что нужно сделать и когда', num: '1', color: 'text-fiverr-green', bg: 'bg-fiverr-green/10', border: 'border-fiverr-green/20' },
              { icon: Users, title: t('step2Title') || 'Получите отклики', desc: t('step2Desc') || 'Проверенные специалисты откликнутся на вашу задачу', num: '2', color: 'text-fiverr-yellow', bg: 'bg-fiverr-yellow/10', border: 'border-fiverr-yellow/20' },
              { icon: CheckCircle2, title: t('step3Title') || 'Выберите лучшего', desc: t('step3Desc') || 'Сравните отзывы, цены и выберите идеального исполнителя', num: '3', color: 'text-fiverr-orange', bg: 'bg-fiverr-orange/10', border: 'border-fiverr-orange/20' },
            ].map((step, idx) => (
              <div key={idx} className="relative text-center group">
                {/* Number badge */}
                <div className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-fiverr-card border border-fiverr-border text-heading font-black flex items-center justify-center text-sm md:text-base z-10 shadow-lg group-hover:scale-110 group-hover:bg-heading group-hover:text-fiverr-card transition-all duration-300">
                  {step.num}
                </div>

                {/* Icon Container */}
                <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-3xl ${step.bg} border ${step.border} flex items-center justify-center mb-6 md:mb-8 group-hover:-translate-y-2 group-hover:shadow-xl transition-all duration-300 relative overflow-hidden backdrop-blur-sm`}>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <step.icon className={`w-10 h-10 md:w-12 md:h-12 ${step.color} relative z-10`} />
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-heading mb-3 md:mb-4">{step.title}</h3>
                <p className="text-fiverr-text-muted text-sm md:text-base leading-relaxed max-w-[280px] mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Trust Section === */}
      <section className="py-16 md:py-20 page-bg">
        <div className="fiverr-container">
          <div className="fiverr-card p-8 md:p-16 relative overflow-hidden">
            {/* Glow effects */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-fiverr-green/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-fiverr-blue/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <h2 className="text-center text-3xl md:text-4xl font-black text-heading mb-14 relative z-10">{t('trustTitle') || 'Maestro — это надежно'}</h2>

            <div className="grid md:grid-cols-3 gap-10 relative z-10">
              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-fiverr-green/10 border border-fiverr-green/20 flex items-center justify-center mx-auto mb-5 group-hover:bg-fiverr-green/20 transition-colors">
                  <Shield className="w-8 h-8 text-fiverr-green" />
                </div>
                <h3 className="font-bold text-lg text-heading mb-3">{t('trust1Title') || 'Проверенные профи'}</h3>
                <p className="text-fiverr-text-muted text-sm leading-relaxed">{t('trust1Desc')}</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-fiverr-yellow/10 border border-fiverr-yellow/20 flex items-center justify-center mx-auto mb-5 group-hover:bg-fiverr-yellow/20 transition-colors">
                  <Star className="w-8 h-8 text-fiverr-yellow fill-current" />
                </div>
                <h3 className="font-bold text-lg text-heading mb-3">{t('trust2Title') || 'Честные отзывы'}</h3>
                <p className="text-fiverr-text-muted text-sm leading-relaxed">{t('trust2Desc')}</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-fiverr-blue/10 border border-fiverr-blue/20 flex items-center justify-center mx-auto mb-5 group-hover:bg-fiverr-blue/20 transition-colors">
                  <HeartHandshake className="w-8 h-8 text-fiverr-blue" />
                </div>
                <h3 className="font-bold text-lg text-heading mb-3">{t('trust3Title') || 'Безопасные сделки'}</h3>
                <p className="text-fiverr-text-muted text-sm leading-relaxed">{t('trust3Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === CTA: Become a Specialist === */}
      <section className="py-16 md:py-20 relative overflow-hidden section-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full bg-fiverr-green/10 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="fiverr-container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black text-heading mb-6">{t('becomeSpecialist') || 'Стань специалистом'}</h2>
            <p className="text-lg text-fiverr-text-muted mb-10 leading-relaxed max-w-xl mx-auto">
              {t('becomeSpecialistDesc') || 'Присоединяйтесь к тысячам профессионалов на Maestro. Получайте заказы и зарабатывайте.'}
            </p>
            <button
              onClick={() => navigate('/become-specialist')}
              className="fiverr-btn fiverr-btn-primary text-lg px-10 py-4 animate-pulse-green"
            >
              {t('becomeSpecialist') || 'Стать специалистом'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="py-14 border-t border-fiverr-border chat-bg">
        <div className="fiverr-container">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="text-2xl font-black text-heading mb-4">
                maestro<span className="text-fiverr-green">.</span>
              </div>
              <p className="text-sm text-fiverr-text-muted leading-relaxed">
                {t('footerDesc') || 'Платформа для поиска проверенных специалистов и фрилансеров в Узбекистане.'}
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-heading mb-4 text-sm uppercase tracking-wider">{t('categories') || 'Категории'}</h4>
              <div className="space-y-2">
                {['Репетиторы', 'Мастера по ремонту', 'Фрилансеры', 'Мастера красоты'].map(cat => (
                  <a key={cat} href="#" className="block text-sm text-fiverr-text-muted hover:text-fiverr-green transition-colors">{t(cat) || cat}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-heading mb-4 text-sm uppercase tracking-wider">{t('aboutService') || 'О сервисе'}</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-fiverr-text-muted hover:text-fiverr-green transition-colors">{t('aboutService') || 'О сервисе'}</a>
                <a href="#" className="block text-sm text-fiverr-text-muted hover:text-fiverr-green transition-colors">{t('help') || 'Помощь'}</a>
                <a href="#" className="block text-sm text-fiverr-text-muted hover:text-fiverr-green transition-colors">{t('rules') || 'Правила'}</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-heading mb-4 text-sm uppercase tracking-wider">{t('forSpecialists') || 'Для специалистов'}</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-fiverr-text-muted hover:text-fiverr-green transition-colors">{t('becomeSpecialist') || 'Стать специалистом'}</a>
                <a href="#" className="block text-sm text-fiverr-text-muted hover:text-fiverr-green transition-colors">{t('getMoreOrders') || 'Получайте заказы'}</a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-fiverr-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-fiverr-text-dim text-sm">&copy; 2026 Maestro. {t('rights') || 'Все права защищены'}</p>
            <div className="flex items-center gap-4">
              <span className="text-fiverr-text-dim text-sm">Telegram</span>
              <span className="text-fiverr-text-dim text-sm">Instagram</span>
              <span className="text-fiverr-text-dim text-sm">YouTube</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};