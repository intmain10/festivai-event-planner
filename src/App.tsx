import React, { useState, useMemo, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Menu,
  Plus,
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Mic,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wallet,
  Calendar,
  Briefcase,
  Lightbulb,
  Heart,
  Cake,
  Globe2,
  CheckCircle2,
  Circle,
  Download,
  KeyRound,
  TrendingDown,
  ShieldAlert,
  PanelRightClose,
  PanelRightOpen,
  MapPin,
  SquarePen,
  ArrowUpRight,
  SlidersHorizontal,
  Star,
  ExternalLink,
  Building2,
  Quote
} from 'lucide-react';
import {
  EventBlueprint,
  CurrencyCode,
  ChatMessage,
  VendorChecklistItem,
  PersonalizedIdea,
  VenueAdRecommendation,
} from './types';
import {
  generateEventBlueprintWithAI,
  processHumanConversationTurn,
  ConversationDraftMemory,
  formatCurrency,
  getStoredApiKey,
  setStoredApiKey,
} from './services/genai';
import { GeminiStarIcon } from './components/GeminiChatbot';

type CanvasTab = 'overview' | 'venues' | 'budget' | 'timeline' | 'vendors' | 'ideas';

interface SavedSession {
  id: string;
  blueprint: EventBlueprint;
  messages: ChatMessage[];
}

/** Renders inline bold (**text**), italic (*text*), and `code` cleanly */
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

