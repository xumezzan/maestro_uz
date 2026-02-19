import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { User, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAppContext();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Пароли не совпадают!");
            return;
        }

        try {
            await register({
                username: formData.username, // Using username explicitly
                email: formData.email,
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName,
                role: 'CLIENT'
            });
            navigate('/');
        } catch (error) {
            alert("Ошибка регистрации. Возможно, пользователь с таким именем уже существует.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-8">

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Регистрация</h1>
                    <p className="text-gray-500 dark:text-gray-400">Создайте аккаунт заказчика</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя пользователя</label>
                        <input
                            type="text"
                            name="username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="user123"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Иван"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Фамилия</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Иванов"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="client@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Подтвердите пароль</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
                    >
                        Зарегистрироваться
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>
                        Есть аккаунт?{' '}
                        <Link to="/login" className="text-primary-600 hover:underline font-medium">
                            Войти
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
