import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAppContext();
    const [showPassword, setShowPassword] = useState(false);
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
                username: formData.username,
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
        <div className="min-h-screen flex items-center justify-center p-4 page-bg">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 rounded-full bg-fiverr-green/5 blur-[120px] -top-20 right-20" />
                <div className="absolute w-80 h-80 rounded-full bg-fiverr-blue/5 blur-[100px] bottom-10 -left-10" />
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
                        <h1 className="text-2xl font-bold text-heading mb-2">Создать аккаунт</h1>
                        <p className="text-fiverr-text-muted">Зарегистрируйтесь как заказчик</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Имя пользователя</label>
                            <input
                                type="text"
                                name="username"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="fiverr-input"
                                placeholder="user123"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Имя</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="fiverr-input"
                                    placeholder="Иван"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Фамилия</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="fiverr-input"
                                    placeholder="Иванов"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="fiverr-input"
                                placeholder="client@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Пароль</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
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
                            <PasswordStrengthMeter password={formData.password} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Подтвердите пароль</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="fiverr-input"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full fiverr-btn fiverr-btn-primary py-3.5 text-base mt-2"
                        >
                            Зарегистрироваться
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-fiverr-text-muted">
                        <p>
                            Есть аккаунт?{' '}
                            <Link to="/login" className="text-fiverr-green hover:text-fiverr-green-dark font-medium transition-colors">
                                Войти
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
