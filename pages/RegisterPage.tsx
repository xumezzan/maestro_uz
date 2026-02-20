import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { registerRequest, verifyEmail } = useAppContext();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [otpCode, setOtpCode] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await registerRequest({
                username: formData.username,
                email: formData.email,
                first_name: formData.firstName,
                last_name: formData.lastName,
                role: 'CLIENT'
            });
            addToast("Код подтверждения отправлен на почту", 'success');
            setStep(2);
        } catch (error) {
            addToast("Ошибка регистрации. Заполните корректно данные.", 'error');
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await verifyEmail(formData.email, otpCode);
            navigate('/');
        } catch (error) {
            addToast("Неверный код подтверждения.", 'error');
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
                                    <p className="text-xs text-fiverr-text-dim mt-2">
                                        На этот адрес мы отправим ваш пароль и код подтверждения.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full fiverr-btn fiverr-btn-primary py-3.5 text-base mt-2"
                                >
                                    Получить код
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
                                    Мы отправили пароль и 6-значный код на <br />
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
                                    className="w-full fiverr-btn fiverr-btn-primary py-3.5 text-base"
                                    disabled={otpCode.length < 6}
                                >
                                    Подтвердить и войти
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-center text-sm text-fiverr-text-dim hover:text-heading transition-colors"
                                >
                                    Вернуться назад
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
