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
  
  // State for selected conversation
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
        navigate('/login');
    }
  }, [currentUser, navigate]);

  // Handle URL params for direct navigation
  useEffect(() => {
      const idParam = searchParams.get('id');
      const participantParam = searchParams.get('participantId');

      if (idParam) {
          setSelectedConversationId(idParam);
      } else if (participantParam) {
          const conv = conversations.find(c => c.participantId === participantParam);
          if (conv) {
              setSelectedConversationId(conv.id);
          }
      }
  }, [searchParams, conversations]);

  // Mark as read when conversation is selected or updated
  useEffect(() => {
      if (selectedConversationId && currentUser) {
          // Check if we actually have unread messages to avoid loop/unnecessary calls
          const conversation = conversations.find(c => c.id === selectedConversationId);
          const hasUnread = conversation?.messages.some(m => !m.isRead && m.senderId !== currentUser.id);
          
          if (hasUnread) {
             markAsRead(selectedConversationId);
          }
      }
  }, [selectedConversationId, conversations, markAsRead, currentUser]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversationId, conversations, selectedFile]); // Added selectedFile to scroll when preview appears

  if (!currentUser) {
      return null;
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert("Файл слишком большой (макс 5MB)");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedFile(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleClearFile = () => {
      setSelectedFile(null);
  };

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedConversationId) return;
      if (!inputText.trim() && !selectedFile) return;

      sendMessage(
          selectedConversationId, 
          inputText, 
          selectedFile ? { url: selectedFile, type: 'image' } : undefined
      );
      setInputText('');
      setSelectedFile(null);
  };

  const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    // Adjusted height: 100vh - 64px (Header) - 64px (Bottom Nav on Mobile). 
    // On Desktop (md), Bottom Nav is hidden, so height is just 100vh - 64px.
    <div className="h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] bg-gray-50 dark:bg-slate-900 flex overflow-hidden">
      
      {/* Sidebar List (Hidden on mobile if chat selected) */}
      <div className={`w-full md:w-80 lg:w-96 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('messages')}</h1>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Поиск..." 
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 border-none focus:ring-2 focus:ring-primary-500 outline-none text-sm dark:text-white"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                    {t('noMessages')}
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
                            className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
                        >
                            <div className="relative flex-shrink-0">
                                <img src={conv.participantAvatar} alt={conv.participantName} className="w-12 h-12 rounded-full object-cover" />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{conv.participantName}</h3>
                                    {lastMsg && <span className="text-xs text-gray-400">{formatTime(lastMsg.timestamp)}</span>}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-sm truncate pr-2 ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {lastMsg && lastMsg.senderId === currentUser.id ? `Вы: ${lastText}` : lastText}
                                    </p>
                                    {hasUnread && (
                                        <span className="w-2.5 h-2.5 bg-primary-600 rounded-full flex-shrink-0"></span>
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
      <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-slate-900 ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
         
         {selectedConversation ? (
             <>
                {/* Chat Header */}
                <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setSelectedConversationId(null)}
                            className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <img src={selectedConversation.participantAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white leading-tight">{selectedConversation.participantName}</h2>
                            <span className="text-xs text-green-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {t('online')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors hidden sm:block">
                            <Phone className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors hidden sm:block">
                            <Video className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5] dark:bg-[#0b1120]">
                    {selectedConversation.messages.map((msg, index) => {
                        const isMe = msg.senderId === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 shadow-sm ${
                                    isMe 
                                    ? 'bg-primary-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                                }`}>
                                    {msg.mediaType === 'image' && msg.mediaUrl && (
                                        <div className="mb-2 -mx-2 -mt-2">
                                            <img src={msg.mediaUrl} alt="Вложение" className="rounded-xl w-full h-auto max-h-64 object-cover" />
                                        </div>
                                    )}
                                    {msg.text && (
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    )}
                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white dark:bg-slate-800 p-4 border-t border-gray-200 dark:border-slate-700">
                    {selectedFile && (
                        <div className="flex items-center gap-4 mb-3 p-2 bg-gray-50 dark:bg-slate-700 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                            <img src={selectedFile} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-500 dark:text-gray-300">Изображение выбрано</span>
                            </div>
                            <button onClick={handleClearFile} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSend} className="flex gap-2 items-end max-w-4xl mx-auto">
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center px-4 py-2">
                             <input 
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={t('typeMessage')}
                                className="flex-1 bg-transparent border-none focus:ring-0 outline-none max-h-32 dark:text-white"
                             />
                        </div>
                        <button 
                            type="submit"
                            disabled={!inputText.trim() && !selectedFile}
                            className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
             </>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                 <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Info className="w-10 h-10 text-gray-300 dark:text-slate-600" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('selectChat')}</h3>
                 <p className="max-w-xs text-center">{t('noMessages')}</p>
             </div>
         )}
      </div>
    </div>
  );
};