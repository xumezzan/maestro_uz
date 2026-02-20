import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { resetPassword } = useAppContext();
    const { addToast } = useToast();

    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Extract token from URL query params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tokenParam = params.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        }
    }, [location.search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== passwordConfirm) {
            setError('Пароли не совпадают');
            return;
        }

        if (password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов');
            return;
        }

        if (!token) {
            setError('Токен сброса пароля не найден. Запросите новую ссылку.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password, passwordConfirm);
            setSuccess(true);
        } catch (err: any) {
            const serverError = err.response?.data?.error ||
                err.response?.data?.password?.[0] ||
                err.response?.data?.token?.[0] ||
                'Ошибка сброса пароля. Попробуйте запросить новую ссылку.';
            setError(serverError);
            addToast(serverError, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 page-bg">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 rounded-full bg-fiverr-green/5 blur-[120px] top-20 -left-20" />
                <div className="absolute w-80 h-80 rounded-full bg-fiverr-blue/5 blur-[100px] bottom-20 right-10" />
            </div>

            <div className="relative max-w-md w-full">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block text-3xl font-black text-heading">
                        maestro<span className="text-fiverr-green">.</span>
                    </Link>
                </div>

                <div className="fiverr-card p-8">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-fiverr-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-fiverr-green" />
                            </div>
                            <h2 className="text-xl font-bold text-heading mb-2">Пароль изменён!</h2>
                            <p className="text-fiverr-text-muted text-sm mb-6">
                                Теперь вы можете войти с новым паролем.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="fiverr-btn fiverr-btn-primary py-3 px-6"
                            >
                                Войти
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-fiverr-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-8 h-8 text-fiverr-green" />
                                </div>
                                <h1 className="text-2xl font-bold text-heading mb-2">Новый пароль</h1>
                                <p className="text-fiverr-text-muted text-sm">
                                    Введите новый пароль для вашего аккаунта
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Новый пароль</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={8}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="fiverr-input pr-12"
                                            placeholder="Минимум 8 символов"
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

                                <div>
                                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Подтвердите пароль</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="fiverr-input"
                                        placeholder="Повторите пароль"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !token}
                                    className="w-full fiverr-btn fiverr-btn-primary py-3.5 text-base mt-2 disabled:opacity-50"
                                >
                                    {loading ? 'Сохранение...' : 'Сменить пароль'}
                                </button>
                            </form>

                            {!token && (
                                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm text-center">
                                    Токен не найден. <Link to="/forgot-password" className="text-fiverr-green hover:underline">Запросите новую ссылку</Link>
                                </div>
                            )}
                        </>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-fiverr-text-muted hover:text-heading transition-colors"
                        >
                            Вернуться к входу
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
