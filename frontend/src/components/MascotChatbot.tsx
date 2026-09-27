import React, { useState, useEffect, useRef } from 'react';
import { sendMascotChat, getSmartLocalMascotReply } from '../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'rusty';
  text: string;
  source?: string;
  timestamp: string;
  suggested_actions?: string[];
}

interface MascotChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  docTitle?: string;
  frameworkId?: string;
  activeClause?: string;
}

// Clean text formatter: converts **bold** to <strong>, renders bullets and paragraphs cleanly
function renderFormattedMessage(rawText: string) {
  const paragraphs = rawText.split('\n\n');

  return (
    <div className="space-y-2">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');
        return (
          <div key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => {
              const isBullet = line.startsWith('• ') || line.startsWith('- ') || /^\d+\./.test(line);
              const parts = line.split(/(\*\*[^*]+\*\*)/g);
              return (
                <div key={lIdx} className={isBullet ? 'pl-2.5 py-0.5 border-l-2 border-coral/30 my-0.5' : ''}>
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
  // Empty messages array so chat only begins when initiated by user
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getPageLabel = (page: string) => {
    switch (page) {
      case 'upload':
        return 'Policy Ingestion Studio';
      case 'results':
        return 'Statutory Audit & Redline Studio';
      case 'vault':
        return 'Continuous Compliance Vault';
      case 'sentinel':
        return 'Regulatory Sentinel Radar';
      case 'proof':
        return 'Court Attestation Certificate';
      case 'verify':
        return 'InsurTech Risk & Verification';
      default:
        return 'Compliance Enclave';
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

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
        suggested_actions: response.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, rustyMsg]);
    } catch {
      // Dynamic fallback based on query and current page context
      const fallbackResponse = getSmartLocalMascotReply(query.trim(), currentPage, activeClause);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'rusty',
          text: fallbackResponse.reply,
          source: fallbackResponse.source || 'rusty-legal-engine',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggested_actions: fallbackResponse.suggested_actions || ['Word Redline', 'Policy Vault', 'Court Attestation'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        resize: 'both',
        minWidth: '340px',
        maxWidth: 'min(760px, 94vw)',
        minHeight: '440px',
        maxHeight: 'calc(100vh - 210px)',
      }}
      className={`fixed bottom-[185px] sm:bottom-[195px] right-3 sm:right-6 z-[1001] flex flex-col rounded-3xl bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-2xl border-2 border-coral/35 shadow-clay-lg dark:shadow-dark-clay animate-fade-in text-left font-sans overflow-hidden transition-all duration-200 ${
        isExpanded
          ? 'w-[92vw] sm:w-[620px] h-[640px]'
          : 'w-[360px] sm:w-[430px] h-[520px]'
      }`}
    >
      
      {/* Top Bar */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-apricot-50 via-white to-apricot-50 dark:from-[#0d1322] dark:via-[#11192d] dark:to-[#0d1322] border-b border-coral/20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-coral to-coral-tangerine text-white flex items-center justify-center text-lg shadow-neon-coral relative flex-shrink-0">
            <span>🦊</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0c1220] absolute -top-0.5 -right-0.5 animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-forest-ink dark:text-white">
                Rusty
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-coral/10 text-[9px] font-mono font-bold text-coral border border-coral/25">
                LEGAL COPILOT
              </span>
            </div>
            <div className="text-[10px] font-mono text-forest-muted dark:text-slate-400 truncate max-w-[180px] sm:max-w-[240px]">
              {getPageLabel(currentPage)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Resize / Expand Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xs cursor-pointer"
            title={isExpanded ? "Collapse to Standard Size" : "Expand Size"}
          >
            <span className="material-symbols-outlined text-sm">
              {isExpanded ? 'close_fullscreen' : 'open_in_full'}
            </span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xs cursor-pointer"
              title="Clear Conversation"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          )}

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

      {/* Compliance Topic Quick-Bar */}
      <div className="px-3 py-1.5 bg-coral/5 dark:bg-slate-900/60 border-b border-coral/15 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono no-scrollbar flex-shrink-0">
        <button
          onClick={() => handleSendMessage('Explain CFPB Rule 1033 personal financial data retention limits.')}
          className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-coral/20 hover:border-coral text-forest-ink dark:text-slate-200 whitespace-nowrap transition-colors cursor-pointer"
        >
          CFPB Rule 1033
        </button>
        <button
          onClick={() => handleSendMessage('Explain EU AI Act Article 14 human stop-switch requirements.')}
          className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-coral/20 hover:border-coral text-forest-ink dark:text-slate-200 whitespace-nowrap transition-colors cursor-pointer"
        >
          EU AI Act
        </button>
        <button
          onClick={() => handleSendMessage('How does Microsoft Word (.docx) native Track Changes export work in RegDiff?')}
          className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-coral/20 hover:border-coral text-forest-ink dark:text-slate-200 whitespace-nowrap transition-colors cursor-pointer"
        >
          Word Redlines
        </button>
        <button
          onClick={() => handleSendMessage('Explain FRE 902(13) Merkle Ledger evidentiary certification in RegDiff.')}
          className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-coral/20 hover:border-coral text-forest-ink dark:text-slate-200 whitespace-nowrap transition-colors cursor-pointer"
        >
          FRE 902(13) Proof
        </button>
        <button
          onClick={() => handleSendMessage('Explain the Multi-Model AI Statutory Consensus Engine.')}
          className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-coral/20 hover:border-coral text-forest-ink dark:text-slate-200 whitespace-nowrap transition-colors cursor-pointer"
        >
          Consensus Engine
        </button>
      </div>

      {/* Message Feed / Quiet Empty State */}
      <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3 my-auto">
            <div className="w-11 h-11 rounded-2xl bg-coral/10 text-coral flex items-center justify-center text-2xl shadow-xs">
              🦊
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-forest-ink dark:text-white">
                Chat with Rusty
              </h4>
              <p className="text-xs text-forest-muted dark:text-slate-400 max-w-[260px] leading-relaxed">
                Ask any question about statutory rules, policy audits, Word redlines, or Merkle evidence.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 pt-1 max-w-[320px]">
              <button
                onClick={() => handleSendMessage('Why is 90 days retention illegal under CFPB Rule 1033?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-coral/15 text-[10px] font-mono text-forest-ink dark:text-slate-300 hover:text-coral hover:border-coral transition-colors cursor-pointer"
              >
                Why 90-day is illegal?
              </button>
              <button
                onClick={() => handleSendMessage('Explain the EU AI Act <=500ms human stop-switch rule.')}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-coral/15 text-[10px] font-mono text-forest-ink dark:text-slate-300 hover:text-coral hover:border-coral transition-colors cursor-pointer"
              >
                EU AI Act Stop-Switch
              </button>
              <button
                onClick={() => handleSendMessage('How does Word (.docx) native Track Changes export work?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-coral/15 text-[10px] font-mono text-forest-ink dark:text-slate-300 hover:text-coral hover:border-coral transition-colors cursor-pointer"
              >
                Word XML Redlines
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] p-3.5 rounded-2xl leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-coral to-coral-tangerine text-white rounded-br-xs shadow-xs font-sans whitespace-pre-wrap'
                    : 'bg-slate-100/90 dark:bg-[#12192b] text-forest-ink dark:text-slate-200 rounded-bl-xs border border-coral/15 dark:border-slate-800 shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  msg.text
                ) : (
                  <div className="space-y-2">
                    {renderFormattedMessage(msg.text)}
                    
                    {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1 border-t border-coral/10 dark:border-slate-800/80">
                        {msg.suggested_actions.map((act, actIdx) => (
                          <button
                            key={actIdx}
                            onClick={() => handleSendMessage(`Tell me more about ${act}`)}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-coral/25 text-[10px] font-mono text-coral hover:bg-coral hover:text-white transition-colors cursor-pointer"
                          >
                            {act} &rarr;
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-forest-muted dark:text-slate-400 px-1">
                <span>{msg.timestamp}</span>
                {msg.source && (
                  <span className="opacity-75 font-semibold">
                    • {msg.source.includes('gemini') ? '⚡ Live Copilot' : '🛡️ Built-in Engine'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-[#12192b] border border-coral/15 text-xs font-mono text-forest-muted dark:text-slate-400 w-fit animate-pulse">
            <span>🦊 Rusty is analyzing...</span>
            <span className="w-1.5 h-1.5 rounded-full bg-coral animate-ping"></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar - Sticky & Permanently Visible */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white dark:bg-[#0c1220] border-t border-coral/20 flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Rusty about any regulation, policy, or question..."
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
