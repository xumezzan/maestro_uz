import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageSquare, User, Briefcase } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, conversations } = useAppContext();
  const { t } = useLanguage();
  const isSpecialist = role === UserRole.SPECIALIST;

  const unreadCount = conversations.reduce((acc, conv) => {
    return acc + (conv.messages.length > 0 && !conv.messages[conv.messages.length - 1].isRead ? 1 : 0);
  }, 0);

  const navItems = [
    {
      path: isSpecialist ? "/specialist/dashboard" : "/client",
      icon: isSpecialist ? Briefcase : Home,
      label: isSpecialist ? 'orders' : 'main',
      showForSpecialist: true,
      showForUser: true,
    },
    {
      path: "/client/categories",
      icon: Search,
      label: 'search',
      showForSpecialist: false,
      showForUser: true,
    },
    {
      path: "/client/create-task",
      icon: PlusCircle,
      label: 'create',
      showForSpecialist: false,
      showForUser: true,
      isMain: true,
    },
    {
      path: "/messages",
      icon: MessageSquare,
      label: 'chats',
      showForSpecialist: true,
      showForUser: true,
      badge: unreadCount,
    },
    {
      path: "/profile",
      icon: User,
      label: 'profile',
      showForSpecialist: true,
      showForUser: true,
    },
  ].filter(item => (isSpecialist && item.showForSpecialist) || (!isSpecialist && item.showForUser));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div
        className="flex justify-around items-center h-16 px-2 page-bg"
        style={{
          borderTop: '1px solid var(--fiverr-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isMainBtn = (item as any).isMain;

          if (isMainBtn) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-fiverr-green shadow-lg shadow-fiverr-green/30 hover:bg-fiverr-green-dark transition-all active:scale-90"
              >
                <item.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive
                ? 'text-fiverr-green'
                : 'text-fiverr-text-dim hover:text-fiverr-text-muted'
                }`}
            >
              <div className="relative">
                <item.icon
                  className={`w-6 h-6 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-fiverr-red rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                {t(item.label)}
              </span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-fiverr-green rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
