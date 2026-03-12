import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Navigation from '../components/Navigation';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const ChatPage: React.FC = () => {
    const { theme } = useUserPreferences();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I am NicheCode AI. Ask me anything about Data Structures or the training data." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:5002/chat', {
                query: userMessage.content
            });

            const botMessage: Message = { role: 'assistant', content: response.data.answer };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error fetching response:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the agent." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-hidden transition-colors duration-500">
            <Navigation />
            <div className="flex flex-1 overflow-hidden">
                {/* Main Chat Area */}
                <main className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-50 dark:from-zinc-900 via-white dark:via-zinc-950 to-white dark:to-zinc-950">

                    {/* Mobile Header */}
                    <header className="md:hidden p-4 border-b border-black/5 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-2">
                            <Bot className="w-6 h-6 text-violet-500" />
                            <span className="font-bold text-zinc-900 dark:text-white">NicheCode</span>
                        </div>
                        <Menu className="w-6 h-6 text-zinc-500" />
                    </header>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="w-4 h-4 text-violet-400" />
                                        </div>
                                    )}

                                    <div
                                        className={`relative max-w-[80%] md:max-w-[85%] p-4 rounded-3xl ${msg.role === 'user'
                                            ? 'bg-violet-600 text-white rounded-br-none shadow-lg shadow-violet-600/20'
                                            : 'bg-white dark:bg-zinc-800/50 border border-black/5 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-200 rounded-bl-none shadow-sm dark:shadow-none prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent max-w-none'
                                            }`}
                                    >
                                        {msg.role === 'user' ? (
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        ) : (
                                            <ReactMarkdown
                                                components={{
                                                    code({ node, inline, className, children, ...props }: any) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !inline && match ? (
                                                            <div className="rounded-xl overflow-hidden my-4 border border-black/5 dark:border-zinc-700/50 shadow-sm dark:shadow-none">
                                                                <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono border-b border-black/5 dark:border-zinc-800 flex justify-between items-center">
                                                                    <span>{match[1]}</span>
                                                                </div>
                                                                <SyntaxHighlighter
                                                                    style={theme === 'light' ? prism : vscDarkPlus as any}
                                                                    language={match[1]}
                                                                    PreTag="div"
                                                                    customStyle={{ margin: 0, padding: '1.25rem', background: theme === 'light' ? '#f8fafc' : '#09090b' }}
                                                                    {...props}
                                                                >
                                                                    {String(children).replace(/\n$/, '')}
                                                                </SyntaxHighlighter>
                                                            </div>
                                                        ) : (
                                                            <code className="bg-violet-500/10 dark:bg-zinc-700/50 px-1.5 py-0.5 rounded text-violet-600 dark:text-violet-300 font-mono text-sm" {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center shrink-0 mt-1">
                                            <User className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <div className="bg-white dark:bg-zinc-800/50 border border-black/5 dark:border-zinc-700/50 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm dark:shadow-none">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100"></div>
                                            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 md:p-6 pb-6 max-w-3xl mx-auto w-full">
                        <form onSubmit={handleSubmit} className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                            <div className="relative flex items-center bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-zinc-700 focus-within:border-violet-500/50 shadow-2xl transition-all">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask something..."
                                    className="w-full bg-transparent px-6 py-4 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="p-2 mr-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                        <div className="text-center mt-3 text-xs text-zinc-600">
                            Powered By NicheCode AI © 2025-2026
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default ChatPage;
