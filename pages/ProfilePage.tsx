import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { UserRole, TaskStatus, UserProfile } from '../types';
import { MOCK_SPECIALISTS } from '../constants';
import { SpecialistCard } from '../components/SpecialistCard';
import { 
  User, Mail, Phone, MapPin, Star, 
  Settings, Camera, Edit2, BadgeCheck, Clock, Calendar, Lock, CheckCircle, Briefcase, DollarSign, Tag, Instagram, Send, ChevronRight, FileText, History, Filter, XCircle, Heart, Trash2, MessageCircle
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { currentUser, tasks, updateUser, deleteTask, taskResponses, startChat } = useAppContext();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'history' | 'favorites'>('overview');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELED'>('ALL');
  
  // Local state for avatar preview
  const [avatar, setAvatar] = useState<string | undefined>(currentUser?.avatarUrl);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // State for deletion confirmation
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Local state for form fields
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

  // Initialize form data when currentUser changes or loads
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

  // Filter tasks
  const activeTasks = tasks.filter(t => t.status === TaskStatus.OPEN || t.status === TaskStatus.IN_PROGRESS);
  const historyTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELED).filter(t => {
      if (historyFilter === 'ALL') return true;
      return t.status === historyFilter;
  });

  // Filter favorites
  const favoriteSpecialists = MOCK_SPECIALISTS.filter(s => currentUser.favorites?.includes(s.id));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit check
          addToast("Файл слишком большой (макс 5MB)", 'error');
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setUploadSuccess(true);
        addToast("Фотография загружена", 'success');
        setTimeout(() => setUploadSuccess(false), 3000); // Clear success state after 3s
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

    // If specialist, sync with specialist profile
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 md:py-12 transition-colors duration-200 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden relative group">
              
              {/* Cover Gradient */}
              <div className="h-32 bg-gradient-to-r from-violet-600 to-indigo-600 relative">
                 <div className="absolute inset-0 bg-black/10"></div>
                 {isSpecialist && specialistData?.verified && (
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" /> {t('verified')}
                    </div>
                 )}
              </div>

              <div className="px-6 pb-6 relative">
                 {/* Avatar */}
                 <div className="relative -mt-16 mb-4 flex justify-center">
                    <div className="relative">
                        <div 
                          className="w-32 h-32 rounded-full p-1 bg-white dark:bg-slate-800 shadow-xl cursor-pointer group overflow-hidden relative"
                          onClick={() => fileInputRef.current?.click()}
                        >
                            {avatar ? (
                                <img 
                                    src={avatar} 
                                    alt={currentUser.name} 
                                    className="w-full h-full rounded-full object-cover bg-gray-100 dark:bg-slate-700"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                    <User className="w-16 h-16" />
                                </div>
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Explicit Upload Button */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            className="absolute bottom-1 right-1 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg border-2 border-white dark:border-slate-800 transition-transform hover:scale-110 flex items-center justify-center z-20"
                            title="Загрузить фото"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        
                        {/* Success Feedback */}
                        {uploadSuccess && (
                            <div className="absolute top-0 right-0 p-1.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-in fade-in zoom-in duration-300 z-30 shadow-sm">
                                <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                        )}

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                 </div>

                 {/* User Info */}
                 <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{currentUser.name}</h2>
                    <p className="text-primary-600 dark:text-primary-400 font-medium text-sm mb-3">
                        {isSpecialist ? (specialistData?.category ? t(specialistData.category) : t('specialist')) : t('client')}
                    </p>
                    
                    {isSpecialist && specialistData && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-bold text-gray-900 dark:text-white">{specialistData.rating}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">({specialistData.reviewsCount} {t('reviews')})</span>
                        </div>
                    )}
                 </div>

                 {/* Contacts & Socials */}
                 <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-gray-400">
                            <Mail className="w-4 h-4" />
                        </div>
                        <span className="truncate">{currentUser.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-gray-400">
                            <Phone className="w-4 h-4" />
                        </div>
                        <span>{isSpecialist ? '+998 90 123 45 67' : '+998 ** *** ** **'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-gray-400">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <span>{currentUser.location || t('tashkent')}</span>
                    </div>

                    {isSpecialist && (
                        <div className="flex justify-center gap-3 mt-4 pt-4">
                            {specialistData?.telegram && (
                                <a href={`https://t.me/${specialistData.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all hover:scale-110">
                                    <Send className="w-5 h-5" />
                                </a>
                            )}
                            {specialistData?.instagram && (
                                <a href={`https://instagram.com/${specialistData.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-500 hover:bg-pink-100 dark:hover:bg-pink-900/40 flex items-center justify-center transition-all hover:scale-110">
                                    <Instagram className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    )}
                 </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-2">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        activeTab === 'overview' 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5" />
                        <span>{isSpecialist ? t('myProfile') : t('myOrders')}</span>
                    </div>
                    {activeTab === 'overview' && <ChevronRight className="w-4 h-4" />}
                </button>
                
                {!isSpecialist && (
                    <>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mt-1 ${
                            activeTab === 'history' 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <History className="w-5 h-5" />
                            <span>{t('orderHistory')}</span>
                        </div>
                        {activeTab === 'history' && <ChevronRight className="w-4 h-4" />}
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('favorites')}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mt-1 ${
                            activeTab === 'favorites' 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Heart className="w-5 h-5" />
                            <span>{t('favorites')}</span>
                        </div>
                        {activeTab === 'favorites' && <ChevronRight className="w-4 h-4" />}
                    </button>
                    </>
                )}

                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mt-1 ${
                        activeTab === 'settings' 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5" />
                        <span>{t('settings')}</span>
                    </div>
                    {activeTab === 'settings' && <ChevronRight className="w-4 h-4" />}
                </button>
            </nav>

          </div>

          {/* Right Content (8 cols) */}
          <div className="lg:col-span-8">
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isSpecialist ? (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">15</div>
                                    <div className="text-sm text-gray-500">{t('completedOrders')}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                    <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{specialistData?.rating || '0.0'}</div>
                                    <div className="text-sm text-gray-500">{t('avgRating')}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">2 {t('experienceYears')}</div>
                                    <div className="text-sm text-gray-500">{t('exp')}</div>
                                </div>
                            </div>

                            {/* Main Info */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary-500" />
                                    {t('aboutMe')}
                                </h3>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                                    <p className="leading-relaxed whitespace-pre-line">
                                        {specialistData?.description || t('noDescription')}
                                    </p>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-primary-500" />
                                        {t('servicesAndSkills')}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {specialistData?.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium border border-gray-200 dark:border-slate-600">
                                                {t(tag) || tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">{t('serviceCost')}</span>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('minVisit')}</div>
                                        <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                            {new Intl.NumberFormat('ru-RU').format(specialistData?.priceStart || 0)} UZS
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Client Orders View
                        <div className="space-y-4">
                             <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('activeOrders')}</h2>
                                <Link to="/create-task" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary-600/20 transition-all">
                                    + {t('createOrder')}
                                </Link>
                            </div>
                            {activeTasks.length > 0 && activeTasks.map(task => {
                                const responses = taskResponses.filter(r => r.taskId === task.id);
                                return (
                                    <div key={task.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all group overflow-hidden">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                                                    task.status === TaskStatus.OPEN 
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                }`}>
                                                    {t(task.status)}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400 text-sm font-medium">{task.budget}</span>
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setTaskToDelete(task.id);
                                                        }}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                        title="Удалить задачу"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">{task.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {task.location}</div>
                                                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {task.date}</div>
                                            </div>

                                            {/* Responses Section */}
                                            {responses.length > 0 && (
                                                <div className="mt-4 border-t border-gray-100 dark:border-slate-700 pt-4">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                                                        Отклики ({responses.length})
                                                    </div>
                                                    <div className="space-y-3">
                                                        {responses.map(response => (
                                                            <div key={response.id} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 flex gap-3">
                                                                <img src={response.specialistAvatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                                <div className="flex-grow min-w-0">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{response.specialistName}</h4>
                                                                            <div className="flex items-center gap-1 text-xs text-yellow-500">
                                                                                <Star className="w-3 h-3 fill-current" />
                                                                                <span>{response.specialistRating}</span>
                                                                            </div>
                                                                        </div>
                                                                        <span className="font-bold text-primary-600 dark:text-primary-400 text-sm whitespace-nowrap">
                                                                            {new Intl.NumberFormat('ru-RU').format(response.price)} UZS
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 mb-2 line-clamp-2">
                                                                        {response.message}
                                                                    </p>
                                                                    <button 
                                                                        onClick={() => handleStartChatWithSpecialist(response.specialistId)}
                                                                        className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 w-fit"
                                                                    >
                                                                        <MessageCircle className="w-3 h-3" />
                                                                        {t('write')}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {responses.length === 0 && (
                                                 <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 text-sm text-gray-400 italic">
                                                     Пока нет откликов. Специалисты скоро увидят вашу заявку.
                                                 </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })} 
                            
                            {activeTasks.length === 0 && (
                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-slate-700">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <Briefcase className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('noActiveOrders')}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">{t('createOrderToFind')}</p>
                                    <Link to="/create-task" className="text-primary-600 font-bold hover:underline">{t('createNow')}</Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'history' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('orderHistory')}</h2>
                   </div>
                   
                   {/* Filter Tabs */}
                   <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                       <button 
                         onClick={() => setHistoryFilter('ALL')}
                         className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                             historyFilter === 'ALL' 
                             ? 'bg-gray-800 text-white dark:bg-white dark:text-slate-900' 
                             : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                         }`}
                       >
                           {t('all')}
                       </button>
                       <button 
                         onClick={() => setHistoryFilter(TaskStatus.COMPLETED)}
                         className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                             historyFilter === TaskStatus.COMPLETED 
                             ? 'bg-emerald-600 text-white' 
                             : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                         }`}
                       >
                           {t('completed')}
                       </button>
                       <button 
                         onClick={() => setHistoryFilter(TaskStatus.CANCELED)}
                         className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                             historyFilter === TaskStatus.CANCELED 
                             ? 'bg-red-600 text-white' 
                             : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                         }`}
                       >
                           {t('canceled')}
                       </button>
                   </div>

                   {historyTasks.length > 0 ? historyTasks.map(task => (
                        <div key={task.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80 hover:opacity-100 transition-opacity">
                             <div>
                                 <div className="flex items-center gap-3 mb-2">
                                     <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                                         task.status === TaskStatus.COMPLETED 
                                         ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                         : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                     }`}>
                                         {task.status === TaskStatus.COMPLETED ? (
                                             <><CheckCircle className="w-3 h-3" /> {t('completedStatus')}</>
                                         ) : (
                                             <><XCircle className="w-3 h-3" /> {t('canceledStatus')}</>
                                         )}
                                     </span>
                                     <span className="text-gray-400 text-sm">{new Date(task.createdAt).toLocaleDateString()}</span>
                                 </div>
                                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">{task.title}</h3>
                             </div>
                             <div className="text-right sm:text-right">
                                <div className="text-lg font-bold text-gray-900 dark:text-white">{task.budget}</div>
                             </div>
                        </div>
                   )) : (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-slate-700">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <History className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('historyEmpty')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('historyEmptyDesc')}</p>
                        </div>
                   )}
                </div>
            )}
            
            {activeTab === 'favorites' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('favoriteSpecialists')}</h2>
                   </div>

                   {favoriteSpecialists.length > 0 ? (
                       <div className="grid gap-6">
                           {favoriteSpecialists.map(specialist => (
                               <SpecialistCard key={specialist.id} specialist={specialist} />
                           ))}
                       </div>
                   ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-slate-700">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Heart className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('favoritesEmpty')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">{t('favoritesEmptyDesc')}</p>
                            <Link to="/search" className="text-primary-600 font-bold hover:underline">{t('findSpecialists')}</Link>
                        </div>
                   )}
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-slate-700">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('editProfile')}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('updateInfo')}</p>
                        </div>
                        <button onClick={() => setActiveTab('overview')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 transition-colors">
                            <ChevronRight className="w-6 h-6 rotate-180" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSave} className="space-y-8">
                         {/* Personal Data */}
                         <section>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                                <User className="w-4 h-4 text-primary-500" /> {t('mainInfo')}
                            </h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('yourName')}</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500 group-focus-within:bg-primary-100 group-focus-within:text-primary-600 dark:group-focus-within:bg-primary-900/30 dark:group-focus-within:text-primary-400 transition-colors">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium"
                                            placeholder="Иван Иванов"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('city')}</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500 group-focus-within:bg-primary-100 group-focus-within:text-primary-600 dark:group-focus-within:bg-primary-900/30 dark:group-focus-within:text-primary-400 transition-colors">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={formData.location} 
                                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium"
                                            placeholder="Ташкент"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('email')}</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500 group-focus-within:bg-primary-100 group-focus-within:text-primary-600 dark:group-focus-within:bg-primary-900/30 dark:group-focus-within:text-primary-400 transition-colors">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="email" 
                                            value={formData.email} 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium"
                                            placeholder="example@mail.uz"
                                        />
                                    </div>
                                </div>
                            </div>
                         </section>

                         {isSpecialist && (
                            <section>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-primary-500" /> {t('professionalData')}
                                </h4>
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('minCost')}</label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500 group-focus-within:bg-primary-100 group-focus-within:text-primary-600 dark:group-focus-within:bg-primary-900/30 dark:group-focus-within:text-primary-400 transition-colors">
                                                    <DollarSign className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="number" 
                                                    value={formData.priceStart} 
                                                    onChange={(e) => setFormData({...formData, priceStart: e.target.value})}
                                                    className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium"
                                                    placeholder="100000"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('skillsTags')}</label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500 group-focus-within:bg-primary-100 group-focus-within:text-primary-600 dark:group-focus-within:bg-primary-900/30 dark:group-focus-within:text-primary-400 transition-colors">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={formData.tags} 
                                                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                                                    placeholder="Через запятую"
                                                    className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 flex justify-between">
                                            {t('aboutMe')}
                                            <span className="text-xs text-gray-400 font-normal">{formData.description.length} символов</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500 group-focus-within:bg-primary-100 group-focus-within:text-primary-600 dark:group-focus-within:bg-primary-900/30 dark:group-focus-within:text-primary-400 transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <textarea 
                                                rows={5}
                                                value={formData.description} 
                                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-medium resize-y"
                                                placeholder="Расскажите о своем опыте..."
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Socials */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                         <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Telegram</label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500 group-focus-within:bg-blue-100 group-focus-within:text-blue-600 dark:group-focus-within:bg-blue-900/30 dark:group-focus-within:text-blue-400 transition-colors">
                                                    <Send className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={formData.telegram} 
                                                    onChange={(e) => setFormData({...formData, telegram: e.target.value})}
                                                    placeholder="@username"
                                                    className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                                />
                                            </div>
                                         </div>
                                         <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Instagram</label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500 group-focus-within:bg-pink-100 group-focus-within:text-pink-600 dark:group-focus-within:bg-pink-900/30 dark:group-focus-within:text-pink-400 transition-colors">
                                                    <Instagram className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={formData.instagram} 
                                                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                                                    placeholder="@username"
                                                    className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                                                />
                                            </div>
                                         </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                                        <input 
                                            type="checkbox" 
                                            id="verified" 
                                            checked={formData.verified} 
                                            onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                                            className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-slate-500"
                                        />
                                        <label htmlFor="verified" className="text-sm text-gray-700 dark:text-gray-300 font-bold cursor-pointer select-none">
                                            {t('demoVerified')}
                                        </label>
                                    </div>
                                </div>
                            </section>
                         )}

                         <div className="flex justify-end gap-4 pt-6 border-t border-gray-100 dark:border-slate-700">
                             <button type="button" onClick={() => setActiveTab('overview')} className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                 {t('cancel')}
                             </button>
                             <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2 active:scale-95">
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

      {/* Confirmation Modal */}
      {taskToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Удалить заказ?</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.</p>
                  <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => setTaskToDelete(null)}
                        className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium transition-colors"
                      >
                          {t('cancel')}
                      </button>
                      <button 
                        onClick={confirmDeleteTask}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                      >
                          Удалить
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};