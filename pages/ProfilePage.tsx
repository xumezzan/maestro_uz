import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { UserRole, TaskStatus, UserProfile } from '../types';
import { MOCK_SPECIALISTS } from '../constants';
import { SpecialistCard } from '../components/SpecialistCard';
import {
    User, Mail, Phone, MapPin, Star,
    Settings, Camera, Edit2, BadgeCheck, Clock, Calendar, Lock, CheckCircle, Briefcase, Banknote, Tag, Instagram, Send, ChevronRight, FileText, History, Filter, XCircle, Heart, Trash2, MessageCircle
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
    const { currentUser, tasks, updateUser, deleteTask, taskResponses, startChat, acceptResponse } = useAppContext();
    const { t } = useLanguage();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'history' | 'favorites'>('overview');
    const [historyFilter, setHistoryFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELED'>('ALL');

    const [avatar, setAvatar] = useState<string | undefined>(currentUser?.avatarUrl);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        location: '',
        priceStart: '',
        tags: '',
        description: '',
        verified: false,
        telegram: '',
        instagram: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            const sp = currentUser.specialistProfile;
            setFormData({
                name: currentUser.name,
                email: currentUser.email,
                location: currentUser.location || (sp?.location || ''),
                priceStart: sp ? sp.priceStart.toString() : '',
                tags: sp ? sp.tags.join(', ') : '',
                description: sp ? sp.description : '',
                verified: sp ? sp.verified : false,
                telegram: sp?.telegram || '',
                instagram: sp?.instagram || ''
            });
            setAvatar(currentUser.avatarUrl);
        }
    }, [currentUser]);

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    const isSpecialist = currentUser.role === UserRole.SPECIALIST;
    const specialistData = currentUser.specialistProfile;

    const activeTasks = tasks.filter(t => t.status === TaskStatus.OPEN || t.status === TaskStatus.IN_PROGRESS);
    const historyTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELED).filter(t => {
        if (historyFilter === 'ALL') return true;
        return t.status === historyFilter;
    });

    const favoriteSpecialists = MOCK_SPECIALISTS.filter(s => currentUser.favorites?.includes(s.id));

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                addToast("Файл слишком большой (макс 5MB)", 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
                setUploadSuccess(true);
                addToast("Фотография загружена", 'success');
                setTimeout(() => setUploadSuccess(false), 3000);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedUser: UserProfile = {
            ...currentUser,
            name: formData.name,
            email: formData.email,
            location: formData.location,
            avatarUrl: avatar,
        };
        if (isSpecialist && updatedUser.specialistProfile) {
            updatedUser.specialistProfile = {
                ...updatedUser.specialistProfile,
                name: formData.name,
                location: formData.location,
                avatarUrl: avatar || updatedUser.specialistProfile.avatarUrl,
                priceStart: parseInt(formData.priceStart.replace(/\s/g, '')) || 0,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                description: formData.description.trim(),
                verified: formData.verified,
                telegram: formData.telegram,
                instagram: formData.instagram
            };
        }
        updateUser(updatedUser);
        addToast("Профиль успешно обновлен", 'success');
        setActiveTab('overview');
    };

    const handleStartChatWithSpecialist = (specialistId: string) => {
        startChat(specialistId);
        navigate(`/messages?participantId=${specialistId}`);
    };

    const confirmDeleteTask = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete);
            addToast("Заказ удален", 'info');
            setTaskToDelete(null);
        }
    };

    return (
        <div className="min-h-screen py-8 md:py-12 page-bg">
            <div className="fiverr-container">
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* Left Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Profile Card */}
                        <div className="fiverr-card overflow-hidden relative">
                            {/* Cover */}
                            <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #1dbf73 0%, #0e8c56 100%)' }}>
                                <div className="absolute inset-0 bg-black/10" />
                                {isSpecialist && specialistData?.verified && (
                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <BadgeCheck className="w-3 h-3" /> {t('verified')}
                                    </div>
                                )}
                            </div>

                            <div className="px-6 pb-6 relative">
                                <div className="relative -mt-16 mb-4 flex justify-center">
                                    <div className="relative">
                                        <div
                                            className="w-32 h-32 rounded-full p-1 shadow-xl cursor-pointer group overflow-hidden relative section-bg" onClick={() => fileInputRef.current?.click()}
                                        >
                                            {avatar ? (
                                                <img src={avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover bg-fiverr-card" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-fiverr-card flex items-center justify-center text-fiverr-text-dim">
                                                    <User className="w-16 h-16" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            className="absolute bottom-1 right-1 p-2 bg-fiverr-green hover:bg-fiverr-green-dark text-white rounded-full shadow-lg border-2 transition-transform hover:scale-110 flex items-center justify-center z-20"
                                            style={{ borderColor: '#12122a' }}
                                            title="Загрузить фото"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        {uploadSuccess && (
                                            <div className="absolute top-0 right-0 p-1.5 bg-fiverr-green rounded-full border-2 animate-fade-in z-30 shadow-sm" style={{ borderColor: '#12122a' }}>
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                </div>

                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-heading mb-1">{currentUser.name}</h2>
                                    <p className="text-fiverr-green font-medium text-sm mb-3">
                                        {isSpecialist ? (specialistData?.category ? t(specialistData.category) : t('specialist')) : t('client')}
                                    </p>
                                    {isSpecialist && specialistData && (
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-fiverr-border bg-white/5">
                                            <Star className="w-4 h-4 text-fiverr-yellow fill-current" />
                                            {specialistData.rating > 0 ? (
                                                <>
                                                    <span className="font-bold text-heading">{specialistData.rating.toFixed(1)}</span>
                                                    <span className="text-fiverr-text-dim text-xs">({specialistData.reviewsCount} {t('reviews')})</span>
                                                </>
                                            ) : (
                                                <span className="text-fiverr-text-dim text-sm">{t('noRatingsYet')}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-6 border-t border-fiverr-border">
                                    <div className="flex items-center gap-3 text-sm text-fiverr-text-muted">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-fiverr-border flex items-center justify-center flex-shrink-0 text-fiverr-text-dim">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="truncate">{currentUser.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-fiverr-text-muted">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-fiverr-border flex items-center justify-center flex-shrink-0 text-fiverr-text-dim">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span>{isSpecialist ? '+998 90 123 45 67' : '+998 ** *** ** **'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-fiverr-text-muted">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-fiverr-border flex items-center justify-center flex-shrink-0 text-fiverr-text-dim">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <span>{currentUser.location || t('tashkent')}</span>
                                    </div>
                                    {isSpecialist && (
                                        <div className="flex justify-center gap-3 mt-4 pt-4">
                                            {specialistData?.telegram && (
                                                <a href={`https://t.me/${specialistData.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-all hover:scale-110">
                                                    <Send className="w-5 h-5" />
                                                </a>
                                            )}
                                            {specialistData?.instagram && (
                                                <a href={`https://instagram.com/${specialistData.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 flex items-center justify-center transition-all hover:scale-110">
                                                    <Instagram className="w-5 h-5" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="fiverr-card p-2">
                            <button onClick={() => setActiveTab('overview')}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-fiverr-green/10 text-fiverr-green font-medium' : 'text-fiverr-text-muted hover:bg-white/5'}`}>
                                <div className="flex items-center gap-3"><Briefcase className="w-5 h-5" /><span>{isSpecialist ? t('myProfile') : t('myOrders')}</span></div>
                                {activeTab === 'overview' && <ChevronRight className="w-4 h-4" />}
                            </button>

                            {!isSpecialist && (
                                <>
                                    <button onClick={() => setActiveTab('history')}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mt-1 ${activeTab === 'history' ? 'bg-fiverr-green/10 text-fiverr-green font-medium' : 'text-fiverr-text-muted hover:bg-white/5'}`}>
                                        <div className="flex items-center gap-3"><History className="w-5 h-5" /><span>{t('orderHistory')}</span></div>
                                        {activeTab === 'history' && <ChevronRight className="w-4 h-4" />}
                                    </button>

                                    <button onClick={() => setActiveTab('favorites')}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mt-1 ${activeTab === 'favorites' ? 'bg-fiverr-green/10 text-fiverr-green font-medium' : 'text-fiverr-text-muted hover:bg-white/5'}`}>
                                        <div className="flex items-center gap-3"><Heart className="w-5 h-5" /><span>{t('favorites')}</span></div>
                                        {activeTab === 'favorites' && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                </>
                            )}

                            <button onClick={() => setActiveTab('settings')}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mt-1 ${activeTab === 'settings' ? 'bg-fiverr-green/10 text-fiverr-green font-medium' : 'text-fiverr-text-muted hover:bg-white/5'}`}>
                                <div className="flex items-center gap-3"><Settings className="w-5 h-5" /><span>{t('settings')}</span></div>
                                {activeTab === 'settings' && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </nav>
                    </div>

                    {/* Right Content */}
                    <div className="lg:col-span-8">
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-fade-in">
                                {isSpecialist ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {[
                                                { icon: CheckCircle, value: '15', label: t('completedOrders'), color: 'text-fiverr-green', bg: 'bg-fiverr-green/10' },
                                                { icon: Star, value: specialistData?.rating && specialistData.rating > 0 ? specialistData.rating.toFixed(1) : '-', label: t('avgRating'), color: 'text-fiverr-yellow', bg: 'bg-fiverr-yellow/10' },
                                                { icon: Calendar, value: `2 ${t('experienceYears')}`, label: t('exp'), color: 'text-fiverr-blue', bg: 'bg-fiverr-blue/10' },
                                            ].map((stat, idx) => (
                                                <div key={idx} className="fiverr-card p-5 flex flex-col items-center justify-center text-center">
                                                    <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-full flex items-center justify-center mb-3`}>
                                                        <stat.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-heading">{stat.value}</div>
                                                    <div className="text-sm text-fiverr-text-muted">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="fiverr-card p-8">
                                            <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
                                                <User className="w-5 h-5 text-fiverr-green" />
                                                {t('aboutMe')}
                                            </h3>
                                            <p className="text-fiverr-text-muted leading-relaxed whitespace-pre-line">
                                                {specialistData?.description || t('noDescription')}
                                            </p>
                                            <div className="mt-8">
                                                <h3 className="text-sm font-bold text-fiverr-text-dim uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-fiverr-green" />
                                                    {t('servicesAndSkills')}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {specialistData?.tags.map(tag => (
                                                        <span key={tag} className="fiverr-tag">{t(tag) || tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-fiverr-border flex items-center justify-between">
                                                <span className="text-fiverr-text-dim text-sm">{t('serviceCost')}</span>
                                                <div className="text-right">
                                                    <div className="text-sm text-fiverr-text-dim">{t('minVisit')}</div>
                                                    <div className="text-xl font-bold text-fiverr-green">
                                                        {new Intl.NumberFormat('ru-RU').format(specialistData?.priceStart || 0)} UZS
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-bold text-heading">{t('activeOrders')}</h2>
                                            <Link to="/create-task" className="fiverr-btn fiverr-btn-primary text-sm px-4 py-2">
                                                + {t('createOrder')}
                                            </Link>
                                        </div>
                                        {activeTasks.length > 0 && activeTasks.map(task => {
                                            const responses = taskResponses.filter(r => r.taskId === task.id);
                                            return (
                                                <div key={task.id} className="fiverr-card group overflow-hidden">
                                                    <div className="p-6">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={`fiverr-badge ${task.status === TaskStatus.OPEN ? 'fiverr-badge-green' : 'fiverr-badge-blue'}`}>
                                                                {t(task.status)}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-fiverr-text-dim text-sm font-medium">{task.budget}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); }}
                                                                    className="text-fiverr-text-dim hover:text-fiverr-red transition-colors p-1" title="Удалить задачу">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-heading mb-2 group-hover:text-fiverr-green transition-colors">{task.title}</h3>
                                                        <div className="flex items-center gap-4 text-sm text-fiverr-text-dim mb-4">
                                                            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {task.location}</div>
                                                            <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {task.date}</div>
                                                        </div>

                                                        {responses.length > 0 && (
                                                            <div className="mt-4 border-t border-fiverr-border pt-4">
                                                                <div className="text-sm font-bold text-heading mb-3">Отклики ({responses.length})</div>
                                                                <div className="space-y-3">
                                                                    {responses.map(response => (
                                                                        <div key={response.id} className="bg-white/5 border border-fiverr-border rounded-lg p-3 flex gap-3">
                                                                            <img src={response.specialistAvatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-fiverr-border" />
                                                                            <div className="flex-grow min-w-0">
                                                                                <div className="flex justify-between items-start">
                                                                                    <div>
                                                                                        <h4 className="font-bold text-heading text-sm truncate">{response.specialistName}</h4>
                                                                                        <div className="flex items-center gap-1 text-xs text-fiverr-yellow">
                                                                                            <Star className="w-3 h-3 fill-current" />
                                                                                            <span>{response.specialistRating}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className="font-bold text-fiverr-green text-sm whitespace-nowrap">
                                                                                        {new Intl.NumberFormat('ru-RU').format(response.price)} UZS
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-fiverr-text-muted text-sm mt-1 mb-2 line-clamp-2">{response.message}</p>
                                                                                <div className="flex gap-2">
                                                                                    <button onClick={() => handleStartChatWithSpecialist(response.specialistId)}
                                                                                        className="text-xs bg-white/5 border border-fiverr-border text-fiverr-text-muted px-3 py-1.5 rounded-md hover:border-fiverr-green hover:text-fiverr-green transition-colors flex items-center gap-1 w-fit">
                                                                                        <MessageCircle className="w-3 h-3" /> {t('write')}
                                                                                    </button>
                                                                                    {task.status === TaskStatus.OPEN && (
                                                                                        <button onClick={() => acceptResponse(response.id)}
                                                                                            className="text-xs bg-fiverr-green hover:bg-fiverr-green-dark text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 w-fit">
                                                                                            <CheckCircle className="w-3 h-3" /> {t('accept')}
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {responses.length === 0 && (
                                                            <div className="mt-4 pt-4 border-t border-fiverr-border text-sm text-fiverr-text-dim italic">
                                                                Пока нет откликов. Специалисты скоро увидят вашу заявку.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {activeTasks.length === 0 && (
                                            <div className="fiverr-card p-12 text-center border-2 border-dashed border-fiverr-border">
                                                <div className="w-16 h-16 bg-fiverr-card border border-fiverr-border rounded-full flex items-center justify-center mx-auto mb-4 text-fiverr-text-dim">
                                                    <Briefcase className="w-8 h-8" />
                                                </div>
                                                <h3 className="font-bold text-heading text-lg">{t('noActiveOrders')}</h3>
                                                <p className="text-fiverr-text-muted mt-1 mb-6">{t('createOrderToFind')}</p>
                                                <Link to="/create-task" className="text-fiverr-green font-bold hover:underline">{t('createNow')}</Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-xl font-bold text-heading mb-4">{t('orderHistory')}</h2>

                                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                    {[
                                        { key: 'ALL' as const, label: t('all'), active: 'bg-white text-fiverr-darker' },
                                        { key: 'COMPLETED' as const, label: t('completed'), active: 'bg-fiverr-green text-white' },
                                        { key: 'CANCELED' as const, label: t('canceled'), active: 'bg-fiverr-red text-white' },
                                    ].map(f => (
                                        <button key={f.key} onClick={() => setHistoryFilter(f.key)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${historyFilter === f.key
                                                ? f.active
                                                : 'text-fiverr-text-muted border border-fiverr-border hover:border-fiverr-green'
                                                }`}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                {historyTasks.length > 0 ? historyTasks.map(task => (
                                    <div key={task.id} className="fiverr-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80 hover:opacity-100 transition-opacity">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`fiverr-badge flex items-center gap-1.5 ${task.status === TaskStatus.COMPLETED ? 'fiverr-badge-green' : 'bg-fiverr-red/10 text-fiverr-red border border-fiverr-red/20'}`}>
                                                    {task.status === TaskStatus.COMPLETED ? (
                                                        <><CheckCircle className="w-3 h-3" /> {t('completedStatus')}</>
                                                    ) : (
                                                        <><XCircle className="w-3 h-3" /> {t('canceledStatus')}</>
                                                    )}
                                                </span>
                                                <span className="text-fiverr-text-dim text-sm">{new Date(task.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-heading">{task.title}</h3>
                                        </div>
                                        <div className="text-right sm:text-right">
                                            <div className="text-lg font-bold text-heading">{task.budget}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="fiverr-card p-12 text-center border-2 border-dashed border-fiverr-border">
                                        <div className="w-16 h-16 bg-fiverr-card border border-fiverr-border rounded-full flex items-center justify-center mx-auto mb-4 text-fiverr-text-dim">
                                            <History className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-bold text-heading text-lg">{t('historyEmpty')}</h3>
                                        <p className="text-fiverr-text-muted mt-1">{t('historyEmptyDesc')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-xl font-bold text-heading mb-4">{t('favoriteSpecialists')}</h2>

                                {favoriteSpecialists.length > 0 ? (
                                    <div className="grid gap-6">
                                        {favoriteSpecialists.map(specialist => (
                                            <SpecialistCard key={specialist.id} specialist={specialist} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="fiverr-card p-12 text-center border-2 border-dashed border-fiverr-border">
                                        <div className="w-16 h-16 bg-fiverr-card border border-fiverr-border rounded-full flex items-center justify-center mx-auto mb-4 text-fiverr-text-dim">
                                            <Heart className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-bold text-heading text-lg">{t('favoritesEmpty')}</h3>
                                        <p className="text-fiverr-text-muted mt-1 mb-6">{t('favoritesEmptyDesc')}</p>
                                        <Link to="/search" className="text-fiverr-green font-bold hover:underline">{t('findSpecialists')}</Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="fiverr-card p-8 animate-fade-in">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-fiverr-border">
                                    <div>
                                        <h2 className="text-2xl font-bold text-heading">{t('editProfile')}</h2>
                                        <p className="text-fiverr-text-muted text-sm mt-1">{t('updateInfo')}</p>
                                    </div>
                                    <button onClick={() => setActiveTab('overview')} className="p-2 hover:bg-white/5 rounded-full text-fiverr-text-dim transition-colors">
                                        <ChevronRight className="w-6 h-6 rotate-180" />
                                    </button>
                                </div>

                                <form onSubmit={handleSave} className="space-y-8">
                                    <section>
                                        <h4 className="text-sm font-bold text-fiverr-text-dim uppercase tracking-wider mb-5 flex items-center gap-2">
                                            <User className="w-4 h-4 text-fiverr-green" /> {t('mainInfo')}
                                        </h4>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-fiverr-text-muted ml-1">{t('yourName')}</label>
                                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="fiverr-input" placeholder="Иван Иванов" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-fiverr-text-muted ml-1">{t('city')}</label>
                                                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="fiverr-input" placeholder="Ташкент" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-bold text-fiverr-text-muted ml-1">{t('email')}</label>
                                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="fiverr-input" placeholder="example@mail.uz" />
                                            </div>
                                        </div>
                                    </section>

                                    {isSpecialist && (
                                        <section>
                                            <h4 className="text-sm font-bold text-fiverr-text-dim uppercase tracking-wider mb-5 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-fiverr-green" /> {t('professionalData')}
                                            </h4>
                                            <div className="space-y-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-fiverr-text-muted ml-1">{t('minCost')}</label>
                                                        <input type="number" value={formData.priceStart} onChange={(e) => setFormData({ ...formData, priceStart: e.target.value })} className="fiverr-input" placeholder="100000" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-fiverr-text-muted ml-1">{t('skillsTags')}</label>
                                                        <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="fiverr-input" placeholder="Через запятую" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-fiverr-text-muted ml-1 flex justify-between">
                                                        {t('aboutMe')}
                                                        <span className="text-xs text-fiverr-text-dim font-normal">{formData.description.length} символов</span>
                                                    </label>
                                                    <textarea rows={5} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="fiverr-input resize-y" placeholder="Расскажите о своем опыте..." />
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-fiverr-text-muted ml-1">Telegram</label>
                                                        <input type="text" value={formData.telegram} onChange={(e) => setFormData({ ...formData, telegram: e.target.value })} className="fiverr-input" placeholder="@username" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-fiverr-text-muted ml-1">Instagram</label>
                                                        <input type="text" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} className="fiverr-input" placeholder="@username" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-fiverr-border">
                                                    <input type="checkbox" id="verified" checked={formData.verified} onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                                                        className="w-5 h-5 rounded text-fiverr-green focus:ring-fiverr-green border-fiverr-border bg-fiverr-darker" />
                                                    <label htmlFor="verified" className="text-sm text-fiverr-text-muted font-bold cursor-pointer select-none">
                                                        {t('demoVerified')}
                                                    </label>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    <div className="flex justify-end gap-4 pt-6 border-t border-fiverr-border">
                                        <button type="button" onClick={() => setActiveTab('overview')} className="px-6 py-3 rounded-xl text-fiverr-text-muted font-bold hover:bg-white/5 transition-colors">
                                            {t('cancel')}
                                        </button>
                                        <button type="submit" className="fiverr-btn fiverr-btn-primary px-8 py-3">
                                            <CheckCircle className="w-5 h-5" />
                                            {t('save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {taskToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="fiverr-card w-full max-w-sm p-6">
                        <h3 className="text-xl font-bold text-heading mb-2">Удалить заказ?</h3>
                        <p className="text-fiverr-text-muted mb-6">Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setTaskToDelete(null)}
                                className="px-4 py-2 rounded-lg text-fiverr-text-muted hover:bg-white/5 font-medium transition-colors">
                                {t('cancel')}
                            </button>
                            <button onClick={confirmDeleteTask}
                                className="px-4 py-2 rounded-lg bg-fiverr-red text-white hover:bg-red-600 font-medium transition-colors">
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};