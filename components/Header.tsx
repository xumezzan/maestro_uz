import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, User, Menu, Moon, Sun, PlusCircle, Search, LogOut, Globe, MessageSquare, ArrowUpRight, LayoutGrid, X, Briefcase } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme }) => {
  const { role, currentUser, logout, conversations } = useAppContext();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determine if the current view is for a Specialist
  const isSpecialist = role === UserRole.SPECIALIST;

  // Close mobile menu when route changes
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
      // Logic to switch between Client and Specialist views/landing pages
      if (currentUser) {
          logout(); // Simple toggle for demo: logout to switch persona
          if (isSpecialist) navigate('/'); // Go to Client landing
          else navigate('/become-specialist'); // Go to Specialist landing
      } else {
          // Guest mode toggle
          if (location.pathname === '/become-specialist') navigate('/');
          else navigate('/become-specialist');
      }
      setIsMenuOpen(false);
  };

  const unreadCount = conversations.reduce((acc, conv) => {
      return acc + (conv.messages.length > 0 && !conv.messages[conv.messages.length -1].isRead && conv.messages[conv.messages.length -1].senderId !== currentUser?.id ? 1 : 0);
  }, 0);

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-200 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative">
        
        {/* Left Side: Logo & Location */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link to={isSpecialist ? "/specialist-dashboard" : "/"} className="text-3xl font-extrabold flex items-center tracking-tighter">
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Maestro</span>
          </Link>
          
          <div className="hidden md:flex items-center text-gray-900 dark:text-white font-medium gap-1 text-sm hover:text-primary-600 transition-colors cursor-pointer group border-r border-gray-200 dark:border-slate-700 pr-6 mr-2">
            <MapPin className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
            <span>{t('tashkent')}</span>
          </div>

          {/* Catalog is ONLY for Clients/Guests. Specialists see Orders on dashboard. */}
          {!isSpecialist && (
            <Link 
                to="/categories" 
                className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
                <LayoutGrid className="w-4 h-4" />
                <span>{t('catalog')}</span>
            </Link>
          )}
        </div>

        {/* Right Side: Navigation & Actions */}
        <div className="flex items-center gap-4">
          
          {/* Role Switcher (Top Right) */}
          <button 
             onClick={handleRoleSwitch}
             className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mr-2"
          >
             {isSpecialist ? t('iAmClient') : t('iAmSpecialist')}
             <ArrowUpRight className="w-3 h-3" />
          </button>

          {/* Primary Actions */}
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            {!isSpecialist && currentUser && (
                // CLIENT VIEW
                <Link to="/create-task" className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${location.pathname === '/create-task' ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                    <PlusCircle className="w-4 h-4" />
                    <span>{t('createOrder')}</span>
                </Link>
            )}
            
            {/* Specialist View: No header buttons needed as Dashboard has AI search */}

            {/* Messages */}
            {currentUser && (
               <Link to="/messages" className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <MessageSquare className="w-5 h-5" />
                  {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary-600 rounded-full border-2 border-white dark:border-slate-800"></span>
                  )}
               </Link>
            )}
          </nav>

          {/* Utilities */}
          <div className="flex items-center gap-2 border-l border-gray-200 dark:border-slate-700 pl-4">
            <button 
                onClick={toggleLanguage}
                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors uppercase"
            >
                {language}
            </button>

            <button 
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Auth */}
          {currentUser ? (
             <div className="flex items-center gap-2 ml-2">
                <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 p-1 rounded-full transition-colors pr-3 border border-transparent hover:border-gray-200 dark:hover:border-slate-600">
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                    <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
                </Link>
             </div>
          ) : (
             <Link to="/login" className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 transition-colors">
                <span>{t('login')}</span>
            </Link>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-[calc(4rem+env(safe-area-inset-top))] left-0 right-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 shadow-xl z-50 animate-in slide-in-from-top-2">
           <div className="flex flex-col space-y-4">
              {currentUser && (
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-700">
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                      <div>
                          <div className="font-bold text-gray-900 dark:text-white">{currentUser.name}</div>
                          <div className="text-xs text-gray-500">{currentUser.email}</div>
                      </div>
                  </div>
              )}

              {/* Mobile Logic: Hide Catalog if Specialist */}
              {!isSpecialist ? (
                  <Link 
                    to="/categories" 
                    className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg"
                  >
                      <LayoutGrid className="w-5 h-5" />
                      <span>{t('catalog')}</span>
                  </Link>
              ) : (
                  <Link 
                    to="/specialist-dashboard" 
                    className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg"
                  >
                      <Briefcase className="w-5 h-5" />
                      <span>{t('findOrders')}</span>
                  </Link>
              )}

              {!isSpecialist && currentUser && (
                <Link to="/create-task" className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg">
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('createOrder')}</span>
                </Link>
              )}

              {currentUser && (
                 <>
                    <Link to="/messages" className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg">
                        <MessageSquare className="w-5 h-5" />
                        <span>{t('messages')}</span>
                        {unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{unreadCount}</span>
                        )}
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg">
                        <User className="w-5 h-5" />
                        <span>{t('myProfile')}</span>
                    </Link>
                 </>
              )}

              <button 
                 onClick={handleRoleSwitch}
                 className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg w-full text-left"
              >
                 <ArrowUpRight className="w-5 h-5" />
                 <span>{isSpecialist ? t('iAmClient') : t('iAmSpecialist')}</span>
              </button>

              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-3 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg w-full text-left"
              >
                 <Globe className="w-5 h-5" />
                 <span>Язык: {language.toUpperCase()}</span>
              </button>
              
              <div className="border-t border-gray-100 dark:border-slate-700 pt-2 mt-2">
                  {currentUser ? (
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full text-left"
                      >
                          <LogOut className="w-5 h-5" />
                          <span>{t('logout')}</span>
                      </button>
                  ) : (
                      <Link to="/login" className="flex items-center gap-3 p-2 text-primary-600 font-bold hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg">
                          <User className="w-5 h-5" />
                          <span>{t('login')}</span>
                      </Link>
                  )}
              </div>
           </div>
        </div>
      )}
    </header>
  );
};