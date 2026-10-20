import { EventBlueprint, EventCategory } from '../types';

export const PRESET_BLUEPRINTS: Record<EventCategory, EventBlueprint> = {
  wedding: {
    id: 'preset-wedding-1',
    category: 'wedding',
    title: 'Aarav & Meera’s Twilight Palace Garden Wedding',
    subtitle: 'Romantic Heritage Fusion with Sustainable Floral Artistry',
    date: '2026-12-12',
    location: 'Udaipur / Heritage Courtyard Lawn',
    guestCount: 220,
    totalBudget: 1800000,
    currency: 'INR',
    vibe: 'Royal Romantic, Candlelit Marigold & Rose Quartz, Intimate Luxury',
    customPrompt: 'A 220-guest heritage courtyard wedding blending traditional ceremonies with a modern acoustic reception under fairy lights, live artisanal chaat & global grazing tables, eco-friendly floral decor.',
    aiExecutiveSummary: 'Designed for 220 guests with a ₹18,00,000 budget, this blueprint prioritizes high-impact visual moments (candlelit sunken courtyard + locally sourced marigold & blush rose installations) while keeping catering efficiency high through interactive live stations rather than excessive plated courses. 8% contingency is locked in for weather and last-minute guest additions.',
    themePalette: [
      { name: 'Rose Quartz', hex: '#DB2777' },
      { name: 'Blush Silk', hex: '#FBCFE8' },
      { name: 'Antique Marigold', hex: '#CA8A04' },
      { name: 'Royal Plum', hex: '#831843' },
      { name: 'Ivory Parchment', hex: '#FDF2F8' },
    ],
    budgetBreakdown: [
      {
        id: 'b-wed-1',
        category: 'Venue & Heritage Courtyard Rental',
        percentage: 28,
        allocated: 504000,
        actualSpent: 485000,
        priority: 'Essential',
        aiTip: 'Book a twilight-to-midnight slot with bundled bridal suite access and generator backup included in the base contract.',
        items: ['Main Courtyard & Lawn Hire', 'Bridal & Groom Green Rooms', 'Power Backup & Valet Parking']
      },
      {
        id: 'b-wed-2',
        category: 'Gourmet Catering & Artisanal Bar',
        percentage: 30,
        allocated: 540000,
        actualSpent: 510000,
        priority: 'Essential',
        aiTip: 'Replace 30% of static buffet trays with 4 theatrical live stations (Artisanal Chaat, Wood-fired Flatbreads, Jalebi Rabri Bar, Botanical Mocktails) to cut food waste by 22%.',
        items: ['Welcome Botanical Infusions', '4 Live Culinary Theater Stations', 'Royal Sit-Down Family Dinner', 'Midnight Masala Chai & Espresso Cart']
      },
      {
        id: 'b-wed-3',
        category: 'Sustainable Floral & Lighting Decor',
        percentage: 16,
        allocated: 288000,
        actualSpent: 295000,
        priority: 'High',
        aiTip: 'Use 70% warm Edison canopy lighting, brass urlis, and potted orchids/marigolds that can be donated or gifted after the ceremony.',
        items: ['Floating Mandap Canopy', 'Warm Fairy-Light Tunnel Entrance', 'Brass Candlelit Centerpieces', 'Eco-Petal Confetti Cones']
      },
      {
        id: 'b-wed-4',
        category: 'Cinematic Photo & Documentary Film',
        percentage: 10,
        allocated: 180000,
        actualSpent: 175000,
        priority: 'High',
        aiTip: 'Request a 2-shooter candid team + 1 drone operator and a 60-second same-day edit reel for the reception toast.',
        items: ['Candid Photography Team', 'Drone Aerial Venue Shots', 'Same-Day Reception Highlight Reel', 'Fine-Art Heirloom Album']
      },
      {
        id: 'b-wed-5',
        category: 'Live Acoustic Fusion & DJ Soundscape',
        percentage: 8,
        allocated: 144000,
        actualSpent: 135000,
        priority: 'Flexible',
        aiTip: 'Hire a Sitar + Acoustic Guitar duo for Pheras & Cocktail Hour, transitioning into a single high-energy DJ for the after-party.',
        items: ['Acoustic Sitar-Guitar Duo', 'Reception DJ & Line-Array Audio', 'Wireless Lapel Mics for Vows & Speeches']
      },
      {
        id: 'b-wed-6',
        category: 'Guest Hospitality, Favors & Contingency',
        percentage: 8,
        allocated: 144000,
        actualSpent: 92000,
        priority: 'Flexible',
        aiTip: 'Keep at least ₹60,000 unallocated until 7 days prior for last-minute transport, weather canopies, and extra guest plates.',
        items: ['Handcrafted Brass Tea Tins & Honey Favors', 'Digital QR Itinerary & WhatsApp Concierge', 'Emergency Weather & Buffer Reserve']
      }
    ],
    timeline: [
      {
        id: 't-wed-1',
        phase: '6 Months Out',
        timeframe: 'T - 180 Days',
        title: 'Lock Heritage Venue & Core Date',
        description: 'Finalize courtyard contract, verify noise curfew (10:30 PM outdoor / indoor transition), and pay 25% refundable deposit.',
        category: 'Venue',
        completed: true,
        priority: 'Critical'
      },
      {
        id: 't-wed-2',
        phase: '4 Months Out',
        timeframe: 'T - 120 Days',
        title: 'Book Candid Photo Team & Culinary Caterer',
        description: 'Conduct tasting session for regional fusion menu and lock sunset golden-hour portrait schedule with lead photographer.',
        category: 'Vendors',
        completed: true,
        priority: 'Critical'
      },
      {
        id: 't-wed-3',
        phase: '2 Months Out',
        timeframe: 'T - 60 Days',
        title: 'Dispatch Interactive Digital Invites & RSVP Tracker',
        description: 'Send personalized WhatsApp & web invitations collecting dietary preferences, song requests, and arrival times.',
        category: 'Guests',
        completed: true,
        priority: 'High'
      },
      {
        id: 't-wed-4',
        phase: '2 Weeks Out',
        timeframe: 'T - 14 Days',
        title: 'Finalize Floor Plan, Mandap Sightlines & Headcount',
        description: 'Lock guaranteed guest count (220) with caterer and share 3D seating chart with decor and audio engineers.',
        category: 'Logistics',
        completed: false,
        priority: 'Critical'
      },
      {
        id: 't-wed-5',
        phase: 'Day-Of: 04:00 PM',
        timeframe: '16:00 HRS',
        title: 'Baraat Welcome & Botanical Sherbet Reception',
        description: 'Guests arrive through marigold-draped archway; dhol players & chilled rose-cardamom spritzers served.',
        category: 'Day-Of Run of Show',
        completed: false,
        priority: 'High',
        isDayOf: true
      },
      {
        id: 't-wed-6',
        phase: 'Day-Of: 05:15 PM',
        timeframe: '17:15 HRS',
        title: 'Sunset Varmala & Courtyard Pheras',
        description: 'Golden-hour ceremony accompanied by live sitar & flute harmonies; bilingual ceremony booklet distributed on seats.',
        category: 'Day-Of Run of Show',
        completed: false,
        priority: 'Critical',
        isDayOf: true
      },
      {
        id: 't-wed-7',
        phase: 'Day-Of: 07:30 PM',
        timeframe: '19:30 HRS',
        title: 'Candlelit Toasts, Same-Day Film Screening & Dinner',
        description: 'Couple grand entry under sparkler fountain, 3-minute family toast, screening of morning highlights, and dinner service.',
        category: 'Day-Of Run of Show',
        completed: false,
        priority: 'High',
        isDayOf: true
      }
    ],
    vendors: [
      {
        id: 'v-wed-1',
        category: 'Venue & Hospitality',
        role: 'Heritage Courtyard & Banquet Estate',
        status: 'Booked',
        estimatedCost: 504000,
        leadTime: '6–8 Months Prior',
        mustAskQuestions: [
          'Is there an exclusive backup indoor hall included if unexpected rain occurs?',
          'Are outside decorators and specialty live food carts permitted without royalty fees?',
          'What is the exact outdoor amplified music cutoff time?'
        ],
        aiNegotiationScript: 'Hello [Venue Manager], we love the heritage courtyard aesthetic for our December 12 celebration (220 guests). Since we are booking both the afternoon ceremony and evening reception slots, could you waive the external decorator royalty fee and include 4 complimentary bridal family rooms in our package?',
        checklistTasks: [
          { id: 'vt-1', label: 'Verify generator backup & fuel inclusion', done: true },
          { id: 'vt-2', label: 'Confirm valet parking for 80+ cars', done: true },
          { id: 'vt-3', label: 'Sign final rain-contingency addendum', done: false }
        ]
      },
      {
        id: 'v-wed-2',
        category: 'Catering & Mixology',
        role: 'Bespoke Culinary & Live Station Caterer',
        status: 'Shortlisted',
        estimatedCost: 540000,
        leadTime: '3–5 Months Prior',
        mustAskQuestions: [
          'What is the staff-to-guest ratio for live stations to avoid queues longer than 3 minutes?',
          'How do you handle Jain, vegan, and nut-free dietary separation?',
          'What is the per-plate rate for unexpected guests beyond the 220 guarantee?'
        ],
        aiNegotiationScript: 'Hi [Caterer Name], your live Artisanal Chaat and Regional Tapas menu stood out at our tasting! We are ready to lock in 220 guaranteed plates this week if we can cap the per-plate price at ₹2,350 inclusive of the welcome botanical mocktail bar and complimentary crew meals for 15 vendors.',
        checklistTasks: [
          { id: 'vt-4', label: 'Complete full menu tasting & spice-level notes', done: true },
          { id: 'vt-5', label: 'Lock 15 vendor/crew meal boxes at 50% rate', done: false },
          { id: 'vt-6', label: 'Arrange NGO tie-up for surplus food donation', done: false }
        ]
      },
      {
        id: 'v-wed-3',
        category: 'Floral & Production',
        role: 'Sustainable Event Scenography & Lighting',
        status: 'Negotiating',
        estimatedCost: 288000,
        leadTime: '2–4 Months Prior',
        mustAskQuestions: [
          'Can we reuse ceremony floral pillars as stage framing for the evening reception?',
          'Are all floral installations foam-free and biodegradable?',
          'Does the quote include warm 2700K architectural uplighting?'
        ],
        aiNegotiationScript: 'Hi [Decorator Name], to maximize visual impact within our ₹2.85L budget, we’d like to design modular floral arches that transition from the sunset Mandap to the evening sweetheart stage during cocktail hour. Could you revise the proposal with this dual-use layout?',
        checklistTasks: [
          { id: 'vt-7', label: 'Approve 3D moodboard & lighting swatch', done: true },
          { id: 'vt-8', label: 'Confirm 30-minute turnaround plan for ceremony-to-reception flip', done: false }
        ]
      },
      {
        id: 'v-wed-4',
        category: 'Photography & Film',
        role: 'Documentary Wedding Collective',
        status: 'Booked',
        estimatedCost: 180000,
        leadTime: '4–6 Months Prior',
        mustAskQuestions: [
          'How many edited preview photos will we receive within 48 hours of the wedding?',
          'Do you carry dual-slot backup cameras and on-site SSD redundancy?',
          'Are drone permissions handled by your team?'
        ],
        aiNegotiationScript: 'Hello [Studio Name], we adore your natural storytelling style! If we pay 50% upon signing today, could you include a 20-photo next-morning social preview pack and raw archival footage on our provided SSD at no extra charge?',
        checklistTasks: [
          { id: 'vt-9', label: 'Share VIP family group photo shot-list', done: false },
          { id: 'vt-10', label: 'Schedule 25-min golden hour couple portrait window', done: true }
        ]
      }
    ],
    ideas: [
      {
        id: 'idea-wed-1',
        category: 'Theme & Decor',
        title: 'Modular "Twilight to Starlight" Repurposed Floral Architecture',
        description: 'Design floating brass rings and woven marigold-rose tapestries for the afternoon Mandap that unclip in 12 minutes to become the dramatic backdrop behind the evening acoustic stage.',
        estimatedImpact: 'High Wow-Factor',
        colorPalette: [
          { name: 'Marigold Gold', hex: '#EAB308' },
          { name: 'Rose Quartz', hex: '#DB2777' },
          { name: 'Midnight Berry', hex: '#831843' }
        ],
        implementationSteps: [
          'Use lightweight interlocking brass frames with quick-release hooks',
          'Assign 4 dedicated decor crew members during the 45-min cocktail transition',
          'Add warm dimmable fairy lights pre-wired inside the floral garlands'
        ],
        saved: true
      },
      {
        id: 'idea-wed-2',
        category: 'Guest Experience',
        title: 'Audio Guestbook Vintage Rotary Phone & Polaroid Wall',
        description: 'Instead of a paper sign-in book, place a restored 1970s brass rotary phone where guests pick up the receiver after a tone to record heartfelt voice messages and marriage advice.',
        estimatedImpact: 'Crowd Favorite',
        implementationSteps: [
          'Place phone in a cozy velvet lounge corner away from main speakers',
          'Provide prompt cards ("Tell us your favorite memory with the couple" / "Best marriage rule")',
          'Export recordings as a vinyl-style digital album post-wedding'
        ],
        saved: true
      },
      {
        id: 'idea-wed-3',
        category: 'Culinary & Drinks',
        title: 'His, Hers & Ours Heritage Story Infusions',
        description: 'Serve three signature zero-proof & craft spritzers inspired by milestones in the couple’s story—complete with custom illustrated coasters telling the story behind each drink.',
        estimatedImpact: 'Budget-Friendly Gem',
        implementationSteps: [
          'Create "First Coffee Date Cold Brew Tonic", "Udaipur Sunset Rose-Saffron Fizz", and "Spiced Kokum Mule"',
          'Print QR codes on coasters linking to the couple’s Spotify wedding playlist'
        ],
        saved: false
      },
      {
        id: 'idea-wed-4',
        category: 'Sustainability & Impact',
        title: 'Seed-Paper Ceremony Programs & Post-Event Bouquet Rescue',
        description: 'Print ceremony storybooks on basil-and-marigold seed paper and partner with a local women’s collective to turn leftover wedding flowers into natural incense sticks.',
        estimatedImpact: 'Eco-Conscious',
        implementationSteps: [
          'Order plantable cotton-rag seed cards 3 weeks prior',
          'Schedule floral pickup at 9:00 AM the morning after the wedding'
        ],
        saved: false
      }
    ],
    generatedCopy: {
      invitationText: `Beneath a canopy of heritage arches and twilight stars,\nwe invite you to celebrate the union of\n\nAarav & Meera\n\nSaturday, December 12, 2026 | 4:00 PM Onwards\nThe Royal Courtyard Lawn, Udaipur\n\nJoin us for sunset vows, acoustic melodies, and a candlelit feast.\nDress Code: Heritage Pastel & Gold Elegance`,
      welcomeNoteOrSpeech: `"Good evening everyone! Looking out at this courtyard filled with the people who shaped every chapter of our lives feels surreal. Whether you traveled across cities or grew up down the street from us, thank you for bringing your warmth, laughter, and blessings tonight. Eat generously, leave us a voice note at the rotary phone, and meet us under the lights on the dance floor!"`,
      hashtagsOrTaglines: [
        '#AaravMetHisMeera',
        '#TwilightInUdaipur',
        '#MeeraAndAaravForever',
        '#CourtyardVows2026'
      ],
      rainOrBackupPlan: 'Weather Shield Protocol: Clear-span transparent glass marquee pre-reserved on 24-hour standby; courtyard stone pathways lined with anti-slip heritage rugs and brass patio heaters for December evening breeze.'
    }
  },

  birthday: {
    id: 'preset-birthday-1',
    category: 'birthday',
    title: 'Rhea’s 30th "Golden Hour Velvet & Vinyl" Soirée',
    subtitle: 'Chic Rooftop Greenhouse Celebration with Interactive Tapas & Retro Vinyl Lounge',
    date: '2026-11-14',
    location: 'Bengaluru / Botanical Glasshouse Rooftop',
    guestCount: 65,
    totalBudget: 240000,
    currency: 'INR',
    vibe: 'Warm Terracotta, Champagne Gold, Retro Vinyl & Botanical Chic',
    customPrompt: '65 close friends and family for a milestone 30th birthday on a glasshouse rooftop with custom cocktail/mocktail lab, analog vinyl DJ, Polaroid magazine booth, and artisanal tapas.',
    aiExecutiveSummary: 'Tailored for 65 guests at ₹2,40,000, this milestone birthday blueprint avoids stiff banquet seating in favor of conversational lounge clusters, a high-energy interactive mixology bar, and a custom "Vogue-style" photo booth cover experience that doubles as a take-home party favor.',
    themePalette: [
      { name: 'Velvet Magenta', hex: '#DB2777' },
      { name: 'Champagne Gold', hex: '#D97706' },
      { name: 'Sunset Coral', hex: '#FB7185' },
      { name: 'Espresso Vinyl', hex: '#31102F' },
      { name: 'Warm Cream', hex: '#FFF1F2' },
    ],
    budgetBreakdown: [
      {
        id: 'b-bday-1',
        category: 'Rooftop Glasshouse Minimum Spend & Venue',
        percentage: 35,
        allocated: 84000,
        actualSpent: 80000,
        priority: 'Essential',
        aiTip: 'Negotiate a full F&B redeemable cover charge so the venue rental fee is ₹0 when hitting ₹80,000 in food and drinks.',
        items: ['Private Rooftop Terrace Exclusive Hire', 'Lounge Seating Setup', 'Dedicated Sound System']
      },
      {
        id: 'b-bday-2',
        category: 'Artisanal Tapas, Grazing Table & Custom Cake',
        percentage: 28,
        allocated: 67200,
        actualSpent: 64500,
        priority: 'Essential',
        aiTip: 'Order a sculptural 2-tier vintage Lambeth cake for photos (serves 35) and supplement with matching tiramisu cups for effortless service.',
        items: ['Mediterranean & Asian Pass-Around Tapas', '2-Tier Vintage Lambeth Cake', 'Interactive DIY Spritz & Mocktail Bar']
      },
      {
        id: 'b-bday-3',
        category: 'Magazine Cover Photo Booth & Neon Scenography',
        percentage: 15,
        allocated: 36000,
        actualSpent: 34000,
        priority: 'High',
        aiTip: 'A custom acrylic magazine-box photo zone becomes the centerpiece decor AND gives every guest an instant printed keepsake.',
        items: ['Custom "RHEA: THE THIRTY ISSUE" Photo Box', 'Warm Amber Uplights & Disco Balls', 'Tabletop Bud Vases & Taper Candles']
      },
      {
        id: 'b-bday-4',
        category: 'Vinyl DJ & Live Saxophone Set',
        percentage: 12,
        allocated: 28800,
        actualSpent: 28000,
        priority: 'High',
        aiTip: 'Curate a "1996 to 2026" nostalgia crate spanning each decade of the guest of honor’s life.',
        items: ['3-Hour Indie/Disco Vinyl DJ Set', '90-Min Live Saxophone Accompaniment']
      },
      {
        id: 'b-bday-5',
        category: 'Custom Merch Favors & Buffer',
        percentage: 10,
        allocated: 24000,
        actualSpent: 19500,
        priority: 'Flexible',
        aiTip: 'Create "Morning-After Recovery Kits" + custom matchboxes or drip-coffee sachets.',
        items: ['Custom Illustrated Drip Coffee & Matchbook Favors', 'Candid Paparazzi Photographer (3 hrs)', 'Late-Night Fries & Sliders Buffer']
      }
    ],
    timeline: [
      {
        id: 't-bday-1',
        phase: '6 Weeks Out',
        timeframe: 'T - 42 Days',
        title: 'Reserve Rooftop Glasshouse & F&B Minimum',
        description: 'Lock Saturday sunset-to-11:30 PM slot with F&B minimum credit agreement.',
        category: 'Venue',
        completed: true,
        priority: 'Critical'
      },
      {
        id: 't-bday-2',
        phase: '3 Weeks Out',
        timeframe: 'T - 21 Days',
        title: 'Launch Interactive Digital Invite & Song Request Poll',
        description: 'Collect RSVPs along with every guest’s "1 song that reminds you of Rhea".',
        category: 'Guests',
        completed: true,
        priority: 'High'
      },
      {
        id: 't-bday-3',
        phase: '1 Week Out',
        timeframe: 'T - 7 Days',
        title: 'Approve Lambeth Cake Sketch & Magazine Booth Graphics',
        description: 'Confirm vinyl decal lettering for photo booth box and allergy tags for tapas menu.',
        category: 'Decor & Food',
        completed: false,
        priority: 'High'
      },
      {
        id: 't-bday-4',
        phase: 'Day-Of: 06:30 PM',
        timeframe: '18:30 HRS',
        title: 'Golden Hour Arrival & Polaroid Check-In',
        description: 'Guests snap an instant Polaroid on arrival and pin a birthday prediction for Rhea’s 30s.',
        category: 'Day-Of Run of Show',
        completed: false,
        priority: 'High',
        isDayOf: true
      },
      {
        id: 't-bday-5',
        phase: 'Day-Of: 08:30 PM',
        timeframe: '20:30 HRS',
        title: '30-Second Roast & Toast + Candle Wish',
        description: '5 best friends deliver rapid-fire 60-second stories followed by the vintage cake cutting.',
        category: 'Day-Of Run of Show',
        completed: false,
        priority: 'Critical',
        isDayOf: true
      }
    ],
    vendors: [
      {
        id: 'v-bday-1',
        category: 'Venue & Bar',
        role: 'Botanical Rooftop Lounge',
        status: 'Booked',
        estimatedCost: 84000,
        leadTime: '4–6 Weeks Prior',
        mustAskQuestions: [
          'Is the entire ₹84,000 minimum spend redeemable against food and beverages?',
          'Is there a retractable glass roof in case of evening drizzle?',
          'Do you charge corkage or cake-cutting fees for an outside artisan baker?'
        ],
        aiNegotiationScript: 'Hi [Venue Events Lead], we’re hosting a 65-guest 30th birthday on Nov 14. If we guarantee an ₹80,000 F&B minimum spend paid 50% upfront, could you waive the private terrace zone fee and cakeage charge?',
        checklistTasks: [
          { id: 'vb-1', label: 'Confirm zero cake-cutting fee in writing', done: true },
          { id: 'vb-2', label: 'Test AUX/XLR hookup for Vinyl DJ controller', done: false }
        ]
      },
      {
        id: 'v-bday-2',
        category: 'Specialty Bakery',
        role: 'Bespoke Vintage Patisserie',
        status: 'Booked',
        estimatedCost: 12500,
        leadTime: '2–3 Weeks Prior',
        mustAskQuestions: [
          'Can you deliver directly to the venue refrigerator 2 hours before doors open?',
          'Are edible gold leaf and cherries included in the quoted design?'
        ],
        aiNegotiationScript: 'Hi [Chef Name], we’d love to order your 2-tier heart Lambeth cake + 40 matching single-serve tiramisu cups. Could you include chilled delivery to the rooftop venue at 5:00 PM within ₹12,000?',
        checklistTasks: [
          { id: 'vb-3', label: 'Confirm Belgian dark chocolate + raspberry filling', done: true },
          { id: 'vb-4', label: 'Pack long brass sparkler candles & cake knife', done: false }
        ]
      }
    ],
    ideas: [
      {
        id: 'idea-bday-1',
        category: 'Guest Experience',
        title: '"30 Before 30" Trivia & Time-Capsule Wine Box',
        description: 'Guests scan a tabletop card to play a 5-question live trivia game about hilarious moments from the birthday star’s 20s, then drop advice cards into a locked box for their 35th birthday.',
        estimatedImpact: 'Crowd Favorite',
        implementationSteps: [
          'Prepare 8 funny multiple-choice questions with childhood/college photos',
          'Award a mini champagne bottle or artisanal chocolate bar to the top scorer'
        ],
        saved: true
      },
      {
        id: 'idea-bday-2',
        category: 'Theme & Decor',
        title: 'Custom Editorial Magazine Cover Booth ("THE THIRTY ISSUE")',
        description: 'A life-sized backlit magazine cover frame with witty headlines tailored to the birthday guest’s inside jokes and milestones.',
        estimatedImpact: 'High Wow-Factor',
        implementationSteps: [
          'Design cover headlines ("How to Survive Your 20s in Style", "Exclusive: Still Ordering Iced Coffee at 9 PM")',
          'Place a ring light + tripod phone mount with instant AirDrop station'
        ],
        saved: true
      }
    ],
    generatedCopy: {
      invitationText: `THE THIRTY ISSUE — LIVE EDITION\n\nRaise a glass as Rhea trades her twenties for velvet nights, vinyl grooves, and golden-hour toasts!\n\nSaturday, November 14, 2026 | 6:30 PM – Midnight\nThe Botanical Glasshouse Rooftop, Bengaluru\n\nDress Code: Sunset Cocktail & Velvet Chic\nRSVP with the one song that gets you on the dance floor.`,
      welcomeNoteOrSpeech: `"Turning 30 surrounded by the exact people who made my 20s unforgettable is the greatest gift I could ask for. Thank you for every late-night call, spontaneous trip, and chaotic memory in this room—here’s to a decade of bolder dreams and better wine!"`,
      hashtagsOrTaglines: [
        '#RheaTurnsThirty',
        '#TheThirtyIssue',
        '#ThirtyFlirtyAndThriving',
        '#VelvetAndVinyl30'
      ],
      rainOrBackupPlan: 'Retractable glasshouse canopy closes automatically in 90 seconds; indoor conservatory lounge reserved seamlessly.'
    }
  },

  community: {
    id: 'preset-community-1',
    category: 'community',
    title: 'GreenSpark Neighborhood Cultural & Makers Festival',
    subtitle: 'Zero-Waste Community Arts, Local Food Artisans & Live Indie Stage',
    date: '2026-11-29',
    location: 'Public Amphitheater & Heritage Park Grounds',
    guestCount: 500,
    totalBudget: 350000,
    currency: 'INR',
    vibe: 'Vibrant Community Spirit, Eco-Craft, Inclusive & Family-Friendly',
    customPrompt: 'A 500-attendee Sunday community cultural & sustainability festival featuring 25 local maker stalls, zero-waste food court, kids upcycling workshops, acoustic folk stage, and sponsor booths.',
    aiExecutiveSummary: 'Engineered for 500 attendees on a ₹3,50,000 community budget (with 45% recoverable via stall fees and local sponsorships!). Focuses resources on clear wayfinding, acoustic stage production, civic permits, and reusable dishware logistics.',
    themePalette: [
      { name: 'Festival Berry', hex: '#DB2777' },
      { name: 'Marigold Sun', hex: '#EAB308' },
      { name: 'Teal Commons', hex: '#0D9488' },
      { name: 'Terracotta Clay', hex: '#EA580C' },
      { name: 'Canvas Cream', hex: '#FDF2F8' },
    ],
    budgetBreakdown: [
      {
        id: 'b-com-1',
        category: 'Park Permits, Stage Canopy & 25 Maker Booths',
        percentage: 32,
        allocated: 112000,
        actualSpent: 108000,
        priority: 'Essential',
        aiTip: 'Charge ₹3,500 per commercial maker stall (20 stalls = ₹70,000 offset) while keeping 5 stalls free for local NGOs and student creators.',
        items: ['Municipal Amphitheater Permit & Insurance', '25 Octanorm/Bamboo Canopy Stalls', 'Main Acoustic Stage & Shading']
      },
      {
        id: 'b-com-2',
        category: 'PA Sound System, Lighting & Generator Power',
        percentage: 20,
        allocated: 70000,
        actualSpent: 66000,
        priority: 'Essential',
        aiTip: 'Centralize power distribution to the food court and main stage only; keep craft stalls solar/daylight powered.',
        items: ['Line-Array PA & 6 Stage Mics', 'Silent DG Power Backup', 'Festival String Lighting']
      },
      {
        id: 'b-com-3',
        category: 'Zero-Waste Cutlery Bank, Hydration & Sanitation',
        percentage: 18,
        allocated: 63000,
        actualSpent: 59000,
        priority: 'High',
        aiTip: 'Partner with a reusable steel-plate bank + 3-bin waste marshals to achieve 95% landfill diversion.',
        items: ['Reusable Steel Plate & Cup Wash Station', '3 Free Filtered Drinking Water Kiosks', 'Eco-Volunteers & Waste Segregation Stations']
      },
      {
        id: 'b-com-4',
        category: 'Artist Honorariums & Workshop Supplies',
        percentage: 18,
        allocated: 63000,
        actualSpent: 60000,
        priority: 'High',
        aiTip: 'Cross-promote local indie bands and pottery/upcycling instructors with high-visibility stage shoutouts and reel clips.',
        items: ['4 Indie Folk & Percussion Acts', 'Kids Clay & Upcycled Tote Workshop Supplies', 'Community Mural Canvas & Paints']
      },
      {
        id: 'b-com-5',
        category: 'Signage, First-Aid, Security & Contingency',
        percentage: 12,
        allocated: 42000,
        actualSpent: 35000,
        priority: 'Essential',
        aiTip: 'Print reusable fabric bunting and QR-based digital festival maps instead of single-use paper flyers.',
        items: ['First-Aid Ambulance & Paramedic Kiosk', '4 Crowd Marshals & Volunteer T-Shirts', 'Reusable Fabric Wayfinding Banners']
      }
    ],
    timeline: [
      {
        id: 't-com-1',
        phase: '8 Weeks Out',
        timeframe: 'T - 56 Days',
        title: 'Secure Municipal Park NOC, Fire & Sound Permits',
        description: 'Submit site layout map showing emergency exits, fire extinguishers, and decibel compliance.',
        category: 'Permits & Legal',
        completed: true,
        priority: 'Critical'
      },
      {
        id: 't-com-2',
        phase: '5 Weeks Out',
        timeframe: 'T - 35 Days',
        title: 'Open Call for Local Makers, Food Artisans & Sponsors',
        description: 'Publish registration form for 25 curated stalls and confirm 3 neighborhood business sponsors.',
        category: 'Vendors & Sponsors',
        completed: true,
        priority: 'Critical'
      },
      {
        id: 't-com-3',
        phase: '2 Weeks Out',
        timeframe: 'T - 14 Days',
        title: 'Recruit & Brief 30 Community Volunteers',
        description: 'Assign shifts for registration desk, zero-waste stations, stage management, and accessibility support.',
        category: 'Operations',
        completed: false,
        priority: 'High'
      },
      {
        id: 't-com-4',
        phase: 'Day-Of: 10:00 AM',
        timeframe: '10:00 HRS',
        title: 'Vendor Load-In & Safety Walkthrough',
        description: 'All 25 stalls complete setup; electrical load check and zero-waste dishware distribution to food stalls.',
        category: 'Day-Of Run of Show',
        completed: false,
        priority: 'Critical',
        isDayOf: true
      },
      {
        id: 't-com-5',
        phase: 'Day-Of: 04:30 PM',
        timeframe: '16:30 HRS',
        title: 'Community Drum Circle & Amphitheater Headliner',
        description: 'Interactive 100-person percussion circle followed by sunset indie folk concert and community awards.',
        category: 'Day-Of Run of Show',
        completed: false,
        priority: 'High',
        isDayOf: true
      }
    ],
    vendors: [
      {
        id: 'v-com-1',
        category: 'Infrastructure & Tents',
        role: 'Eco-Bamboo Stall & Stage Fabricator',
        status: 'Booked',
        estimatedCost: 112000,
        leadTime: '4–6 Weeks Prior',
        mustAskQuestions: [
          'Can all 25 stalls be erected between 6:00 AM and 9:30 AM on Sunday morning?',
          'Are fire-retardant certificates provided for the municipal inspection?',
          'Does the quote include 2 tables, 2 chairs, and a 5A plug point per stall?'
        ],
        aiNegotiationScript: 'Hello [Vendor Name], since GreenSpark is a community-led civic festival, could you offer a 15% community impact discount in exchange for placing your logo as our Official Infrastructure Partner on the main entrance arch?',
        checklistTasks: [
          { id: 'vc-1', label: 'Approve stall numbering & wheelchair-accessible aisle widths (min 3m)', done: true },
          { id: 'vc-2', label: 'Place 6 fire extinguishers across food & stage zones', done: false }
        ]
      },
      {
        id: 'v-com-2',
        category: 'Sustainability Logistics',
        role: 'Zero-Waste Crockery Bank & Compost Partner',
        status: 'Shortlisted',
        estimatedCost: 38000,
        leadTime: '3 Weeks Prior',
        mustAskQuestions: [
          'How many stainless steel plates and tumblers are needed for 500 rolling attendees?',
          'Do you provide on-site washing staff to cycle dishes every 30 minutes?',
          'Will you issue a post-event Waste Diversion Impact Certificate?'
        ],
        aiNegotiationScript: 'Hi [Partner Name], we expect 500 attendees across 8 hours (~1,200 food servings). Can we lock in a 400-plate rotating steel inventory with 3 wash attendants and a live "Waste Saved Counter" board for ₹35,000?',
        checklistTasks: [
          { id: 'vc-3', label: 'Brief all food vendors on zero single-use plastic rule', done: true },
          { id: 'vc-4', label: 'Set up refundable ₹50 cup token system if needed', done: false }
        ]
      }
    ],
    ideas: [
      {
        id: 'idea-com-1',
        category: 'Guest Experience',
        title: 'Collaborative 12-Foot Neighborhood Story Mural',
        description: 'A paint-by-numbers style giant canvas illustrated by a local artist where every attendee paints one segment representing their favorite neighborhood landmark.',
        estimatedImpact: 'Crowd Favorite',
        implementationSteps: [
          'Pre-sketch outline on weather-resistant canvas boards',
          'Donate the finished mural to the local community library or metro station'
        ],
        saved: true
      },
      {
        id: 'idea-com-2',
        category: 'Sustainability & Impact',
        title: 'Live "Zero-Waste Impact Ticker" & Seed Swap Library',
        description: 'Display a live chalkboard/digital counter showing how many single-use plastic items were saved during the festival, paired with a free community seed & book swap table.',
        estimatedImpact: 'Eco-Conscious',
        implementationSteps: [
          'Update counter every hour based on reusable plate wash cycles',
          'Invite urban gardeners to trade heirloom vegetable seeds'
        ],
        saved: true
      }
    ],
    generatedCopy: {
      invitationText: `YOU’RE INVITED TO GREENSPARK 2026!\nNeighborhood Cultural, Food & Makers Festival\n\nSunday, November 29, 2026 | 11:00 AM – 8:00 PM\nHeritage Park Amphitheater\n\n25+ Local Artisans • Zero-Waste Regional Food Court • Upcycling Workshops • Sunset Indie Folk Concert\n\nFree Entry for All | Bring Your Own Water Bottle & Tote Bag!`,
      welcomeNoteOrSpeech: `"Welcome neighbors, makers, artists, and families! Today proves what happens when a neighborhood comes together to celebrate local creativity and sustainability. Every meal you enjoy today is served on reusable dishware, and every stall supports an independent creator from our own community. Let’s make today joyful, inclusive, and 100% zero-waste!"`,
      hashtagsOrTaglines: [
        '#GreenSparkFest2026',
        '#ZeroWasteNeighborhood',
        '#MadeInOurCommunity',
        '#CultureInTheCommons'
      ],
      rainOrBackupPlan: 'Waterproof German hanger canopy over central amphitheater & food court; storm-drain mats along main walkway and backup indoor community hall across the park.'
    }
  }
};
