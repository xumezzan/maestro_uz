import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, User, Menu, Moon, Sun, PlusCircle, Search, LogOut, Globe, MessageSquare, ArrowUpRight, LayoutGrid, X, Briefcase, Bell, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

export const Header: React.FC = () => {
  const { role, currentUser, logout, conversations } = useAppContext();
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSpecialist = role === UserRole.SPECIALIST;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'uz' : 'ru');
  };

  const handleRoleSwitch = () => {
    if (currentUser) {
      logout();
      if (isSpecialist) navigate('/');
      else navigate('/become-specialist');
    } else {
      if (location.pathname === '/become-specialist') navigate('/');
      else navigate('/become-specialist');
    }
    setIsMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const unreadCount = conversations.reduce((acc, conv) => {
    return acc + (conv.messages.length > 0 && !conv.messages[conv.messages.length - 1].isRead && conv.messages[conv.messages.length - 1].senderId !== currentUser?.id ? 1 : 0);
  }, 0);

  const categories = [
    { label: t('Репетиторы') || 'Репетиторы', path: '/search?category=Репетиторы' },
    { label: t('Мастера по ремонту') || 'Ремонт', path: '/search?category=Ремонт' },
    { label: t('Фрилансеры') || 'Фриланс', path: '/search?category=IT и фриланс' },
    { label: t('Мастера красоты') || 'Красота', path: '/search?category=Красота' },
    { label: t('Спортивные тренеры') || 'Спорт', path: '/search?category=Спорт' },
  ];

  return (
    <>
      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled ? (isDark ? 'shadow-lg shadow-black/30' : 'shadow-md shadow-black/10') : ''
          }`}
        style={{
          backgroundColor: 'var(--page-bg)',
          borderColor: 'var(--fiverr-border)',
        }}
      >
        <div className="fiverr-container">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to={isSpecialist ? "/specialist-dashboard" : "/"} className="flex items-center gap-1 group flex-shrink-0">
              <span className="text-2xl font-black text-heading tracking-tight">
                maestro
              </span>
              <span className="text-2xl font-black text-fiverr-green">.</span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="flex w-full rounded-lg overflow-hidden" style={{ border: '1px solid var(--fiverr-border)' }}>
                <input
                  type="text"
                  className="fiverr-input rounded-none border-0 py-2.5"
                  placeholder={t('searchPlaceholder') || 'Найти услугу...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-5 bg-fiverr-green hover:bg-fiverr-green-dark text-white transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-3">

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--fiverr-text-muted)' }}
                title={isDark ? 'Светлая тема' : 'Тёмная тема'}
              >
                {isDark
                  ? <Sun className="w-5 h-5 hover:text-fiverr-yellow" />
                  : <Moon className="w-5 h-5 hover:text-fiverr-blue" />
                }
              </button>

              {/* Language */}
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors uppercase"
                style={{ color: 'var(--fiverr-text-muted)' }}
              >
                <Globe className="w-4 h-4" />
                {language}
              </button>

              {/* Create Task - for clients */}
              {!isSpecialist && currentUser && (
                <Link
                  to="/create-task"
                  className="hidden md:flex items-center gap-2 fiverr-btn fiverr-btn-primary text-sm py-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('createOrder')}</span>
                </Link>
              )}

              {/* Messages */}
              {currentUser && (
                <Link
                  to="/messages"
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--fiverr-text-muted)' }}
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-fiverr-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Categories */}
              {!isSpecialist && (
                <Link
                  to="/categories"
                  className="hidden md:flex p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--fiverr-text-muted)' }}
                >
                  <LayoutGrid className="w-5 h-5" />
                </Link>
              )}

              {/* Auth */}
              {currentUser ? (
                <div className="flex items-center gap-2 ml-1">
                  <Link to="/profile">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-fiverr-green/30 hover:ring-fiverr-green transition-all"
                    />
                  </Link>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold transition-colors"
                    style={{ color: 'var(--fiverr-text-muted)' }}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    className="fiverr-btn fiverr-btn-outline text-sm py-2"
                  >
                    {t('register') || 'Регистрация'}
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: 'var(--fiverr-text-muted)' }}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Sub-nav - Desktop */}
        {!isSpecialist && (
          <div className="hidden md:block" style={{ borderTop: '1px solid var(--fiverr-border)' }}>
            <div className="fiverr-container">
              <div className="flex items-center gap-6 h-11 overflow-x-auto">
                {categories.map((cat, i) => (
                  <Link
                    key={i}
                    to={cat.path}
                    className="text-sm font-medium whitespace-nowrap transition-colors py-2 border-b-2 border-transparent hover:border-fiverr-green"
                    style={{ color: 'var(--fiverr-text-secondary)' }}
                  >
                    {cat.label}
                  </Link>
                ))}
                <Link
                  to="/categories"
                  className="text-sm font-medium text-fiverr-green hover:text-fiverr-green-dark whitespace-nowrap transition-colors py-2"
                >
                  {t('allServices') || 'Все услуги'} →
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 backdrop-blur-sm"
          style={{ backgroundColor: 'var(--overlay-bg)' }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="absolute top-0 right-0 w-80 max-w-full h-full overflow-y-auto animate-slide-in-right"
            style={{
              backgroundColor: 'var(--section-bg)',
              borderLeft: '1px solid var(--fiverr-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Close */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-black text-heading">maestro<span className="text-fiverr-green">.</span></span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2" style={{ color: 'var(--fiverr-text-muted)' }}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search - Mobile */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--fiverr-border)' }}>
                  <input
                    type="text"
                    className="fiverr-input rounded-none border-0 py-3"
                    placeholder={t('searchPlaceholder') || 'Найти услугу...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="px-4 bg-fiverr-green text-white">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* User Info */}
              {currentUser && (
                <div className="fiverr-card p-4 mb-6 flex items-center gap-3">
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="font-bold text-heading">{currentUser.name}</div>
                    <div className="text-sm" style={{ color: 'var(--fiverr-text-muted)' }}>{currentUser.email}</div>
                  </div>
                </div>
              )}

              {/* Nav Links */}
              <div className="space-y-1">
                {!currentUser && (
                  <>
                    <Link to="/login" className="flex items-center gap-3 p-3 rounded-xl transition-colors font-medium" style={{ color: 'var(--fiverr-text)' }}>
                      <User className="w-5 h-5 text-fiverr-green" /> {t('login')}
                    </Link>
                    <Link to="/register" className="flex items-center gap-3 p-3 rounded-xl transition-colors font-medium" style={{ color: 'var(--fiverr-text)' }}>
                      <PlusCircle className="w-5 h-5 text-fiverr-green" /> {t('register') || 'Регистрация'}
                    </Link>
                  </>
                )}
                {!isSpecialist && (
                  <Link to="/categories" className="flex items-center gap-3 p-3 rounded-xl transition-colors font-medium" style={{ color: 'var(--fiverr-text)' }}>
                    <LayoutGrid className="w-5 h-5 text-fiverr-green" /> {t('catalog')}
                  </Link>
                )}
                {!isSpecialist && currentUser && (
                  <Link to="/create-task" className="flex items-center gap-3 p-3 rounded-xl bg-fiverr-green text-white font-bold">
                    <PlusCircle className="w-5 h-5" /> {t('createOrder')}
                  </Link>
                )}
                {currentUser && (
                  <Link to="/messages" className="flex items-center gap-3 p-3 rounded-xl transition-colors font-medium" style={{ color: 'var(--fiverr-text)' }}>
                    <MessageSquare className="w-5 h-5 text-fiverr-green" /> {t('chats') || 'Сообщения'}
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-fiverr-red text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </Link>
                )}
                {currentUser && (
                  <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl transition-colors font-medium" style={{ color: 'var(--fiverr-text)' }}>
                    <User className="w-5 h-5 text-fiverr-green" /> {t('profile')}
                  </Link>
                )}

                <hr style={{ borderColor: 'var(--fiverr-border)' }} className="my-3" />

                {/* Theme toggle in mobile menu */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors w-full font-medium"
                  style={{ color: 'var(--fiverr-text-muted)' }}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  {isDark ? 'Светлая тема' : 'Тёмная тема'}
                </button>

                <button
                  onClick={handleRoleSwitch}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors w-full font-medium"
                  style={{ color: 'var(--fiverr-text-muted)' }}
                >
                  <ArrowUpRight className="w-5 h-5" /> {isSpecialist ? t('iAmClient') : t('iAmSpecialist')}
                </button>

                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors w-full font-medium"
                  style={{ color: 'var(--fiverr-text-muted)' }}
                >
                  <Globe className="w-5 h-5" /> {language === 'ru' ? 'Узбекский' : 'Русский'}
                </button>

                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 rounded-xl text-fiverr-red hover:bg-fiverr-red/10 transition-colors w-full font-medium"
                  >
                    <LogOut className="w-5 h-5" /> {t('exit') || 'Выйти'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};