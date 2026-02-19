import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { SpecialistDashboard } from './pages/SpecialistDashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SpecialistOnboardingPage } from './pages/SpecialistOnboardingPage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesPage } from './pages/MessagesPage';
import { SpecialistDetailsPage } from './pages/SpecialistDetailsPage';
import { CategoriesPage } from './pages/CategoriesPage';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or system preference on initial load
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <LanguageProvider>
      <ToastProvider>
        <AppProvider>
          <HashRouter>
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-gray-100 transition-colors duration-200 pb-16 md:pb-0">
              <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/specialist/:id" element={<SpecialistDetailsPage />} />
                <Route path="/create-task" element={<CreateTaskPage />} />
                <Route path="/specialist-dashboard" element={<SpecialistDashboard />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/become-specialist" element={<SpecialistOnboardingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/messages" element={<MessagesPage />} />
              </Routes>
              <BottomNavigation />
            </div>
          </HashRouter>
        </AppProvider>
      </ToastProvider>
    </LanguageProvider>
  );
};

export default App;