/** Clean Rich Markdown Renderer matching Google Gemini App typography */
function GeminiMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-2.5 text-[15px] leading-[1.7] text-[#1F1F1F]">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1" />;

        if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
          return (
            <h4
              key={idx}
              className="text-base sm:text-[17px] font-semibold text-[#1F1F1F] pt-1 tracking-tight"
            >
              {renderInlineFormatting(line.replace(/^#+\s+/, ''))}
            </h4>
          );
        }

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

/** Native LLM Sponsored Hotel / Restaurant Recommendation Cards Component */
function VenueAdCardsGrid({
  venues,
  onSelectVenue,
  selectedVenueName,
}: {
  venues: VenueAdRecommendation[];
  onSelectVenue: (venue: VenueAdRecommendation) => void;
  selectedVenueName?: string;
}) {
  return (
    <div className="pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#0B57D0]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#444746]">
            Sponsored • Live OpenStreetMap Places & Hotels
          </span>
        </div>
        <span className="text-[11px] text-[#0B57D0] bg-[#E8F0FE] font-medium px-2.5 py-0.5 rounded-full">
          100% Real-World OSM Data
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {venues.map((venue) => {
          const isLocked =
            selectedVenueName &&
            selectedVenueName.toLowerCase().includes(venue.name.toLowerCase());

          return (
            <div
              key={venue.id}
              className={`rounded-2xl p-4 border transition-all bg-[#FFFFFF] space-y-3 ${
                isLocked
                  ? 'border-[#0B57D0] ring-2 ring-[#0B57D0]/15 bg-[#F8FAFD]'
                  : 'border-[#DCE1E8] hover:border-[#0B57D0]/60 shadow-2xs'
              }`}
            >
              {/* Top Row: Badge + Name + Rating + Price */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-900 border border-amber-300">
                      {venue.sponsoredBadge}
                    </span>
                    <span className="text-xs text-[#444746] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#0B57D0]" />
                      {venue.type} • {venue.city}
                    </span>
                  </div>

                  <h5 className="text-base font-bold text-[#1F1F1F] flex items-center gap-2">
                    <span>{venue.name}</span>
                    {isLocked && (
                      <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        ✓ Selected Venue
                      </span>
                    )}
                  </h5>

                  {venue.address && (
                    <div className="text-xs text-[#444746] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0B57D0] shrink-0" />
                      <span>{venue.address}</span>
                    </div>
                  )}

                  {/* Star Rating */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-[#1F1F1F]">{venue.rating.toFixed(1)}</span>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[#444746]">
                      ({venue.reviewCount.toLocaleString()} Google reviews)
                    </span>
                  </div>
                </div>

                {/* Package Price Box */}
                <div className="sm:text-right bg-[#F8FAFD] px-3 py-2 rounded-xl border border-[#E3E3E3] shrink-0">
                  <div className="text-xs text-[#444746]">
                    {formatCurrency(venue.pricePerGuest, venue.currency)} / guest
                  </div>
                  <div className="text-sm font-bold text-[#0B57D0]">
                    Est. {formatCurrency(venue.estimatedTotalForGuests, venue.currency)} total
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    ✓ Fits your comfort budget
                  </div>
                </div>
              </div>

              {/* Perks Pills */}
              <div className="flex flex-wrap gap-1.5">
                {venue.highlights.map((perk, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium bg-[#E8F0FE]/70 text-[#0B57D0] px-2.5 py-0.5 rounded-full"
                  >
                    ✓ {perk}
                  </span>
                ))}
              </div>

              {/* Verified Guest Review Snippet */}
              <div className="p-2.5 rounded-xl bg-[#F0F4F9]/80 text-xs text-[#444746] flex items-start gap-2">
                <Quote className="w-4 h-4 text-[#0B57D0] shrink-0 mt-0.5" />
                <div>
                  <span className="italic">"{venue.topReviewSnippet}"</span>
                  <span className="block text-[11px] font-semibold text-[#1F1F1F] mt-0.5">
                    — {venue.reviewerName}
                  </span>
                </div>
              </div>

              {/* Booking & Lock-in Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={venue.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-semibold transition-colors"
                  >
                    <span>Book / Check Availability</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={venue.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F0F4F9] hover:bg-[#E1E5EA] text-[#1F1F1F] text-xs font-medium transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#0B57D0]" />
                    <span>Google Maps</span>
                  </a>

                  {venue.osmUrl && (
                    <a
                      href={venue.osmUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F0F4F9] hover:bg-[#E1E5EA] text-[#444746] text-xs font-medium transition-colors"
                    >
                      <span>OSM #{venue.osmId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectVenue(venue)}
                  className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    isLocked
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white hover:bg-[#E8F0FE] text-[#0B57D0] border-[#0B57D0]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLocked ? 'Locked in Your Plan ✓' : 'Select Venue for My Plan'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  // Layout State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasTab, setCanvasTab] = useState<CanvasTab>('overview');
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('INR');

  // Pure GenAI State: Starts completely empty until user gives a prompt!
  const [blueprint, setBlueprint] = useState<EventBlueprint | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [draftMemory, setDraftMemory] = useState<ConversationDraftMemory>({ notes: [] });
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  // Prompt & Loading State
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiSourceBadge, setAiSourceBadge] = useState<'gemini-live' | 'genai-engine'>(
    getStoredApiKey() ? 'gemini-live' : 'genai-engine'
  );

  // UI Interaction Helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedMsgIds, setLikedMsgIds] = useState<Record<string, 'up' | 'down' | null>>({});
  const [openThinkingIds, setOpenThinkingIds] = useState<Record<string, boolean>>({});
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'pre' | 'dayof'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey());
  const [showEditParameters, setShowEditParameters] = useState(false);

  // Parameter refinement fields
  const [editGuests, setEditGuests] = useState(150);
  const [editBudget, setEditBudget] = useState(1000000);
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);

  // Start a fresh blank Gemini chat session
  const handleStartNewChat = () => {
    if (blueprint && chatMessages.length > 0) {
      setSavedSessions((prev) => {
        const exists = prev.some((s) => s.id === blueprint.id);
        if (exists) {
          return prev.map((s) =>
            s.id === blueprint.id ? { ...s, blueprint, messages: chatMessages } : s
          );
        }
        return [{ id: blueprint.id, blueprint, messages: chatMessages }, ...prev];
      });
    }
    setBlueprint(null);
    setChatMessages([]);
    setDraftMemory({ notes: [] });
    setCanvasOpen(false);
    setChatInput('');
    setShowEditParameters(false);
  };

  // Load a previously prompted session from sidebar
  const handleSelectSavedSession = (session: SavedSession) => {
    setBlueprint(session.blueprint);
    setChatMessages(session.messages);
    setCanvasOpen(true);
    setEditGuests(session.blueprint.guestCount);
    setEditBudget(session.blueprint.totalBudget);
    setEditLocation(session.blueprint.location);
    setEditDate(session.blueprint.date);
  };

  // Main GenAI Conversational Turn Handler
  const handleSendPrompt = async (customPromptText?: string) => {
    const promptText = (customPromptText ?? chatInput).trim();
    if (!promptText || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);
    if (!customPromptText) setChatInput('');
    setIsGenerating(true);

    try {
      const turnResult = await processHumanConversationTurn(
        promptText,
        nextHistory,
        draftMemory,
        blueprint,
        defaultCurrency
      );

      setDraftMemory(turnResult.updatedDraft);
      setAiSourceBadge(turnResult.source);

      if (turnResult.generatedBlueprint) {
        const bp = turnResult.generatedBlueprint;
        setBlueprint(bp);
        setCanvasOpen(true);
        setCanvasTab('overview');
        setEditGuests(bp.guestCount);
        setEditBudget(bp.totalBudget);
        setEditLocation(bp.location);
        setEditDate(bp.date);

        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: turnResult.replyMarkdown,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionTaken: `Generated ${bp.category} plan + ${
            bp.venueRecommendations?.length || 3
          } partner venues (${bp.guestCount} guests • ${formatCurrency(
            bp.totalBudget,
            bp.currency
          )})`,
          venueRecommendations: turnResult.venueRecommendations || bp.venueRecommendations,
        };

        setChatMessages((prev) => {
          const updated = [...prev, aiMsg];
          setSavedSessions((sessions) => [
            { id: bp.id, blueprint: bp, messages: updated },
            ...sessions.filter((s) => s.id !== bp.id),
          ]);
          return updated;
        });

        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.6 },
        });
      } else {
        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: turnResult.replyMarkdown,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionTaken: turnResult.venueRecommendations
            ? 'Found top-rated hotels & restaurants for your budget'
            : blueprint
            ? `Analyzed "${blueprint.title}"`
            : 'Conversational response',
          venueRecommendations: turnResult.venueRecommendations,
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // When a user clicks "Select Venue for My Plan" on any LLM Ad Card!
  const handleSelectVenueFromAd = async (venue: VenueAdRecommendation) => {
    if (blueprint) {
      // Update existing blueprint with the chosen hotel/restaurant!
      setBlueprint((prev) => {
        if (!prev) return null;
        const updatedVendors = prev.vendors.map((v, i) =>
          i === 0
            ? {
                ...v,
                role: `${venue.name} (${venue.type})`,
                status: 'Shortlisted' as const,
                estimatedCost: venue.estimatedTotalForGuests,
              }
            : v
        );
        return {
          ...prev,
          location: `${venue.name}, ${venue.city}`,
          subtitle: `${prev.vibe} • Hosted at ${venue.name}`,
          vendors: updatedVendors,
        };
      });
      setEditLocation(`${venue.name}, ${venue.city}`);
      setCanvasOpen(true);

      setChatMessages((prev) => [
        ...prev,
        {
          id: `venue-lock-${Date.now()}`,
          role: 'assistant',
          content: `### 📍 Locked In **${venue.name}** (${venue.rating}★)\nI’ve set **${venue.name}** in **${venue.city}** as your primary venue in the Event Canvas (Est. **${formatCurrency(
            venue.estimatedTotalForGuests,
            venue.currency
          )}** at **${formatCurrency(
            venue.pricePerGuest,
            venue.currency
          )}/guest**) and marked it as **Shortlisted** in your Vendor Checklist!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionTaken: `Selected ${venue.name}`,
        },
      ]);
    } else {
      // If user clicked a venue card before generating a full plan, generate the full plan around that venue!
      await handleSendPrompt(
        `Plan a ${draftMemory.category || 'birthday'} party at ${venue.name} in ${
          venue.city
        } with a budget of ${formatCurrency(
          Math.round(venue.estimatedTotalForGuests * 1.9),
          venue.currency
        )}`
      );
    }
  };

  // Refine parameters if user adjusts guests/budget in the active Canvas
  const handleUpdateParameters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blueprint) return;
    setShowEditParameters(false);
    setIsGenerating(true);

    try {
      const result = await generateEventBlueprintWithAI({
        category: blueprint.category,
        title: blueprint.title,
        date: editDate || blueprint.date,
        location: editLocation || blueprint.location,
        guestCount: Number(editGuests) || blueprint.guestCount,
        totalBudget: Number(editBudget) || blueprint.totalBudget,
        currency: blueprint.currency,
        vibe: blueprint.vibe,
        customPrompt: blueprint.customPrompt,
      });

      setBlueprint(result.blueprint);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `upd-${Date.now()}`,
          role: 'assistant',
          content: `### ✨ Updated Your Plan & Venue Matches\nRecalculated your budget, vendor estimates, and hotel/restaurant packages for **${result.blueprint.guestCount} guests** in **${result.blueprint.location}** with a total budget of **${formatCurrency(
            result.blueprint.totalBudget,
            result.blueprint.currency
          )}**.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionTaken: 'Updated Event Canvas & Venue Matches',
          venueRecommendations: result.blueprint.venueRecommendations,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Voice Input via Web Speech API
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
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

  // Computed metrics when a blueprint is active
  const perGuestCost = useMemo(() => {
    if (!blueprint) return 0;
    return Math.round(blueprint.totalBudget / Math.max(1, blueprint.guestCount));
  }, [blueprint]);

  const completedMilestones = useMemo(() => {
    if (!blueprint) return 0;
    return blueprint.timeline.filter((t) => t.completed).length;
  }, [blueprint]);

  const timelineProgress = useMemo(() => {
    if (!blueprint) return 0;
    return Math.round((completedMilestones / Math.max(1, blueprint.timeline.length)) * 100);
  }, [blueprint, completedMilestones]);

  const nextEasyStep = useMemo(() => {
    if (!blueprint) return null;
    return blueprint.timeline.find((t) => !t.completed) || null;
  }, [blueprint]);

  const filteredTimeline = useMemo(() => {
    if (!blueprint) return [];
    if (timelineFilter === 'pre') return blueprint.timeline.filter((t) => !t.isDayOf);
    if (timelineFilter === 'dayof') return blueprint.timeline.filter((t) => t.isDayOf);
    return blueprint.timeline;
  }, [blueprint, timelineFilter]);

  // Interactive Canvas Mutations
  const handleBudgetAmountChange = (id: string, value: number) => {
    if (!blueprint) return;
    setBlueprint((prev) =>
      prev
        ? {
            ...prev,
            budgetBreakdown: prev.budgetBreakdown.map((b) =>
              b.id === id
                ? {
                    ...b,
                    allocated: Math.max(0, value),
                    percentage: Math.round(
                      (Math.max(0, value) / Math.max(1, prev.totalBudget)) * 100
                    ),
                  }
                : b
            ),
          }
        : null
    );
  };

  const handleAIRebalanceBudget = () => {
    if (!blueprint) return;
    setBlueprint((prev) => {
      if (!prev) return null;
      const updated = prev.budgetBreakdown.map((b) => {
        if (b.priority === 'Flexible' || b.category.toLowerCase().includes('decor')) {
          const reduced = Math.round(b.allocated * 0.88);
          return {
            ...b,
            allocated: reduced,
            percentage: Math.round((reduced / prev.totalBudget) * 100),
            aiTip: `✨ Saved ${formatCurrency(
              b.allocated - reduced,
              prev.currency
            )} (12%) for your peace-of-mind emergency reserve.`,
          };
        }
        return b;
      });
      return { ...prev, budgetBreakdown: updated };
    });
  };

  const toggleTimelineItem = (id: string) => {
    setBlueprint((prev) =>
      prev
        ? {
            ...prev,
            timeline: prev.timeline.map((t) =>
              t.id === id ? { ...t, completed: !t.completed } : t
            ),
          }
        : null
    );
  };

  const handleAddTimelineTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !blueprint) return;
    setBlueprint((prev) =>
      prev
        ? {
            ...prev,
            timeline: [
              ...prev.timeline,
              {
                id: `tl-${Date.now()}`,
                phase: 'Custom Step',
                timeframe: 'Added by You',
                title: newTaskTitle.trim(),
                description: `Custom task for ${prev.title}`,
                category: 'Checklist',
                completed: false,
                priority: 'High',
              },
            ],
          }
        : null
    );
    setNewTaskTitle('');
  };

  const handleVendorStatusChange = (id: string, status: VendorChecklistItem['status']) => {
    setBlueprint((prev) =>
      prev
        ? {
            ...prev,
            vendors: prev.vendors.map((v) => (v.id === id ? { ...v, status } : v)),
          }
        : null
    );
  };

  const toggleVendorSubtask = (vendorId: string, taskId: string) => {
    setBlueprint((prev) =>
      prev
        ? {
            ...prev,
            vendors: prev.vendors.map((v) =>
              v.id === vendorId
                ? {
                    ...v,
                    checklistTasks: v.checklistTasks.map((t) =>
                      t.id === taskId ? { ...t, done: !t.done } : t
                    ),
                  }
                : v
            ),
          }
        : null
    );
  };

  const handleGenerateExtraIdea = () => {
    if (!blueprint) return;
    const extra: PersonalizedIdea = {
      id: `idea-${Date.now()}`,
      category: 'Guest Experience',
      title: `Interactive Welcome Refreshment & Memory Corner`,
      description: `Greet your ${blueprint.guestCount} guests in ${blueprint.location} with a signature local drink station and an instant Polaroid or voice-note guestbook.`,
      estimatedImpact: 'Crowd Favorite',
      implementationSteps: [
        'Set up welcome drinks near the entrance with clear dietary labels',
        'Add a simple prompt card inviting guests to leave a favorite memory',
      ],
      saved: true,
    };
    setBlueprint((prev) => (prev ? { ...prev, ideas: [extra, ...prev.ideas] } : null));
  };

  const handleCopyText = (id: string, text: string) => {
    const cleaned = text.replace(/\*\*/g, '').replace(/###\s*/g, '');
    navigator.clipboard.writeText(cleaned);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportDossier = () => {
    if (!blueprint) return;
    const md = `# ${blueprint.title} — AuraPlan AI Blueprint\nDate: ${blueprint.date} | Location: ${
      blueprint.location
    }\nGuests: ${blueprint.guestCount} | Budget: ${formatCurrency(
      blueprint.totalBudget,
      blueprint.currency
    )}\n\n## Summary\n${blueprint.aiExecutiveSummary}\n\n## Budget\n${blueprint.budgetBreakdown
      .map((b) => `- ${b.category}: ${formatCurrency(b.allocated, blueprint.currency)}`)
      .join('\n')}\n\n## Checklist\n${blueprint.timeline
      .map((t) => `- [${t.completed ? 'x' : ' '}] ${t.phase}: ${t.title}`)
      .join('\n')}\n`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-plan.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Starter prompt examples for the blank Gemini welcome screen
  const starterPrompts = [
    {
      icon: Heart,
      title: 'Plan a wedding celebration',
      sub: 'Budgets, timelines, hotels & decor',
      prompt:
        'Plan a 200-guest outdoor garden wedding in Udaipur with a budget of ₹15,00,000, live food stations, and warm fairy-light decor.',
    },
    {
      icon: Cake,
      title: 'Birthday party + rooftop places',
      sub: 'Top restaurants, ratings & cake ideas',
      prompt:
        'Plan a milestone 30th rooftop birthday party in Mumbai for 50 friends under ₹85,000 and suggest top restaurants with ratings.',
    },
    {
      icon: Globe2,
      title: 'Create a community event',
      sub: 'Venues, stalls, permits & schedule',
      prompt:
        'Organize a Sunday neighborhood cultural and food festival in Bengaluru for 400 attendees with a budget of ₹3,00,000.',
    },
    {
      icon: Building2,
      title: 'Find hotels & restaurants',
      sub: 'Compare ratings, reviews & packages',
      prompt:
        'Suggest the best rooftop restaurants and hotels in Delhi for a 60-person birthday celebration under ₹1,20,000.',
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#FFFFFF] text-[#1F1F1F] font-sans">
      {/* 1. AUTHENTIC GOOGLE GEMINI LEFT SIDEBAR (#F0F4F9) */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0 -ml-72 md:ml-0 md:w-16'
        } bg-[#F0F4F9] h-full flex flex-col justify-between transition-all duration-300 shrink-0 z-30 border-r border-[#E3E3E3]/60 overflow-hidden`}
      >
        <div className="p-3 space-y-4">
          {/* Top Hamburger Menu */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              title="Toggle menu"
              className="cursor-pointer p-2.5 rounded-full hover:bg-[#DCE1E8] text-[#444746] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* "+ New chat" Pill Button */}
          <button
            type="button"
            onClick={handleStartNewChat}
            className={`cursor-pointer flex items-center gap-3 bg-[#DDE3EA] hover:bg-[#D3DBE5] text-[#1F1F1F] font-medium text-sm rounded-full transition-all ${
              sidebarOpen ? 'px-4 py-3 w-full' : 'w-10 h-10 justify-center mx-auto'
            }`}
          >
            <SquarePen className="w-4 h-4 text-[#444746] shrink-0" />
            {sidebarOpen && <span>New chat</span>}
          </button>

          {/* Dynamic Recent Prompts / Plans History */}
          {sidebarOpen && (
            <div className="pt-2 space-y-1">
              <div className="px-3 py-1.5 text-xs font-semibold text-[#444746]">
                Recent
              </div>

              {savedSessions.length === 0 ? (
                <div className="px-3 py-4 text-xs text-[#444746]/80 leading-relaxed">
                  No plans yet. Enter a prompt on the right to generate your first wedding, birthday, or community event plan!
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {savedSessions.map((session) => {
                    const isCurrent = blueprint?.id === session.id;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => handleSelectSavedSession(session)}
                        className={`cursor-pointer w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-left text-xs font-medium transition-colors ${
                          isCurrent
                            ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                            : 'text-[#1F1F1F] hover:bg-[#E1E5EA]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#0B57D0]" />
                        <span className="truncate">{session.blueprint.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active Plan Canvas Shortcuts */}
              {blueprint && (
                <div className="pt-4 space-y-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-[#444746]">
                    Generated Plan Canvas
                  </div>
                  {(
                    [
                      { id: 'overview', label: '🌿 Summary & #1 Next Step' },
                      { id: 'venues', label: '🏨 Hotels & Places (Sponsored)' },
                      { id: 'budget', label: '💰 Smart Budget Breakdown' },
                      { id: 'timeline', label: '✅ Timeline & Checklist' },
                      { id: 'vendors', label: '🤝 Vendor Checklist & Scripts' },
                      { id: 'ideas', label: '✨ Personalized Ideas & Invite' },
                    ] as const
                  ).map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setCanvasOpen(true);
                        setCanvasTab(sec.id);
                      }}
                      className={`cursor-pointer w-full flex items-center gap-2.5 px-3.5 py-2 rounded-full text-left text-xs font-medium transition-colors ${
                        canvasOpen && canvasTab === sec.id
                          ? 'bg-[#E8F0FE] text-[#0B57D0] font-semibold'
                          : 'text-[#444746] hover:bg-[#E1E5EA]'
                      }`}
                    >
                      <span className="truncate">{sec.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Sidebar Settings */}
        {sidebarOpen && (
          <div className="p-3 border-t border-[#DCE1E8] space-y-1.5 text-xs text-[#444746]">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-full hover:bg-[#E1E5EA]">
              <span className="font-medium">Default Currency:</span>
              <select
                aria-label="Select default currency"
                value={blueprint ? blueprint.currency : defaultCurrency}
                onChange={(e) => {
                  const newCurr = e.target.value as CurrencyCode;
                  setDefaultCurrency(newCurr);
                  if (blueprint) {
                    setBlueprint({ ...blueprint, currency: newCurr });
                  }
                }}
                className="bg-transparent font-bold text-[#0B57D0] focus:outline-none cursor-pointer"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="AED">AED</option>
              </select>
            </div>

            {blueprint && (
              <button
                type="button"
                onClick={handleExportDossier}
                className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-full hover:bg-[#E1E5EA] text-left font-medium text-[#1F1F1F]"
              >
                <Download className="w-4 h-4 text-[#444746]" />
                <span>Download Plan (.md)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowApiModal(true)}
              className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-full hover:bg-[#E1E5EA] text-left font-medium text-[#1F1F1F]"
            >
              <KeyRound className="w-4 h-4 text-[#0B57D0]" />
              <span className="truncate">
                {aiSourceBadge === 'gemini-live'
                  ? 'Live AI Key Connected'
                  : 'Connect AI API Key'}
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* 2. CENTER GOOGLE GEMINI PROMPT & CONVERSATION WORKSPACE */}
      <div className="flex-1 flex flex-col h-full bg-[#FFFFFF] min-w-0">
        {/* Top Gemini Header */}
        <header className="h-14 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="cursor-pointer p-2 rounded-full hover:bg-[#F0F4F9] text-[#444746]"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 px-2 py-1 rounded-xl">
              <GeminiStarIcon className="w-5 h-5" />
              <span className="text-[19px] font-semibold tracking-tight text-[#1F1F1F]">
                FestivAI
              </span>
              <span className="text-xs font-medium text-[#0B57D0] bg-[#E8F0FE] px-2.5 py-0.5 rounded-full">
                Smart Celebration & Event Planner
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {blueprint && (
              <button
                type="button"
                onClick={() => setCanvasOpen((v) => !v)}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#0B57D0] transition-colors"
              >
                {canvasOpen ? (
                  <>
                    <PanelRightClose className="w-4 h-4" />
                    <span className="hidden sm:inline">Hide Plan Canvas</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="w-4 h-4" />
                    <span>Open Plan Canvas</span>
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Main Center Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col">
          {chatMessages.length === 0 ? (
            /* PURE BLANK GEMINI WELCOME STATE */
            <div className="flex-1 flex flex-col justify-center max-w-3xl w-full mx-auto space-y-8 py-8">
              <div className="space-y-2 px-2">
                <div className="flex items-center gap-3 mb-2">
                  <GeminiStarIcon className="w-8 h-8" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] bg-clip-text text-transparent inline-block">
                  Hello, there
                </h1>
                <p className="text-2xl sm:text-3xl font-medium text-[#C4C7C5] leading-snug">
                  What wedding, birthday, or community event shall we plan today?
                </p>
              </div>

              {/* 4 Optional Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-1">
                {starterPrompts.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendPrompt(card.prompt)}
                      className="cursor-pointer group text-left p-4 rounded-2xl bg-[#F0F4F9] hover:bg-[#E1E5EA] transition-all flex flex-col justify-between h-36"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#1F1F1F] leading-snug">
                          {card.title}
                        </div>
                        <div className="text-xs text-[#444746] mt-1.5 line-clamp-2">
                          {card.sub}
                        </div>
                      </div>
                      <div className="self-end w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4 text-[#1F1F1F]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CONVERSATION STREAM */
            <div className="max-w-3xl w-full mx-auto space-y-6 pt-2 pb-4">
              {chatMessages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] bg-[#F0F4F9] text-[#1F1F1F] rounded-[24px] rounded-tr-xs px-5 py-3.5 text-[15px] leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                const isThinkingOpen = !!openThinkingIds[msg.id];
                const liked = likedMsgIds[msg.id] || null;

                return (
                  <div key={msg.id} className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1">
                      <GeminiStarIcon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Show thinking / Action Taken chip */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenThinkingIds((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                          className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-[#444746] hover:bg-[#F0F4F9] px-2.5 py-1 rounded-full transition-colors"
                        >
                          <span>{msg.actionTaken || 'Show thinking'}</span>
                          {isThinkingOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {isThinkingOpen && blueprint && (
                        <div className="p-3 rounded-xl bg-[#F8FAFD] border-l-2 border-[#4285F4] text-xs text-[#444746] space-y-1">
                          <div>
                            • Event Category: <strong>{blueprint.category}</strong> in{' '}
                            <strong>{blueprint.location}</strong>
                          </div>
                          <div>
                            • Matched Budget & Places for{' '}
                            <strong>{blueprint.guestCount} guests</strong>:{' '}
                            {formatCurrency(blueprint.totalBudget, blueprint.currency)} (~
                            {formatCurrency(perGuestCost, blueprint.currency)}/guest)
                          </div>
                        </div>
                      )}

                      {/* Rich Markdown Answer */}
                      <GeminiMarkdown content={msg.content} />

                      {/* NATIVE LLM SPONSORED VENUE & RESTAURANT AD CARDS IN CHAT */}
                      {msg.venueRecommendations && msg.venueRecommendations.length > 0 && (
                        <VenueAdCardsGrid
                          venues={msg.venueRecommendations}
                          onSelectVenue={handleSelectVenueFromAd}
                          selectedVenueName={blueprint?.location}
                        />
                      )}

                      {/* Interactive Gemini Canvas Artifact Chip */}
                      {blueprint && msg.venueRecommendations && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-[#F0F4F9] border border-[#DCE1E8] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#C2E7FF] text-[#001D35] flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="text-xs sm:text-sm font-semibold text-[#1F1F1F] truncate">
                                {blueprint.title}
                              </div>
                              <div className="text-[11px] text-[#444746]">
                                Interactive Budget, Timeline, Hotels & Vendor Scripts
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCanvasOpen(true)}
                            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-semibold transition-colors"
                          >
                            <span>Open Canvas</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Gemini Bottom Action Bar */}
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
                          className={`cursor-pointer p-1.5 rounded-full hover:bg-[#F0F4F9] ${
                            liked === 'up' ? 'text-[#0B57D0] bg-[#E8F0FE]' : ''
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
                          className={`cursor-pointer p-1.5 rounded-full hover:bg-[#F0F4F9] ${
                            liked === 'down' ? 'text-[#0B57D0] bg-[#E8F0FE]' : ''
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          title="Copy"
                          className="cursor-pointer p-1.5 rounded-full hover:bg-[#F0F4F9] flex items-center gap-1 text-xs"
                        >
                          {copiedId === msg.id ? (
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
                            handleSendPrompt('Suggest more hotels and restaurants within my budget')
                          }
                          className="cursor-pointer px-2.5 py-1 rounded-full hover:bg-[#F0F4F9] text-xs font-medium flex items-center gap-1"
                        >
                          <Building2 className="w-3.5 h-3.5 text-[#0B57D0]" />
                          <span>Show More Places</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isGenerating && (
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

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Floating Gemini Prompt Omnibox */}
        <div className="px-4 sm:px-8 pb-4 pt-2 bg-[#FFFFFF] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="max-w-3xl mx-auto bg-[#F0F4F9] focus-within:bg-[#E9EEF6] rounded-[28px] px-4 py-3 transition-colors flex flex-col gap-2 shadow-2xs"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                blueprint
                  ? 'Ask for more hotels/restaurants, adjust budget, or ask a question...'
                  : 'Enter a prompt (e.g., "Plan a 50-guest birthday in Mumbai under ₹80,000 and suggest restaurants")'
              }
              className="w-full bg-transparent px-1 py-1 text-[15px] text-[#1F1F1F] placeholder-[#444746] focus:outline-none"
              autoFocus
            />

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  title="Reset & start new prompt"
                  className="cursor-pointer w-8 h-8 rounded-full hover:bg-[#DCE1E8] flex items-center justify-center text-[#444746] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendPrompt(
                      blueprint
                        ? `Suggest top-rated hotels and restaurants in ${blueprint.location} for ${blueprint.guestCount} guests`
                        : 'Suggest top rooftop restaurants and hotels in Mumbai for a 50-guest birthday party under ₹80,000'
                    )
                  }
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white hover:bg-[#DCE1E8] text-[#1F1F1F] transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#0B57D0]" />
                  <span>Find Hotels & Restaurants</span>
                </button>

                {blueprint && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSendPrompt('How can I cut 12% from this budget without losing quality?')
                    }
                    className="cursor-pointer hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white hover:bg-[#DCE1E8] text-[#1F1F1F] transition-colors"
                  >
                    <Wallet className="w-3.5 h-3.5 text-[#0B57D0]" />
                    <span>Save 12% on Budget</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  title="Speak your prompt"
                  className={`cursor-pointer w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isListening
                      ? 'bg-red-100 text-red-600 animate-pulse'
                      : 'hover:bg-[#DCE1E8] text-[#444746]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!chatInput.trim() || isGenerating}
                  aria-label="Send prompt"
                  className={`cursor-pointer w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    chatInput.trim()
                      ? 'bg-[#0B57D0] hover:bg-[#0842A0] text-white'
                      : 'bg-[#DCE1E8] text-[#444746] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          <p className="text-[11px] text-center text-[#444746] mt-2">
            Includes AI-matched hotel & restaurant partner suggestions with ratings, verified reviews, and direct booking links.
          </p>
        </div>
      </div>

      {/* 3. RIGHT-HAND GEMINI CANVAS (ONLY OPENS AFTER USER GENERATES A PLAN!) */}
      {blueprint && canvasOpen && (
        <section className="w-full md:w-[460px] lg:w-[540px] xl:w-[600px] h-full bg-[#F8FAFD] border-l border-[#E3E3E3] flex flex-col justify-between shrink-0 z-20">
          {/* Canvas Header */}
          <div className="p-4 bg-[#FFFFFF] border-b border-[#E3E3E3] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#E8F0FE] text-[#0B57D0] text-[11px] font-bold uppercase">
                    Generated Canvas
                  </span>
                  <span className="text-xs text-[#444746] truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {blueprint.location}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-[#1F1F1F] truncate mt-0.5">
                  {blueprint.title}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditParameters((v) => !v)}
                  className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] hover:bg-[#E1E5EA] text-[#1F1F1F]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#0B57D0]" />
                  <span>Refine</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasOpen(false)}
                  title="Close Canvas"
                  className="cursor-pointer p-1.5 rounded-full hover:bg-[#F0F4F9] text-[#444746]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inline Quick Refine Drawer */}
            {showEditParameters && (
              <form
                onSubmit={handleUpdateParameters}
                className="p-3 rounded-2xl bg-[#F8FAFD] border border-[#DCE1E8] grid grid-cols-2 sm:grid-cols-4 gap-2 items-end"
              >
                <div>
                  <label className="block text-[10px] font-semibold text-[#444746]">Guests</label>
                  <input
                    type="number"
                    min={5}
                    value={editGuests}
                    onChange={(e) => setEditGuests(Number(e.target.value))}
                    className="w-full rounded-lg bg-white border border-[#DCE1E8] px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#444746]">
                    Budget ({blueprint.currency})
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={editBudget}
                    onChange={(e) => setEditBudget(Number(e.target.value))}
                    className="w-full rounded-lg bg-white border border-[#DCE1E8] px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#444746]">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full rounded-lg bg-white border border-[#DCE1E8] px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="cursor-pointer py-1.5 px-3 rounded-lg bg-[#0B57D0] text-white text-xs font-semibold"
                >
                  Recalculate
                </button>
              </form>
            )}

            {/* 6 Canvas Tabs (Including 🏨 Places & Hotels) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {(
                [
                  { id: 'overview', label: '🌿 Summary' },
                  { id: 'venues', label: '🏨 Places & Hotels' },
                  { id: 'budget', label: '💰 Budget' },
                  { id: 'timeline', label: `✅ Timeline (${timelineProgress}%)` },
                  { id: 'vendors', label: '🤝 Vendors' },
                  { id: 'ideas', label: '✨ Ideas & Invite' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCanvasTab(tab.id)}
                  className={`cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    canvasTab === tab.id
                      ? 'bg-[#0B57D0] text-white shadow-2xs'
                      : 'bg-[#F0F4F9] text-[#444746] hover:bg-[#E1E5EA]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* TAB 0: OVERVIEW */}
            {canvasTab === 'overview' && (
              <div className="space-y-4">
                {nextEasyStep && (
                  <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#C2E7FF] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B57D0] bg-[#E8F0FE] px-2.5 py-1 rounded-full">
                        🌿 Your #1 First Step
                      </span>
                      <span className="text-xs text-[#444746]">{nextEasyStep.phase}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#1F1F1F]">
                        {nextEasyStep.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#444746] mt-1 leading-relaxed">
                        {nextEasyStep.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => toggleTimelineItem(nextEasyStep.id)}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Done & Show Next Step</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCanvasTab('budget')}
                    className="cursor-pointer text-left bg-white p-3.5 rounded-2xl border border-[#E3E3E3] hover:border-[#0B57D0] transition-colors"
                  >
                    <div className="text-[11px] text-[#444746]">Total Budget</div>
                    <div className="text-base font-bold text-[#1F1F1F] mt-1 truncate">
                      {formatCurrency(blueprint.totalBudget, blueprint.currency)}
                    </div>
                    <div className="text-[11px] text-[#0B57D0] mt-0.5">
                      ~{formatCurrency(perGuestCost, blueprint.currency)} / guest
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCanvasTab('venues')}
                    className="cursor-pointer text-left bg-white p-3.5 rounded-2xl border border-[#E3E3E3] hover:border-[#0B57D0] transition-colors"
                  >
                    <div className="text-[11px] text-[#444746]">Matched Places</div>
                    <div className="text-base font-bold text-[#1F1F1F] mt-1">
                      {blueprint.venueRecommendations?.length || 3} Hotels
                    </div>
                    <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                      ★ 4.8+ Rated
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCanvasTab('timeline')}
                    className="cursor-pointer text-left bg-white p-3.5 rounded-2xl border border-[#E3E3E3] hover:border-[#0B57D0] transition-colors"
                  >
                    <div className="text-[11px] text-[#444746]">Timeline</div>
                    <div className="text-base font-bold text-[#1F1F1F] mt-1">
                      {completedMilestones} / {blueprint.timeline.length} Done
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      {timelineProgress}% Ready
                    </div>
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#E3E3E3] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#444746]">
                    <GeminiStarIcon className="w-4 h-4" />
                    <span>Executive Summary</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#1F1F1F] leading-relaxed">
                    {blueprint.aiExecutiveSummary}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[#444746]">Theme Palette:</span>
                    {blueprint.themePalette.map((sw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8FAFD] border border-[#E3E3E3] text-xs"
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sw.hex }}
                        />
                        <span>{sw.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: PLACES & HOTELS (SPONSORED LLM VENUE ADS) */}
            {canvasTab === 'venues' && blueprint.venueRecommendations && (
              <div className="space-y-4">
                <VenueAdCardsGrid
                  venues={blueprint.venueRecommendations}
                  onSelectVenue={handleSelectVenueFromAd}
                  selectedVenueName={blueprint.location}
                />
              </div>
            )}

            {/* TAB 2: BUDGET */}
            {canvasTab === 'budget' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-[#E3E3E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#1F1F1F]">
                      Total Budget: {formatCurrency(blueprint.totalBudget, blueprint.currency)}
                    </div>
                    <div className="text-xs text-[#444746]">
                      {blueprint.guestCount} guests (~{formatCurrency(perGuestCost, blueprint.currency)} per person)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAIRebalanceBudget}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#0B57D0] text-xs font-semibold transition-colors self-start"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Save 12% Easily</span>
                  </button>
                </div>

                {blueprint.budgetBreakdown.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-[#E3E3E3] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-[#0B57D0] bg-[#E8F0FE] px-2 py-0.5 rounded-full">
                          {item.percentage}%
                        </span>
                        <h4 className="font-semibold text-sm sm:text-base text-[#1F1F1F] mt-1">
                          {item.category}
                        </h4>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-[#1F1F1F]">
                        {formatCurrency(item.allocated, blueprint.currency)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {item.items.map((sub, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-[#F0F4F9] text-[#444746] px-2.5 py-0.5 rounded-full"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#F0F4F9] space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#444746]">
                        <span>Adjust allocation:</span>
                        <input
                          type="range"
                          min={0}
                          max={blueprint.totalBudget}
                          step={Math.max(100, Math.round(blueprint.totalBudget / 100))}
                          value={item.allocated}
                          onChange={(e) =>
                            handleBudgetAmountChange(item.id, Number(e.target.value))
                          }
                          className="w-36 accent-[#0B57D0] cursor-pointer"
                        />
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F8FAFD] text-xs text-[#444746] flex items-start gap-2">
                        <GeminiStarIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{item.aiTip}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: TIMELINE */}
            {canvasTab === 'timeline' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-[#E3E3E3]">
                  <div className="flex items-center gap-1">
                    {(['all', 'pre', 'dayof'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setTimelineFilter(f)}
                        className={`cursor-pointer px-3 py-1 rounded-full text-xs font-medium ${
                          timelineFilter === f
                            ? 'bg-[#0B57D0] text-white'
                            : 'text-[#444746] hover:bg-[#F0F4F9]'
                        }`}
                      >
                        {f === 'all'
                          ? 'All Steps'
                          : f === 'pre'
                          ? 'Before Event'
                          : 'Event Day'}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 pr-2">
                    {timelineProgress}% Done
                  </span>
                </div>

                <form onSubmit={handleAddTimelineTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add custom milestone..."
                    className="flex-1 rounded-full bg-white border border-[#DCE1E8] px-4 py-2 text-xs focus:outline-none focus:border-[#0B57D0]"
                  />
                  <button
                    type="submit"
                    className="cursor-pointer px-4 py-2 rounded-full bg-[#0B57D0] text-white text-xs font-semibold"
                  >
                    + Add
                  </button>
                </form>

                {filteredTimeline.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleTimelineItem(item.id)}
                    className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      item.completed
                        ? 'bg-[#F0F4F9]/60 border-[#E3E3E3] opacity-75'
                        : 'bg-white border-[#E3E3E3] hover:border-[#0B57D0]'
                    }`}
                  >
                    <button type="button" className="mt-0.5 shrink-0">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#0B57D0]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#0B57D0]">
                        <span>{item.phase}</span>
                        <span>•</span>
                        <span className="text-[#444746]">{item.category}</span>
                      </div>
                      <h4
                        className={`text-sm font-semibold mt-0.5 ${
                          item.completed ? 'line-through text-[#444746]' : 'text-[#1F1F1F]'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#444746] mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: VENDORS */}
            {canvasTab === 'vendors' && (
              <div className="space-y-4">
                {blueprint.vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="bg-white rounded-2xl p-4 border border-[#E3E3E3] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-[#0B57D0]">
                          {vendor.category} • {vendor.leadTime}
                        </span>
                        <h4 className="text-base font-semibold text-[#1F1F1F]">
                          {vendor.role}
                        </h4>
                        <div className="text-xs text-[#444746]">
                          Suggested Budget:{' '}
                          {formatCurrency(vendor.estimatedCost, blueprint.currency)}
                        </div>
                      </div>

                      <select
                        value={vendor.status}
                        onChange={(e) =>
                          handleVendorStatusChange(
                            vendor.id,
                            e.target.value as VendorChecklistItem['status']
                          )
                        }
                        className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F0F4F9] text-[#1F1F1F] border border-[#DCE1E8]"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="Shortlisted">Comparing</option>
                        <option value="Negotiating">Talking</option>
                        <option value="Booked">Booked ✓</option>
                      </select>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-[#F0F4F9]">
                      <div className="text-[11px] font-bold uppercase text-[#444746]">
                        Vendor Checklist
                      </div>
                      {vendor.checklistTasks.map((task) => (
                        <label
                          key={task.id}
                          className="flex items-center gap-2 text-xs text-[#1F1F1F] cursor-pointer py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => toggleVendorSubtask(vendor.id, task.id)}
                            className="rounded accent-[#0B57D0]"
                          />
                          <span className={task.done ? 'line-through text-[#444746]' : ''}>
                            {task.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFD] border border-[#E3E3E3] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0B57D0] flex items-center gap-1.5">
                          <GeminiStarIcon className="w-3.5 h-3.5" />
                          <span>Polite Outreach Message</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(vendor.id, vendor.aiNegotiationScript)}
                          className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#DCE1E8] text-xs font-medium hover:bg-[#F0F4F9]"
                        >
                          {copiedId === vendor.id ? '✓ Copied!' : 'Copy Message'}
                        </button>
                      </div>
                      <p className="text-xs text-[#444746] italic leading-relaxed">
                        "{vendor.aiNegotiationScript}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: IDEAS & INVITE */}
            {canvasTab === 'ideas' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-[#E3E3E3] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B57D0] uppercase">
                      ✉️ Ready-to-Send Invitation
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText('invite-text', blueprint.generatedCopy.invitationText)
                      }
                      className="cursor-pointer px-3 py-1 rounded-full bg-[#E8F0FE] text-[#0B57D0] text-xs font-semibold"
                    >
                      {copiedId === 'invite-text' ? '✓ Copied!' : 'Copy Invite'}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm bg-[#F8FAFD] p-3.5 rounded-xl border border-[#E3E3E3] text-[#1F1F1F] leading-relaxed">
                    {blueprint.generatedCopy.invitationText}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold uppercase text-[#444746]">
                    Personalized Ideas
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateExtraIdea}
                    className="cursor-pointer text-xs font-semibold text-[#0B57D0] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+ Generate Another Idea</span>
                  </button>
                </div>

                {blueprint.ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className="bg-white rounded-2xl p-4 border border-[#E3E3E3] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#0B57D0] bg-[#E8F0FE] px-2.5 py-0.5 rounded-full">
                        {idea.category}
                      </span>
                      <span className="text-[11px] text-[#444746]">{idea.estimatedImpact}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-[#1F1F1F]">{idea.title}</h4>
                    <p className="text-xs text-[#444746] leading-relaxed">{idea.description}</p>
                  </div>
                ))}

                <div className="bg-white rounded-2xl p-4 border border-[#E3E3E3] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Weather & Backup Plan</span>
                  </div>
                  <p className="text-xs text-[#444746] leading-relaxed">
                    {blueprint.generatedCopy.rainOrBackupPlan}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Gemini API Key Settings Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E3E3E3] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GeminiStarIcon className="w-5 h-5" />
                <h3 className="text-lg font-semibold text-[#1F1F1F]">
                  FestivAI Engine Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="cursor-pointer p-1 rounded-full hover:bg-[#F0F4F9] text-[#444746]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#444746] leading-relaxed">
              Works out-of-the-box with zero setup! Optionally, paste a{' '}
              <strong>Google Gemini API Key</strong> (`gemini-2.0-flash`) for live cloud generation.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#444746] mb-1">
                Google Gemini API Key (Optional)
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-[#DCE1E8] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0B57D0]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setApiKeyInput('');
                  setStoredApiKey('');
                  setAiSourceBadge('genai-engine');
                  setShowApiModal(false);
                }}
                className="cursor-pointer px-4 py-2 rounded-full text-xs font-semibold text-[#444746] hover:bg-[#F0F4F9]"
              >
                Use Built-In Engine
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoredApiKey(apiKeyInput);
                  setAiSourceBadge(apiKeyInput.trim() ? 'gemini-live' : 'genai-engine');
                  setShowApiModal(false);
                }}
                className="cursor-pointer px-5 py-2 rounded-full text-xs font-semibold bg-[#0B57D0] hover:bg-[#0842A0] text-white"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
