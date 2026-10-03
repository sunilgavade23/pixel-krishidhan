import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Minus, RefreshCw, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BOT_CONTEXT_KEY = 'kd_bot_context';

const INTENTS = [
    {
        key: 'post',
        route: '/post-choice',
        keywords: ['post', 'sell', 'rent out', 'listing', 'list', 'bech', 'bhade', 'जाहिरात', 'विक्री'],
        response:
            'Post flow: + button -> choose Rent or Sell -> fill details -> upload photos -> submit. I can open posting page now.',
        suggestions: ['Open posting page', 'Required fields', 'Back to menu'],
    },
    {
        key: 'book',
        route: '/home',
        keywords: ['book', 'booking', 'buy', 'request', 'order now', 'बुक', 'खरेदी', 'किराया', 'rent'],
        response:
            'Booking flow: open listing -> choose unit/date -> check total fare -> send request. Owner approves in their orders.',
        suggestions: ['Open listings', 'Booking status meaning', 'Back to menu'],
    },
    {
        key: 'orders',
        route: '/my-orders',
        keywords: ['order', 'history', 'status', 'pending', 'approved', 'rejected', 'orders', 'ऑर्डर', 'स्टेटस'],
        response:
            'My Orders shows both sent and received requests. Status flow is: pending -> approved/rejected -> completed.',
        suggestions: ['Open My Orders', 'Payment steps', 'Back to menu'],
    },
    {
        key: 'profile',
        route: '/profile',
        keywords: ['profile', 'account', 'language', 'photo', 'city', 'name', 'प्रोफाइल', 'खाते'],
        response:
            'Profile lets you update name, phone, city, profile photo, and language.',
        suggestions: ['Open profile', 'How to change language', 'Back to menu'],
    },
    {
        key: 'categories',
        route: '/categories',
        keywords: ['category', 'tool', 'tractor', 'harvester', 'blower', 'trolly', 'rotar', 'search', 'श्रेणी'],
        response:
            'Use Categories for equipment types. Use Home search to quickly find matching listings.',
        suggestions: ['Open categories', 'Open search', 'Back to menu'],
    },
    {
        key: 'schemes',
        route: '/schemes',
        keywords: ['scheme', 'government', 'yojana', 'pm kisan', 'mahadbt', 'योजना', 'सरकारी'],
        response:
            'Government schemes are available in Home cards and full details in Schemes page.',
        suggestions: ['Open schemes', 'Back to menu'],
    },
    {
        key: 'whatsapp',
        route: '/home',
        keywords: ['whatsapp', 'chat owner', 'wa', 'contact owner'],
        response:
            'Open any listing and tap WhatsApp button to directly message owner with booking summary.',
        suggestions: ['Open listings', 'Back to menu'],
    },
    {
        key: 'payment',
        route: '/my-orders',
        keywords: ['payment', 'pay', 'upi', 'cash', 'cod', 'paid', 'पेमेंट'],
        response:
            'After owner approves, complete payment from My Orders. Payment status updates to paid/cod.',
        suggestions: ['Open My Orders', 'Booking status meaning', 'Back to menu'],
    },
];

const QUICK_ACTIONS = [
    'Post listing',
    'How to book',
    'My orders',
    'Government schemes',
    'Payment help',
    'WhatsApp booking',
];

const contextDefaults = { lastIntent: '', createdAt: Date.now() };

const normalize = (text) => String(text || '').toLowerCase().trim();

const findIntent = (text) => {
    const q = normalize(text);
    if (!q) return null;

    let best = null;
    let bestScore = 0;

    for (const intent of INTENTS) {
        let score = 0;
        for (const kw of intent.keywords) {
            if (q.includes(kw)) score += kw.length;
        }
        if (score > bestScore) {
            best = intent;
            bestScore = score;
        }
    }

    return bestScore > 0 ? best : null;
};

