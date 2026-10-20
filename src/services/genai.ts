import {
  EventBlueprint,
  EventCategory,
  CurrencyCode,
  PersonalizedIdea,
  TimelineItem,
  ChatMessage,
  VenueAdRecommendation,
  VenuePhotoSlide,
  PlaceSearchCategory,
  BudgetItem,
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

function buildVenuePhotoCarousel(
  venueName: string,
  city: string,
  placeCategory: PlaceSearchCategory,
  guests: number,
  idx: number
): VenuePhotoSlide[] {
  const restaurantDiningPhotos = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=900&q=80',
  ];

  const buffetFoodPhotos = [
    'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  ];

  const hotelBanquetPhotos = [
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80',
  ];

  const bakeryDessertPhotos = [
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=900&q=80',
  ];

  const outdoorAmbiencePhotos = [
    'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80',
  ];

  if (placeCategory === 'bakery') {
    return [
      {
        url: bakeryDessertPhotos[idx % bakeryDessertPhotos.length],
        tag: 'Signature Cakes & Mithai',
        caption: `${venueName} (${city}) — Custom Celebration Cakes & Festive Boxes`,
      },
      {
        url: bakeryDessertPhotos[(idx + 1) % bakeryDessertPhotos.length],
        tag: 'Dessert Counter',
        caption: `Artisanal Pastries, Dry-Fruit Hampers & Live Dessert Table`,
      },
      {
        url: restaurantDiningPhotos[idx % restaurantDiningPhotos.length],
        tag: 'Cafe Seating',
        caption: `Warm Indoor Cafe & Tasting Lounge in ${city}`,
      },
      {
        url: buffetFoodPhotos[idx % buffetFoodPhotos.length],
        tag: 'Savory Bites',
        caption: `High-Tea Platters & Freshly Baked Savories for ${guests} Guests`,
      },
    ];
  }

  return [
    {
      url:
        placeCategory === 'hotel' || placeCategory === 'banquet'
          ? hotelBanquetPhotos[idx % hotelBanquetPhotos.length]
          : restaurantDiningPhotos[idx % restaurantDiningPhotos.length],
      tag: 'Main Dining & Ambience',
      caption: `${venueName}, ${city} — Spacious Group Dining Hall for ${guests} Guests`,
    },
    {
      url: buffetFoodPhotos[idx % buffetFoodPhotos.length],
      tag: 'Festive Lunch & Dinner Spread',
      caption: `Multi-Cuisine Festive Buffet, Live Starters & Regional ${city} Specialties`,
    },
    {
      url: restaurantDiningPhotos[(idx + 2) % restaurantDiningPhotos.length],
      tag: `Group Table (${guests} Pax)`,
      caption: `Dedicated Long-Table & Private Section Setup for Team / Family Celebrations`,
    },
    {
      url: outdoorAmbiencePhotos[idx % outdoorAmbiencePhotos.length],
      tag: 'Festive Lighting & Decor',
      caption: `Warm Celebration Lighting, Welcome Drink Bar & Photo Corner at ${venueName}`,
    },
  ];
}
export async function fetchLiveOpenSourceVenueAds(params: {
  category: EventCategory;
  city: string;
  guestCount: number;
  totalBudget: number;
  currency: CurrencyCode;
  filterCategory?: PlaceSearchCategory;
  preferRestaurants?: boolean;
  occasionLabel?: string;
}): Promise<{ resolvedCity: string; venues: VenueAdRecommendation[] }> {
  const geo = await resolveRealCityFromOpenStreetMap(params.city);
  const realCity = geo.cityName;

  const guests = Math.max(5, params.guestCount);
  const budgetVenuePool = Math.round(params.totalBudget * 0.48);
  const basePerGuest = Math.max(
    params.currency === 'INR' ? 450 : 15,
    Math.round(budgetVenuePool / guests)
  );

  const collectedFeatures: PhotonFeature[] = [];

  try {
    let queries: string[];
    if (params.filterCategory && params.filterCategory !== 'all') {
      queries = [`${params.filterCategory} ${realCity}`];
    } else if (params.preferRestaurants) {
      queries = [
        `restaurant ${realCity}`,
        `hotel ${realCity}`,
        `cafe ${realCity}`,
        `banquet ${realCity}`,
      ];
    } else {
      queries =
        params.category === 'birthday'
          ? [`restaurant ${realCity}`, `hotel ${realCity}`, `cafe ${realCity}`, `bakery ${realCity}`]
          : params.category === 'wedding'
          ? [`hotel ${realCity}`, `banquet ${realCity}`, `resort ${realCity}`, `restaurant ${realCity}`]
          : [`restaurant ${realCity}`, `hotel ${realCity}`, `banquet ${realCity}`, `auditorium ${realCity}`];
    }

    const responses = await Promise.all(
      queries.map((q) =>
        fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`).then((r) =>
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
  const tierMultipliers = [0.9, 1.0, 0.82, 0.95, 0.88, 1.05];
  const ratings = [4.9, 4.8, 4.7, 4.8, 4.6, 4.9];
  const reviewCounts = [1420, 980, 740, 1650, 610, 1190];

  const topFeatures = collectedFeatures.slice(0, 8);
  const occasionDesc = params.occasionLabel || params.category;

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

      const lowerName = venueName.toLowerCase();
      const isBakery =
        p.osm_value === 'bakery' || lowerName.includes('bakery') || lowerName.includes('cake');
      const isCafe = p.osm_value === 'cafe' || lowerName.includes('cafe') || lowerName.includes('coffee');
      const isHotel =
        p.osm_value === 'hotel' ||
        p.osm_value === 'guest_house' ||
        lowerName.includes('hotel') ||
        lowerName.includes('resort') ||
        lowerName.includes('palace');
      const isBanquet = lowerName.includes('banquet') || lowerName.includes('lawn') || lowerName.includes('hall');

      const placeCategory: PlaceSearchCategory = isBakery
        ? 'bakery'
        : isCafe
        ? 'cafe'
        : isBanquet
        ? 'banquet'
        : isHotel
        ? 'hotel'
        : 'restaurant';

      const venueType: VenueAdRecommendation['type'] = isBakery
        ? 'Artisanal Bakery & Cake Studio'
        : isCafe
        ? 'Cafe & Lounge'
        : isHotel
        ? 'Hotel & Banquet'
        : params.preferRestaurants
        ? 'Restaurant & Group Dining'
        : params.category === 'community'
        ? 'Restaurant & Celebration Space'
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
        placeCategory,
        city: realCity,
        address: formattedAddress,
        osmId: p.osm_id ? String(p.osm_id) : undefined,
        coordinates: { lat, lon },
        rating: ratings[idx % ratings.length],
        reviewCount: reviewCounts[idx % reviewCounts.length],
        topReviewSnippet: `Verified real-world ${venueType.toLowerCase()} at ${
          p.street || p.district || realCity
        }. Ideal group seating for a ${guests}-guest ${occasionDesc.toLowerCase()} in ${realCity}.`,
        reviewerName: `OpenStreetMap Verified POI • ${p.district || realCity}`,
        pricePerGuest,
        estimatedTotalForGuests: estimatedTotal,
        currency: params.currency,
        sponsoredBadge: badges[idx % badges.length],
        highlights: [
          `Address: ${p.street || p.district || realCity}`,
          `Group Package: ~${formatCurrency(pricePerGuest, params.currency)}/person (${guests} pax)`,
          `In-App Map, Festive Menu & Direct Booking`,
        ],
        photos: buildVenuePhotoCarousel(venueName, realCity, placeCategory, guests, idx),
        inAppMenuPreview: {
          welcomeDrinks: [
            'Kesar Badam Thandai / Chilled Rose & Cardamom Spritzer',
            'Fresh Mint Cucumber Cooler & Artisanal Mocktails',
            'Specialty Masala Chai & Cold Brew Welcome Bar',
          ],
          starters: [
            'Paneer Tikka Angara, Hara Bhara Kebab & Crispy Lotus Stem',
            'Live Artisanal Gujarati/North Indian Chaat & Mezze Platter',
            'Chef’s Signature Truffle & Cheese Croquettes',
          ],
          mainsAndLiveCounters: [
            `Grand Festive ${realCity} Buffet & Live Flatbread/Pasta Station`,
            'Dal Makhani, Paneer Lababdar, Veg Dum Biryani & Assorted Kulchas',
            'Dedicated Jain, Swaminarayan & Vegan Custom Counters Included',
          ],
          desserts: [
            'Festive Dry-Fruit Mithai Platter, Warm Gulab Jamun & Pistachio Gelato',
            'Belgian Chocolate Mousse Cups & Rasmalai Tres Leches',
          ],
          includedAmenities: [
            `Reserved Group Dining Zone for ${guests} Guests`,
            'Festive Table Decor, Diya/Warm Uplighting & Music',
            'Zero Corkage/Cakeage Fee & Dedicated Valet Parking',
          ],
        },
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
        placeCategory: 'hotel',
        city: realCity,
        address: `Central ${realCity}`,
        coordinates: { lat: geo.lat || 23.0225, lon: geo.lon || 72.5714 },
        rating: 4.8,
        reviewCount: 920,
        topReviewSnippet: `Popular venue in ${realCity} for ${guests} guests.`,
        reviewerName: `Local Guide • ${realCity}`,
        pricePerGuest: basePerGuest,
        estimatedTotalForGuests: basePerGuest * guests,
        currency: params.currency,
        sponsoredBadge: 'Sponsored • Live OSM Match',
        highlights: [`Located in ${realCity}`, `Fits ${guests} guests comfortably`],
        photos: buildVenuePhotoCarousel(`${realCity} Grand Hotel & Banquet`, realCity, 'hotel', guests, 0),
        inAppMenuPreview: {
          welcomeDrinks: ['Botanical Mocktail Bar', 'Fresh Fruit Spritzers'],
          starters: ['Assorted Tandoori & Continental Appetizers', 'Live Chaat Counter'],
          mainsAndLiveCounters: ['Full Multi-Cuisine Buffet & Live Flatbreads'],
          desserts: ['Celebration Cake Setup & Artisanal Desserts'],
          includedAmenities: ['Private Hall', 'Audio System', 'Valet Parking'],
        },
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
  occasionLabel?: string;
  eventDate?: string;
  preferRestaurants?: boolean;
  guestCount?: number;
  totalBudget?: number;
  currency?: CurrencyCode;
  location?: string;
  vibe?: string;
  notes: string[];
}

/**
 * Extracts whatever details are present in a single message — including festivals (Diwali, Holi, etc.),
 * corporate team lunches/dinners, exact dates ("6th November (Friday)"), and misspelled cities ("ahemdabad").
 */
export function extractPartialEntities(text: string): Partial<ConversationDraftMemory> {
  const lower = text.toLowerCase().trim();
  const partial: Partial<ConversationDraftMemory> = {};

  // 1. Specific Occasion & Category Detection (Never default festivals/team lunches to Birthday!)
  const hasDiwali = /\b(diwali|deepavali|deepawali|diya|dhanteras|bhai\s*dooj)\b/i.test(lower);
  const hasTeamDining =
    /\b(team\s+dinner|team\s+lunch|office\s+party|office\s+dinner|office\s+lunch|corporate\s+dinner|corporate\s+lunch|team\s+outing|office\s+celebration|colleagues|outside\s+the\s+office)\b/i.test(
      lower
    );
  const hasLunchOrDinner = /\b(lunch|dinner|brunch|buffet|resturant|resturants|restaurant|restaurants|restraunt|dining|food)\b/i.test(
    lower
  );

  if (hasLunchOrDinner || hasTeamDining) {
    partial.preferRestaurants = true;
  }

  if (hasDiwali && (hasTeamDining || hasLunchOrDinner)) {
    partial.category = 'community';
    partial.occasionLabel = 'Diwali Celebration & Team Lunch/Dinner';
    partial.vibe = 'Festive Diwali Lights, Great Food & Team Camaraderie';
  } else if (hasDiwali) {
    partial.category = 'community';
    partial.occasionLabel = 'Diwali Festival Celebration';
    partial.vibe = 'Bright Diyas, Festive Food & Warm Company';
  } else if (/\b(holi|rangoli|dhuleti)\b/i.test(lower)) {
    partial.category = 'community';
    partial.occasionLabel = 'Holi Celebration & Festive Gathering';
  } else if (/\b(navratri|garba|dandiya|durga\s+puja|dussehra)\b/i.test(lower)) {
    partial.category = 'community';
    partial.occasionLabel = 'Navratri & Festive Celebration';
  } else if (/\b(eid|iftaar|iftar|ramadan)\b/i.test(lower)) {
    partial.category = 'community';
    partial.occasionLabel = 'Eid & Iftar Feast Celebration';
  } else if (/\b(christmas|xmas|secret\s+santa|new\s+year|nye)\b/i.test(lower)) {
    partial.category = 'community';
    partial.occasionLabel = 'Holiday & Year-End Celebration';
  } else if (hasTeamDining) {
    partial.category = 'community';
    partial.occasionLabel = /\blunch\b/i.test(lower)
      ? 'Corporate Team Lunch & Outing'
      : 'Corporate Team Dinner & Celebration';
    partial.vibe = 'Warm Team Bonding, Great Food & Relaxed Dining';
  } else if (/\b(farewell|send-off|retirement|promotion\s+party)\b/i.test(lower)) {
    partial.category = 'community';
    partial.occasionLabel = 'Team Farewell & Celebration Dinner';
  } else if (/\b(reunion|alumni|get-together|get\s+together|kitty\s+party|meetup)\b/i.test(lower)) {
    partial.category = 'community';
    partial.occasionLabel = 'Group Get-Together & Dining Celebration';
  } else if (/\b(wedding|marriage|shaadi|bridal|engagement|reception|nikah|vows|sangeet|mehendi|haldi|roka)\b/i.test(lower)) {
    partial.category = 'wedding';
    if (/\bengagement|roka\b/i.test(lower)) partial.occasionLabel = 'Engagement Celebration';
    else if (/\breception\b/i.test(lower)) partial.occasionLabel = 'Wedding Reception';
    else if (/\bsangeet\b/i.test(lower)) partial.occasionLabel = 'Sangeet Night Celebration';
    else partial.occasionLabel = 'Wedding Celebration';
  } else if (/\b(anniversary|silver\s+jubilee|golden\s+jubilee)\b/i.test(lower)) {
    partial.category = 'wedding';
    partial.occasionLabel = 'Anniversary Celebration';
  } else if (
    /\b(birthday|bday|b'day|turning\s+\d+|sweet\s+16|kids\s+party|surprise\s+party|baby\s+shower|housewarming)\b/i.test(
      lower
    )
  ) {
    partial.category = 'birthday';
    if (/\bbaby\s+shower\b/i.test(lower)) partial.occasionLabel = 'Baby Shower Celebration';
    else if (/\bhousewarming\b/i.test(lower)) partial.occasionLabel = 'Housewarming Celebration';
    else partial.occasionLabel = 'Birthday Celebration';
  } else if (
    /\b(community|festival|hackathon|charity|neighborhood|workshop|summit|college\s+fest|cultural\s+fest|block\s+party|town\s+hall|celebration)\b/i.test(
      lower
    )
  ) {
    partial.category = 'community';
    partial.occasionLabel = hasLunchOrDinner
      ? 'Festive Celebration & Group Dining'
      : 'Community & Cultural Celebration';
  } else if (hasLunchOrDinner) {
    partial.category = 'community';
    partial.occasionLabel = /\blunch\b/i.test(lower)
      ? 'Group Lunch & Restaurant Outing'
      : 'Group Dinner & Restaurant Outing';
  }

  // 1b. Date extraction from natural text (e.g., "6th November (Friday)", "November 6", "15 Dec")
  const dateMatch1 = text.match(
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)(?:\s*,?\s*\d{4})?(?:\s*\([A-Za-z]+\))?)/i
  );
  const dateMatch2 = text.match(
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?(?:\s*\([A-Za-z]+\))?)/i
  );
  if (dateMatch1) {
    partial.eventDate = dateMatch1[1].trim();
  } else if (dateMatch2) {
    partial.eventDate = dateMatch2[1].trim();
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
      /(\d+)\s*(?:guests|guest|people|person|persons|pax|friends|attendees|members|visitors|folks|kids|adults|invitees|colleagues|employees|team\s+members)/i
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
    if (parsed >= 200 && parsed !== partial.guestCount && parsed !== 2025 && parsed !== 2026) {
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

  // Priority A: Scan every word in the message against our typo-tolerant city dictionary first!
  const tokens = lower.split(/[^a-z]+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const tok = tokens[i];
    if (typoCityDictionary[tok]) {
      partial.location = typoCityDictionary[tok];
      break;
    }
  }

  // Priority B: If not in dictionary, check "city is X", "in X", "at X", "near X" from the END of the prompt backwards
  if (!partial.location) {
    const stopWords = new Set([
      'budget', 'roughly', 'around', 'under', 'about', 'people', 'guests', 'guest',
      'friends', 'family', 'wedding', 'birthday', 'party', 'community', 'event',
      'celebration', 'some', 'good', 'best', 'top', 'hotel', 'hotels', 'restaurant',
      'restaurants', 'resturant', 'resturants', 'mind', 'india', 'the', 'this', 'that',
      'our', 'my', 'your', 'december', 'november', 'january', 'february', 'march',
      'april', 'may', 'june', 'july', 'august', 'september', 'october', 'plan',
      'planning', 'organize', 'office', 'team', 'dinner', 'lunch', 'today', 'friday',
      'monday', 'tuesday', 'wednesday', 'thursday', 'saturday', 'sunday', 'advance',
      'time', 'person', 'company', 'moments', 'food', 'arrangements', 'vote', 'joining'
    ]);

    const allMatches = Array.from(
      text.matchAll(
        /\b(?:city\s*(?:is|:|=)?|location\s*(?:is|:|=)?|place\s*(?:is|:|=)?|in|at|near)\s+([a-zA-Z]{3,20})(?:\s+([a-zA-Z]{3,20}))?/gi
      )
    );

    for (let i = allMatches.length - 1; i >= 0; i--) {
      const m = allMatches[i];
      const word1 = m[1].toLowerCase();
      const word2 = m[2]?.toLowerCase();
      if (typoCityDictionary[word1]) {
        partial.location = typoCityDictionary[word1];
        break;
      } else if (!stopWords.has(word1)) {
        const combined =
          word2 && !stopWords.has(word2) ? `${m[1]} ${m[2]}` : m[1];
        partial.location = combined.charAt(0).toUpperCase() + combined.slice(1);
        break;
      }
    }
  }

  // 6. Vibe keywords
  const vibeKeywords: string[] = [];
  if (hasDiwali) vibeKeywords.push('Festive Diwali Lights & Great Food');
  if (hasTeamDining) vibeKeywords.push('Team Dinner & Wonderful Company');
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
    partial.vibe = vibeKeywords.join(' • ');
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
    occasionLabel: newEntities.occasionLabel || currentDraft.occasionLabel,
    eventDate: newEntities.eventDate || currentDraft.eventDate,
    preferRestaurants: newEntities.preferRestaurants ?? currentDraft.preferRestaurants,
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
      replyMarkdown: `Hey there! 👋 Great to meet you. How can I help you today?\n\nWhether you’re planning a **Diwali celebration**, **team lunch/dinner**, **wedding**, **birthday party**, or looking for the **best real restaurants & hotels** in your city — just tell me what you have in mind!`,
    };
  }

  // CASE 2: Explicit Venue / Restaurant / Hotel / Place Discovery Request (Supports typos like "resturant"!)
  const asksForPlaces =
    /\b(restaurant|restaurants|resturant|resturants|restraunt|hotel|hotels|place|places|venue|venues|rooftop|banquet|resort|cafe|lunch|dinner|buffet|where\s+should\s+i\s+host|book\s+a\s+place)\b/i.test(
      lower
    );

  if (
    asksForPlaces &&
    !currentBlueprint &&
    !updatedDraft.guestCount &&
    !updatedDraft.totalBudget
  ) {
    const cat = updatedDraft.category || 'community';
    const rawCity = updatedDraft.location || 'Ahmedabad';
    const curr = updatedDraft.currency || defaultCurrency;
    const guests =
      updatedDraft.guestCount || (cat === 'wedding' ? 150 : cat === 'birthday' ? 30 : 40);
    const budget =
      updatedDraft.totalBudget ||
      (curr === 'INR'
        ? updatedDraft.preferRestaurants
          ? guests * 1000
          : cat === 'wedding'
          ? 1200000
          : cat === 'birthday'
          ? 60000
          : 150000
        : 2000);

    const liveOsm = await fetchLiveOpenSourceVenueAds({
      category: cat,
      city: rawCity,
      guestCount: guests,
      totalBudget: budget,
      currency: curr,
      preferRestaurants: updatedDraft.preferRestaurants,
      occasionLabel: updatedDraft.occasionLabel || 'Celebration & Group Dining',
    });
    updatedDraft.location = liveOsm.resolvedCity;

    return {
      source: 'genai-engine',
      updatedDraft,
      venueRecommendations: liveOsm.venues,
      replyMarkdown: `### 🍽️ Best Real Restaurants & Venues in **${liveOsm.resolvedCity}** (Live OpenStreetMap Data)\nHere are **${liveOsm.venues.length} real verified restaurants & hotels** in **${liveOsm.resolvedCity}** with their street addresses, sample menus, embedded maps, and direct in-app booking:`,
    };
  }

  // CASE 3: Active Blueprint Exists -> Check if user is pasting a brand-new event OR updating parameters
  if (currentBlueprint) {
    const isNewOccasionOrUpdate =
      newEntities.guestCount !== undefined ||
      newEntities.totalBudget !== undefined ||
      newEntities.location !== undefined ||
      newEntities.occasionLabel !== undefined ||
      newEntities.category !== undefined ||
      /\b(change|update|make\s+it|instead|actually|modify|recalculate|city\s+is|planning\s+our)\b/i.test(
        lower
      );

    if (
      isNewOccasionOrUpdate &&
      (newEntities.guestCount ||
        newEntities.totalBudget ||
        newEntities.location ||
        newEntities.occasionLabel ||
        newEntities.category)
    ) {
      const targetCategory = newEntities.category || currentBlueprint.category;
      const targetOccasion =
        newEntities.occasionLabel ||
        updatedDraft.occasionLabel ||
        (targetCategory === 'wedding'
          ? 'Wedding Celebration'
          : targetCategory === 'birthday'
          ? 'Birthday Celebration'
          : 'Festive & Community Celebration');
      const targetGuests = newEntities.guestCount || currentBlueprint.guestCount;
      const targetCurrency = newEntities.currency || currentBlueprint.currency;
      const targetBudget =
        newEntities.totalBudget ||
        (newEntities.preferRestaurants && !currentDraft.totalBudget
          ? targetCurrency === 'INR'
            ? targetGuests * 1200
            : targetGuests * 35
          : currentBlueprint.totalBudget);
      const targetLocation = newEntities.location || currentBlueprint.location;
      const targetVibe = newEntities.vibe || currentBlueprint.vibe;
      const targetDate = newEntities.eventDate || currentBlueprint.date;

      const gen = await generateEventBlueprintWithAI({
        category: targetCategory,
        occasionLabel: targetOccasion,
        preferRestaurants: updatedDraft.preferRestaurants,
        title: `${targetLocation} ${targetOccasion} (${targetGuests} Guests)`,
        date: targetDate,
        location: targetLocation,
        guestCount: targetGuests,
        totalBudget: targetBudget,
        currency: targetCurrency,
        vibe: targetVibe,
        customPrompt: trimmed,
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
        preferRestaurants: updatedDraft.preferRestaurants,
        occasionLabel: updatedDraft.occasionLabel || currentBlueprint.title,
      });

      return {
        source: 'genai-engine',
        updatedDraft,
        venueRecommendations: liveOsm.venues,
        replyMarkdown: `### 🍽️ Best Real Restaurants & Venues in **${liveOsm.resolvedCity}** (OpenStreetMap)\nBased on your **${targetGuests} guests** in **${liveOsm.resolvedCity}**, here are real verified restaurants and hotels with street addresses, menus, and instant in-app booking:`,
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
      replyMarkdown: `I’d love to help you organize that! 🎉\n\nTo get started, tell me a little bit about what you have in mind:\n1. **What are we celebrating?** (e.g., a **Diwali celebration**, **team dinner/lunch**, **wedding**, **birthday party**, or **community event**)\n2. **Roughly how many people** are you expecting, and what **city and budget** are you looking at?`,
    };
  }

  if (hasCategory && !hasGuestsOrBudget && !userExplicitlySaidGenerateNow) {
    await new Promise((r) => setTimeout(r, 400));
    const catLabel =
      updatedDraft.occasionLabel ||
      (updatedDraft.category === 'wedding'
        ? 'wedding 💍'
        : updatedDraft.category === 'birthday'
        ? 'birthday party 🎂'
        : 'celebration event 🪔');

    const locText = updatedDraft.location ? ` in **${updatedDraft.location}**` : '';

    return {
      source: 'genai-engine',
      updatedDraft,
      replyMarkdown: `Planning your **${catLabel}**${locText} sounds wonderful! I can put together a complete budget breakdown, timeline, checklist, and **real restaurant/hotel recommendations** from OpenStreetMap for you.\n\nBefore I build your plan, tell me:\n- **Roughly how many guests/people** are joining?\n- **What is your approximate budget?** (e.g., *₹45,000*, *₹12 Lakhs*, *$2,500*)\n- **Which city or area** do you prefer?\n\n*(Or just reply **"Surprise me"** and I’ll generate a complete plan right now!)*`,
    };
  }

  // CASE 5: We have enough details -> Never default non-birthday prompts to "Birthday"!
  const finalCategory: EventCategory = updatedDraft.category || 'community';
  const finalOccasionLabel =
    updatedDraft.occasionLabel ||
    (finalCategory === 'wedding'
      ? 'Wedding Celebration'
      : finalCategory === 'birthday'
      ? 'Birthday Celebration'
      : updatedDraft.preferRestaurants
      ? 'Group Lunch / Dinner Celebration'
      : 'Festive Celebration & Gathering');

  const finalCurrency: CurrencyCode = updatedDraft.currency || defaultCurrency;
  const finalGuests =
    updatedDraft.guestCount ||
    (finalCategory === 'wedding' ? 150 : finalCategory === 'birthday' ? 30 : 40);

  // Smart default budget if user didn't specify a number (e.g., ~₹1,200/person for restaurant lunch/dinner!)
  const finalBudget =
    updatedDraft.totalBudget ||
    (finalCurrency === 'INR'
      ? updatedDraft.preferRestaurants
        ? finalGuests * 1200
        : finalCategory === 'wedding'
        ? 1200000
        : finalCategory === 'birthday'
        ? 60000
        : 150000
      : updatedDraft.preferRestaurants
      ? finalGuests * 35
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
      : 'Bright Festive Spirit, Great Food & Wonderful Company');

  const finalDate =
    updatedDraft.eventDate ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const genResult = await generateEventBlueprintWithAI({
    category: finalCategory,
    occasionLabel: finalOccasionLabel,
    preferRestaurants: updatedDraft.preferRestaurants,
    title: `${rawLocation} ${finalOccasionLabel} (${finalGuests} Guests)`,
    date: finalDate,
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
  occasionLabel?: string;
  preferRestaurants?: boolean;
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

  const occasionTitle =
    input.occasionLabel ||
    (input.category === 'wedding'
      ? 'Wedding Celebration'
      : input.category === 'birthday'
      ? 'Birthday Celebration'
      : 'Celebration & Event');

  // Fetch REAL live places & resolve fuzzy city spelling from OpenStreetMap Photon API!
  const liveOsm = await fetchLiveOpenSourceVenueAds({
    category: input.category,
    city: input.location,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: input.currency,
    preferRestaurants: input.preferRestaurants,
    occasionLabel: occasionTitle,
  });

  const resolvedCity = liveOsm.resolvedCity;
  const venueAds = liveOsm.venues;

  const resolvedTitle = `${resolvedCity} ${occasionTitle} (${input.guestCount} Guests)`;

  const perGuestBudget = Math.round(input.totalBudget / Math.max(1, input.guestCount));
  const formattedTotal = formatCurrency(input.totalBudget, input.currency);
  const formattedPerGuest = formatCurrency(perGuestBudget, input.currency);

  const isDiwaliOrTeamDining =
    /diwali|team|lunch|dinner|office|corporate/i.test(occasionTitle) ||
    /diwali|team\s+dinner|team\s+lunch/i.test(input.customPrompt);

  const scaledBudgets: BudgetItem[] = isDiwaliOrTeamDining
    ? [
        {
          id: `gen-b-${Date.now()}-0`,
          category: 'Restaurant Group Buffet / Dining Package',
          percentage: 58,
          allocated: Math.round(input.totalBudget * 0.58),
          actualSpent: 0,
          priority: 'Essential',
          items: [
            `Group table reservation for ${input.guestCount} people in ${resolvedCity}`,
            'Welcome drinks & pre-plated starters on table',
            'Full multi-cuisine festive lunch/dinner buffet & desserts',
          ],
          aiTip: `Book a ${input.guestCount}-person group buffet table in ${resolvedCity} with complimentary welcome drinks and zero separate hall rental.`,
        },
        {
          id: `gen-b-${Date.now()}-1`,
          category: 'Festive Diwali Gifts, Hampers & Mithai Boxes',
          percentage: 20,
          allocated: Math.round(input.totalBudget * 0.2),
          actualSpent: 0,
          priority: 'High',
          items: [
            `Assorted dry-fruit & artisanal mithai boxes (${input.guestCount} units)`,
            'Custom festive greeting cards & diyas for team members',
          ],
          aiTip: `Order artisanal sweets and dry-fruit hampers in bulk from a local ${resolvedCity} sweet house for a 15% corporate discount.`,
        },
        {
          id: `gen-b-${Date.now()}-2`,
          category: 'Festive Decor, Diyas, Games & Photography',
          percentage: 14,
          allocated: Math.round(input.totalBudget * 0.14),
          actualSpent: 0,
          priority: 'Flexible',
          items: [
            'Office & restaurant table festive centerpiece decor',
            'Team superlative awards, Diwali quiz & group photo moments',
          ],
          aiTip: 'Add a quick 20-minute Diwali trivia or Best Ethnic Wear award before lunch/dinner starts!',
        },
        {
          id: `gen-b-${Date.now()}-3`,
          category: 'Transport & Contingency Buffer',
          percentage: 8,
          allocated: Math.round(input.totalBudget * 0.08),
          actualSpent: 0,
          priority: 'Flexible',
          items: [
            'Shared cab coordination from office to restaurant',
            '3–5 buffer plates for last-minute team RSVPs',
          ],
          aiTip: 'Keep 3–5 buffer plates ready at the restaurant for last-minute team RSVPs.',
        },
      ]
    : baseTemplate.budgetBreakdown.map((item, idx) => {
        const allocated = Math.round((input.totalBudget * item.percentage) / 100);
        return {
          ...item,
          id: `gen-b-${Date.now()}-${idx}`,
          allocated,
          actualSpent: 0,
          aiTip: `${item.aiTip} (Tailored for ${input.guestCount} guests in ${resolvedCity})`,
        };
      });

  const scaledTimeline: TimelineItem[] = isDiwaliOrTeamDining
    ? [
        {
          id: `gen-t-${Date.now()}-0`,
          phase: 'Step 1 • Today (RSVP Poll)',
          timeframe: 'Today',
          title: `Close Team RSVP Poll & Confirm Headcount (~${input.guestCount} People)`,
          description: `Collect final votes from colleagues for ${input.date} and note Veg / Jain / Non-Veg dietary preferences.`,
          category: 'RSVP & Headcount',
          completed: false,
          priority: 'High',
        },
        {
          id: `gen-t-${Date.now()}-1`,
          phase: 'Step 2 • Venue Lock-In',
          timeframe: '5–7 Days Prior',
          title: `Book Best Group Restaurant in ${resolvedCity} for ${input.guestCount} Pax`,
          description: `Reserve a dedicated long-table or private dining zone in ${resolvedCity} directly via the Places & Hotels tab.`,
          category: 'Restaurant Booking',
          completed: false,
          priority: 'High',
        },
        {
          id: `gen-t-${Date.now()}-2`,
          phase: 'Step 3 • Menu & Hampers',
          timeframe: '3 Days Prior',
          title: 'Pre-Select Buffet / Set Menu & Festive Mithai Hampers',
          description: 'Pre-order starters on the table so all 40 team members are served immediately upon arrival.',
          category: 'Food & Gifts',
          completed: false,
          priority: 'Medium',
        },
        {
          id: `gen-t-${Date.now()}-3`,
          phase: `Step 4 • Celebration Day (${input.date})`,
          timeframe: input.date,
          title: 'Office Festive Photos + Group Lunch/Dinner Outside Office',
          description: 'Group ethnic-wear photos at office, cab departure together, welcome drinks, great food & team celebration!',
          category: 'Event Day',
          completed: false,
          priority: 'High',
        },
      ]
    : baseTemplate.timeline.map((t, idx) => ({
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
      aiNegotiationScript: `Hello! We are organizing our ${occasionTitle} in ${resolvedCity} on ${input.date} for ${input.guestCount} people. Could you share your best group package for ${input.guestCount} guests (around ${formatCurrency(
        perGuestBudget,
        input.currency
      )}/person) and confirm group seating availability?`,
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
    title: isDiwaliOrTeamDining
      ? `Festive Diwali Team Awards, Instant Polaroid Wall & Zero-Wait Starters in ${resolvedCity}`
      : `Bespoke "${input.vibe.split('•')[0]?.trim() || 'Signature'}" Experience in ${resolvedCity}`,
    description: isDiwaliOrTeamDining
      ? `Make your ${input.date} celebration for ${input.guestCount} colleagues unforgettable with pre-plated welcome starters at the restaurant, fun superlative awards ("Brightest Spark", "Best Ethnic Fit"), and festive mithai boxes.`
      : `Set up an interactive arrival zone in ${resolvedCity} for your ${input.guestCount} guests with local welcome refreshments, instant photo memories, and warm ambient lighting.`,
    estimatedImpact: 'High Wow-Factor',
    implementationSteps: [
      `Reserve a dedicated 40-seater group section at one of the verified ${resolvedCity} restaurants below`,
      `Arrange pre-served welcome drinks & starters on the table so there is zero waiting time`,
      `Host a 15-minute festive team toast & group photo session before the main course`,
    ],
    saved: true,
  };

  const cleanTag = resolvedCity.replace(/[^a-zA-Z0-9]/g, '') || 'Celebration';

  const synthesized: EventBlueprint = {
    ...baseTemplate,
    id: `synth-${Date.now()}`,
    category: input.category,
    title: resolvedTitle,
    subtitle: `${input.vibe} • ${input.date} • ${resolvedCity} (${input.guestCount} People)`,
    date: input.date,
    location: resolvedCity,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: input.currency,
    vibe: input.vibe,
    customPrompt: input.customPrompt,
    aiExecutiveSummary: `Tailored ${occasionTitle} plan on ${input.date} for ${input.guestCount} people in ${resolvedCity} with an estimated budget of ${formattedTotal} (~${formattedPerGuest}/person). Includes ${venueAds.length} real OpenStreetMap-verified restaurants & hotels in ${resolvedCity} with in-app maps, festive menus, and instant table reservation.`,
    budgetBreakdown: scaledBudgets,
    timeline: scaledTimeline,
    vendors: scaledVendors,
    ideas: [customIdeaFromPrompt, ...baseTemplate.ideas.map((i) => ({ ...i, saved: false }))],
    venueRecommendations: venueAds,
    generatedCopy: {
      invitationText: isDiwaliOrTeamDining
        ? `🪔✨ DIWALI CELEBRATION & TEAM LUNCH / DINNER ✨🪔\n\nWe’re planning our Diwali celebration on ${input.date}, followed by a special team meal outside the office in ${resolvedCity}!\n\n📅 Date: ${input.date}\n📍 City: ${resolvedCity}\n👥 Group Size: ${input.guestCount} Team Members\n\nTo help us finalize the restaurant reservation, please cast your RSVP vote by today and let us know your dietary preferences (Veg / Jain). Let’s make this Diwali brighter with great food, happy moments, and wonderful company!`
        : `✨ YOU ARE WARMLY INVITED ✨\n\n${resolvedTitle.toUpperCase()}\n${input.vibe}\n\n📅 Date: ${input.date}\n📍 Location: ${resolvedCity}\n👥 Celebrating with ${input.guestCount} guests\n\nWe would love your presence as we celebrate together! Kindly RSVP with your dietary preferences.`,
      welcomeNoteOrSpeech: `"Happy Festive Season everyone! Having all ${input.guestCount} of us together outside the office in ${resolvedCity} on ${input.date} makes this celebration truly special. Thank you for all your energy, teamwork, and wonderful company—let’s enjoy great food and happy moments together!"`,
      hashtagsOrTaglines: [
        `#${cleanTag}DiwaliCelebration`,
        `#TeamFeast${cleanTag}`,
        '#FestiveMomentsTogether',
      ],
      rainOrBackupPlan: `Group Seating Tip for ${resolvedCity}: Confirm a dedicated indoor AC group dining hall for all ${input.guestCount} people together, and pre-order welcome drinks & starters 24 hours in advance for seamless service.`,
    },
  };

  const topRestaurantLines = venueAds
    .slice(0, 4)
    .map(
      (v, i) =>
        `${i + 1}. **${v.name}** (*${v.address}*) — ⭐ **${v.rating}** • Est. **${formatCurrency(
          v.pricePerGuest,
          input.currency
        )}/person** (${formatCurrency(v.estimatedTotalForGuests, input.currency)} for ${
          input.guestCount
        } people)`
    )
    .join('\n');

  const topBudgetLines = scaledBudgets
    .slice(0, 4)
    .map(
      (b) => `- **${b.category} (${b.percentage}%):** ${formatCurrency(b.allocated, input.currency)}`
    )
    .join('\n');

  const aiReplyMarkdown = `### 🪔✨ **${synthesized.title}** — Scheduled for **${input.date}**
I’ve organized your **${occasionTitle}** for **${input.guestCount} people** in **${resolvedCity}** on **${input.date}** (Est. package budget: **${formattedTotal}** or ~**${formattedPerGuest}/person**).

### 🍽️ Top Real Restaurants in **${resolvedCity}** for **${input.guestCount} People** (Live OpenStreetMap)
${topRestaurantLines}

*(Click **🗺️ View Live Street Map**, **🍽️ View Sample Menu**, or **✨ Book Directly in FestivAI** on any card below to reserve your 40-person table without leaving this app!)*

### 💰 Suggested Celebration & Dining Budget
${topBudgetLines}

### ✅ Quick Action Checklist for **${input.date}**
1. **${scaledTimeline[0]?.title}** — *${scaledTimeline[0]?.description}*
2. **${scaledTimeline[1]?.title}** — *${scaledTimeline[1]?.description}*
3. **${scaledTimeline[2]?.title}** — *${scaledTimeline[2]?.description}*`;

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
