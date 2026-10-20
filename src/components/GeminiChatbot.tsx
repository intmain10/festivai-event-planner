import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Plus,
  Mic,
  Send,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
  Compass,
  Wallet,
  Calendar,
  FileText,
  SquarePen
} from 'lucide-react';
import { ChatMessage, EventBlueprint } from '../types';
import { formatCurrency } from '../services/genai';

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: EventBlueprint;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (query?: string) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  onClearChat: () => void;
  onOpenApiModal: () => void;
  aiSourceBadge: 'gemini-live' | 'genai-engine';
}

/** Authentic 4-Point Google Gemini Star SVG */
export function GeminiStarIcon({ className = 'w-6 h-6', spinning = false }: { className?: string; spinning?: boolean }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${spinning ? 'animate-spin' : ''}`}
    >
      <path
        d="M14 0C14 7.732 7.732 14 0 14C7.732 14 14 20.268 14 28C14 20.268 20.268 14 28 14C20.268 14 14 7.732 14 0Z"
        fill="url(#gemini_gradient)"
      />
      <defs>
        <linearGradient
          id="gemini_gradient"
          x1="0"
          y1="0"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9B72CB" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Renders inline bold (**text**) and italic (*text*) and `code` cleanly */
function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-[#1F1F1F]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-[#444746]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md bg-[#E9EEF6] text-[#0B57D0] font-mono text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

/** Clean Rich Markdown Renderer matching Google Gemini typography */
function GeminiMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2.5 text-[15px] leading-[1.65] text-[#1F1F1F]">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1" />;

        // Headings (### or ## or #)
        if (line.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="text-base font-semibold text-[#1F1F1F] pt-1 tracking-tight"
            >
              {renderInlineFormatting(line.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (line.startsWith('## ') || line.startsWith('# ')) {
          return (
            <h3
              key={idx}
              className="text-lg font-semibold text-[#1F1F1F] pt-1 tracking-tight"
            >
              {renderInlineFormatting(line.replace(/^#+\s+/, ''))}
            </h3>
          );
        }

        // Numbered list item (e.g., "1. **Dual-Purpose...")
        const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-3 pl-1">
              <span className="w-5 h-5 rounded-full bg-[#E8F0FE] text-[#0B57D0] text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                {numberedMatch[1]}
              </span>
              <div className="flex-1">{renderInlineFormatting(numberedMatch[2])}</div>
            </div>
          );
        }

        // Bullet list item (- or * or •)
        if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] shrink-0 mt-2.5" />
              <div className="flex-1">
                {renderInlineFormatting(line.replace(/^[-*•]\s+/, ''))}
              </div>
            </div>
          );
        }

        return <p key={idx}>{renderInlineFormatting(line)}</p>;
      })}
    </div>
  );
}

export default function GeminiChatbot({
  isOpen,
  onClose,
  blueprint,
  messages,
  isLoading,
  onSendMessage,
  chatInput,
  setChatInput,
  onClearChat,
  onOpenApiModal,
  aiSourceBadge,
}: GeminiChatbotProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'2.0 Flash' | '2.5 Pro Event Architect'>('2.0 Flash');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [likedMsgIds, setLikedMsgIds] = useState<Record<string, 'up' | 'down' | null>>({});
  const [openThinkingIds, setOpenThinkingIds] = useState<Record<string, boolean>>({});
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onSendMessage('I have never planned an event before — walk me through the 3 easiest steps to start!');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setChatInput(transcript);
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  const suggestionCards = [
    {
      title: 'First time planning? Start here',
      subtitle: 'Simple 3-step guide with zero stress',
      prompt: 'I have never planned an event before — walk me through the 3 easiest steps to start without feeling overwhelmed!',
      icon: Sparkles,
    },
    {
      title: 'Cut 12% from this budget',
      subtitle: 'Easy ways to save money',
      prompt: 'How can I cut 12% from this budget without sacrificing guest experience?',
      icon: Wallet,
    },
    {
      title: 'What to ask vendors',
      subtitle: 'Ready-to-send polite messages',
      prompt: 'Give me 3 vendor negotiation tips and contract clauses for this event',
      icon: Compass,
    },
    {
      title: 'Rain & backup plan',
      subtitle: 'Peace-of-mind weather checklist',
      prompt: 'Suggest a rain & timeline buffer plan for our venue and guest count',
      icon: Calendar,
    },
  ];

  const handleCopyMessage = (id: string, text: string) => {
    const clean = text.replace(/\*\*/g, '').replace(/###\s*/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const toggleThinking = (id: string) => {
    setOpenThinkingIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px] transition-all">
      <div
        className={`bg-[#FFFFFF] text-[#1F1F1F] h-full shadow-2xl flex flex-col justify-between transition-all duration-300 ${
          isExpanded ? 'w-full max-w-5xl mx-auto rounded-none sm:rounded-2xl sm:my-2 sm:h-[calc(100vh-16px)] border border-[#E3E3E3]' : 'w-full max-w-[500px] border-l border-[#E3E3E3]'
        }`}
      >
        {/* Top Gemini App Header */}
        <header className="px-4 py-3 bg-[#FFFFFF] border-b border-[#F0F4F9] flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            {/* Model Dropdown Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModelDropdown((v) => !v)}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#F0F4F9] transition-colors"
              >
                <span className="text-[17px] font-medium tracking-tight text-[#1F1F1F]">
                  Gemini
                </span>
                <span className="text-xs font-medium text-[#444746] bg-[#F0F4F9] px-2 py-0.5 rounded-full">
                  {selectedModel}
                </span>
                <ChevronDown className="w-4 h-4 text-[#444746]" />
              </button>

              {showModelDropdown && (
                <div className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-[#F0F4F9] shadow-xl border border-[#E3E3E3] p-1.5 z-30">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#444746]">
                    Model & Event Engine
                  </div>
                  {(['2.0 Flash', '2.5 Pro Event Architect'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m);
                        setShowModelDropdown(false);
                      }}
                      className="cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium hover:bg-white transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-[#1F1F1F]">Gemini {m}</div>
                        <div className="text-[11px] text-[#444746]">
                          {m === '2.0 Flash'
                            ? 'Fast everyday event planning'
                            : 'Deep budget & run-of-show reasoning'}
                        </div>
                      </div>
                      {selectedModel === m && (
                        <Check className="w-4 h-4 text-[#0B57D0]" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-[#E3E3E3] mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModelDropdown(false);
                        onOpenApiModal();
                      }}
                      className="cursor-pointer w-full px-3 py-1.5 rounded-xl text-left text-xs font-medium text-[#0B57D0] hover:bg-white transition-colors"
                    >
                      {aiSourceBadge === 'gemini-live'
                        ? '✓ Live Gemini API Key Connected'
                        : '+ Connect Live Gemini API Key'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClearChat}
              title="New chat"
              className="cursor-pointer p-2 rounded-full text-[#444746] hover:bg-[#F0F4F9] transition-colors"
            >
              <SquarePen className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              title={isExpanded ? 'Dock panel' : 'Expand to full studio view'}
              className="cursor-pointer p-2 rounded-full text-[#444746] hover:bg-[#F0F4F9] transition-colors hidden sm:inline-flex"
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Gemini"
              className="cursor-pointer p-2 rounded-full text-[#444746] hover:bg-[#F0F4F9] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Active Event Context Pill Bar */}
        <div className="px-5 py-2 bg-[#F8FAFD] border-b border-[#EEF2F6] flex items-center justify-between gap-2 text-xs text-[#444746]">
          <div className="flex items-center gap-2 truncate">
            <GeminiStarIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Context: <strong className="text-[#1F1F1F]">{blueprint.title}</strong> ({blueprint.guestCount} guests •{' '}
              {formatCurrency(blueprint.totalBudget, blueprint.currency)})
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#0B57D0] font-medium text-[11px] shrink-0">
            Synced
          </span>
        </div>

        {/* Scrollable Conversation Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 bg-[#FFFFFF]">
          {/* Gemini Signature Greeting + Suggestion Cards */}
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="space-y-1 px-1">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] bg-clip-text text-transparent inline-block">
                Hello, Planner
              </h2>
              <p className="text-lg sm:text-xl font-medium text-[#C4C7C5]">
                How can I help organize your {blueprint.category} today?
              </p>
            </div>

            {/* 2x2 Gemini Suggestion Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {suggestionCards.map((card, i) => {
                const IconComponent = card.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSendMessage(card.prompt)}
                    className="cursor-pointer group text-left p-3.5 rounded-2xl bg-[#F0F4F9] hover:bg-[#E1E5EA] transition-all flex flex-col justify-between h-28 relative overflow-hidden"
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-[#1F1F1F] leading-snug">
                        {card.title}
                      </div>
                      <div className="text-[11px] text-[#444746] mt-1 line-clamp-2">
                        {card.subtitle}
                      </div>
                    </div>
                    <div className="self-end w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <IconComponent className="w-3.5 h-3.5 text-[#1F1F1F]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation Turns */}
          <div className="max-w-2xl mx-auto space-y-6 pt-2">
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[82%] bg-[#F0F4F9] text-[#1F1F1F] rounded-[24px] rounded-tr-xs px-5 py-3 text-[15px] leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              const isThinkingOpen = !!openThinkingIds[msg.id];
              const likedState = likedMsgIds[msg.id] || null;

              return (
                <div key={msg.id} className="flex items-start gap-3.5">
                  {/* Left Gemini Star Avatar */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <GeminiStarIcon className="w-6 h-6" />
                  </div>

                  {/* Right Response Content + Gemini Action Bar */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Collapsible "Show thinking" chip like Gemini 2.0/2.5 */}
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleThinking(msg.id)}
                        className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-[#444746] hover:bg-[#F0F4F9] px-2.5 py-1 rounded-full transition-colors"
                      >
                        <span>Analyzed event blueprint</span>
                        {isThinkingOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isThinkingOpen && (
                        <div className="mt-1.5 p-3 rounded-xl bg-[#F8FAFD] border-l-2 border-[#9B72CB] text-xs text-[#444746] space-y-1">
                          <div>
                            • Checked active budget: {formatCurrency(blueprint.totalBudget, blueprint.currency)} across {blueprint.guestCount} guests ({blueprint.location}).
                          </div>
                          <div>
                            • Matched aesthetic parameters: "{blueprint.vibe}".
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rich Markdown Body */}
                    <GeminiMarkdownRenderer content={msg.content} />

                    {/* Authentic Gemini Bottom Action Bar */}
                    <div className="flex items-center gap-1 pt-1 text-[#444746]">
                      <button
                        type="button"
                        onClick={() =>
                          setLikedMsgIds((prev) => ({
                            ...prev,
                            [msg.id]: prev[msg.id] === 'up' ? null : 'up',
                          }))
                        }
                        title="Good response"
                        className={`cursor-pointer p-1.5 rounded-full hover:bg-[#F0F4F9] transition-colors ${
                          likedState === 'up' ? 'text-[#0B57D0] bg-[#E8F0FE]' : ''
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setLikedMsgIds((prev) => ({
                            ...prev,
                            [msg.id]: prev[msg.id] === 'down' ? null : 'down',
                          }))
                        }
                        title="Bad response"
                        className={`cursor-pointer p-1.5 rounded-full hover:bg-[#F0F4F9] transition-colors ${
                          likedState === 'down' ? 'text-[#0B57D0] bg-[#E8F0FE]' : ''
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        title="Copy response"
                        className="cursor-pointer p-1.5 rounded-full hover:bg-[#F0F4F9] transition-colors flex items-center gap-1 text-xs"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Copied</span>
                          </>
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onSendMessage(
                            'Give me another creative variation with exact cost numbers'
                          )
                        }
                        title="Regenerate response"
                        className="cursor-pointer p-1.5 rounded-full hover:bg-[#F0F4F9] transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Gemini Shimmer Loading State */}
            {isLoading && (
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <GeminiStarIcon className="w-6 h-6" spinning />
                </div>
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="text-xs font-medium text-[#444746] animate-pulse">
                    Thinking...
                  </div>
                  <div className="h-3.5 w-3/4 rounded-full bg-gradient-to-r from-[#E8F0FE] via-[#F3E8FD] to-[#E8F0FE] animate-pulse" />
                  <div className="h-3.5 w-1/2 rounded-full bg-gradient-to-r from-[#F3E8FD] via-[#E8F0FE] to-[#F3E8FD] animate-pulse" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Gemini Pill Omnibox Input */}
        <div className="px-4 sm:px-6 pb-3 pt-2 bg-[#FFFFFF]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSendMessage();
            }}
            className="max-w-2xl mx-auto bg-[#F0F4F9] focus-within:bg-[#E9EEF6] rounded-[28px] px-3.5 py-2.5 transition-colors flex flex-col gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Gemini"
              className="w-full bg-transparent px-2 py-1 text-[15px] text-[#1F1F1F] placeholder-[#444746] focus:outline-none"
            />

            <div className="flex items-center justify-between px-1">
              {/* Left Pill Tools (+ and Canvas/Deep Research chips) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onSendMessage(
                      `Create a complete 5-point checklist for ${blueprint.title} in ${blueprint.location}`
                    )
                  }
                  title="Quick Checklist Prompt"
                  className="cursor-pointer w-8 h-8 rounded-full hover:bg-[#DCE1E8] flex items-center justify-center text-[#444746] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSendMessage(
                      `Analyze my ${formatCurrency(blueprint.totalBudget, blueprint.currency)} budget and suggest 3 high-ROI upgrades`
                    )
                  }
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#444746] hover:bg-[#DCE1E8] transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Budget Canvas</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSendMessage(
                      `Draft a polite WhatsApp RSVP & dietary reminder message for our ${blueprint.guestCount} guests`
                    )
                  }
                  className="cursor-pointer hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#444746] hover:bg-[#DCE1E8] transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Draft Invite</span>
                </button>
              </div>

              {/* Right Send / Mic Button */}
              <div className="flex items-center gap-1">
                {chatInput.trim() ? (
                  <button
                    type="submit"
                    disabled={isLoading}
                    aria-label="Send message"
                    className="cursor-pointer w-9 h-9 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white flex items-center justify-center transition-all shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    title="Speak to Gemini (Voice Input)"
                    className={`cursor-pointer w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      isListening
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'hover:bg-[#DCE1E8] text-[#444746]'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </form>

          <p className="text-[11px] text-center text-[#444746] mt-2">
            Gemini is synced with your live AuraPlan event blueprint. Double-check vendor quotes.
          </p>
        </div>
      </div>
    </div>
  );
}
