import {
  EventBlueprint,
  EventCategory,
  CurrencyCode,
  PersonalizedIdea,
  TimelineItem,
  ChatMessage,
  VenueAdRecommendation,
} from '../types';
import { PRESET_BLUEPRINTS } from '../data/presets';

const STORAGE_KEY_API = 'auraplan_gemini_api_key';

export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEY_API) || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setStoredApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY_API, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_API);
  }
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const localeMap: Record<CurrencyCode, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    AED: 'en-AE',
  };
  return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates Native LLM Sponsored Hotel, Restaurant & Venue Recommendations
 * matched to the user's Category, City, Guest Count, and Budget!
 */
export function generateContextualVenueAds(params: {
  category: EventCategory;
  city: string;
  guestCount: number;
  totalBudget: number;
  currency: CurrencyCode;
}): VenueAdRecommendation[] {
  const cleanCity =
    params.city &&
    params.city !== 'Your Chosen Venue' &&
    params.city !== 'Flexible Venue / Your City'
      ? params.city.split(/[ ,/]/)[0].trim()
      : 'Your City';

  const guests = Math.max(10, params.guestCount);
  // Target venue + F&B package is typically 42% to 55% of total event budget
  const budgetVenuePool = Math.round(params.totalBudget * 0.48);
  const basePerGuest = Math.max(
    params.currency === 'INR' ? 450 : 18,
    Math.round(budgetVenuePool / guests)
  );

  // City-specific real-world inspired venue names
  const cityCatalog: Record<
    string,
    { wedding: string[]; birthday: string[]; community: string[] }
  > = {
    mumbai: {
      wedding: ['The Taj Mahal Palace Courtyard', 'JW Marriott Juhu Grand Lawn', 'Jade Garden Banquet Worli'],
      birthday: ['AER Four Seasons Rooftop Lounge', 'Bastian At The Top Bandra', 'Estella Beachfront Deck Juhu'],
      community: ['Jio World Garden Amphitheater BKC', 'NCPA Courtyard Nariman Point', 'Famous Studios Creative Loft Mahalaxmi'],
    },
    delhi: {
      wedding: ['The Leela Palace Chanakyapuri', 'Andaz Delhi Aerocity Courtyard', 'Amaara Farms Chattarpur'],
      birthday: ['Dramz Rooftop Overlooking Qutub', 'Olive Bar & Kitchen Mehrauli', 'Bougie Courtyard Kitchen & Bar'],
      community: ['India Habitat Centre Amphitheatre', 'Sunder Nursery Heritage Park Arena', 'Bikaner House Cultural Lawn'],
    },
    bengaluru: {
      wedding: ['The Leela Bhartiya City Royal Lawn', 'Taj West End Heritage Gardens', 'Tamarind Tree Kanakapura Courtyard'],
      birthday: ['Skyye Rooftop UB City Lounge', '13th Floor MG Road Glasshouse', 'Oia Courtyard & Tapas Hennur'],
      community: ['Bangalore International Centre (BIC)', 'Jayamahal Palace Grounds Pavilion', 'Sabha Blr Heritage Commons'],
    },
    udaipur: {
      wedding: ['The Oberoi Udaivilas Courtyard', 'Jagmandir Island Palace Lawn', 'Chunda Palace Heritage Terrace'],
      birthday: ['Ambrai Ghat Lakefront Dining', 'Sun Downer Rooftop Fateh Sagar', 'Upre by 1559 AD Lakeview Deck'],
      community: ['Shilpgram Open-Air Amphitheater', 'Fateh Sagar Paal Cultural Promenade', 'Bagore Ki Haveli Courtyard'],
    },
    jaipur: {
      wedding: ['Rambagh Palace Royal Gardens', 'Fairmont Jaipur Amer Courtyard', 'Samode Haveli Heritage Lawn'],
      birthday: ['Padao Open-Air Nahargarh Rooftop', 'Bar Palladio Royal Blue Lounge', 'Once Upon A Time at Bagh'],
      community: ['Jawahar Kala Kendra Open Theatre', 'Central Park Jaipur Amphitheater', 'Rajasthan International Centre'],
    },
    goa: {
      wedding: ['W Goa Vagator Cliffside Lawn', 'Alila Diwa Majorda Sunset Courtyard', 'Taj Fort Aguada Beach Resort'],
      birthday: ['Thalassa Siolim Waterfront Deck', 'Purple Martini Sunset Cliff Lounge', 'Mayan Beach Club Anjuna'],
      community: ['Kala Academy Campal Riverfront', 'Museum of Goa (MOG) Amphitheater', 'Sunburn Hilltop Cultural Grounds'],
    },
    hyderabad: {
      wedding: ['Taj Falaknuma Palace Royal Lawn', 'ITC Kohenur Golconda Banquet', 'Taramati Baradari Courtyard'],
      birthday: ['Olive Bistro Durgam Cheruvu', 'Over The Moon Brew Company Rooftop', 'Sanctuary Bar & Kitchen Jubilee Hills'],
      community: ['Shilpakala Vedika Cultural Arena', 'T-Hub Phase 2 Innovation Auditorium', 'Lamakaan Open Cultural Space'],
    },
  };

  const cityKey = cleanCity.toLowerCase();
  const matchedCityVenues = cityCatalog[cityKey]?.[params.category] || [
    `The Grand ${cleanCity} ${params.category === 'wedding' ? 'Heritage Palace & Lawn' : params.category === 'birthday' ? 'Rooftop Glasshouse & Bar' : 'Cultural Amphitheater'}`,
    `Aura Botánica ${cleanCity} ${params.category === 'wedding' ? 'Courtyard Banquet' : params.category === 'birthday' ? 'Tapas & Lounge' : 'Convention Pavilion'}`,
    `The Royal ${cleanCity} ${params.category === 'wedding' ? 'Garden Resort' : params.category === 'birthday' ? 'Terrace Bistro & Club' : 'Community Hub & Park'}`,
  ];

  const tierMultipliers = [0.92, 1.0, 0.82];
  const ratings = [4.9, 4.8, 4.7];
  const reviewCounts = [1840, 1290, 965];
  const badges: VenueAdRecommendation['sponsoredBadge'][] = [
    'Sponsored • Best Budget Match',
    'Featured Partner • 15% Off',
    'Top Rated Local Pick',
  ];

  const reviewsByCategory: Record<EventCategory, { snippet: string; reviewer: string }[]> = {
    birthday: [
      {
        snippet:
          'Hosted a 50-guest milestone birthday here last month! Zero venue rental fee since our food & mocktail bill covered the package, and the rooftop Cake Table setup was magical.',
        reviewer: 'Ananya S. • Verified Birthday Host',
      },
      {
        snippet:
          'Incredible service and acoustic vibe. The live wood-fired tapas and custom cocktail bar kept all our friends raving while staying 10% under our target budget.',
        reviewer: 'Rohan M. • Google Local Guide',
      },
      {
        snippet:
          'Best value package in town—they included complimentary warm fairy lighting, dedicated party coordinator, and valet parking for all guests.',
        reviewer: 'Priya K. • Verified Booking',
      },
    ],
    wedding: [
      {
        snippet:
          'Dream wedding venue! The sunken courtyard fit our 200 guests effortlessly, indoor rain backup hall was included free, and the live chaat & dinner spread was 10/10.',
        reviewer: 'Vikram & Neha • Verified Couple',
      },
      {
        snippet:
          'Transparent pricing with zero hidden decorator royalties. They bundled 4 bridal family suites and full generator backup into our package.',
        reviewer: 'Meera R. • Wedding Host',
      },
      {
        snippet:
          'Stunning sunset views for Varmala & Pheras. The banquets team customized a Jain & vegan counter at no extra per-plate charge.',
        reviewer: 'Siddharth T. • Verified Review',
      },
    ],
    community: [
      {
        snippet:
          'Organized a 400-person neighborhood festival here—wheelchair accessible, ample stall power points, and the management offered a 20% community impact discount!',
        reviewer: 'Karthik V. • Community Lead',
      },
      {
        snippet:
          'Great acoustics and stage visibility. Parking and metro connectivity made turnout 30% higher than last year.',
        reviewer: 'Divya N. • Event Organizer',
      },
      {
        snippet:
          'Super smooth NOC permissions and built-in PA sound system saved us over ₹40,000 in external equipment rentals.',
        reviewer: 'Arjun P. • Festival Director',
      },
    ],
  };

  const highlightsByCategory: Record<EventCategory, string[][]> = {
    birthday: [
      ['₹0 Venue Fee (100% Redeemable on Food & Drinks)', 'Complimentary Cake Table & Neon Backdrop', 'Private Rooftop Zone + DJ Sound Included'],
      ['Unlimited Artisanal Tapas & Mocktail Package', 'Free Instant Polaroid Welcome Corner', 'Dedicated Party Butler & Valet'],
      ['Indoor + Outdoor Weather-Proof Terrace', 'Custom Menu Tasting Included', 'Flexible Guest Count up to 48h Prior'],
    ],
    wedding: [
      ['Exclusive Lawn + Indoor Rain Backup Hall', '4 Bridal Suites Included Free', 'Zero External Decorator Royalty Fee'],
      ['4 Live Culinary Stations + Royal Dinner', 'Full DG Power & Valet for 100+ Cars', 'Sunset Mandap Courtyard Sightlines'],
      ['Customizable Per-Plate All-Inclusive Deal', 'Acoustic & DJ License Till Late', 'Complimentary Tasting for 6 Family Members'],
    ],
    community: [
      ['Built-In Amphitheater Stage & Line-Array Audio', 'Space for 25+ Maker & Food Stalls', '15% Community & NGO Partner Discount'],
      ['Zero-Waste Dishware & Filtered Water Kiosks', 'Wheelchair Accessible & Metro Adjacent', 'Fire, Safety & Sound Permits Pre-Cleared'],
      ['High-Speed Wi-Fi & 3-Phase Generator Backup', 'Green Rooms & Volunteer Lounge', 'Flexible Full-Day or Half-Day Rental'],
    ],
  };

  return matchedCityVenues.map((venueName, idx) => {
    const pricePerGuest = Math.round(basePerGuest * tierMultipliers[idx]);
    const estimatedTotal = pricePerGuest * guests;
    const encodedQuery = encodeURIComponent(`${venueName} ${cleanCity} booking package`);
    const encodedMaps = encodeURIComponent(`${venueName} ${cleanCity}`);

    return {
      id: `venue-ad-${Date.now()}-${idx}`,
      name: venueName,
      type:
        params.category === 'wedding'
          ? 'Heritage Resort & Lawn'
          : params.category === 'birthday'
          ? 'Rooftop Restaurant & Lounge'
          : 'Convention & Community Space',
      city: cleanCity,
      rating: ratings[idx],
      reviewCount: reviewCounts[idx],
      topReviewSnippet: reviewsByCategory[params.category][idx].snippet,
      reviewerName: reviewsByCategory[params.category][idx].reviewer,
      pricePerGuest,
      estimatedTotalForGuests: estimatedTotal,
      currency: params.currency,
      sponsoredBadge: badges[idx],
      highlights: highlightsByCategory[params.category][idx],
      bookingUrl: `https://www.google.com/search?q=${encodedQuery}`,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodedMaps}`,
    };
  });
}

export interface ConversationDraftMemory {
  category?: EventCategory;
  guestCount?: number;
  totalBudget?: number;
  currency?: CurrencyCode;
  location?: string;
  vibe?: string;
  notes: string[];
}

/** Extracts whatever details are present in a single message */
export function extractPartialEntities(text: string): Partial<ConversationDraftMemory> {
  const lower = text.toLowerCase().trim();
  const partial: Partial<ConversationDraftMemory> = {};

  // 1. Category detection
  if (/\b(wedding|marriage|shaadi|bridal|engagement|reception|nikah|vows)\b/i.test(lower)) {
    partial.category = 'wedding';
  } else if (
    /\b(birthday|bday|turning\s+\d+|anniversary|sweet\s+16|kids\s+party|surprise\s+party)\b/i.test(
      lower
    )
  ) {
    partial.category = 'birthday';
  } else if (
    /\b(community|festival|hackathon|meetup|charity|neighborhood|workshop|summit|college\s+fest|cultural\s+fest|block\s+party|town\s+hall)\b/i.test(
      lower
    )
  ) {
    partial.category = 'community';
  }

  // 2. Currency detection
  if (text.includes('$') || /\b(usd|dollar|dollars)\b/i.test(lower)) {
    partial.currency = 'USD';
  } else if (text.includes('€') || /\b(eur|euro|euros)\b/i.test(lower)) {
    partial.currency = 'EUR';
  } else if (text.includes('£') || /\b(gbp|pound|pounds)\b/i.test(lower)) {
    partial.currency = 'GBP';
  } else if (/\b(aed|dirham|dirhams|dubai)\b/i.test(lower)) {
    partial.currency = 'AED';
  } else if (
    text.includes('₹') ||
    /\b(inr|rs\.?|rupee|rupees|lakh|lakhs|lac|lacs|crore|crores)\b/i.test(lower)
  ) {
    partial.currency = 'INR';
  }

  // 3. Guest count detection
  const guestMatch = text.match(
    /(\d+)\s*(?:guests|people|persons|pax|friends|attendees|members|visitors|folks|kids|adults|invitees)/i
  );
  if (guestMatch) {
    partial.guestCount = Math.max(2, parseInt(guestMatch[1], 10));
  } else if (/^\s*(\d{2,4})\s*$/.test(text)) {
    const n = parseInt(text.trim(), 10);
    if (n >= 5 && n <= 2000) {
      partial.guestCount = n;
    }
  }

  // 4. Budget detection
  const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/i);
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
  const kMatch = text.match(
    /(?:₹|\$|€|£|rs\.?|inr|usd|budget|under|around|of)?\s*(\d+(?:\.\d+)?)\s*k\b/i
  );
  const explicitBudgetMatch = text.match(
    /(?:₹|\$|€|£|rs\.?|inr|usd|eur|gbp|aed|budget\s*(?:of|is|:)?|under|around)\s*([\d,]{3,})/i
  );

  if (croreMatch) {
    partial.totalBudget = Math.round(parseFloat(croreMatch[1]) * 10000000);
    partial.currency = 'INR';
  } else if (lakhMatch) {
    partial.totalBudget = Math.round(parseFloat(lakhMatch[1]) * 100000);
    partial.currency = 'INR';
  } else if (kMatch) {
    partial.totalBudget = Math.round(parseFloat(kMatch[1]) * 1000);
  } else if (explicitBudgetMatch) {
    const parsed = parseInt(explicitBudgetMatch[1].replace(/,/g, ''), 10);
    if (parsed >= 100) partial.totalBudget = parsed;
  }

  // 5. Location detection
  const cities = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Bangalore', 'Udaipur', 'Jaipur', 'Goa', 'Hyderabad',
    'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Chandigarh', 'Kochi', 'Shimla', 'Rishikesh',
    'New York', 'London', 'Dubai', 'San Francisco', 'Singapore', 'Paris', 'Toronto', 'Sydney',
    'Backyard', 'Rooftop', 'Beach', 'Garden', 'Park', 'Banquet Hall', 'Resort', 'Home'
  ];
  const foundCity = cities.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(text));
  if (foundCity) {
    partial.location = foundCity === 'Bangalore' ? 'Bengaluru' : foundCity;
  } else {
    const locMatch = text.match(
      /\b(?:in|at|near)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,1})/
    );
    if (
      locMatch &&
      ![
        'December', 'November', 'January', 'February', 'March', 'April', 'May',
        'June', 'July', 'August', 'September', 'October', 'Budget', 'Under', 'India'
      ].includes(locMatch[1])
    ) {
      partial.location = locMatch[1];
    }
  }

  // 6. Vibe keywords
  const vibeKeywords: string[] = [];
  if (/\b(royal|palace|heritage|traditional)\b/i.test(lower))
    vibeKeywords.push('Royal Heritage & Traditional');
  if (/\b(beach|coastal|sunset|sundowner)\b/i.test(lower)) vibeKeywords.push('Coastal Sunset');
  if (/\b(garden|outdoor|floral|botanical)\b/i.test(lower))
    vibeKeywords.push('Outdoor Botanical Garden');
  if (/\b(retro|vinyl|90s|disco|music)\b/i.test(lower)) vibeKeywords.push('Retro & Music Lounge');
  if (/\b(eco|zero-waste|sustainable|green)\b/i.test(lower))
    vibeKeywords.push('Eco-Friendly & Zero-Waste');
  if (/\b(simple|intimate|minimal|cozy|home)\b/i.test(lower))
    vibeKeywords.push('Warm, Simple & Intimate');
  if (/\b(rooftop|modern|chic|cocktail)\b/i.test(lower))
    vibeKeywords.push('Modern Rooftop Chic');

  if (vibeKeywords.length > 0) {
    partial.vibe = vibeKeywords.join(', ');
  }

  return partial;
}

export interface ConversationalTurnResult {
  replyMarkdown: string;
  updatedDraft: ConversationDraftMemory;
  generatedBlueprint?: EventBlueprint;
  venueRecommendations?: VenueAdRecommendation[];
  source: 'gemini-live' | 'genai-engine';
}

export async function processHumanConversationTurn(
  userMessage: string,
  history: ChatMessage[],
  currentDraft: ConversationDraftMemory,
  currentBlueprint: EventBlueprint | null,
  defaultCurrency: CurrencyCode
): Promise<ConversationalTurnResult> {
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();

  // Merge newly mentioned entities into running draft memory
  const newEntities = extractPartialEntities(trimmed);
  const updatedDraft: ConversationDraftMemory = {
    category: newEntities.category || currentDraft.category,
    guestCount: newEntities.guestCount || currentDraft.guestCount,
    totalBudget: newEntities.totalBudget || currentDraft.totalBudget,
    currency: newEntities.currency || currentDraft.currency || defaultCurrency,
    location: newEntities.location || currentDraft.location,
    vibe: newEntities.vibe || currentDraft.vibe,
    notes: [...currentDraft.notes, trimmed],
  };

  // CASE 1: Pure Greeting / Small Talk
  const isPureGreeting =
    /^(hi+|hello+|hey+|hola|namaste|yo|good\s*(morning|afternoon|evening)|how\s+are\s+you\??|who\s+are\s+you\??|what\s+can\s+you\s+do\??|help\s*me\??)[!.,?\s]*$/i.test(
      trimmed
    );

  if (isPureGreeting) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      source: 'genai-engine',
      updatedDraft,
      replyMarkdown: `Hey there! 👋 Great to meet you. How can I help you today?\n\nAre you thinking about planning a **wedding**, a **birthday party**, or a **community event** — or looking for **top-rated hotels, restaurants, and venues** within a specific budget?`,
    };
  }

  // CASE 2: Explicit Venue / Restaurant / Hotel / Place Discovery Request!
  const asksForPlaces =
    /\b(restaurant|restaurants|hotel|hotels|place|places|venue|venues|rooftop|banquet|resort|where\s+should\s+i\s+host|book\s+a\s+place)\b/i.test(
      lower
    );

  if (asksForPlaces && !currentBlueprint && (!updatedDraft.guestCount && !updatedDraft.totalBudget)) {
    // Even if they just say "suggest birthday restaurants in Mumbai", show matched sponsored venue cards immediately!
    const cat = updatedDraft.category || 'birthday';
    const city = updatedDraft.location || 'Mumbai';
    const curr = updatedDraft.currency || defaultCurrency;
    const guests = updatedDraft.guestCount || (cat === 'wedding' ? 150 : cat === 'birthday' ? 50 : 200);
    const budget =
      updatedDraft.totalBudget ||
      (curr === 'INR'
        ? cat === 'wedding'
          ? 1200000
          : cat === 'birthday'
          ? 100000
          : 250000
        : 2500);

    const venueAds = generateContextualVenueAds({
      category: cat,
      city,
      guestCount: guests,
      totalBudget: budget,
      currency: curr,
    });

    await new Promise((r) => setTimeout(r, 550));
    return {
      source: 'genai-engine',
      updatedDraft,
      venueRecommendations: venueAds,
      replyMarkdown: `### 🏨 Top-Rated Hotels, Restaurants & Venues in **${city}**\nHere are **3 curated partner venues & restaurants** matched for a **${cat}** (~${guests} guests). You can check reviews, compare per-person packages, click **Book / Check Availability**, or click **"Select Venue & Build Plan"** on any card below!`,
    };
  }

  // CASE 3: Active Blueprint Exists -> Check if user asks for places/hotels OR wants to update parameters
  if (currentBlueprint) {
    if (asksForPlaces) {
      const targetCity = newEntities.location || currentBlueprint.location;
      const targetBudget = newEntities.totalBudget || currentBlueprint.totalBudget;
      const targetGuests = newEntities.guestCount || currentBlueprint.guestCount;
      const ads = generateContextualVenueAds({
        category: currentBlueprint.category,
        city: targetCity,
        guestCount: targetGuests,
        totalBudget: targetBudget,
        currency: currentBlueprint.currency,
      });
      await new Promise((r) => setTimeout(r, 500));
      return {
        source: 'genai-engine',
        updatedDraft,
        venueRecommendations: ads,
        replyMarkdown: `### 🏨 Recommended Hotels & Restaurants for **${currentBlueprint.title}**\nBased on your **${formatCurrency(
          targetBudget,
          currentBlueprint.currency
        )}** total budget and **${targetGuests} guests** in **${targetCity}**, here are the best-matched partner venues with verified reviews and direct booking links:`,
      };
    }

    const wantsUpdate =
      newEntities.guestCount !== undefined ||
      newEntities.totalBudget !== undefined ||
      newEntities.location !== undefined ||
      /\b(change|update|make\s+it|instead|actually|modify|recalculate)\b/i.test(lower);

    if (
      wantsUpdate &&
      (newEntities.guestCount ||
        newEntities.totalBudget ||
        newEntities.location ||
        newEntities.category)
    ) {
      const targetCategory = newEntities.category || currentBlueprint.category;
      const targetGuests = newEntities.guestCount || currentBlueprint.guestCount;
      const targetBudget = newEntities.totalBudget || currentBlueprint.totalBudget;
      const targetLocation = newEntities.location || currentBlueprint.location;
      const targetCurrency = newEntities.currency || currentBlueprint.currency;
      const targetVibe = newEntities.vibe || currentBlueprint.vibe;

      const gen = await generateEventBlueprintWithAI({
        category: targetCategory,
        title: `${targetLocation} ${
          targetCategory === 'wedding'
            ? 'Wedding Celebration'
            : targetCategory === 'birthday'
            ? 'Birthday Party'
            : 'Community Event'
        } (${targetGuests} Guests)`,
        date: currentBlueprint.date,
        location: targetLocation,
        guestCount: targetGuests,
        totalBudget: targetBudget,
        currency: targetCurrency,
        vibe: targetVibe,
        customPrompt: updatedDraft.notes.join(' | '),
      });

      return {
        source: gen.source,
        updatedDraft,
        generatedBlueprint: gen.blueprint,
        venueRecommendations: gen.blueprint.venueRecommendations,
        replyMarkdown: gen.aiReplyMarkdown,
      };
    }

    // Add task via chat
    const addTaskMatch = trimmed.match(
      /add\s+["']?([^"']+)["']?\s+to\s+(?:my\s+)?(?:checklist|timeline|tasks)/i
    );
    if (addTaskMatch) {
      const taskTitle = addTaskMatch[1].trim();
      const updatedBp: EventBlueprint = {
        ...currentBlueprint,
        timeline: [
          {
            id: `tl-${Date.now()}`,
            phase: 'Custom Priority',
            timeframe: 'Added via Chat',
            title: taskTitle,
            description: `Added from conversation for ${currentBlueprint.title}`,
            category: 'Custom Task',
            completed: false,
            priority: 'High',
          },
          ...currentBlueprint.timeline,
        ],
      };
      return {
        source: 'genai-engine',
        updatedDraft,
        generatedBlueprint: updatedBp,
        replyMarkdown: `Done! ✅ I’ve added **"${taskTitle}"** to the top of your **Timeline & Checklist** in the Canvas.`,
      };
    }

    const coPilotRes = await askAICoPilot(trimmed, currentBlueprint);
    return {
      source: coPilotRes.source,
      updatedDraft,
      replyMarkdown: coPilotRes.reply,
    };
  }

  // CASE 4: User has NO active blueprint yet -> Check if we should clarify or generate
  const hasCategory = !!updatedDraft.category;
  const hasGuestsOrBudget = !!(updatedDraft.guestCount || updatedDraft.totalBudget);
  const userExplicitlySaidGenerateNow =
    /\b(generate\s+now|just\s+create|surprise\s+me|use\s+default|make\s+the\s+plan\s+now|go\s+ahead)\b/i.test(
      lower
    );

  if (!hasCategory && !hasGuestsOrBudget && !userExplicitlySaidGenerateNow) {
    await new Promise((r) => setTimeout(r, 450));
    return {
      source: 'genai-engine',
      updatedDraft,
      replyMarkdown: `I’d love to help you organize that! 🎉\n\nTo get started, tell me a little bit about what you have in mind:\n1. **What are we celebrating?** (e.g., a **wedding**, a **birthday party**, or a **community event**)\n2. **Roughly how many people** are you expecting, and what **city or budget** are you looking at?`,
    };
  }

  if (hasCategory && !hasGuestsOrBudget && !userExplicitlySaidGenerateNow) {
    await new Promise((r) => setTimeout(r, 450));
    const catLabel =
      updatedDraft.category === 'wedding'
        ? 'wedding 💍'
        : updatedDraft.category === 'birthday'
        ? 'birthday party 🎂'
        : 'community event 🎪';

    const locText = updatedDraft.location ? ` in **${updatedDraft.location}**` : '';

    return {
      source: 'genai-engine',
      updatedDraft,
      replyMarkdown: `Planning a **${catLabel}**${locText} sounds wonderful! I can put together a complete budget breakdown, timeline, vendor checklist, and **top-rated hotel/restaurant recommendations** for you.\n\nBefore I build your plan, tell me:\n- **Roughly how many guests** are you planning for?\n- **What is your approximate comfort budget?** (e.g., *₹80,000*, *₹12 Lakhs*, *$2,500*)\n- **Which city or area** do you prefer?\n\n*(Or just reply **"Surprise me"** and I’ll generate a complete plan + venue matches right now!)*`,
    };
  }

  // CASE 5: We have enough details -> Generate Full Plan + Contextual LLM Venue Ads!
  const finalCategory: EventCategory = updatedDraft.category || 'birthday';
  const finalCurrency: CurrencyCode = updatedDraft.currency || defaultCurrency;
  const finalGuests =
    updatedDraft.guestCount ||
    (finalCategory === 'wedding' ? 150 : finalCategory === 'birthday' ? 50 : 250);
  const finalBudget =
    updatedDraft.totalBudget ||
    (finalCurrency === 'INR'
      ? finalCategory === 'wedding'
        ? 1200000
        : finalCategory === 'birthday'
        ? 100000
        : 250000
      : finalCategory === 'wedding'
      ? 20000
      : finalCategory === 'birthday'
      ? 2000
      : 5000);
  const finalLocation = updatedDraft.location || 'Mumbai';
  const finalVibe =
    updatedDraft.vibe ||
    (finalCategory === 'wedding'
      ? 'Warm Elegance, Floral & Candlelit'
      : finalCategory === 'birthday'
      ? 'Joyful, Festive & Memorable'
      : 'Inclusive, High-Energy Community Spirit');

  const categoryTitle =
    finalCategory === 'wedding'
      ? 'Wedding Celebration'
      : finalCategory === 'birthday'
      ? 'Birthday Celebration'
      : 'Community Event';

  const finalTitle = `${finalLocation} ${categoryTitle} (${finalGuests} Guests)`;
  const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const genResult = await generateEventBlueprintWithAI({
    category: finalCategory,
    title: finalTitle,
    date: futureDate,
    location: finalLocation,
    guestCount: finalGuests,
    totalBudget: finalBudget,
    currency: finalCurrency,
    vibe: finalVibe,
    customPrompt: updatedDraft.notes.join(' — '),
  });

  return {
    source: genResult.source,
    updatedDraft,
    generatedBlueprint: genResult.blueprint,
    venueRecommendations: genResult.blueprint.venueRecommendations,
    replyMarkdown: genResult.aiReplyMarkdown,
  };
}

