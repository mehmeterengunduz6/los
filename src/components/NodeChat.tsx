'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CurriculumNode, ChatMessage, LearningSession, NodeChatHistory } from '@/types';
import { findNodeInCurriculum, getNodeChatHistory } from '@/lib/context-manager';

interface NodeChatProps {
  session: LearningSession;
  nodeId: string;
  onClose: () => void;
  onSessionUpdate: (session: LearningSession) => void;
}

export default function NodeChat({ 
  session, 
  nodeId, 
  onClose, 
  onSessionUpdate 
}: NodeChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get current node and chat history
  const currentNode = findNodeInCurriculum(session.curriculum, nodeId);
  const chatHistory = getNodeChatHistory(session, nodeId);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory.messages, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // Mark node as in-progress when chat opens
  useEffect(() => {
    if (currentNode && currentNode.status === 'not-started') {
      const updateNodeStatus = (node: CurriculumNode): CurriculumNode => {
        if (node.id === nodeId) {
          return { ...node, status: 'in-progress' };
        }
        return {
          ...node,
          children: node.children.map(updateNodeStatus)
        };
      };
      
      onSessionUpdate({
        ...session,
        curriculum: updateNodeStatus(session.curriculum),
        updatedAt: Date.now()
      });
    }
  }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    // Add user message to history
    const updatedHistory: NodeChatHistory = {
      nodeId,
      messages: [...chatHistory.messages, userMessage]
    };

    const newSession: LearningSession = {
      ...session,
      chatHistories: {
        ...session.chatHistories,
        [nodeId]: updatedHistory
      },
      updatedAt: Date.now()
    };

    onSessionUpdate(newSession);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          nodeId,
          message: userMessage.content,
          chatHistories: newSession.chatHistories,
          curriculum: session.curriculum,
          personalization: session.personalization
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setStreamingMessage(fullResponse);
        }
      }

      // Add assistant message to history
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
      };

      const finalHistory: NodeChatHistory = {
        nodeId,
        messages: [...updatedHistory.messages, assistantMessage]
      };

      onSessionUpdate({
        ...newSession,
        chatHistories: {
          ...newSession.chatHistories,
          [nodeId]: finalHistory
        },
        updatedAt: Date.now()
      });

      setStreamingMessage('');
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: Date.now()
      };

      const errorHistory: NodeChatHistory = {
        nodeId,
        messages: [...updatedHistory.messages, errorMessage]
      };

      onSessionUpdate({
        ...newSession,
        chatHistories: {
          ...newSession.chatHistories,
          [nodeId]: errorHistory
        },
        updatedAt: Date.now()
      });
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  }, [input, isLoading, nodeId, chatHistory.messages, session, onSessionUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const markAsCompleted = () => {
    const updateNodeStatus = (node: CurriculumNode): CurriculumNode => {
      if (node.id === nodeId) {
        return { ...node, status: 'completed' };
      }
      return {
        ...node,
        children: node.children.map(updateNodeStatus)
      };
    };
    
    onSessionUpdate({
      ...session,
      curriculum: updateNodeStatus(session.curriculum),
      updatedAt: Date.now()
    });
  };

  if (!currentNode) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500">
        Node not found
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="outline" 
                className={`
                  ${currentNode.status === 'completed' 
                    ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' 
                    : currentNode.status === 'in-progress'
                      ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                      : 'border-zinc-600 text-zinc-400'
                  }
                `}
              >
                {currentNode.status === 'completed' ? '✓ Completed' : 
                 currentNode.status === 'in-progress' ? 'In Progress' : 'Not Started'}
              </Badge>
            </div>
            <h2 className="text-lg font-medium text-white truncate">
              {currentNode.title}
            </h2>
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
              {currentNode.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-zinc-400 hover:text-white flex-shrink-0"
          >
            ✕
          </Button>
        </div>
        
        {currentNode.status !== 'completed' && chatHistory.messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAsCompleted}
            className="mt-3 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            Mark as Completed ✓
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {chatHistory.messages.length === 0 && !streamingMessage && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mb-3">
                💡
              </div>
              <p className="text-zinc-400 text-sm">
                Send a message to start learning about this topic.
              </p>
              <p className="text-zinc-500 text-xs mt-2">
                Try: &quot;I&apos;m ready to learn&quot; or &quot;Teach me this topic&quot;
              </p>
            </div>
          )}
          
          {chatHistory.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] rounded-2xl px-4 py-3
                  ${message.role === 'user'
                    ? 'bg-amber-500/20 text-amber-50 rounded-tr-sm'
                    : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                  }
                `}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 bg-zinc-800 text-zinc-100">
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {streamingMessage}
                  <span className="inline-block w-1.5 h-4 bg-amber-400 ml-0.5 animate-pulse" />
                </div>
              </div>
            </div>
          )}
          
          {isLoading && !streamingMessage && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-zinc-800">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-zinc-800 p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send)"
            className="flex-1 min-h-[44px] max-h-[150px] bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-black font-medium self-end"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

