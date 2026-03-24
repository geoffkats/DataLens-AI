import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, X, MessageSquare, ShieldCheck, Undo2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { processChatCommand } from '../services/geminiService';
import { ColumnConfig, ChatAction, SheetMetadata } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  data: any[];
  columns: ColumnConfig[];
  allSheetsMetadata?: SheetMetadata[];
  onApplyActions: (actions: ChatAction[]) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export const AIChat: React.FC<AIChatProps> = ({ data, columns, allSheetsMetadata, onApplyActions, onUndo, canUndo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your DataLens Lead Architect. I have sub-sheet awareness of your 16-sheet ecosystem. How can I help you orchestrate your data today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<ChatAction[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingActions]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await processChatCommand(input, data, columns, allSheetsMetadata);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (result.actions && result.actions.length > 0) {
        setPendingActions(result.actions);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error while processing your request. Please check your API Key configuration.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmActions = () => {
    if (pendingActions) {
      onApplyActions(pendingActions);
      setPendingActions(null);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {canUndo && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={onUndo}
            className="w-12 h-12 bg-white text-zinc-600 rounded-full shadow-xl flex items-center justify-center hover:bg-zinc-50 border border-zinc-100"
            title="Undo last AI action"
          >
            <History className="w-5 h-5" />
          </motion.button>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-14 h-14 bg-zinc-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform",
            isOpen && "hidden"
          )}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[400px] h-[650px] bg-white rounded-3xl shadow-2xl border border-zinc-100 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">DataLens God Mode</h3>
                  <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">Orchestrator Active • 16 Sheets Aware</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canUndo && (
                  <button 
                    onClick={onUndo}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-emerald-400"
                    title="Undo last AI action"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    msg.role === 'assistant' ? "bg-zinc-900 text-white" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === 'assistant' 
                      ? "bg-white text-zinc-700 rounded-tl-none border border-zinc-100" 
                      : "bg-emerald-600 text-white rounded-tr-none"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {pendingActions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    Visual Forensic Preview
                  </div>
                  <div className="space-y-2">
                    {pendingActions.map((action, i) => (
                      <div key={i} className="text-xs text-emerald-800 flex items-start gap-2">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                        {action.description || action.type}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={confirmActions}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                    >
                      Apply Changes
                    </button>
                    <button 
                      onClick={() => setPendingActions(null)}
                      className="px-4 py-2 bg-white text-zinc-500 rounded-xl text-xs font-bold border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 bg-white text-zinc-700 rounded-2xl rounded-tl-none border border-zinc-100 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-zinc-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask for complex joins or data fixes..."
                  className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 text-center mt-2">
                Data Analyst in a Box • Sub-Sheet Aware
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
