import React, { useState, useEffect, useRef } from 'react';
import { sendMascotChat } from '../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'rusty';
  text: string;
  source?: string;
  timestamp: string;
}

interface MascotChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  docTitle?: string;
  frameworkId?: string;
  activeClause?: string;
}

// Clean text formatter: converts **bold** to <strong> and renders paragraphs cleanly without raw asterisks
function renderFormattedMessage(rawText: string) {
  const paragraphs = rawText.split('\n\n');

  return (
    <div className="space-y-2">
      {paragraphs.map((p, pIdx) => {
        // Line-by-line within paragraph
        const lines = p.split('\n');
        return (
          <div key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => {
              // Parse **bold** cleanly
              const parts = line.split(/(\*\*[^*]+\*\*)/g);
              return (
                <div key={lIdx} className={line.startsWith('• ') || line.startsWith('- ') || /^\d+\./.test(line) ? 'pl-2 py-0.5' : ''}>
                  {parts.map((part, partIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      const inner = part.slice(2, -2);
                      return (
                        <strong key={partIdx} className="font-bold text-forest-ink dark:text-white">
                          {inner}
                        </strong>
                      );
                    }
                    return <span key={partIdx}>{part}</span>;
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export const MascotChatbot: React.FC<MascotChatbotProps> = ({
  isOpen,
  onClose,
  currentPage,
  docTitle,
  frameworkId,
  activeClause,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getPageLabel = (page: string) => {
    switch (page) {
      case 'upload':
        return 'Policy Ingestion & AST Parser';
      case 'results':
        return 'Statutory Audit & Redline Studio';
      case 'vault':
        return 'Continuous Compliance Vault';
      case 'sentinel':
        return 'Regulatory Sentinel Radar';
      case 'proof':
        return 'Court Attestation Certificate';
      default:
        return 'Compliance Enclave';
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

      // Backend automatically loads GEMINI_API_KEY from .env.local without UI prompt
      const response = await sendMascotChat({
        message: query.trim(),
        history,
        page_context: currentPage,
        doc_title: docTitle,
        framework_id: frameworkId,
        active_clause: activeClause,
      });

      const rustyMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'rusty',
        text: response.reply,
        source: response.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, rustyMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'rusty',
          text: "I am ready to help! Please ask me any question regarding CFPB Rule 1033, EU AI Act, the Policy Vault, or Word Track Changes.",
          source: 'rusty-legal-engine',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[360px] sm:w-[410px] h-[540px] max-h-[85vh] flex flex-col rounded-3xl bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-2xl border-2 border-coral/35 shadow-clay-lg dark:shadow-dark-clay animate-fade-in text-left font-sans overflow-hidden">
      
      {/* Top Bar - Minimal & Clean with no API key prompt */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-apricot-50 via-white to-apricot-50 dark:from-[#0d1322] dark:via-[#11192d] dark:to-[#0d1322] border-b border-coral/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-coral to-coral-tangerine text-white flex items-center justify-center text-lg shadow-neon-coral relative flex-shrink-0">
            <span>🦊</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0c1220] absolute -top-0.5 -right-0.5 animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-forest-ink dark:text-white">
                Rusty AI
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-coral/10 text-[9px] font-mono font-bold text-coral border border-coral/25">
                LEGAL INSPECTOR
              </span>
            </div>
            <div className="text-[10px] font-mono text-forest-muted dark:text-slate-400 truncate max-w-[200px]">
              {getPageLabel(currentPage)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Online</span>
          </span>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            title="Close Assistant"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-forest-muted dark:text-slate-400 space-y-2.5 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center text-2xl shadow-xs">
              🦊
            </div>
            <div className="font-display font-bold text-sm text-forest-ink dark:text-white">
              Ask Rusty AI
            </div>
            <p className="text-xs max-w-[240px] leading-relaxed">
              Ask any question about your document or regulations to begin.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] p-3.5 rounded-2xl leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-coral to-coral-tangerine text-white rounded-br-xs shadow-xs font-sans whitespace-pre-wrap'
                  : 'bg-slate-100 dark:bg-[#12192b] text-forest-ink dark:text-slate-200 rounded-bl-xs border border-coral/15 dark:border-slate-800'
              }`}
            >
              {msg.sender === 'user' ? (
                msg.text
              ) : (
                renderFormattedMessage(msg.text)
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-forest-muted dark:text-slate-400 px-1">
              <span>{msg.timestamp}</span>
              {msg.source && (
                <span className="opacity-75 font-semibold">
                  • {msg.source.includes('gemini') ? '⚡ Gemini 1.5' : '🛡️ Built-in Engine'}
                </span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-[#12192b] border border-coral/15 text-xs font-mono text-forest-muted dark:text-slate-400 w-fit animate-pulse">
            <span>🦊 Rusty is inspecting...</span>
            <span className="w-1.5 h-1.5 rounded-full bg-coral animate-ping"></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Chips */}
      <div className="px-3 py-2 border-t border-coral/15 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#080d18]/50 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono no-scrollbar">
        <button
          onClick={() => handleSendMessage('Why is 90 days retention illegal under CFPB Rule 1033?')}
          className="px-2.5 py-1 rounded-full bg-white dark:bg-[#101728] border border-coral/20 text-forest-ink dark:text-slate-300 hover:text-coral hover:border-coral whitespace-nowrap transition-colors cursor-pointer"
        >
          Why is 90-day illegal?
        </button>

        <button
          onClick={() => handleSendMessage('Explain the EU AI Act <=500ms human stop-switch rule.')}
          className="px-2.5 py-1 rounded-full bg-white dark:bg-[#101728] border border-coral/20 text-forest-ink dark:text-slate-300 hover:text-coral hover:border-coral whitespace-nowrap transition-colors cursor-pointer"
        >
          EU AI Act Stop-Switch
        </button>

        <button
          onClick={() => handleSendMessage('How does Sentinel Radar monitor laws overnight?')}
          className="px-2.5 py-1 rounded-full bg-white dark:bg-[#101728] border border-coral/20 text-forest-ink dark:text-slate-300 hover:text-coral hover:border-coral whitespace-nowrap transition-colors cursor-pointer"
        >
          How does Sentinel work?
        </button>

        <button
          onClick={() => handleSendMessage('How does Word (.docx) Track Changes export work?')}
          className="px-2.5 py-1 rounded-full bg-white dark:bg-[#101728] border border-coral/20 text-forest-ink dark:text-slate-300 hover:text-coral hover:border-coral whitespace-nowrap transition-colors cursor-pointer"
        >
          Word Redline export
        </button>
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white dark:bg-[#0c1220] border-t border-coral/20 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Rusty about your document or regulations..."
          disabled={loading}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#121929] border border-coral/20 focus:border-coral focus:outline-hidden text-xs font-sans text-forest-ink dark:text-white"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="w-8 h-8 rounded-xl bg-coral hover:bg-coral-vivid text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 flex-shrink-0 shadow-xs"
          title="Send Question"
        >
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </form>

    </div>
  );
};