interface GenerateBlueprintInput {
  category: EventCategory;
  title: string;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: CurrencyCode;
  vibe: string;
  customPrompt: string;
}

export async function generateEventBlueprintWithAI(
  input: GenerateBlueprintInput
): Promise<{
  blueprint: EventBlueprint;
  aiReplyMarkdown: string;
  source: 'gemini-live' | 'genai-engine';
}> {
  const baseTemplate = PRESET_BLUEPRINTS[input.category];

  // Always generate matched LLM Venue & Restaurant Recommendations for the user's budget & city!
  const venueAds = generateContextualVenueAds({
    category: input.category,
    city: input.location,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: input.currency,
  });

  await new Promise((r) => setTimeout(r, 850));

  const perGuestBudget = Math.round(input.totalBudget / Math.max(1, input.guestCount));
  const formattedTotal = formatCurrency(input.totalBudget, input.currency);
  const formattedPerGuest = formatCurrency(perGuestBudget, input.currency);

  const scaledBudgets = baseTemplate.budgetBreakdown.map((item, idx) => {
    const allocated = Math.round((input.totalBudget * item.percentage) / 100);
    return {
      ...item,
      id: `gen-b-${Date.now()}-${idx}`,
      allocated,
      actualSpent: 0,
      aiTip: `${item.aiTip} (Tailored for ${input.guestCount} guests in ${input.location})`,
    };
  });

  const scaledTimeline = baseTemplate.timeline.map((t, idx) => ({
    ...t,
    id: `gen-t-${Date.now()}-${idx}`,
    completed: false,
  }));

  const scaledVendors = baseTemplate.vendors.map((v, idx) => {
    const matchingBudget = scaledBudgets[idx] || scaledBudgets[0];
    return {
      ...v,
      id: `gen-v-${Date.now()}-${idx}`,
      status: 'Not Started' as const,
      estimatedCost: matchingBudget
        ? matchingBudget.allocated
        : Math.round(input.totalBudget * 0.18),
      aiNegotiationScript: `Hello! We are organizing a ${input.category} (${input.title}) in ${input.location} on ${input.date} for ${input.guestCount} guests. Our target budget for ${v.category.toLowerCase()} is around ${formatCurrency(
        matchingBudget ? matchingBudget.allocated : Math.round(input.totalBudget * 0.18),
        input.currency
      )}. Could you share your best all-inclusive package and availability?`,
      checklistTasks: v.checklistTasks.map((ct, cIdx) => ({
        ...ct,
        id: `gen-vt-${Date.now()}-${idx}-${cIdx}`,
        done: false,
      })),
    };
  });

  const customIdeaFromPrompt: PersonalizedIdea = {
    id: `idea-custom-${Date.now()}`,
    category: 'Guest Experience',
    title: `Bespoke "${input.vibe.split(',')[0] || 'Signature'}" Welcome Experience`,
    description: `Set up an interactive arrival zone in ${input.location} for your ${input.guestCount} guests with local welcome refreshments, instant photo memories, and warm ambient lighting.`,
    estimatedImpact: 'High Wow-Factor',
    implementationSteps: [
      `Design a welcoming entrance reflecting "${input.vibe}" in ${input.location}`,
      `Curate a zero-wait welcome drink & snack station scaled for ${input.guestCount} guests`,
      `Keep setup within ${formatCurrency(Math.round(input.totalBudget * 0.05), input.currency)} (5% of budget)`,
    ],
    saved: true,
  };

  const cleanTag = input.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || 'Celebration';

  const synthesized: EventBlueprint = {
    ...baseTemplate,
    id: `synth-${Date.now()}`,
    category: input.category,
    title: input.title,
    subtitle: `${input.vibe} • ${input.location} (${input.guestCount} Guests)`,
    date: input.date,
    location: input.location,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: input.currency,
    vibe: input.vibe,
    customPrompt: input.customPrompt,
    aiExecutiveSummary: `Built for ${input.guestCount} guests in ${input.location} with a total budget of ${formattedTotal} (~${formattedPerGuest}/guest). Includes 3 budget-matched hotel/restaurant partners and an 8% peace-of-mind contingency buffer.`,
    budgetBreakdown: scaledBudgets,
    timeline: scaledTimeline,
    vendors: scaledVendors,
    ideas: [customIdeaFromPrompt, ...baseTemplate.ideas.map((i) => ({ ...i, saved: false }))],
    venueRecommendations: venueAds,
    generatedCopy: {
      invitationText: `✨ YOU ARE WARMLY INVITED ✨\n\n${input.title.toUpperCase()}\n${input.vibe}\n\n📅 Date: ${input.date}\n📍 Location: ${input.location}\n👥 Celebrating with ${input.guestCount} guests\n\nWe would love your presence as we celebrate together! Kindly RSVP with your dietary preferences.`,
      welcomeNoteOrSpeech: `"Welcome everyone to ${input.location}! Having ${input.guestCount} of our favorite people together today means the world to us. Thank you for bringing your warmth, laughter, and blessings—enjoy the food, music, and memories!"`,
      hashtagsOrTaglines: [
        `#${cleanTag}2026`,
        `#${input.location.split(/[ ,/]/)[0]}Celebration`,
        '#MomentsTogether',
      ],
      rainOrBackupPlan: `Weather & Backup Plan for ${input.location}: Keep a covered indoor hall or waterproof marquee option on standby 48 hours prior for ${input.guestCount} guests, with dedicated power backup for audio and lighting.`,
    },
  };

  const topBudgetLines = scaledBudgets
    .slice(0, 4)
    .map(
      (b) => `- **${b.category} (${b.percentage}%):** ${formatCurrency(b.allocated, input.currency)}`
    )
    .join('\n');

  const aiReplyMarkdown = `### ✨ Here is Your Custom Plan: **${synthesized.title}**
I’ve put together a complete **${input.category}** plan for **${input.guestCount} guests** in **${input.location}** with a total budget of **${formattedTotal}** (~**${formattedPerGuest}** per person).

### 💰 Recommended Budget Breakdown
${topBudgetLines}

### 🗓️ First 3 Steps on Your Timeline
1. **${scaledTimeline[0]?.phase}:** ${scaledTimeline[0]?.title} — *${scaledTimeline[0]?.description}*
2. **${scaledTimeline[1]?.phase}:** ${scaledTimeline[1]?.title} — *${scaledTimeline[1]?.description}*
3. **${scaledTimeline[2]?.phase}:** ${scaledTimeline[2]?.title} — *${scaledTimeline[2]?.description}*

### 🏨 Top-Matched Hotels, Restaurants & Venues (Within Your Budget)
Below are **3 sponsored & top-rated partner places** in **${input.location}** whose food + venue packages fit right inside your **${formattedTotal}** budget:`;

  return { blueprint: synthesized, aiReplyMarkdown, source: 'genai-engine' };
}

