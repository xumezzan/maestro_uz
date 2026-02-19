import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageSquare, User, Briefcase } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { role, conversations } = useAppContext();
  const { t } = useLanguage();
  const isSpecialist = role === UserRole.SPECIALIST;

  const isActive = (path: string) => location.pathname === path;

  // Calculate unread messages
  const unreadCount = conversations.reduce((acc, conv) => {
    return acc + (conv.messages.length > 0 && !conv.messages[conv.messages.length -1].isRead ? 1 : 0);
  }, 0);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-40 transition-colors duration-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        
        {/* Home */}
        <Link 
          to={isSpecialist ? "/specialist-dashboard" : "/"} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') || isActive('/specialist-dashboard') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {isSpecialist ? <Briefcase className="w-6 h-6" /> : <Home className="w-6 h-6" />}
          <span className="text-[10px] font-medium">{isSpecialist ? t('orders') : t('main')}</span>
        </Link>

        {/* Search / Catalog */}
        {!isSpecialist && (
          <Link 
            to="/categories" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/categories') || isActive('/search') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-medium">{t('search')}</span>
          </Link>
        )}

        {/* Create Task (Center Button) */}
        {!isSpecialist && (
          <Link 
            to="/create-task" 
            className="flex flex-col items-center justify-center w-full h-full -mt-6"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
               isActive('/create-task') 
               ? 'bg-primary-700 text-white' 
               : 'bg-primary-600 text-white'
            }`}>
              <PlusCircle className="w-8 h-8" />
            </div>
          </Link>
        )}

        {/* Messages */}
        <Link 
          to="/messages" 
          className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/messages') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-white dark:border-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">{t('chats')}</span>
        </Link>

        {/* Profile */}
        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/profile') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t('profile')}</span>
        </Link>

      </div>
    </div>
  );
};