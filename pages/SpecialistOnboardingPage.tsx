import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ServiceCategory } from '../types';
import { User, Briefcase, FileCheck, CheckCircle, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const SpecialistOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerSpecialist } = useAppContext();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);

  // File Upload Refs and State
  const profileInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);
  const [profileUploaded, setProfileUploaded] = useState(false);
  const [passportUploaded, setPassportUploaded] = useState(false);

  // Form State
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

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    registerSpecialist({
        name: `${formData.name} ${formData.surname}`,
        email: formData.email,
        phone: formData.phone,
        category: formData.category,
        description: formData.description,
        priceStart: parseInt(formData.priceStart) || 0,
        location: formData.location,
        tags: [formData.category], // Simplified
        verified: true // Auto-verify for demo if they passed "verification" step
    });
    addToast('Вы успешно зарегистрировались!', 'success');
    navigate('/specialist-dashboard');
  };

  const handleFileChange = (type: 'profile' | 'passport') => (e: React.ChangeEvent<HTMLInputElement>) => {
      // Mock upload logic: just set state to true if a file is selected
      if (e.target.files && e.target.files[0]) {
          if (type === 'profile') setProfileUploaded(true);
          if (type === 'passport') setPassportUploaded(true);
          addToast('Файл успешно "загружен" (Демо)', 'success');
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-4">
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Стать специалистом Maestro</h1>
            <p className="text-gray-500 dark:text-gray-400">Находите заказы и зарабатывайте без посредников</p>
        </div>

        {/* Steps Header */}
        <div className="flex justify-between items-center mb-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-slate-700 -z-0"></div>
            {[
                { n: 1, label: 'Аккаунт', icon: User },
                { n: 2, label: 'Услуги', icon: Briefcase },
                { n: 3, label: 'Проверка', icon: FileCheck }
            ].map((s) => (
                <div key={s.n} className="relative z-10 flex flex-col items-center gap-2 bg-gray-50 dark:bg-slate-900 px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        step >= s.n 
                        ? 'border-primary-600 bg-primary-600 text-white' 
                        : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-400'
                    }`}>
                        <s.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-medium ${step >= s.n ? 'text-primary-600' : 'text-gray-400'}`}>
                        {s.label}
                    </span>
                </div>
            ))}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
            
            {/* Step 1: Personal Info */}
            {step === 1 && (
                <form onSubmit={handleNext} className="p-8 space-y-5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Личные данные</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Фамилия</label>
                            <input type="text" required value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Номер телефона</label>
                        <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Придумайте пароль</label>
                        <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                    </div>

                    <button type="submit" className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                        Далее <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            )}

            {/* Step 2: Professional Info */}
            {step === 2 && (
                <form onSubmit={handleNext} className="p-8 space-y-5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">О вашей работе</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Основная категория</label>
                        <select 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value as ServiceCategory})} 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        >
                            {Object.values(ServiceCategory).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Город</label>
                        <select 
                            value={formData.location} 
                            onChange={e => setFormData({...formData, location: e.target.value})} 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="Ташкент">Ташкент</option>
                            <option value="Самарканд">Самарканд</option>
                            <option value="Бухара">Бухара</option>
                            <option value="Андижан">Андижан</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Опыт работы (лет)</label>
                        <input type="number" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="Например: 5" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Минимальная стоимость выезда</label>
                        <input type="number" value={formData.priceStart} onChange={e => setFormData({...formData, priceStart: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="UZS" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">О себе (что умеете делать?)</label>
                        <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="Опишите свои навыки подробно..." />
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">Назад</button>
                        <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            Далее <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            )}

            {/* Step 3: Verification */}
            {step === 3 && (
                <form onSubmit={handleFinish} className="p-8 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Верификация и фото</h2>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg flex gap-3">
                        <CheckCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            Чтобы получить значок "Проверен" и доступ к заказам, загрузите фото паспорта и личное фото. Ваши данные в безопасности.
                        </p>
                    </div>

                    {/* Profile Photo Upload */}
                    <div 
                        onClick={() => profileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            profileUploaded 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                            profileUploaded 
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-600' 
                            : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        }`}>
                            {profileUploaded ? <CheckCircle className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                            {profileUploaded ? 'Фото профиля загружено' : 'Загрузить фото профиля'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {profileUploaded ? 'Нажмите, чтобы изменить' : 'JPG, PNG до 5MB'}
                        </p>
                        <input 
                            type="file" 
                            ref={profileInputRef} 
                            className="hidden" 
                            onChange={handleFileChange('profile')} 
                        />
                    </div>

                     {/* Passport Photo Upload */}
                     <div 
                        onClick={() => passportInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            passportUploaded 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                            passportUploaded
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-600'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-500'
                        }`}>
                            {passportUploaded ? <CheckCircle className="w-6 h-6" /> : <FileCheck className="w-6 h-6" />}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                            {passportUploaded ? 'Паспорт загружен' : 'Загрузить фото паспорта'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {passportUploaded ? 'Нажмите, чтобы изменить' : 'Лицевая сторона'}
                        </p>
                        <input 
                            type="file" 
                            ref={passportInputRef} 
                            className="hidden" 
                            onChange={handleFileChange('passport')} 
                        />
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">Назад</button>
                        <button 
                            type="submit" 
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                        >
                            Завершить регистрацию
                        </button>
                    </div>
                </form>
            )}

        </div>
      </div>
    </div>
  );
};