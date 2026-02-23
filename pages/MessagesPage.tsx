import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Message, Conversation } from '../types';
import { Send, Search, ArrowLeft, MoreVertical, Phone, Video, Info, Paperclip, X } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const MessagesPage: React.FC = () => {
    const { conversations, currentUser, sendMessage, markAsRead } = useAppContext();
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!currentUser) navigate('/login');
    }, [currentUser, navigate]);

    useEffect(() => {
        const idParam = searchParams.get('id');
        const participantParam = searchParams.get('participantId');
        if (idParam) setSelectedConversationId(idParam);
        else if (participantParam) {
            const conv = conversations.find(c => c.participantId === participantParam);
            if (conv) setSelectedConversationId(conv.id);
        }
    }, [searchParams, conversations]);

    useEffect(() => {
        if (selectedConversationId && currentUser) {
            const conversation = conversations.find(c => c.id === selectedConversationId);
            const hasUnread = conversation?.messages.some(m => !m.isRead && m.senderId !== currentUser.id);
            if (hasUnread) markAsRead(selectedConversationId);
        }
    }, [selectedConversationId, conversations, markAsRead, currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [selectedConversationId, conversations, selectedFile]);

    if (!currentUser) return null;

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { alert("Файл слишком большой (макс 5MB)"); return; }
            const reader = new FileReader();
            reader.onloadend = () => setSelectedFile(reader.result as string);
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleClearFile = () => setSelectedFile(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConversation) return;
        await sendMessage(selectedConversation.id, inputText, selectedFile ? { url: selectedFile, type: 'image' } : undefined);
        setInputText('');
        setSelectedFile(null);
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] flex overflow-hidden page-bg">

            {/* Sidebar */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-fiverr-border flex flex-col section-bg ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>

                <div className="p-4 border-b border-fiverr-border">
                    <h1 className="text-xl font-bold text-heading mb-4">{t('messages') || 'Сообщения'}</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fiverr-text-dim" />
                        <input
                            type="text"
                            placeholder="Поиск..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-fiverr-card border border-fiverr-border text-heading text-sm outline-none focus:border-fiverr-green transition-colors placeholder-fiverr-text-dim"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-fiverr-text-dim">
                            {t('noMessages') || 'Нет сообщений'}
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const lastMsg = conv.messages[conv.messages.length - 1];
                            const isActive = conv.id === selectedConversationId;
                            const hasUnread = conv.messages.some(m => !m.isRead && m.senderId !== currentUser.id);
                            const lastText = lastMsg
                                ? (lastMsg.mediaType === 'image' ? '📷 Фото' : lastMsg.text)
                                : 'Нет сообщений';

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedConversationId(conv.id)}
                                    className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-fiverr-border/50 ${isActive ? 'bg-fiverr-green/10 border-l-2 border-l-fiverr-green' : 'hover:bg-white/5'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <img src={conv.participantAvatar} alt={conv.participantName} className="w-12 h-12 rounded-full object-cover ring-2 ring-fiverr-border" />
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-fiverr-green rounded-full border-2" style={{ borderColor: '#12122a' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-heading truncate">{conv.participantName}</h3>
                                            {lastMsg && <span className="text-xs text-fiverr-text-dim">{formatTime(lastMsg.timestamp)}</span>}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-sm truncate pr-2 ${hasUnread ? 'font-bold text-heading' : 'text-fiverr-text-muted'}`}>
                                                {lastMsg && lastMsg.senderId === currentUser.id ? `Вы: ${lastText}` : lastText}
                                            </p>
                                            {hasUnread && (
                                                <span className="w-2.5 h-2.5 bg-fiverr-green rounded-full flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedConversationId ? 'hidden md:flex' : 'flex'} page-bg`}>

                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-fiverr-border flex items-center justify-between z-10 section-bg">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedConversationId(null)}
                                    className="md:hidden p-2 -ml-2 text-fiverr-text-muted hover:text-heading"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <img src={selectedConversation.participantAvatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-fiverr-border" />
                                <div>
                                    <h2 className="font-bold text-heading leading-tight">{selectedConversation.participantName}</h2>
                                    <span className="text-xs text-fiverr-green flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-fiverr-green" />
                                        {t('online') || 'онлайн'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-fiverr-text-muted">
                                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors hidden sm:block">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors hidden sm:block">
                                    <Video className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-bg">
                            {selectedConversation.messages.map((msg) => {
                                const isMe = msg.senderId === currentUser.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 ${isMe
                                            ? 'bg-fiverr-green text-white rounded-br-sm'
                                            : 'bg-fiverr-card text-heading border border-fiverr-border rounded-bl-sm'
                                            }`}>
                                            {msg.mediaType === 'image' && msg.mediaUrl && (
                                                <div className="mb-2 -mx-2 -mt-1">
                                                    <img src={msg.mediaUrl} alt="Вложение" className="rounded-xl w-full h-auto max-h-64 object-cover" />
                                                </div>
                                            )}
                                            {msg.text && (
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                            )}
                                            <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/60' : 'text-fiverr-text-dim'}`}>
                                                {formatTime(msg.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-fiverr-border section-bg">
                            {selectedFile && (
                                <div className="flex items-center gap-4 mb-3 p-2 bg-fiverr-card border border-fiverr-border rounded-xl animate-fade-in">
                                    <img src={selectedFile} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-fiverr-text-muted">Изображение выбрано</span>
                                    </div>
                                    <button onClick={handleClearFile} className="p-1 hover:bg-white/10 rounded-full">
                                        <X className="w-5 h-5 text-fiverr-text-muted" />
                                    </button>
                                </div>
                            )}
                            <form onSubmit={handleSend} className="flex gap-2 items-end max-w-4xl mx-auto">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-fiverr-text-muted hover:text-fiverr-green hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

                                <div className="flex-1 bg-fiverr-card border border-fiverr-border rounded-xl flex items-center px-4 py-2">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder={t('typeMessage') || 'Написать сообщение...'}
                                        className="flex-1 bg-transparent border-none outline-none text-heading placeholder-fiverr-text-dim"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() && !selectedFile}
                                    className="p-3 bg-fiverr-green hover:bg-fiverr-green-dark text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-fiverr-text-dim p-8">
                        <div className="w-20 h-20 bg-fiverr-card border border-fiverr-border rounded-full flex items-center justify-center mb-4">
                            <Info className="w-10 h-10 text-fiverr-text-dim" />
                        </div>
                        <h3 className="text-xl font-bold text-heading mb-2">{t('selectChat') || 'Выберите чат'}</h3>
                        <p className="max-w-xs text-center">{t('noMessages') || 'Нет сообщений'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};