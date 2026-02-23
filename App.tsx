import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
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
import { UserRole } from './types';

const CLIENT_HOME_PATH = '/client';
const SPECIALIST_DASHBOARD_PATH = '/specialist/dashboard';

const RequireAuth: React.FC = () => {
  const { currentUser } = useAppContext();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

const RequireRole: React.FC<{ role: UserRole }> = ({ role }) => {
  const { currentUser } = useAppContext();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (currentUser.role !== role) {
    return <Navigate to={currentUser.role === UserRole.SPECIALIST ? SPECIALIST_DASHBOARD_PATH : CLIENT_HOME_PATH} replace />;
  }

  return <Outlet />;
};

const AppContent: React.FC = () => {
  const { isDark } = useTheme();
  const { isAuthLoading } = useAppContext();

  if (isAuthLoading) {
    return (
      <div className={`min-h-screen page-bg flex items-center justify-center transition-colors duration-300 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fiverr-green"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className={`min-h-screen page-bg font-sans transition-colors duration-300 pb-16 md:pb-0 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        <Header />
        <Routes>
          {/* Canonical role zones */}
          <Route path="/" element={<Navigate to={CLIENT_HOME_PATH} replace />} />
          <Route path="/client" element={<HomePage />} />
          <Route path="/client/search" element={<SearchPage />} />
          <Route path="/client/categories" element={<CategoriesPage />} />
          <Route path="/client/specialist/:id" element={<SpecialistDetailsPage />} />
          <Route path="/specialist/:id" element={<SpecialistDetailsPage />} />

          <Route element={<RequireRole role={UserRole.CLIENT} />}>
            <Route path="/client/create-task" element={<CreateTaskPage />} />
          </Route>

          <Route element={<RequireRole role={UserRole.SPECIALIST} />}>
            <Route path="/specialist/dashboard" element={<SpecialistDashboard />} />
            <Route path="/specialist/top-up" element={<TopUpPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/become-specialist" element={<SpecialistOnboardingPage />} />

          {/* Legacy redirects */}
          <Route path="/search" element={<Navigate to="/client/search" replace />} />
          <Route path="/categories" element={<Navigate to="/client/categories" replace />} />
          <Route path="/create-task" element={<Navigate to="/client/create-task" replace />} />
          <Route path="/specialist-dashboard" element={<Navigate to={SPECIALIST_DASHBOARD_PATH} replace />} />
          <Route path="/top-up" element={<Navigate to="/specialist/top-up" replace />} />

          <Route path="*" element={<Navigate to={CLIENT_HOME_PATH} replace />} />
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
