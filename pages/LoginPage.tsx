import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { useAppContext } from '../context/AppContext';
import { User, Briefcase, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      if (role === UserRole.SPECIALIST) {
        navigate('/specialist-dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      alert("Ошибка входа! Проверьте email и пароль.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-bg">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full bg-fiverr-green/5 blur-[120px] top-20 -left-20" />
        <div className="absolute w-80 h-80 rounded-full bg-fiverr-blue/5 blur-[100px] bottom-20 right-10" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-3xl font-black text-heading">
            maestro<span className="text-fiverr-green">.</span>
          </Link>
        </div>

        <div className="fiverr-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-heading mb-2">Вход в аккаунт</h1>
            <p className="text-fiverr-text-muted">Выберите тип аккаунта</p>
          </div>

          {/* Role Toggle */}
          <div className="flex p-1 rounded-xl bg-fiverr-darker border border-fiverr-border mb-6">
            <button
              onClick={() => setRole(UserRole.CLIENT)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${role === UserRole.CLIENT
                ? 'bg-fiverr-green text-white shadow-lg shadow-fiverr-green/20'
                : 'text-fiverr-text-muted hover:text-heading'
                }`}
            >
              <User className="w-4 h-4" />
              Я Заказчик
            </button>
            <button
              onClick={() => setRole(UserRole.SPECIALIST)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${role === UserRole.SPECIALIST
                ? 'bg-fiverr-green text-white shadow-lg shadow-fiverr-green/20'
                : 'text-fiverr-text-muted hover:text-heading'
                }`}
            >
              <Briefcase className="w-4 h-4" />
              Я Специалист
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Email или телефон</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fiverr-input"
                placeholder={role === UserRole.CLIENT ? "client@example.com" : "master@example.com"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fiverr-input pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fiverr-text-dim hover:text-heading transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full fiverr-btn fiverr-btn-primary py-3.5 text-base mt-2"
            >
              Войти
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-fiverr-text-muted">
            {role === UserRole.SPECIALIST ? (
              <p>
                Нет аккаунта?{' '}
                <Link to="/become-specialist" className="text-fiverr-green hover:text-fiverr-green-dark font-medium transition-colors">
                  Стать специалистом
                </Link>
              </p>
            ) : (
              <p>
                Нет аккаунта?{' '}
                <Link to="/register" className="text-fiverr-green hover:text-fiverr-green-dark font-medium transition-colors">
                  Зарегистрироваться
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};