const Chatbot = ({ t }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ id: 1, text: 'bot_greeting', sender: 'bot', isKey: true }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [context, setContext] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(BOT_CONTEXT_KEY) || '{}');
            return { ...contextDefaults, ...saved };
        } catch {
            return contextDefaults;
        }
    });
    const messagesEndRef = useRef(null);

    useEffect(() => {
        localStorage.setItem(BOT_CONTEXT_KEY, JSON.stringify(context));
    }, [context]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isTyping]);

    const appendBot = (text) => {
        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), text, sender: 'bot', isKey: false }]);
    };

    const appendUser = (text) => {
        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), text, sender: 'user', isKey: false }]);
    };

    const renderSuggestions = (suggestions = []) => {
        if (!Array.isArray(suggestions) || suggestions.length === 0) return;
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                sender: 'bot',
                isSuggestions: true,
                suggestions,
            },
        ]);
    };

    const respondWithIntent = (intent) => {
        appendBot(intent.response);
        renderSuggestions(intent.suggestions);
        setContext({ lastIntent: intent.key, createdAt: Date.now() });
    };

    const handleAssistantAction = (rawText) => {
        const text = normalize(rawText);

        if (!text) {
            appendBot('Please type your question.');
            return;
        }

        if (text === 'back to menu') {
            appendBot('Main options: Post listing, Booking help, My Orders, Profile, Categories, Schemes, Payment.');
            renderSuggestions(['Post listing', 'How to book', 'My orders', 'Open profile']);
            return;
        }

        if (text === 'open posting page') {
            navigate('/post-choice');
            appendBot('Opened posting page.');
            return;
        }
        if (text === 'open listings' || text === 'open search') {
            navigate('/home');
            appendBot('Opened listings page.');
            return;
        }
        if (text === 'open my orders') {
            navigate('/my-orders');
            appendBot('Opened My Orders.');
            return;
        }
        if (text === 'open profile') {
            navigate('/profile');
            appendBot('Opened profile.');
            return;
        }
        if (text === 'open categories') {
            navigate('/categories');
            appendBot('Opened categories.');
            return;
        }
        if (text === 'open schemes') {
            navigate('/schemes');
            appendBot('Opened schemes.');
            return;
        }
        if (text === 'required fields') {
            appendBot('Required listing fields: title, category, city, description, at least one photo. Price is app-standard for rent.');
            return;
        }
        if (text === 'booking status meaning') {
            appendBot('Status meaning: pending = waiting owner decision, approved = accepted, rejected = denied, completed = finished.');
            return;
        }
        if (text === 'payment steps') {
            appendBot('Payment steps: wait for owner approval -> open My Orders -> complete demo payment -> status updates.');
            return;
        }
        if (text === 'how to change language') {
            appendBot('Profile -> Language selection -> choose English/Marathi/Hindi.');
            return;
        }

        const intent = findIntent(text);
        if (intent) {
            respondWithIntent(intent);
            if (intent.route && (text.includes('open') || text.includes('go'))) {
                navigate(intent.route);
            }
            return;
        }

        if (context.lastIntent === 'book') {
            appendBot('For booking help, tell me: "date issue", "status issue", or "payment issue".');
            return;
        }

        appendBot('I can help with posting listings, booking, orders, profile, categories, schemes, and payment.');
        renderSuggestions(['Post listing', 'How to book', 'My orders', 'Government schemes']);
    };

    const withTyping = (callback, delay = 280) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            callback();
        }, delay);
    };

    const handleSend = () => {
        const outgoing = input.trim();
        if (!outgoing) return;
        appendUser(outgoing);
        setInput('');
        withTyping(() => handleAssistantAction(outgoing), 320);
    };

    const handleQuickAction = (text) => {
        appendUser(text);
        withTyping(() => handleAssistantAction(text), 220);
    };

    const resetChat = () => {
        setMessages([{ id: 1, text: 'bot_greeting', sender: 'bot', isKey: true }]);
        setContext(contextDefaults);
    };

    return (
        <div className={`fixed bottom-24 right-4 z-[60] flex flex-col items-end gap-4 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {isOpen && (
                <div className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto">
                    <div className="bg-green-700 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-white p-1 rounded-full flex items-center justify-center">
                                <img src="/logo.jpeg" alt="Bot Logo" className="w-5 h-5 object-contain" />
                            </div>
                            <span className="font-bold text-sm">{t('krishi_bot')}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={resetChat} className="hover:bg-white/20 p-1 rounded transition" title="Reset chat">
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition" title="Minimize">
                                <Minus size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.map((msg) => {
                            if (msg.isSuggestions) {
                                return (
                                    <div key={msg.id} className="flex flex-wrap gap-2">
                                        {(msg.suggestions || []).slice(0, 4).map((label) => (
                                            <button
                                                key={`${msg.id}-${label}`}
                                                onClick={() => handleQuickAction(label)}
                                                className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-700"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[82%] p-3 rounded-2xl text-xs font-medium ${msg.sender === 'user'
                                        ? 'bg-green-700 text-white rounded-tr-none'
                                        : 'bg-white text-gray-700 border border-gray-200 rounded-tl-none shadow-sm'
                                        }`}
                                    >
                                        {msg.isKey ? t(msg.text) : msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 px-3 py-2 rounded-2xl rounded-tl-none shadow-sm text-gray-400 text-[10px]">
                                    typing...
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1">
                            {QUICK_ACTIONS.map((label) => (
                                <button
                                    key={label}
                                    onClick={() => handleQuickAction(label)}
                                    className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-700"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t('type_message')}
                            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
                        />
                        <button onClick={handleSend} disabled={!input.trim()} className="bg-green-700 text-white p-2 rounded-full disabled:opacity-50 hover:scale-105 transition-transform">
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto bg-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all border-2 border-green-700 overflow-hidden"
                aria-label="Toggle chatbot"
            >
                {isOpen ? <X size={28} className="text-green-700" /> : <img src="/logo.jpeg" className="w-full h-full object-contain" alt="Open Bot" />}
            </button>
        </div>
    );
};

export default Chatbot;
