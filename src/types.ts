export type EventCategory = 'wedding' | 'birthday' | 'community';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface BudgetItem {
  id: string;
  category: string;
  percentage: number;
  allocated: number;
  actualSpent: number;
  aiTip: string;
  priority: 'Essential' | 'High' | 'Flexible';
  items: string[];
}

export interface TimelineItem {
  id: string;
  phase: string;
  timeframe: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  priority: 'Critical' | 'High' | 'Medium';
  isDayOf?: boolean;
}

export interface VendorChecklistItem {
  id: string;
  category: string;
  role: string;
  status: 'Not Started' | 'Shortlisted' | 'Negotiating' | 'Booked';
  estimatedCost: number;
  leadTime: string;
  mustAskQuestions: string[];
  aiNegotiationScript: string;
  checklistTasks: { id: string; label: string; done: boolean }[];
}

export interface PersonalizedIdea {
  id: string;
  category: 'Theme & Decor' | 'Culinary & Drinks' | 'Guest Experience' | 'Keepsakes & Favors' | 'Sustainability & Impact';
  title: string;
  description: string;
  estimatedImpact: 'High Wow-Factor' | 'Budget-Friendly Gem' | 'Crowd Favorite' | 'Eco-Conscious';
  colorPalette?: { name: string; hex: string }[];
  implementationSteps: string[];
  saved?: boolean;
}

export interface GeneratedCopy {
  invitationText: string;
  welcomeNoteOrSpeech: string;
  hashtagsOrTaglines: string[];
  rainOrBackupPlan: string;
}

export interface EventBlueprint {
  id: string;
  category: EventCategory;
  title: string;
  subtitle: string;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: CurrencyCode;
  vibe: string;
  customPrompt: string;
  aiExecutiveSummary: string;
  themePalette: { name: string; hex: string }[];
  budgetBreakdown: BudgetItem[];
  timeline: TimelineItem[];
  vendors: VendorChecklistItem[];
  ideas: PersonalizedIdea[];
  generatedCopy: GeneratedCopy;
  venueRecommendations?: VenueAdRecommendation[];
}

export interface VenueAdRecommendation {
  id: string;
  name: string;
  type: 'Hotel & Banquet' | 'Rooftop Restaurant & Lounge' | 'Heritage Resort & Lawn' | 'Convention & Community Space' | 'Restaurant & Banquet';
  city: string;
  address?: string;
  osmId?: string;
  coordinates?: { lat: number; lon: number };
  rating: number;
  reviewCount: number;
  topReviewSnippet: string;
  reviewerName: string;
  pricePerGuest: number;
  estimatedTotalForGuests: number;
  currency: CurrencyCode;
  sponsoredBadge: 'Sponsored • Live OSM Match' | 'Featured Partner • Real Venue' | 'Top Rated Local Pick';
  highlights: string[];
  bookingUrl: string;
  mapsUrl: string;
  osmUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionTaken?: string;
  venueRecommendations?: VenueAdRecommendation[];
}
