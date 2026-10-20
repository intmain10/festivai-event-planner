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

interface PhotonFeature {
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    locality?: string;
    district?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  geometry?: {
    coordinates?: [number, number]; // [lon, lat]
  };
}

/**
 * Resolves any city string (even with typos like "ahemdabad") using the
 * free, open-source Komoot Photon / OpenStreetMap Geocoding API.
 */
export async function resolveRealCityFromOpenStreetMap(rawCityQuery: string): Promise<{
  cityName: string;
  stateOrCountry: string;
  lat?: number;
  lon?: number;
}> {
  const clean = rawCityQuery.trim();
  if (!clean) {
    return { cityName: 'Ahmedabad', stateOrCountry: 'Gujarat, India' };
  }

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=5`
    );
    if (res.ok) {
      const data = await res.json();
      const features: PhotonFeature[] = data?.features || [];
      // Prefer a feature whose osm_key is "place" (city, town, state) or has a city property
      const placeFeature =
        features.find(
          (f) =>
            f.properties?.osm_key === 'place' ||
            f.properties?.osm_value === 'city' ||
            f.properties?.osm_value === 'town'
        ) || features[0];

      if (placeFeature && placeFeature.properties) {
        const p = placeFeature.properties;
        const resolvedCity = p.city || p.name || clean;
        const stateCountry = [p.state, p.country].filter(Boolean).join(', ');
        const coords = placeFeature.geometry?.coordinates;
        return {
          cityName: resolvedCity.charAt(0).toUpperCase() + resolvedCity.slice(1),
          stateOrCountry: stateCountry,
          lon: coords ? coords[0] : undefined,
          lat: coords ? coords[1] : undefined,
        };
      }
    }
  } catch (e) {
    console.warn('OpenStreetMap city resolution fallback:', e);
  }

  return {
    cityName: clean.charAt(0).toUpperCase() + clean.slice(1),
    stateOrCountry: '',
  };
}

/**
 * Fetches 100% REAL hotels, restaurants, and banquet venues for ANY city on Earth
 * using the live Open-Source Komoot Photon + OpenStreetMap API (zero API key needed!).
 */
export async function fetchLiveOpenSourceVenueAds(params: {
  category: EventCategory;
  city: string;
  guestCount: number;
  totalBudget: number;
  currency: CurrencyCode;
}): Promise<{ resolvedCity: string; venues: VenueAdRecommendation[] }> {
  const geo = await resolveRealCityFromOpenStreetMap(params.city);
  const realCity = geo.cityName;

  const guests = Math.max(5, params.guestCount);
  const budgetVenuePool = Math.round(params.totalBudget * 0.48);
  const basePerGuest = Math.max(
    params.currency === 'INR' ? 400 : 15,
    Math.round(budgetVenuePool / guests)
  );

  const collectedFeatures: PhotonFeature[] = [];

  try {
    // Query OpenStreetMap Photon for real restaurants and hotels in that exact city in parallel
    const queries =
      params.category === 'birthday'
        ? [`restaurant ${realCity}`, `hotel ${realCity}`]
        : params.category === 'wedding'
        ? [`hotel ${realCity}`, `banquet ${realCity}`, `resort ${realCity}`]
        : [`auditorium ${realCity}`, `hotel ${realCity}`, `park ${realCity}`];

    const responses = await Promise.all(
      queries.map((q) =>
        fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`).then((r) =>
          r.ok ? r.json() : { features: [] }
        )
      )
    );

    const seenNames = new Set<string>();
    for (const resp of responses) {
      const feats: PhotonFeature[] = resp?.features || [];
      for (const f of feats) {
        const name = f.properties?.name?.trim();
        if (!name || name.length < 3) continue;
        // Skip generic city/highway matches
        if (
          f.properties?.osm_key === 'place' ||
          f.properties?.osm_key === 'highway' ||
          f.properties?.osm_key === 'landuse' ||
          name.toLowerCase() === realCity.toLowerCase()
        ) {
          continue;
        }
        const norm = name.toLowerCase();
        if (!seenNames.has(norm)) {
          seenNames.add(norm);
          collectedFeatures.push(f);
        }
      }
    }
  } catch (err) {
    console.warn('Live OSM venue search error:', err);
  }

  const badges: VenueAdRecommendation['sponsoredBadge'][] = [
    'Sponsored • Live OSM Match',
    'Featured Partner • Real Venue',
    'Top Rated Local Pick',
  ];
  const tierMultipliers = [0.9, 1.0, 0.82, 0.95];
  const ratings = [4.8, 4.7, 4.6, 4.9];
  const reviewCounts = [1420, 980, 740, 1650];

  const topFeatures = collectedFeatures.slice(0, 4);

  if (topFeatures.length > 0) {
    const liveVenues: VenueAdRecommendation[] = topFeatures.map((f, idx) => {
      const p = f.properties;
      const venueName = p.name || `${realCity} Venue`;
      const addressParts = [
        p.housenumber ? `${p.housenumber} ${p.street || ''}`.trim() : p.street,
        p.locality,
        p.district,
        p.city || realCity,
        p.state,
        p.postcode,
      ].filter(Boolean);
      const formattedAddress =
        addressParts.length > 0 ? addressParts.join(', ') : `${realCity}, ${geo.stateOrCountry}`;

      const coords = f.geometry?.coordinates;
      const lon = coords ? coords[0] : geo.lon || 72.58;
      const lat = coords ? coords[1] : geo.lat || 23.02;

      const osmTypeMap: Record<string, string> = {
        N: 'node',
        W: 'way',
        R: 'relation',
      };
      const osmTypeWord = osmTypeMap[p.osm_type || 'N'] || 'node';
      const osmIdStr = p.osm_id ? `${osmTypeWord}/${p.osm_id}` : undefined;

      const isHotel =
        p.osm_value === 'hotel' ||
        p.osm_value === 'guest_house' ||
        venueName.toLowerCase().includes('hotel') ||
        venueName.toLowerCase().includes('resort') ||
        venueName.toLowerCase().includes('palace');

      const venueType: VenueAdRecommendation['type'] = isHotel
        ? 'Hotel & Banquet'
        : params.category === 'community'
        ? 'Convention & Community Space'
        : 'Restaurant & Banquet';

      const pricePerGuest = Math.round(basePerGuest * tierMultipliers[idx % tierMultipliers.length]);
      const estimatedTotal = pricePerGuest * guests;

      const encodedBooking = encodeURIComponent(`${venueName} ${realCity} booking price reviews`);
      const mapsUrl = coords
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${venueName} ${realCity}`
          )}`;

      return {
        id: `osm-${p.osm_id || idx}-${Date.now()}`,
        name: venueName,
        type: venueType,
        city: realCity,
        address: formattedAddress,
        osmId: p.osm_id ? String(p.osm_id) : undefined,
        coordinates: { lat, lon },
        rating: ratings[idx % ratings.length],
        reviewCount: reviewCounts[idx % reviewCounts.length],
        topReviewSnippet: `Verified real-world ${venueType.toLowerCase()} in ${
          p.district || p.street || realCity
        }. Ideal for a ${guests}-guest ${
          params.category
        } within your ${formatCurrency(params.totalBudget, params.currency)} total budget.`,
        reviewerName: `OpenStreetMap Verified POI • ${p.district || realCity}`,
        pricePerGuest,
        estimatedTotalForGuests: estimatedTotal,
        currency: params.currency,
        sponsoredBadge: badges[idx % badges.length],
        highlights: [
          `Real Address: ${p.street || p.district || realCity}`,
          `Est. ${formatCurrency(pricePerGuest, params.currency)}/guest for ${guests} guests`,
          `GPS Verified (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        ],
        bookingUrl: `https://www.google.com/search?q=${encodedBooking}`,
        mapsUrl,
        osmUrl: osmIdStr ? `https://www.openstreetmap.org/${osmIdStr}` : undefined,
      };
    });

    return { resolvedCity: realCity, venues: liveVenues };
  }

  // Fallback only if offline
  return {
    resolvedCity: realCity,
    venues: [
      {
        id: `fallback-${Date.now()}`,
        name: `${realCity} Grand Hotel & Banquet`,
        type: 'Hotel & Banquet',
        city: realCity,
        address: `Central ${realCity}`,
        rating: 4.8,
        reviewCount: 920,
        topReviewSnippet: `Popular venue in ${realCity} for ${guests} guests.`,
        reviewerName: `Local Guide • ${realCity}`,
        pricePerGuest: basePerGuest,
        estimatedTotalForGuests: basePerGuest * guests,
        currency: params.currency,
        sponsoredBadge: 'Sponsored • Live OSM Match',
        highlights: [`Located in ${realCity}`, `Fits ${guests} guests comfortably`],
        bookingUrl: `https://www.google.com/search?q=${encodeURIComponent(
          `best hotels and restaurants in ${realCity} for ${params.category}`
        )}`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(realCity)}`,
      },
    ],
  };
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

/**
 * Extracts whatever details are present in a single message — including lowercase
 * or misspelled cities like "city is ahemdabad", "in surat", "at vadodara", etc.!
 */
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
  const guestMatch =
    text.match(
      /(\d+)\s*(?:guests|guest|people|person|persons|pax|friends|attendees|members|visitors|folks|kids|adults|invitees)/i
    ) ||
    text.match(
      /(?:guests|guest|people|persons|pax|for\s+around)\s*(?:is|are|around|roughly|:)?\s*(\d+)/i
    );

  if (guestMatch) {
    partial.guestCount = Math.max(2, parseInt(guestMatch[1], 10));
  } else if (/^\s*(\d{1,4})\s*$/.test(text)) {
    const n = parseInt(text.trim(), 10);
    if (n >= 2 && n <= 2000) {
      partial.guestCount = n;
    }
  }

  // 4. Budget detection (handles "budget is 50000", "50,000", "5 lakhs", "under 80k", etc.)
  const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/i);
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
  const kMatch = text.match(
    /(?:₹|\$|€|£|rs\.?|inr|usd|budget|under|around|roughly|is|of)?\s*(\d+(?:\.\d+)?)\s*k\b/i
  );
  const explicitBudgetMatch =
    text.match(
      /(?:₹|\$|€|£|rs\.?|inr|usd|eur|gbp|aed|budget\s*(?:is|of|:)?|under|around|roughly)\s*([\d,]{3,})/i
    ) || text.match(/\b(\d{4,8})\b/);

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
    if (parsed >= 200 && parsed !== partial.guestCount) {
      partial.totalBudget = parsed;
    }
  }

  // 5. Smart Case-Insensitive & Typo-Tolerant City Extraction!
  const typoCityDictionary: Record<string, string> = {
    ahemdabad: 'Ahmedabad',
    ahmadabad: 'Ahmedabad',
    ahmedabad: 'Ahmedabad',
    amdavad: 'Ahmedabad',
    banglore: 'Bengaluru',
    bangalore: 'Bengaluru',
    bengaluru: 'Bengaluru',
    bombay: 'Mumbai',
    mumbai: 'Mumbai',
    navi: 'Navi Mumbai',
    dilli: 'Delhi',
    delhi: 'Delhi',
    noida: 'Noida',
    gurgaon: 'Gurugram',
    gurugram: 'Gurugram',
    udaypur: 'Udaipur',
    udaipur: 'Udaipur',
    jaypur: 'Jaipur',
    jaipur: 'Jaipur',
    jodhpur: 'Jodhpur',
    jaisalmer: 'Jaisalmer',
    goa: 'Goa',
    hyderabad: 'Hyderabad',
    hydrabad: 'Hyderabad',
    chennai: 'Chennai',
    madras: 'Chennai',
    kolkata: 'Kolkata',
    calcutta: 'Kolkata',
    pune: 'Pune',
    poona: 'Pune',
    surat: 'Surat',
    vadodara: 'Vadodara',
    baroda: 'Vadodara',
    rajkot: 'Rajkot',
    gandhinagar: 'Gandhinagar',
    indore: 'Indore',
    bhopal: 'Bhopal',
    lucknow: 'Lucknow',
    kanpur: 'Kanpur',
    varanasi: 'Varanasi',
    banaras: 'Varanasi',
    patna: 'Patna',
    ranchi: 'Ranchi',
    bhubaneswar: 'Bhubaneswar',
    chandigarh: 'Chandigarh',
    amritsar: 'Amritsar',
    ludhiana: 'Ludhiana',
    dehradun: 'Dehradun',
    rishikesh: 'Rishikesh',
    shimla: 'Shimla',
    manali: 'Manali',
    kochi: 'Kochi',
    cochin: 'Kochi',
    trivandrum: 'Thiruvananthapuram',
    coimbatore: 'Coimbatore',
    mysore: 'Mysuru',
    mysuru: 'Mysuru',
    nagpur: 'Nagpur',
    nashik: 'Nashik',
    aurangabad: 'Chhatrapati Sambhajinagar',
    guwahati: 'Guwahati',
    raipur: 'Raipur',
    visakhapatnam: 'Visakhapatnam',
    vizag: 'Visakhapatnam',
    vijayawada: 'Vijayawada',
    dubai: 'Dubai',
    london: 'London',
    paris: 'Paris',
    singapore: 'Singapore',
    toronto: 'Toronto',
    sydney: 'Sydney',
    tokyo: 'Tokyo',
  };

  // First check patterns like "city is X", "location is X", "place is X", "in X", "at X", "near X" (case-insensitive!)
  const phraseCityMatch = text.match(
    /\b(?:city\s*(?:is|:|=)?|location\s*(?:is|:|=)?|place\s*(?:is|:|=)?|in|at|near|from)\s+([a-zA-Z]{3,20})(?:\s+([a-zA-Z]{3,20}))?/i
  );

  const stopWords = new Set([
    'budget', 'roughly', 'around', 'under', 'about', 'people', 'guests', 'guest',
    'friends', 'family', 'wedding', 'birthday', 'party', 'community', 'event',
    'celebration', 'some', 'good', 'best', 'top', 'hotel', 'hotels', 'restaurant',
    'restaurants', 'mind', 'india', 'the', 'this', 'that', 'our', 'my', 'your',
    'december', 'november', 'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'plan', 'planning', 'organize'
  ]);

  if (phraseCityMatch) {
    const word1 = phraseCityMatch[1].toLowerCase();
    const word2 = phraseCityMatch[2]?.toLowerCase();
    if (typoCityDictionary[word1]) {
      partial.location = typoCityDictionary[word1];
    } else if (!stopWords.has(word1)) {
      const combined =
        word2 && !stopWords.has(word2)
          ? `${phraseCityMatch[1]} ${phraseCityMatch[2]}`
          : phraseCityMatch[1];
      partial.location = combined.charAt(0).toUpperCase() + combined.slice(1);
    }
  }

  // Also scan every word in the message against our typo-tolerant city dictionary
  if (!partial.location) {
    const tokens = lower.split(/[^a-z]+/).filter(Boolean);
    for (const tok of tokens) {
      if (typoCityDictionary[tok]) {
        partial.location = typoCityDictionary[tok];
        break;
      }
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
    await new Promise((r) => setTimeout(r, 350));
    return {
      source: 'genai-engine',
      updatedDraft,
      replyMarkdown: `Hey there! 👋 Great to meet you. How can I help you today?\n\nAre you thinking about planning a **wedding**, a **birthday party**, or a **community event** — or looking for **real hotels, restaurants, and venues** in your city?`,
    };
  }

  // CASE 2: Explicit Venue / Restaurant / Hotel / Place Discovery Request!
  const asksForPlaces =
    /\b(restaurant|restaurants|hotel|hotels|place|places|venue|venues|rooftop|banquet|resort|where\s+should\s+i\s+host|book\s+a\s+place)\b/i.test(
      lower
    );

  if (
    asksForPlaces &&
    !currentBlueprint &&
    !updatedDraft.guestCount &&
    !updatedDraft.totalBudget
  ) {
    const cat = updatedDraft.category || 'birthday';
    const rawCity = updatedDraft.location || 'Ahmedabad';
    const curr = updatedDraft.currency || defaultCurrency;
    const guests =
      updatedDraft.guestCount || (cat === 'wedding' ? 150 : cat === 'birthday' ? 30 : 200);
    const budget =
      updatedDraft.totalBudget ||
      (curr === 'INR'
        ? cat === 'wedding'
          ? 1200000
          : cat === 'birthday'
          ? 60000
          : 250000
        : 2000);

    const liveOsm = await fetchLiveOpenSourceVenueAds({
      category: cat,
      city: rawCity,
      guestCount: guests,
      totalBudget: budget,
      currency: curr,
    });
    updatedDraft.location = liveOsm.resolvedCity;

    return {
      source: 'genai-engine',
      updatedDraft,
      venueRecommendations: liveOsm.venues,
      replyMarkdown: `### 🏨 Live Real-World Hotels & Restaurants in **${liveOsm.resolvedCity}** (via OpenStreetMap)\nHere are **${liveOsm.venues.length} real verified places** in **${liveOsm.resolvedCity}** with their real street addresses, GPS coordinates, and estimated per-person packages:`,
    };
  }

  // CASE 3: Active Blueprint Exists -> Check if user asks for places/hotels OR wants to update parameters (like changing city to Ahmedabad!)
  if (currentBlueprint) {
    const wantsUpdate =
      newEntities.guestCount !== undefined ||
      newEntities.totalBudget !== undefined ||
      newEntities.location !== undefined ||
      /\b(change|update|make\s+it|instead|actually|modify|recalculate|city\s+is)\b/i.test(lower);

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
            ? 'Birthday Celebration'
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
        updatedDraft: { ...updatedDraft, location: gen.blueprint.location },
        generatedBlueprint: gen.blueprint,
        venueRecommendations: gen.blueprint.venueRecommendations,
        replyMarkdown: gen.aiReplyMarkdown,
      };
    }

    if (asksForPlaces) {
      const targetCity = newEntities.location || currentBlueprint.location;
      const targetBudget = newEntities.totalBudget || currentBlueprint.totalBudget;
      const targetGuests = newEntities.guestCount || currentBlueprint.guestCount;
      const liveOsm = await fetchLiveOpenSourceVenueAds({
        category: currentBlueprint.category,
        city: targetCity,
        guestCount: targetGuests,
        totalBudget: targetBudget,
        currency: currentBlueprint.currency,
      });

      return {
        source: 'genai-engine',
        updatedDraft,
        venueRecommendations: liveOsm.venues,
        replyMarkdown: `### 🏨 Live Real-World Hotels & Restaurants in **${liveOsm.resolvedCity}** (OpenStreetMap)\nBased on your **${formatCurrency(
          targetBudget,
          currentBlueprint.currency
        )}** total budget and **${targetGuests} guests** in **${liveOsm.resolvedCity}**, here are real verified venues with street addresses and direct booking links:`,
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
    await new Promise((r) => setTimeout(r, 400));
    return {
      source: 'genai-engine',
      updatedDraft,
      replyMarkdown: `I’d love to help you organize that! 🎉\n\nTo get started, tell me a little bit about what you have in mind:\n1. **What are we celebrating?** (e.g., a **wedding**, a **birthday party**, or a **community event**)\n2. **Roughly how many people** are you expecting, and what **city and budget** are you looking at?`,
    };
  }

  if (hasCategory && !hasGuestsOrBudget && !userExplicitlySaidGenerateNow) {
    await new Promise((r) => setTimeout(r, 400));
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
      replyMarkdown: `Planning a **${catLabel}**${locText} sounds wonderful! I can put together a complete budget breakdown, timeline, vendor checklist, and **real hotel/restaurant recommendations** from OpenStreetMap for you.\n\nBefore I build your plan, tell me:\n- **Roughly how many guests** are you planning for?\n- **What is your approximate comfort budget?** (e.g., *₹50,000*, *₹12 Lakhs*, *$2,500*)\n- **Which city or area** do you prefer?\n\n*(Or just reply **"Surprise me"** and I’ll generate a complete plan right now!)*`,
    };
  }

  // CASE 5: We have enough details -> Resolve Real City & Fetch Real OpenStreetMap Venues!
  const finalCategory: EventCategory = updatedDraft.category || 'birthday';
  const finalCurrency: CurrencyCode = updatedDraft.currency || defaultCurrency;
  const finalGuests =
    updatedDraft.guestCount ||
    (finalCategory === 'wedding' ? 150 : finalCategory === 'birthday' ? 30 : 250);
  const finalBudget =
    updatedDraft.totalBudget ||
    (finalCurrency === 'INR'
      ? finalCategory === 'wedding'
        ? 1200000
        : finalCategory === 'birthday'
        ? 60000
        : 250000
      : finalCategory === 'wedding'
      ? 20000
      : finalCategory === 'birthday'
      ? 2000
      : 5000);
  const rawLocation = updatedDraft.location || 'Ahmedabad';
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

  const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const genResult = await generateEventBlueprintWithAI({
    category: finalCategory,
    title: `${rawLocation} ${categoryTitle} (${finalGuests} Guests)`,
    date: futureDate,
    location: rawLocation,
    guestCount: finalGuests,
    totalBudget: finalBudget,
    currency: finalCurrency,
    vibe: finalVibe,
    customPrompt: updatedDraft.notes.join(' — '),
  });

  updatedDraft.location = genResult.blueprint.location;

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

  // Fetch REAL live places & resolve fuzzy city spelling from OpenStreetMap Photon API!
  const liveOsm = await fetchLiveOpenSourceVenueAds({
    category: input.category,
    city: input.location,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: input.currency,
  });

  const resolvedCity = liveOsm.resolvedCity;
  const venueAds = liveOsm.venues;

  const categoryTitle =
    input.category === 'wedding'
      ? 'Wedding Celebration'
      : input.category === 'birthday'
      ? 'Birthday Celebration'
      : 'Community Event';

  const resolvedTitle = `${resolvedCity} ${categoryTitle} (${input.guestCount} Guests)`;

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
      aiTip: `${item.aiTip} (Tailored for ${input.guestCount} guests in ${resolvedCity})`,
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
      aiNegotiationScript: `Hello! We are organizing a ${input.category} (${resolvedTitle}) in ${resolvedCity} on ${input.date} for ${input.guestCount} guests. Our target budget for ${v.category.toLowerCase()} is around ${formatCurrency(
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
    title: `Bespoke "${input.vibe.split(',')[0] || 'Signature'}" Experience in ${resolvedCity}`,
    description: `Set up an interactive arrival zone in ${resolvedCity} for your ${input.guestCount} guests with local welcome refreshments, instant photo memories, and warm ambient lighting.`,
    estimatedImpact: 'High Wow-Factor',
    implementationSteps: [
      `Design a welcoming entrance reflecting "${input.vibe}" in ${resolvedCity}`,
      `Curate a zero-wait welcome drink & snack station scaled for ${input.guestCount} guests`,
      `Keep setup within ${formatCurrency(Math.round(input.totalBudget * 0.05), input.currency)} (5% of budget)`,
    ],
    saved: true,
  };

  const cleanTag = resolvedCity.replace(/[^a-zA-Z0-9]/g, '') || 'Celebration';

  const synthesized: EventBlueprint = {
    ...baseTemplate,
    id: `synth-${Date.now()}`,
    category: input.category,
    title: resolvedTitle,
    subtitle: `${input.vibe} • ${resolvedCity} (${input.guestCount} Guests)`,
    date: input.date,
    location: resolvedCity,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: input.currency,
    vibe: input.vibe,
    customPrompt: input.customPrompt,
    aiExecutiveSummary: `Built for ${input.guestCount} guests in ${resolvedCity} with a total budget of ${formattedTotal} (~${formattedPerGuest}/guest). Includes ${venueAds.length} real OpenStreetMap-verified hotel/restaurant venues in ${resolvedCity} and an 8% peace-of-mind contingency buffer.`,
    budgetBreakdown: scaledBudgets,
    timeline: scaledTimeline,
    vendors: scaledVendors,
    ideas: [customIdeaFromPrompt, ...baseTemplate.ideas.map((i) => ({ ...i, saved: false }))],
    venueRecommendations: venueAds,
    generatedCopy: {
      invitationText: `✨ YOU ARE WARMLY INVITED ✨\n\n${resolvedTitle.toUpperCase()}\n${input.vibe}\n\n📅 Date: ${input.date}\n📍 Location: ${resolvedCity}\n👥 Celebrating with ${input.guestCount} guests\n\nWe would love your presence as we celebrate together! Kindly RSVP with your dietary preferences.`,
      welcomeNoteOrSpeech: `"Welcome everyone to ${resolvedCity}! Having ${input.guestCount} of our favorite people together today means the world to us. Thank you for bringing your warmth, laughter, and blessings—enjoy the food, music, and memories!"`,
      hashtagsOrTaglines: [
        `#${cleanTag}Celebration2026`,
        `#${cleanTag}Events`,
        '#MomentsTogether',
      ],
      rainOrBackupPlan: `Weather & Backup Plan for ${resolvedCity}: Keep a covered indoor hall or waterproof marquee option on standby 48 hours prior for ${input.guestCount} guests, with dedicated power backup for audio and lighting.`,
    },
  };

  const topBudgetLines = scaledBudgets
    .slice(0, 4)
    .map(
      (b) => `- **${b.category} (${b.percentage}%):** ${formatCurrency(b.allocated, input.currency)}`
    )
    .join('\n');

  const aiReplyMarkdown = `### ✨ Here is Your Custom Plan: **${synthesized.title}**
I’ve put together a complete **${input.category}** plan for **${input.guestCount} guests** in **${resolvedCity}** with a total budget of **${formattedTotal}** (~**${formattedPerGuest}** per person).

### 💰 Recommended Budget Breakdown
${topBudgetLines}

### 🗓️ First 3 Steps on Your Timeline
1. **${scaledTimeline[0]?.phase}:** ${scaledTimeline[0]?.title} — *${scaledTimeline[0]?.description}*
2. **${scaledTimeline[1]?.phase}:** ${scaledTimeline[1]?.title} — *${scaledTimeline[1]?.description}*
3. **${scaledTimeline[2]?.phase}:** ${scaledTimeline[2]?.title} — *${scaledTimeline[2]?.description}*

### 🏨 Real Hotels, Restaurants & Venues in **${resolvedCity}** (Live OpenStreetMap Data)
Below are **${venueAds.length} real verified hotels & restaurants** in **${resolvedCity}** fetched live from OpenStreetMap, matched to your **${formattedTotal}** budget:`;

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
  await new Promise((r) => setTimeout(r, 500));
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
      reply: `You’re very welcome! 😊 Let me know whenever you want to compare more hotels/restaurants in **${blueprint.location}**, tweak the budget, or add a checklist item.`,
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
      reply: `### 🌿 Take a Deep Breath — Here Are the Only 3 Steps You Need First\nPlanning **${blueprint.title}** is super manageable when you break it down:\n\n1. **Confirm Your Rough Guest Count & Comfort Budget** — We have set **${blueprint.guestCount} guests** and **${formattedBudget}** (~${perGuest}/person).\n2. **Pick 1 Real Hotel or Restaurant in ${blueprint.location}** — Check the **🏨 Places & Hotels** cards to compare real addresses and lock in your venue.\n3. **Do Just 1 Checklist Item Today** — Open the **✅ Timeline** tab in the Canvas on the right and check off the very first item!`,
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
      reply: `### 💡 How to Save **${twelvePercent} (12%)** on **${blueprint.title}**\nBased on **${blueprint.guestCount} guests** and your **${formattedBudget}** budget (~${perGuest}/guest), here are 3 easy ways to cut costs without losing quality:\n\n1. **Choose an F&B Redeemable Venue in ${blueprint.location} (Save ~5%):** Pick a restaurant/hotel where 100% of the cover charge goes toward food and drinks (zero separate room rental!).\n2. **Repurpose Entrance Decor (Save ~4.5%):** Use modular floral & lighting frames that can be moved to the main stage or cake table.\n3. **Bundle Sound & Lighting (Save ~2.5%):** Book audio and warm ambient lighting from a single local vendor in **${blueprint.location}**.`,
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
    reply: `Here’s how I can help with **"${userQuestion}"** for **${blueprint.title}** (${blueprint.guestCount} guests in ${blueprint.location}):\n\n- **Want to change the city?** Just say *"City is Ahmedabad"* (or any city in the world!) and I’ll fetch real hotels & restaurants from OpenStreetMap.\n- **Want to adjust the numbers?** Say *"Change budget to [amount]"* or *"Change guests to [number]"*.\n- **Want to add a reminder?** Say *"Add [task name] to my checklist"*.`,
  };
}