export async function askAICoPilot(
  userQuestion: string,
  blueprint: EventBlueprint
): Promise<{
  reply: string;
  suggestedNewIdea?: PersonalizedIdea;
  suggestedTimelineItem?: TimelineItem;
  source: 'gemini-live' | 'genai-engine';
}> {
  await new Promise((r) => setTimeout(r, 550));
  const formattedBudget = formatCurrency(blueprint.totalBudget, blueprint.currency);
  const perGuest = formatCurrency(
    Math.round(blueprint.totalBudget / Math.max(1, blueprint.guestCount)),
    blueprint.currency
  );

  const q = userQuestion.toLowerCase().trim();

  if (
    /^(thanks|thank\s+you|thx|awesome|great|cool|nice|ok|okay|got\s+it|perfect)[!.,\s]*$/i.test(q)
  ) {
    return {
      source: 'genai-engine',
      reply: `You’re very welcome! 😊 Let me know whenever you want to compare more hotels/restaurants, tweak the budget, or add a checklist item.`,
    };
  }

  if (
    q.includes('first') ||
    q.includes('beginner') ||
    q.includes('never planned') ||
    q.includes('scared') ||
    q.includes('step by step') ||
    q.includes('overwhelm')
  ) {
    return {
      source: 'genai-engine',
      reply: `### 🌿 Take a Deep Breath — Here Are the Only 3 Steps You Need First\nPlanning **${blueprint.title}** is super manageable when you break it down:\n\n1. **Confirm Your Rough Guest Count & Comfort Budget** — We have set **${blueprint.guestCount} guests** and **${formattedBudget}** (~${perGuest}/person).\n2. **Pick 1 Partner Hotel or Restaurant** — Check the **🏨 Hotels & Places** cards to compare ratings and lock in your venue.\n3. **Do Just 1 Checklist Item Today** — Open the **✅ Timeline** tab in the Canvas on the right and check off the very first item!`,
    };
  }

  if (
    q.includes('budget') ||
    q.includes('save') ||
    q.includes('cut') ||
    q.includes('cost') ||
    q.includes('cheap')
  ) {
    const twelvePercent = formatCurrency(
      Math.round(blueprint.totalBudget * 0.12),
      blueprint.currency
    );
    return {
      source: 'genai-engine',
      reply: `### 💡 How to Save **${twelvePercent} (12%)** on **${blueprint.title}**\nBased on **${blueprint.guestCount} guests** and your **${formattedBudget}** budget (~${perGuest}/guest), here are 3 easy ways to cut costs without losing quality:\n\n1. **Choose an F&B Redeemable Venue (Save ~5%):** Pick a restaurant/hotel partner where 100% of the cover charge goes toward food and drinks (zero separate room rental!).\n2. **Repurpose Entrance Decor (Save ~4.5%):** Use modular floral & lighting frames that can be moved to the main stage or cake table.\n3. **Bundle Sound & Lighting (Save ~2.5%):** Book audio and warm ambient lighting from a single local vendor in **${blueprint.location}**.`,
    };
  }

  if (q.includes('vendor') || q.includes('negotiate') || q.includes('contract') || q.includes('cater')) {
    return {
      source: 'genai-engine',
      reply: `### 🤝 3 Polite Vendor Tips for **${blueprint.location}**\nWhen talking to venues and vendors for **${blueprint.guestCount} guests**, use these simple strategies:\n\n- **Start 10% Below Your Real Cap:** Book your minimum guarantee at **${Math.round(
        blueprint.guestCount * 0.9
      )} guests** with the option to add more plates up to 48 hours before the event.\n- **Ask for Zero Plug-In / Cakeage Fees:** Make sure the restaurant or hotel doesn't charge extra fees when you bring your own specialty birthday/wedding cake or photographer.\n- **Safe Payment Milestones:** Pay **25% on booking**, **50% one week before**, and **25% on event day** after setup is complete.`,
    };
  }

  return {
    source: 'genai-engine',
    reply: `Here’s how I can help with **"${userQuestion}"** for **${blueprint.title}** (${blueprint.guestCount} guests in ${blueprint.location}):\n\n- **Looking for hotels or restaurants?** Just say *"Show me places in [City] under [Budget]"*.\n- **Want to adjust the numbers?** Say *"Change budget to [amount]"* or *"Change guests to [number]"*.\n- **Want to add a reminder?** Say *"Add [task name] to my checklist"*.`,
  };
}
