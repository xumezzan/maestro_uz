import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { SpecialistDashboard } from './pages/SpecialistDashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SpecialistOnboardingPage } from './pages/SpecialistOnboardingPage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesPage } from './pages/MessagesPage';
import { SpecialistDetailsPage } from './pages/SpecialistDetailsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { TopUpPage } from './pages/TopUpPage';
import { AdminDashboard } from './pages/AdminDashboard';

const AppContent: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <HashRouter>
      <div className={`min-h-screen page-bg font-sans transition-colors duration-300 pb-16 md:pb-0 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/specialist/:id" element={<SpecialistDetailsPage />} />
          <Route path="/create-task" element={<CreateTaskPage />} />
          <Route path="/specialist-dashboard" element={<SpecialistDashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/become-specialist" element={<SpecialistOnboardingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/top-up" element={<TopUpPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        <BottomNavigation />
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;