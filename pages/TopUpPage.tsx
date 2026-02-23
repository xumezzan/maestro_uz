import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Coins, ArrowLeft, ShieldCheck, CreditCard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getAccessToken } from '../services/authStorage';

export const TopUpPage: React.FC = () => {
    const { currentUser } = useAppContext();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [amount, setAmount] = useState('50000');
    const [paymentMethod, setPaymentMethod] = useState<'payme' | 'click'>('payme');
    const [isLoading, setIsLoading] = useState(false);

    if (!currentUser || currentUser.role !== 'SPECIALIST') {
        navigate('/client');
        return null;
    }

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) < 5000) {
            alert("Минимальная сумма пополнения: 5 000 UZS");
            return;
        }

        setIsLoading(true);
        try {
            const token = getAccessToken();
            const res = await fetch('http://localhost:8000/api/payments/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount,
                    system: paymentMethod
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Payment creation failed');
            }

            const data = await res.json();
            if (data.payment_url) {
                // Redirect user to Payme or Click checkout
                window.location.href = data.payment_url;
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            alert(error.message || t('errorOccurred') || 'Произошла ошибка при создании транзакции');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-12 page-bg">
            <div className="fiverr-container pt-8 max-w-2xl mx-auto">

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-fiverr-text-muted hover:text-heading mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{t('back') || 'Назад'}</span>
                </button>

                <div className="fiverr-card p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-fiverr-green/10 flex flex-shrink-0 items-center justify-center">
                            <Coins className="w-6 h-6 text-fiverr-green" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-heading leading-tight">{t('topUpBalance') || 'Пополнение баланса'}</h1>
                            <p className="text-fiverr-text-dim mt-1">
                                {t('currentBalance') || 'Текущий баланс'}: <strong className="text-heading">{currentUser.specialistProfile?.balance || 0} UZS</strong>
                            </p>
                        </div>
                    </div>

                    <div className="bg-fiverr-green/5 border border-fiverr-green/20 rounded-xl p-4 mb-8 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-fiverr-green flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-fiverr-text-muted">
                            {t('topUpInfo') || 'Средства на балансе используются для оплаты откликов на заказы. Стоимость одного отклика составляет 5 000 UZS. Ваши данные надежно защищены.'}
                        </p>
                    </div>

                    <form onSubmit={handleTopUp} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-fiverr-text-muted mb-2">
                                {t('topAmount') || 'Сумма пополнения (UZS)'}
                            </label>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                {[15000, 50000, 100000].map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setAmount(val.toString())}
                                        className={`py-2 px-1 text-sm font-bold rounded-lg border transition-all ${amount === val.toString()
                                            ? 'bg-fiverr-green/10 border-fiverr-green text-fiverr-green'
                                            : 'bg-transparent border-fiverr-border text-fiverr-text-muted hover:border-fiverr-text-dim'
                                            }`}
                                    >
                                        {val.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="5000"
                                step="1000"
                                className="fiverr-input text-lg font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-fiverr-text-muted mb-2">
                                {t('paymentMethod') || 'Способ оплаты'}
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('payme')}
                                    className={`relative p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all h-24 ${paymentMethod === 'payme'
                                        ? 'bg-fiverr-green/10 border-fiverr-green ring-1 ring-fiverr-green'
                                        : 'bg-transparent border-fiverr-border hover:border-fiverr-text-dim'
                                        }`}
                                >
                                    {paymentMethod === 'payme' && (
                                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-fiverr-green flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                    )}
                                    <span className="font-black text-xl tracking-wider" style={{ color: '#4ac6c0' }}>Payme</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('click')}
                                    className={`relative p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all h-24 ${paymentMethod === 'click'
                                        ? 'bg-fiverr-green/10 border-fiverr-green ring-1 ring-fiverr-green'
                                        : 'bg-transparent border-fiverr-border hover:border-fiverr-text-dim'
                                        }`}
                                >
                                    {paymentMethod === 'click' && (
                                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-fiverr-green flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                    )}
                                    <span className="font-black text-xl tracking-wider text-blue-500">CLICK</span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full fiverr-btn fiverr-btn-primary py-4 text-base mt-4 flex items-center justify-center gap-2"
                        >
                            <CreditCard className="w-5 h-5" />
                            {isLoading ? 'Обработка...' : `Оплатить ${Number(amount).toLocaleString()} UZS`}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};
