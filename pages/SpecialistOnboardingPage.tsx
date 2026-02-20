import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ServiceCategory } from '../types';
import { User, Briefcase, FileCheck, CheckCircle, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { useToast } from '../context/ToastContext';

export const SpecialistOnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const { registerSpecialist } = useAppContext();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [otpCode, setOtpCode] = useState('');

    const profileInputRef = useRef<HTMLInputElement>(null);
    const passportInputRef = useRef<HTMLInputElement>(null);
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [passportFile, setPassportFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        phone: '+998 ',
        password: '',
        category: ServiceCategory.REPAIR,
        description: '',
        priceStart: '',
        experience: '',
        location: 'Ташкент'
    });

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(prev => prev + 1);
    };

    const handlePreFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // First we request the base user registration to send OTP
            await useAppContext().registerRequest({
                username: formData.email.split('@')[0] + Date.now().toString().slice(-4), // generate unique username
                email: formData.email,
                first_name: formData.name,
                last_name: formData.surname,
                role: 'SPECIALIST'
            });
            addToast('Код подтверждения отправлен на почту!', 'success');
            setStep(4); // Move to OTP step
        } catch (error) {
            addToast('Ошибка при отправке кода.', 'error');
        }
    };

    const handleVerifyAndFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { verifyEmail, registerSpecialist } = useAppContext();
            // Verify and log in
            await verifyEmail(formData.email, otpCode);
            // Now that user is authenticated with tokens, create specialist profile
            await registerSpecialist({
                name: `${formData.name} ${formData.surname}`,
                email: formData.email,
                phone: formData.phone,
                category: formData.category,
                description: formData.description,
                priceStart: parseInt(formData.priceStart) || 0,
                location: formData.location,
                tags: [formData.category],
                verified: true,
                passportFile: passportFile || undefined,
                profileFile: profileFile || undefined
            });
            addToast('Профиль специалиста успешно создан!', 'success');
            navigate('/specialist-dashboard');
        } catch (error) {
            addToast('Ошибка подтверждения или создания профиля.', 'error');
        }
    };

    const handleFileChange = (type: 'profile' | 'passport') => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'profile') setProfileFile(file);
            if (type === 'passport') setPassportFile(file);
            addToast('Файл выбран!', 'success');
        }
    };

    return (
        <div className="min-h-screen py-12 page-bg">
            <div className="max-w-2xl mx-auto px-4">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-heading mb-2">Стать специалистом <span className="text-fiverr-green">maestro.</span></h1>
                    <p className="text-fiverr-text-muted">Находите заказы и зарабатывайте без посредников</p>
                </div>

                {/* Steps Header */}
                <div className="flex justify-between items-center mb-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-fiverr-border -z-0" />
                    {[
                        { n: 1, label: 'Аккаунт', icon: User },
                        { n: 2, label: 'Услуги', icon: Briefcase },
                        { n: 3, label: 'Проверка', icon: FileCheck },
                        { n: 4, label: 'Email', icon: CheckCircle }
                    ].map((s) => (
                        <div key={s.n} className="relative z-10 flex flex-col items-center gap-2 px-3 page-bg">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step >= s.n
                                ? 'border-fiverr-green bg-fiverr-green text-white'
                                : 'border-fiverr-border bg-fiverr-card text-fiverr-text-dim'
                                }`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-medium ${step >= s.n ? 'text-fiverr-green' : 'text-fiverr-text-dim'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="fiverr-card overflow-hidden">

                    {/* Step 1 */}
                    {step === 1 && (
                        <form onSubmit={handleNext} className="p-8 space-y-5">
                            <h2 className="text-xl font-bold text-heading">Личные данные</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Имя</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="fiverr-input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Фамилия</label>
                                    <input type="text" required value={formData.surname} onChange={e => setFormData({ ...formData, surname: e.target.value })} className="fiverr-input" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Номер телефона</label>
                                <input type="text" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="fiverr-input" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Email</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="fiverr-input" />
                            </div>

                            <button type="submit" className="w-full mt-4 fiverr-btn fiverr-btn-primary py-3">
                                Далее <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <form onSubmit={handleNext} className="p-8 space-y-5">
                            <h2 className="text-xl font-bold text-heading">О вашей работе</h2>

                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Основная категория</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                                    className="fiverr-input"
                                >
                                    {Object.values(ServiceCategory).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Город</label>
                                <select value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="fiverr-input">
                                    <option value="Ташкент">Ташкент</option>
                                    <option value="Самарканд">Самарканд</option>
                                    <option value="Бухара">Бухара</option>
                                    <option value="Андижан">Андижан</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Опыт работы (лет)</label>
                                <input type="number" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} className="fiverr-input" placeholder="Например: 5" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">Минимальная стоимость выезда</label>
                                <input type="number" value={formData.priceStart} onChange={e => setFormData({ ...formData, priceStart: e.target.value })} className="fiverr-input" placeholder="UZS" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-fiverr-text-muted mb-1.5">О себе</label>
                                <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="fiverr-input resize-none" placeholder="Опишите свои навыки подробно..." />
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-fiverr-border text-fiverr-text-muted hover:border-fiverr-green hover:text-fiverr-green transition-colors">Назад</button>
                                <button type="submit" className="flex-1 fiverr-btn fiverr-btn-primary py-3">
                                    Далее <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <form onSubmit={handlePreFinish} className="p-8 space-y-6">
                            <h2 className="text-xl font-bold text-heading">Верификация и фото</h2>

                            <div className="bg-fiverr-yellow/10 border border-fiverr-yellow/20 p-4 rounded-lg flex gap-3">
                                <CheckCircle className="w-5 h-5 text-fiverr-yellow flex-shrink-0" />
                                <p className="text-sm text-fiverr-yellow">
                                    Чтобы получить значок "Проверен" и доступ к заказам, загрузите фото паспорта и личное фото. Ваши данные в безопасности.
                                </p>
                            </div>

                            {/* Profile Photo */}
                            <div
                                onClick={() => profileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${profileFile
                                    ? 'border-fiverr-green bg-fiverr-green/5'
                                    : 'border-fiverr-border hover:border-fiverr-green/50 hover:bg-white/3'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${profileFile
                                    ? 'bg-fiverr-green/10 text-fiverr-green'
                                    : 'bg-fiverr-card border border-fiverr-border text-fiverr-text-dim'
                                    }`}>
                                    {profileFile ? <CheckCircle className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                </div>
                                <h3 className="font-bold text-heading">
                                    {profileFile ? 'Фото профиля загружено' : 'Загрузить фото профиля'}
                                </h3>
                                <p className="text-sm text-fiverr-text-muted">
                                    {profileFile ? profileFile.name : 'JPG, PNG до 5MB'}
                                </p>
                                <input type="file" ref={profileInputRef} className="hidden" onChange={handleFileChange('profile')} />
                            </div>

                            {/* Passport Photo */}
                            <div
                                onClick={() => passportInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${passportFile
                                    ? 'border-fiverr-green bg-fiverr-green/5'
                                    : 'border-fiverr-border hover:border-fiverr-green/50 hover:bg-white/3'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${passportFile
                                    ? 'bg-fiverr-green/10 text-fiverr-green'
                                    : 'bg-fiverr-card border border-fiverr-border text-fiverr-text-dim'
                                    }`}>
                                    {passportFile ? <CheckCircle className="w-6 h-6" /> : <FileCheck className="w-6 h-6" />}
                                </div>
                                <h3 className="font-bold text-heading">
                                    {passportFile ? 'Паспорт загружен' : 'Загрузить фото паспорта'}
                                </h3>
                                <p className="text-sm text-fiverr-text-muted">
                                    {passportFile ? passportFile.name : 'Лицевая сторона'}
                                </p>
                                <input type="file" ref={passportInputRef} className="hidden" onChange={handleFileChange('passport')} />
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-fiverr-border text-fiverr-text-muted hover:border-fiverr-green hover:text-fiverr-green transition-colors">Назад</button>
                                <button type="submit" className="flex-1 fiverr-btn fiverr-btn-primary py-3">
                                    Получить код
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 4: OTP */}
                    {step === 4 && (
                        <form onSubmit={handleVerifyAndFinish} className="p-8 space-y-6">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-heading mb-2">Подтверждение Email</h1>
                                <p className="text-fiverr-text-muted">
                                    Мы отправили пароль и 6-значный код на <br />
                                    <span className="font-medium text-heading">{formData.email}</span>
                                </p>
                            </div>

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
                                Подтвердить и завершить
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="w-full text-center text-sm text-fiverr-text-dim hover:text-heading transition-colors"
                            >
                                Вернуться назад
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
};