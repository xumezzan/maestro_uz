import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Mail, Send } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
    const { forgotPassword } = useAppContext();
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(email);
            setSent(true);
            addToast("Инструкции по сбросу пароля отправлены на email", 'success');
        } catch (error) {
            // Still show success (anti-enumeration on frontend too)
            setSent(true);
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
                    {!sent ? (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-fiverr-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8 text-fiverr-green" />
                                </div>
                                <h1 className="text-2xl font-bold text-heading mb-2">Забыли пароль?</h1>
                                <p className="text-fiverr-text-muted text-sm">
                                    Введите email вашего аккаунта и мы отправим ссылку для сброса пароля
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="fiverr-input"
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full fiverr-btn fiverr-btn-primary py-3.5 text-base mt-2 disabled:opacity-50"
                                >
                                    {loading ? 'Отправка...' : 'Отправить ссылку'}
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-fiverr-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-fiverr-green" />
                            </div>
                            <h2 className="text-xl font-bold text-heading mb-2">Проверьте почту</h2>
                            <p className="text-fiverr-text-muted text-sm mb-6">
                                Если аккаунт с email <strong className="text-heading">{email}</strong> существует,
                                мы отправили инструкции по сбросу пароля.
                            </p>
                            <p className="text-xs text-fiverr-text-dim">
                                Не получили письмо? Проверьте папку «Спам» или{' '}
                                <button
                                    onClick={() => setSent(false)}
                                    className="text-fiverr-green hover:underline"
                                >
                                    попробуйте снова
                                </button>
                            </p>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1.5 text-sm text-fiverr-text-muted hover:text-heading transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Вернуться к входу
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
