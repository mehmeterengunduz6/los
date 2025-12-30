'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OnboardingMessage, PersonalizationData, LearningSession } from '@/types';
import { saveSession, saveLastInput, getSavedInput } from '@/lib/context-manager';
import { Send, Sparkles, Loader2, RotateCcw } from 'lucide-react';

export default function OnboardingChat() {
    const router = useRouter();
    const [messages, setMessages] = useState<OnboardingMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingCurriculum, setIsGeneratingCurriculum] = useState(false);
    const [savedInput, setSavedInput] = useState<PersonalizationData | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Check for saved input on mount
    useEffect(() => {
        const saved = getSavedInput();
        setSavedInput(saved);
    }, []);

    // Start with static greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: uuidv4(),
                role: 'assistant',
                content: "Hi there! 👋 What do you want to learn?",
                timestamp: Date.now()
            }]);
            inputRef.current?.focus();
        }
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle using saved input
    const handleUseSavedInput = async () => {
        if (!savedInput) return;

        setIsGeneratingCurriculum(true);
        setMessages([{
            id: uuidv4(),
            role: 'assistant',
            content: `Regenerating curriculum for "${savedInput.topic}"...`,
            timestamp: Date.now()
        }]);

        try {
            const response = await fetch('/api/generate-curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personalization: savedInput })
            });

            if (!response.ok) throw new Error('Failed to generate curriculum');

            const data = await response.json();

            const session: LearningSession = {
                id: data.sessionId,
                personalization: savedInput,
                curriculum: data.curriculum,
                chatHistories: {},
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            saveSession(session);

            setMessages([{
                id: uuidv4(),
                role: 'assistant',
                content: `Done! Taking you to your ${savedInput.topic} curriculum...`,
                timestamp: Date.now()
            }]);

            setTimeout(() => {
                router.push(`/learn/${data.sessionId}`);
            }, 1000);

        } catch (error) {
            console.error('Error regenerating curriculum:', error);
            setMessages([{
                id: uuidv4(),
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try chatting instead.',
                timestamp: Date.now()
            }]);
        } finally {
            setIsGeneratingCurriculum(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: OnboardingMessage = {
            id: uuidv4(),
            role: 'user',
            content: input.trim(),
            timestamp: Date.now()
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader');

            let assistantMessage = '';
            const messageId = uuidv4();

            // Add empty assistant message
            setMessages(prev => [...prev, {
                id: messageId,
                role: 'assistant',
                content: '',
                timestamp: Date.now()
            }]);

            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                assistantMessage += decoder.decode(value, { stream: true });

                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        id: messageId,
                        role: 'assistant',
                        content: assistantMessage,
                        timestamp: Date.now()
                    };
                    return updated;
                });
            }

            // Check if AI is ready to generate curriculum
            if (assistantMessage.includes('[READY_TO_GENERATE]')) {
                await handleCurriculumGenerationFromChat(assistantMessage);
            }
        } catch (error) {
            console.error('Error in chat:', error);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleCurriculumGenerationFromChat = async (message: string) => {
        setIsGeneratingCurriculum(true);

        try {
            // Extract personalization data from the message
            const jsonMatch = message.match(/\[READY_TO_GENERATE\]\s*(\{[\s\S]*?\})/);
            if (!jsonMatch) throw new Error('Invalid format');

            const personalization: PersonalizationData = JSON.parse(jsonMatch[1]);

            // Generate curriculum
            const response = await fetch('/api/generate-curriculum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personalization })
            });

            if (!response.ok) throw new Error('Failed to generate curriculum');

            const data = await response.json();

            // Create and save session
            const session: LearningSession = {
                id: data.sessionId,
                personalization,
                curriculum: data.curriculum,
                chatHistories: {},
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            saveSession(session);
            saveLastInput(personalization); // Save for quick regeneration

            // Update last message to show success
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: `Perfect! I've created a personalized curriculum for learning ${personalization.topic}. Let me take you to your learning dashboard!`
                };
                return updated;
            });

            // Navigate to learning page after a brief delay
            setTimeout(() => {
                router.push(`/learn/${data.sessionId}`);
            }, 1500);

        } catch (error) {
            console.error('Error generating curriculum:', error);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: 'Sorry, I had trouble creating your curriculum. Let me try again. What would you like to learn?'
                };
                return updated;
            });
        } finally {
            setIsGeneratingCurriculum(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgb(63 63 70 / 0.4) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="w-full max-w-2xl relative z-10">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-4">
                        <Sparkles className="w-4 h-4" />
                        AI Learning Assistant
                    </div>
                    <h1 className="text-3xl font-light text-white mb-2">Start Your Learning Journey</h1>
                    <p className="text-zinc-400">Tell me what you want to learn, and I&apos;ll create a personalized curriculum for you.</p>

                    {/* Saved Input Button */}
                    {savedInput && (
                        <Button
                            onClick={handleUseSavedInput}
                            disabled={isGeneratingCurriculum}
                            className="mt-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium"
                        >
                            {isGeneratingCurriculum ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <RotateCcw className="w-4 h-4 mr-2" />
                            )}
                            Regenerate: {savedInput.topic}
                        </Button>
                    )}
                </div>

                {/* Chat Container */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden">
                    {/* Messages */}
                    <ScrollArea className="h-[400px] p-6" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${message.role === 'user'
                                            ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100'
                                            : 'bg-zinc-800/80 border border-zinc-700 text-zinc-100'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {message.content.replace(/\[READY_TO_GENERATE\][\s\S]*/, '').trim() || (isLoading && message.role === 'assistant' ? '...' : message.content)}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {isGeneratingCurriculum && (
                                <div className="flex justify-start">
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 px-4 py-3 rounded-2xl">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm">Creating your personalized curriculum...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
                        <div className="flex gap-3">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                disabled={isLoading || isGeneratingCurriculum}
                                className="flex-1 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500/50 focus:ring-amber-500/20"
                            />
                            <Button
                                type="submit"
                                disabled={!input.trim() || isLoading || isGeneratingCurriculum}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-medium px-4"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
