import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, BadgeCheck, X, Eye } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Specialist } from '../types';
import { getAccessToken } from '../services/authStorage';

export const AdminDashboard: React.FC = () => {
    const { currentUser } = useAppContext();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [pendingSpecialists, setPendingSpecialists] = useState<Specialist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Redirect if not admin
        if (!currentUser || !currentUser.isAdmin) {
            navigate('/client');
            return;
        }

        const fetchPending = async () => {
            try {
                const res = await fetch('/api/admin/specialists/', {
                    headers: { 'Authorization': `Bearer ${getAccessToken()}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPendingSpecialists(data.map((s: any) => ({
                        id: s.id.toString(),
                        name: s.name,
                        category: s.category,
                        avatarUrl: s.avatarUrl,
                        verified: s.is_verified,
                        passportUrl: s.passport_image // Requires backend media configuration
                    })));
                } else {
                    addToast('Ошибка загрузки данных', 'error');
                }
            } catch (error) {
                console.error("Failed to fetch pending specialists", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPending();
    }, [currentUser, navigate, addToast]);

    const handleVerify = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/specialists/${id}/verify/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getAccessToken()}` }
            });
            if (res.ok) {
                setPendingSpecialists(prev => prev.filter(s => s.id !== id));
                addToast('Специалист верифицирован!', 'success');
            }
        } catch (error) {
            addToast('Ошибка верификации', 'error');
        }
    };

    const handleReject = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/specialists/${id}/reject/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getAccessToken()}` }
            });
            if (res.ok) {
                setPendingSpecialists(prev => prev.filter(s => s.id !== id));
                addToast('Заявка отклонена', 'info');
            }
        } catch (error) {
            addToast('Ошибка отклонения', 'error');
        }
    };

    if (!currentUser || !currentUser.isAdmin) return null;

    return (
        <div className="pt-24 pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
                <Shield className="w-8 h-8 text-fiverr-green" />
                <h1 className="text-3xl font-bold text-heading">Кабинет Модератора</h1>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-sm border border-fiverr-border">
                <h2 className="text-xl font-semibold text-heading mb-6 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                    Заявки на верификацию ({pendingSpecialists.length})
                </h2>

                {isLoading ? (
                    <div className="text-center py-8 text-fiverr-text-muted">Загрузка...</div>
                ) : pendingSpecialists.length === 0 ? (
                    <div className="text-center py-12 text-fiverr-text-muted border-2 border-dashed border-fiverr-border rounded-xl">
                        Все специалисты проверены! Очередь пуста.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingSpecialists.map(specialist => (
                            <div key={specialist.id} className="flex flex-col md:flex-row items-center justify-between p-4 border border-fiverr-border rounded-xl hover:shadow-md transition bg-background">
                                <div className="flex items-center gap-4 mb-4 md:mb-0">
                                    <img src={specialist.avatarUrl} alt={specialist.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <h3 className="font-semibold text-heading">{specialist.name}</h3>
                                        <span className="text-sm text-fiverr-text-muted">{specialist.category}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {specialist.passportUrl && (
                                        <a href={specialist.passportUrl} target="_blank" rel="noreferrer" className="func-btn text-fiverr-link flex items-center gap-1">
                                            <Eye className="w-4 h-4" /> Паспорт
                                        </a>
                                    )}
                                    <button onClick={() => handleVerify(specialist.id)} className="btn-primary flex items-center gap-2 px-4 py-2">
                                        <BadgeCheck className="w-4 h-4" /> Одобрить
                                    </button>
                                    <button onClick={() => handleReject(specialist.id)} className="btn-secondary text-fiverr-red hover:bg-red-50 flex items-center gap-2 px-4 py-2">
                                        <X className="w-4 h-4" /> Отклонить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
