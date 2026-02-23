import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ArrowRight, ArrowLeft, Eye, EyeOff, RefreshCw } from 'lucide-react';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { registerRequest, verifyEmail, resendVerification } = useAppContext();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [otpCode, setOtpCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        passwordConfirm: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.passwordConfirm) {
            addToast("Пароли не совпадают", 'error');
            return;
        }

        if (formData.password.length < 8) {
            addToast("Пароль должен содержать минимум 8 символов", 'error');
            return;
        }

        setLoading(true);
        try {
            await registerRequest({
                username: formData.username,
                email: formData.email,
                first_name: formData.firstName,
                last_name: formData.lastName,
                password: formData.password,
                password_confirm: formData.passwordConfirm,
                role: 'CLIENT'
            });
            addToast("Код подтверждения отправлен на почту", 'success');
            setStep(2);
        } catch (error: any) {
            const data = error.response?.data;
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                // Show first error message from server
                const firstKey = Object.keys(data)[0];
                const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
                addToast(msg || "Ошибка регистрации", 'error');
            } else {
                addToast("Сервер недоступен или вернул непредвиденную ошибку.", 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await verifyEmail(formData.email, otpCode);
            if (user.role === 'SPECIALIST') {
                navigate('/specialist/dashboard');
            } else {
                navigate('/client');
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || "Неверный код подтверждения.";
            addToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await resendVerification(formData.email);
        } catch {
            addToast("Ошибка повторной отправки", 'error');
        } finally {
            setResending(false);
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
                    <Link to="/client" className="inline-block text-3xl font-black text-heading">
                        maestro<span className="text-fiverr-green">.</span>
                    </Link>
                </div>

                <div className="fiverr-card p-8">
                    {step === 1 ? (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-heading mb-2">Создать аккаунт</h1>
                                <p className="text-fiverr-text-muted">Зарегистрируйтесь как заказчик</p>
                            </div>

                            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Имя пользователя (Логин)</label>
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
                                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Электронная почта</label>
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
                                            minLength={8}
                                            value={formData.password}
                                            onChange={handleChange}
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
                                        name="passwordConfirm"
                                        required
                                        minLength={8}
                                        value={formData.passwordConfirm}
                                        onChange={handleChange}
                                        className="fiverr-input"
                                        placeholder="Повторите пароль"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full fiverr-btn fiverr-btn-primary py-3.5 text-base mt-2 disabled:opacity-50"
                                >
                                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
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
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-heading mb-2">Подтверждение Email</h1>
                                <p className="text-fiverr-text-muted">
                                    Мы отправили 6-значный код на <br />
                                    <span className="font-medium text-heading">{formData.email}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifySubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5 text-center">Код подтверждения</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        autoComplete="off"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        className="fiverr-input text-center text-2xl tracking-[0.5em] font-medium py-4"
                                        placeholder="••••••"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full fiverr-btn fiverr-btn-primary py-3.5 text-base disabled:opacity-50"
                                    disabled={otpCode.length < 6 || loading}
                                >
                                    {loading ? 'Проверка...' : 'Подтвердить и войти'}
                                </button>

                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="inline-flex items-center gap-1 text-sm text-fiverr-text-dim hover:text-heading transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Назад
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resending}
                                        className="inline-flex items-center gap-1 text-sm text-fiverr-green hover:text-fiverr-green-dark transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                                        {resending ? 'Отправка...' : 'Отправить снова'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
