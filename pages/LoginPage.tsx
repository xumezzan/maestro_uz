import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { useAppContext } from '../context/AppContext';
import { User, Briefcase, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, role);
    if (role === UserRole.SPECIALIST) {
        navigate('/specialist-dashboard');
    } else {
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Вход в Maestro</h1>
          <p className="text-gray-500 dark:text-gray-400">Выберите тип аккаунта</p>
        </div>

        <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl mb-6">
          <button
            onClick={() => setRole(UserRole.CLIENT)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              role === UserRole.CLIENT
                ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            Я Заказчик
          </button>
          <button
            onClick={() => setRole(UserRole.SPECIALIST)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              role === UserRole.SPECIALIST
                ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Я Специалист
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email или телефон</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder={role === UserRole.CLIENT ? "client@example.com" : "master@example.com"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
          >
            Войти
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
           {role === UserRole.SPECIALIST ? (
               <p>
                   Нет аккаунта?{' '}
                   <Link to="/become-specialist" className="text-primary-600 hover:underline font-medium">
                       Стать специалистом
                   </Link>
               </p>
           ) : (
               <p>
                   Нет аккаунта?{' '}
                   <Link to="#" className="text-primary-600 hover:underline font-medium">
                       Зарегистрироваться
                   </Link>
               </p>
           )}
        </div>
      </div>
    </div>
  );
};