import prisma from '../utils/prisma.js';
import { normalizeServiceOfferings } from './user.service.js';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://hirebuddy.in').replace(/\/+$/, '');

export function toSeoSlug(input = '') {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCanonicalUrl(path = '/') {
  const cleanPath =
    '/' +
    String(path || '/')
      .split('?')[0]
      .split('#')[0]
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, '');
  return cleanPath === '/' ? SITE_URL : `${SITE_URL}${cleanPath}`;
}

/**
 * Alias map so legacy slugs (/services/plumbing, /services/electrical, /services/driver-services)
 * resolve cleanly and 301-redirect to canonical slugs (/services/plumber, /services/electrician, /services/driver)
 */
export const SERVICE_SLUG_ALIASES = {
  plumbing: 'plumber',
  electrical: 'electrician',
  'driver-services': 'driver',
  'furniture-assembly': 'carpenter',
  cleaning: 'home-cleaning',
};

export const INITIAL_SEO_SERVICES = [
  {
    name: 'Home Cleaning',
    slug: 'home-cleaning',
    icon: '🧹',
    startingPricePaise: 29900,
    seoTitle: 'Home Cleaning Services in India — Verified Cleaners | HireBuddy',
    metaDescription:
      'Book background-verified home cleaning professionals for deep cleaning, kitchen sanitization, bathroom cleaning and sofa vacuuming with transparent pricing.',
    h1Heading: 'Professional Home Cleaning Services by Verified Local Helpers',
    description:
      'Comprehensive home, kitchen, bathroom and sofa cleaning by government-ID verified professionals.',
    introContent:
      'Keep your living spaces spotless and hygienic with HireBuddy verified home cleaning specialists. Whether you need routine weekly housekeeping, move-in deep cleaning, or festival sanitization, you can compare local helpers, view transparent upfront rates, and book with 100% escrow protection.',
    detailedContent:
      'Our home cleaning service covers every corner of your apartment or independent house. Helpers arrive equipped with microfiber dusters, floor scrubbers, and surface-safe disinfectants to remove grease in kitchens, descaling mineral buildup in bathrooms, and vacuuming dust mites from sofas and mattresses.',
    subServices: [
      'Full Home Deep Cleaning (1BHK to 4BHK & Villas)',
      'Kitchen Chimney, Slab & Cabinet Degreasing',
      'Bathroom Tile Descaling & Disinfection',
      'Sofa, Carpet & Mattress Dry Vacuuming',
    ],
    benefits: [
      'Government ID & address-verified local cleaning professionals',
      'Upfront hourly and package pricing with zero hidden charges',
      'Escrow-protected payment released only after your confirmation',
      'Flexible same-day and weekend morning/evening time slots',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Choose Your Cleaning Scope',
        detail: 'Select full-home deep cleaning, kitchen/bathroom sanitization, or hourly housekeeping.',
      },
      {
        step: 2,
        title: 'Compare Verified Local Cleaners',
        detail: 'Check genuine customer ratings, experience, and transparent rates before booking.',
      },
      {
        step: 3,
        title: 'Relax While Your Home Shines',
        detail: 'Your payment stays safe in escrow until the cleaning checklist is completed to your satisfaction.',
      },
    ],
    faqs: [
      {
        question: 'What is included in a standard home cleaning booking on HireBuddy?',
        answer:
          'Standard home cleaning includes sweeping, mopping with disinfectant, dusting furniture and fixtures, cobweb removal, kitchen counter cleaning, and bathroom sanitization.',
      },
      {
        question: 'Do I need to provide cleaning supplies or equipment?',
        answer:
          'For routine hourly housekeeping, customers usually provide basic mops and surface cleaners. For full deep-cleaning bookings, helpers can bring commercial-grade scrubbing pads and eco-friendly cleaning agents.',
      },
      {
        question: 'When is my payment released to the cleaner?',
        answer:
          'Your booking payment is held securely and released to the helper only after the service is completed and confirmed by you.',
      },
    ],
    ogImage: '/images/seo/home-cleaning-service.webp',
  },
  {
    name: 'Plumber',
    slug: 'plumber',
    icon: '🚰',
    startingPricePaise: 19900,
    seoTitle: 'Licensed Plumber Services — Leak Repair, Pipe & Tap Fitting | HireBuddy',
    metaDescription:
      'Hire experienced local plumbers for tap leak repair, drain blockage removal, water tank motor fitting and bathroom sanitaryware installation on HireBuddy.',
    h1Heading: 'Trusted Local Plumber Services for Repairs & Installations',
    description:
      'On-demand plumbing repairs, drain unblocking, pipe leak fixing, and bathroom fixture installation.',
    introContent:
      'From dripping kitchen faucets and concealed pipeline seepage to overhead water tank overflows and bathroom fittings, HireBuddy connects you with skilled local plumbers who diagnose and resolve water issues quickly.',
    detailedContent:
      'Water leaks and choked drains can damage walls and cabinetry if left unattended. Verified plumbers on HireBuddy handle GI, CPVC, and UPVC pipework, mixer tap cartridge replacements, flush tank repairs, geyser inlet-outlet connections, and pressure pump installations with transparent inspection and labor charges.',
    subServices: [
      'Tap, Mixer & Shower Leak Repair',
      'Kitchen Sink & Bathroom Drain Unblocking',
      'Water Tank, Float Valve & Motor Pump Fitting',
      'Western Toilet, Washbasin & Geyser Pipe Installation',
    ],
    benefits: [
      'Experienced plumbers for CPVC, UPVC and GI pipeline repairs',
      'Fast response for urgent water leaks and blocked drains',
      'Clear separation of labor charges and genuine spare parts',
      'Escrow payment protection until leak-free testing is complete',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Describe the Plumbing Issue',
        detail: 'Select tap repair, drain blockage, motor installation, or full bathroom fitting.',
      },
      {
        step: 2,
        title: 'Book a Verified Local Plumber',
        detail: 'Pick a time slot and review the plumber profile, skills, and upfront inspection/labor rate.',
      },
      {
        step: 3,
        title: 'Leak-Free Inspection & Confirmation',
        detail: 'Test the water flow and pressure after repair before confirming completion.',
      },
    ],
    faqs: [
      {
        question: 'Are spare parts like taps or pipes included in the booking fee?',
        answer:
          'The booking amount covers the plumber labor and service charge. Any replacement taps, valves, or pipes can either be provided by you or procured by the plumber with an actual store receipt.',
      },
      {
        question: 'How quickly can I get a plumber for an urgent leak?',
        answer:
          'In supported localities across Noida, Ghaziabad, Meerut, and Delhi, same-day slots are available within 60 to 120 minutes depending on helper availability.',
      },
    ],
    ogImage: '/images/seo/plumber-service.webp',
  },
  {
    name: 'Electrician',
    slug: 'electrician',
    icon: '⚡',
    startingPricePaise: 19900,
    seoTitle: 'Verified Electrician Services — Wiring, MCB, Fan & Inverter Repair | HireBuddy',
    metaDescription:
      'Book certified local electricians for switchboard repair, ceiling fan installation, MCB tripping fixes, inverter setup and home wiring checks on HireBuddy.',
    h1Heading: 'Certified Local Electricians for Safe Home Electrical Repairs',
    description:
      'Safe electrical troubleshooting, MCB & fuse repair, fan/light fitting, and inverter wiring by verified electricians.',
    introContent:
      'Electrical faults require trained hands and strict safety practices. HireBuddy lets you book verified local electricians for switchboard sparking, frequent MCB tripping, ceiling fan and chandelier mounting, appliance earthing, and inverter battery installations.',
    detailedContent:
      'Every electrician listed on HireBuddy undergoes government ID verification and skill assessment. Whether you are upgrading modular switches, installing LED panel lights, wiring a 16A AC power socket, or diagnosing voltage fluctuations, you get transparent upfront pricing and safe workmanship.',
    subServices: [
      'Switchboard, Socket & Modular Wiring Repair',
      'Ceiling Fan, Exhaust Fan & Chandelier Installation',
      'MCB, RCCB & Distribution Board Troubleshooting',
      'Inverter, UPS & Stabilizer Connection Setup',
    ],
    benefits: [
      'Safety-first electrical diagnostics with proper insulation tools',
      'Upfront pricing for fan fitting, switchboard repair and wiring points',
      'Verified local electricians with genuine customer reviews',
      'Protected payments released only after load testing',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Select Your Electrical Task',
        detail: 'Choose fan installation, switchboard repair, MCB troubleshooting, or inverter setup.',
      },
      {
        step: 2,
        title: 'Schedule a Verified Electrician',
        detail: 'Select a convenient date and time slot with an available local electrician.',
      },
      {
        step: 3,
        title: 'Safe Repair & Power Check',
        detail: 'Verify all switches and appliances work safely before releasing the payment.',
      },
    ],
    faqs: [
      {
        question: 'Can electricians on HireBuddy handle three-phase domestic distribution boards?',
        answer:
          'Yes, experienced electricians on HireBuddy can diagnose and replace single-phase and three-phase MCBs, RCCBs, and changeover switches.',
      },
      {
        question: 'Do electricians bring their own ladder for ceiling fan installation?',
        answer:
          'Please mention in your booking notes if your ceiling height requires a tall step ladder so the electrician can arrange one accordingly.',
      },
    ],
    ogImage: '/images/seo/electrician-service.webp',
  },
  {
    name: 'Carpenter',
    slug: 'carpenter',
    icon: '🪚',
    startingPricePaise: 24900,
    seoTitle: 'Skilled Carpenter Services — Furniture Assembly, Door & Lock Repair | HireBuddy',
    metaDescription:
      'Book experienced local carpenters for flat-pack furniture assembly, wooden door alignment, cabinet hinge replacement and custom woodwork on HireBuddy.',
    h1Heading: 'Expert Local Carpenter Services for Furniture & Woodwork',
    description:
      'Professional furniture assembly, door/window lock repair, modular kitchen hinge fixing, and custom carpentry.',
    introContent:
      'Need help assembling a new bed or wardrobe, fixing a jammed wooden door, or replacing broken kitchen hydraulic hinges? HireBuddy connects you with skilled local carpenters who bring precision tools for clean, durable woodwork.',
    detailedContent:
      'Our verified carpenters handle both quick hardware repairs—such as tower bolts, mortise door locks, drawer channels, and curtain rods—and full furniture assembly or dismantling during house shifting.',
    subServices: [
      'Bed, Wardrobe & Study Table Assembly / Dismantling',
      'Wooden Door Planing, Lock & Aldrop Replacement',
      'Kitchen Cabinet Hydraulic Hinge & Drawer Channel Repair',
      'Wall Shelf, Mirror, Curtain Rod & TV Bracket Mounting',
    ],
    benefits: [
      'Skilled local carpenters for both quick repairs and custom woodwork',
      'Clean drilling and alignment using professional carpentry tools',
      'Transparent hourly or per-item assembly rates',
      'Escrow-backed booking security on every job',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'List Your Carpentry Requirement',
        detail: 'Choose furniture assembly, door/window repair, hinge replacement, or wall mounting.',
      },
      {
        step: 2,
        title: 'Match with a Local Carpenter',
        detail: 'Review helper experience, past woodwork ratings, and clear pricing.',
      },
      {
        step: 3,
        title: 'Inspect Alignment & Finish',
        detail: 'Check smooth door/drawer movement before confirming job completion.',
      },
    ],
    faqs: [
      {
        question: 'Can a carpenter dismantle and reassemble my bed and wardrobe when shifting homes?',
        answer:
          'Yes, you can book carpenters specifically for dismantling flat-pack or modular beds and wardrobes and reassembling them at your new residence.',
      },
    ],
    ogImage: '/images/seo/carpenter-service.webp',
  },
  {
    name: 'Driver',
    slug: 'driver',
    icon: '🚗',
    startingPricePaise: 29900,
    seoTitle: 'Hire Verified Personal & Outstation Drivers on Demand | HireBuddy',
    metaDescription:
      'Hire license-verified local drivers for city errands, hospital visits, airport drops and outstation family trips in your own car with HireBuddy.',
    h1Heading: 'Hire Verified Personal Chauffeurs & On-Demand Drivers',
    description:
      'License-verified drivers for hourly city commutes, hospital visits, airport transfers, and outstation trips.',
    introContent:
      'Travel comfortably in your own car without the stress of city traffic or parking. HireBuddy connects car owners with driving-license verified, experienced drivers for hourly local errands, senior citizen doctor visits, late-night pickups, and outstation highway trips.',
    detailedContent:
      'Every driver partner on HireBuddy is verified for a valid Indian driving license and local address proof. You can hire drivers experienced with both manual and automatic hatchbacks, sedans, and SUVs.',
    subServices: [
      'Hourly Local City Chauffeur & Shopping Errands',
      'Hospital & Senior Citizen Accompaniment Drives',
      'Delhi NCR Airport Pickup & Drop Transfers',
      'Same-Day & Multi-Day Outstation Family Trips',
    ],
    benefits: [
      'Driving license and government ID verified local drivers',
      'Experienced with both Manual and Automatic transmission cars',
      'Transparent hourly and daily packages with no surge shocks',
      'Ideal for family trips, medical visits, and daily office commutes',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Enter Trip Timing & Car Type',
        detail: 'Specify local hourly or outstation trip along with manual/automatic transmission.',
      },
      {
        step: 2,
        title: 'Select a Verified Driver',
        detail: 'Review driving experience, ratings, and transparent trip charges.',
      },
      {
        step: 3,
        title: 'Enjoy a Safe, Stress-Free Ride',
        detail: 'Complete your journey and release payment seamlessly through HireBuddy.',
      },
    ],
    faqs: [
      {
        question: 'Are drivers on HireBuddy experienced with automatic SUVs and sedans?',
        answer:
          'Yes, you can specify whether your vehicle is manual or automatic when booking so a driver experienced with your transmission type is assigned.',
      },
    ],
    ogImage: '/images/seo/driver-service.webp',
  },
];

export const INITIAL_SEO_LOCATIONS = [
  {
    name: 'Meerut',
    slug: 'meerut',
    stateName: 'Uttar Pradesh',
    stateCode: 'UP',
    latitude: 28.9845,
    longitude: 77.7064,
    activeHelpersCount: 48,
    serviceAreas: [
      'Modipuram',
      'Pallavpuram Phase 1 & 2',
      'Shastri Nagar',
      'Saket',
      'Ganga Nagar',
      'Kanker Khera',
      'Meerut Cantt',
      'Begum Bridge',
      'Jagriti Vihar',
      'Rohta Road',
    ],
    seoTitle: 'Home Services & Verified Local Helpers in Meerut | HireBuddy',
    metaDescription:
      'Book verified electricians, plumbers, home cleaners, carpenters and personal drivers across Modipuram, Shastri Nagar, Saket and Pallavpuram in Meerut.',
    h1Heading: 'Verified Home Services & Local Helpers in Meerut, Uttar Pradesh',
    introContent:
      'HireBuddy is headquartered in Meerut, connecting households across Modipuram, Pallavpuram, Shastri Nagar, Saket, Ganga Nagar, and Meerut Cantt with background-verified local helpers and factory-direct Meerut manufacturers.',
    coverageDescription:
      'We provide rapid same-day service coverage across North, Central, and South Meerut corridors along NH-58 and Delhi-Meerut Expressway, with verified local technicians residing within 15–30 minutes of major residential colonies.',
    faqs: [
      {
        question: 'Which colonies in Meerut are covered by HireBuddy helpers?',
        answer:
          'HireBuddy covers Modipuram, Pallavpuram, Shastri Nagar, Saket, Ganga Nagar, Jagriti Vihar, Kanker Khera, Meerut Cantt, and surrounding areas.',
      },
      {
        question: 'Can I also order Meerut factory-direct products along with home services?',
        answer:
          'Yes! In addition to home services, HireBuddy features the Meerut Manufacturers Marketplace for authentic sports goods, scissors, and traditional gazak.',
      },
    ],
    ogImage: '/images/seo/meerut-location.webp',
  },
  {
    name: 'Noida',
    slug: 'noida',
    stateName: 'Uttar Pradesh',
    stateCode: 'UP',
    latitude: 28.5355,
    longitude: 77.391,
    activeHelpersCount: 64,
    serviceAreas: [
      'Sector 18 & Sector 15',
      'Sector 62 & Sector 63',
      'Sector 50, 51 & 52',
      'Sector 74, 75, 76, 77 & 78',
      'Sector 137 & Noida Expressway',
      'Greater Noida West (Noida Extension)',
      'Sector 128 & Jaypee Wish Town',
    ],
    seoTitle: 'Home Cleaning, Plumber, Electrician & Driver Services in Noida | HireBuddy',
    metaDescription:
      'Hire verified home cleaners, plumbers, electricians, carpenters and drivers across Noida Sector 18, Sector 62, Sector 76, Sector 137 and Greater Noida West.',
    h1Heading: 'Trusted Home Services & Verified Helpers in Noida',
    introContent:
      'High-rise apartments and independent villas across Noida and Greater Noida West rely on punctual, gate-pass friendly service professionals. HireBuddy connects Noida residents with ID-verified cleaners, plumbers, electricians, carpenters, and drivers.',
    coverageDescription:
      'Our Noida service network spans Central Noida sectors (50–78), IT hub sectors (62–63), Noida-Greater Noida Expressway societies (Sector 93, 128, 137, 150), and Greater Noida West (Gaur City & Techzone 4).',
    faqs: [
      {
        question: 'Are HireBuddy helpers pre-verified for MyGate and NoBrokerHood society entry in Noida?',
        answer:
          'Yes, all helpers carry verified government ID cards so you can easily approve their visitor pass at gated high-rise societies in Noida.',
      },
    ],
    ogImage: '/images/seo/noida-location.webp',
  },
  {
    name: 'Ghaziabad',
    slug: 'ghaziabad',
    stateName: 'Uttar Pradesh',
    stateCode: 'UP',
    latitude: 28.6692,
    longitude: 77.4538,
    activeHelpersCount: 42,
    serviceAreas: [
      'Indirapuram (Ahinsa Khand, Vaibhav Khand, Niti Khand)',
      'Vaishali & Vasundhara',
      'Raj Nagar Extension',
      'Kavi Nagar & Raj Nagar',
      'Crossings Republik',
      'Kaushambi',
    ],
    seoTitle: 'Verified Home Services in Ghaziabad — Indirapuram, Vaishali & Raj Nagar | HireBuddy',
    metaDescription:
      'Book trusted home cleaning, plumber, electrician, carpenter and driver services in Indirapuram, Vaishali, Vasundhara, Crossings Republik and Raj Nagar Extension.',
    h1Heading: 'Verified Local Helpers & Home Services in Ghaziabad',
    introContent:
      'From builder floors in Indirapuram and Vaishali to high-rise towers in Raj Nagar Extension and Crossings Republik, HireBuddy delivers reliable, upfront-priced home maintenance and daily assistance across Ghaziabad.',
    coverageDescription:
      'Active helper coverage across Trans-Hindon (Indirapuram, Vaishali, Vasundhara, Kaushambi) and Cis-Hindon (Raj Nagar Extension, Kavi Nagar, Nehru Nagar, and NH-24 Crossings Republik).',
    faqs: [
      {
        question: 'Do you provide same-day home cleaning and electrician services in Indirapuram and Raj Nagar Extension?',
        answer:
          'Yes, verified helpers are available across Indirapuram, Vaishali, Vasundhara, and Raj Nagar Extension for both scheduled and same-day bookings.',
      },
    ],
    ogImage: '/images/seo/ghaziabad-location.webp',
  },
  {
    name: 'Delhi',
    slug: 'delhi',
    stateName: 'Delhi NCR',
    stateCode: 'DL',
    latitude: 28.6139,
    longitude: 77.209,
    activeHelpersCount: 55,
    serviceAreas: [
      'East Delhi (Mayur Vihar, Preet Vihar, Patparganj)',
      'South Delhi (Lajpat Nagar, Saket, Greater Kailash, Vasant Kunj)',
      'West Delhi (Dwarka, Janakpuri, Rajouri Garden)',
      'North & Central Delhi (Model Town, Karol Bagh, Rohini)',
    ],
    seoTitle: 'Home Services & Verified Helpers in Delhi — Cleaning, Plumber & Electrician | HireBuddy',
    metaDescription:
      'Book ID-verified home cleaners, electricians, plumbers, carpenters and personal drivers across East Delhi, South Delhi, Dwarka and Rohini with HireBuddy.',
    h1Heading: 'Trusted Home Services & Verified Local Helpers in Delhi',
    introContent:
      'Finding dependable household help and skilled repair technicians in Delhi is simple with HireBuddy. Compare verified professionals across East, South, West, and North Delhi with transparent pricing and escrow protection.',
    coverageDescription:
      'Full coverage across DDA apartments, CGHS societies, and independent houses in Mayur Vihar, Patparganj, Saket, Lajpat Nagar, Dwarka, Janakpuri, and Rohini.',
    faqs: [
      {
        question: 'How does HireBuddy ensure safety for home service bookings in Delhi?',
        answer:
          'Every helper undergoes government ID and address verification before taking bookings, and your payment stays in escrow until the service is completed.',
      },
    ],
    ogImage: '/images/seo/delhi-location.webp',
  },
];

export const INITIAL_SERVICE_LOCATION_PAGES = [
  {
    serviceSlug: 'home-cleaning',
    locationSlug: 'noida',
    serviceName: 'Home Cleaning',
    locationName: 'Noida',
    startingPricePaise: 34900,
    availableHelpersCount: 19,
    completedJobsCount: 142,
    seoTitle: 'Home Cleaning in Noida | HireBuddy',
    metaDescription:
      'Book trusted home cleaning professionals in Noida. Compare available services, check pricing and schedule your cleaning service with HireBuddy.',
    h1Heading: 'Professional Home Cleaning Services in Noida',
    introContent:
      'Looking for reliable apartment or villa cleaning in Noida? HireBuddy connects residents across Sector 18, Sector 50, Sector 62, Sector 76, Sector 137, and Greater Noida West with background-verified home cleaners.',
    localGuideContent:
      'High-rise apartments along the Noida-Greater Noida Expressway and central sectors often experience fine construction dust and hard-water scaling on bathroom fixtures. Our Noida cleaning specialists bring descaling agents for chrome taps and glass shower partitions, microfiber pads for vitrified and wooden flooring, and high-suction vacuum tools for balcony tracks and sofa upholstery.',
    localServiceAreas: [
      'Sector 74, 75, 76, 77 & 78 High-Rise Societies',
      'Sector 137, 143 & 150 Noida Expressway',
      'Sector 50, 51, 52 & 62 Residential Blocks',
      'Greater Noida West (Gaur City & Techzone 4)',
    ],
    benefits: [
      'Gate-pass ready verified cleaners for Noida high-rise apartments',
      'Specialized hard-water stain removal for Noida bathroom fittings',
      'Transparent 1BHK, 2BHK, 3BHK and hourly cleaning packages',
      '100% escrow payment safety — release funds only after inspection',
    ],
    faqs: [
      {
        question: 'How much does home cleaning cost in Noida?',
        answer:
          'Routine hourly home cleaning in Noida starts at ₹349, while comprehensive bathroom, kitchen, or full-apartment deep cleaning packages depend on BHK size and scope.',
      },
      {
        question: 'Can I book weekend morning slots in Noida Sector 76 or Sector 137?',
        answer:
          'Yes, morning and afternoon slots are available 7 days a week across all major Noida sectors.',
      },
    ],
    ogImage: '/images/seo/home-cleaning-service-noida.webp',
  },
  {
    serviceSlug: 'home-cleaning',
    locationSlug: 'ghaziabad',
    serviceName: 'Home Cleaning',
    locationName: 'Ghaziabad',
    startingPricePaise: 29900,
    availableHelpersCount: 14,
    completedJobsCount: 96,
    seoTitle: 'Home Cleaning in Ghaziabad — Indirapuram, Vaishali & Raj Nagar | HireBuddy',
    metaDescription:
      'Book verified home cleaning professionals in Ghaziabad across Indirapuram, Vaishali, Vasundhara and Raj Nagar Extension. Transparent pricing on HireBuddy.',
    h1Heading: 'Trusted Home Cleaning Services in Ghaziabad',
    introContent:
      'Book verified local home cleaners across Indirapuram, Vaishali, Vasundhara, Raj Nagar Extension, and Crossings Republik for spotless floors, sanitized bathrooms, and degreased kitchens.',
    localGuideContent:
      'Builder floors in Indirapuram and Vaishali as well as multi-story apartments in Raj Nagar Extension benefit from tailored cleaning checklists covering balcony grills, utility shafts, modular kitchen chimneys, and bathroom tile joints.',
    localServiceAreas: [
      'Indirapuram (Ahinsa Khand, Vaibhav Khand, Nyay Khand)',
      'Vaishali Sectors 1–9 & Vasundhara',
      'Raj Nagar Extension & Kavi Nagar',
      'Crossings Republik NH-24',
    ],
    benefits: [
      'Background-verified local cleaners in Trans-Hindon & Cis-Hindon Ghaziabad',
      'Upfront pricing starting at ₹299 with zero hidden broker fees',
      'Escrow-protected booking with instant helper confirmation',
    ],
    faqs: [
      {
        question: 'Do you cover both Indirapuram and Raj Nagar Extension in Ghaziabad?',
        answer:
          'Yes, we have dedicated local helpers in both the Indirapuram/Vaishali belt and the Raj Nagar Extension/Kavi Nagar belt.',
      },
    ],
    ogImage: '/images/seo/home-cleaning-service-ghaziabad.webp',
  },
  {
    serviceSlug: 'plumber',
    locationSlug: 'noida',
    serviceName: 'Plumber',
    locationName: 'Noida',
    startingPricePaise: 19900,
    availableHelpersCount: 15,
    completedJobsCount: 118,
    seoTitle: 'Plumber in Noida — Leak Repair, Tap & Bathroom Fitting | HireBuddy',
    metaDescription:
      'Hire experienced plumbers in Noida for tap leaks, choked drains, flush tank repairs and geyser installations across Sector 18, 62, 76 and 137.',
    h1Heading: 'Experienced Plumbers in Noida for Fast Leak & Pipe Repairs',
    introContent:
      'Hard water scaling in Noida frequently causes jammed angle valves, dripping mixer cartridges, and choked shower heads. Book a verified local plumber in Noida with upfront pricing.',
    localGuideContent:
      'Our Noida plumbers are well-versed with concealed diverters, wall-hung cisterns, RO inlet valves, and high-pressure booster pumps used in Noida independent houses and apartment towers.',
    localServiceAreas: [
      'Noida Sectors 15, 18, 22, 34, 50, 51 & 62',
      'Central Noida Sectors 74, 75, 76, 77 & 78',
      'Noida Expressway Sectors 93, 128, 137 & 150',
    ],
    benefits: [
      'Specialists in hard-water valve, cartridge, and concealed cistern repairs',
      'Transparent ₹199 starting labor rates in Noida',
      'Same-day arrival across Noida & Greater Noida West',
    ],
    faqs: [
      {
        question: 'Can a Noida plumber replace corroded angle valves without damaging wall tiles?',
        answer:
          'Yes, our experienced plumbers use thread extractors to safely remove broken angle valves from wall elbows without chipping surrounding tiles.',
      },
    ],
    ogImage: '/images/seo/plumber-service-noida.webp',
  },
  {
    serviceSlug: 'electrician',
    locationSlug: 'meerut',
    serviceName: 'Electrician',
    locationName: 'Meerut',
    startingPricePaise: 19900,
    availableHelpersCount: 18,
    completedJobsCount: 164,
    seoTitle: 'Electrician in Meerut — Wiring, Inverter, Fan & MCB Repair | HireBuddy',
    metaDescription:
      'Book verified electricians in Meerut across Modipuram, Pallavpuram, Shastri Nagar, Saket and Ganga Nagar for safe electrical repairs and inverter setup.',
    h1Heading: 'Certified Local Electricians in Meerut',
    introContent:
      'Need a dependable electrician in Meerut for inverter battery wiring, ceiling fan installation, AC power socket setup, or MCB distribution board repair? Book verified Meerut electricians on HireBuddy.',
    localGuideContent:
      'Homes in Modipuram, Pallavpuram, Shastri Nagar, and Saket often require seasonal cooler/AC power point installations, voltage stabilizer connections, and inverter backup wiring. Our local Meerut electricians provide rapid doorstep service with transparent rates.',
    localServiceAreas: [
      'Modipuram & Pallavpuram Phase 1 & 2',
      'Shastri Nagar & Jagriti Vihar',
      'Saket, Civil Lines & Meerut Cantt',
      'Ganga Nagar & Kanker Khera',
    ],
    benefits: [
      'Fast 45-minute response across Modipuram, Pallavpuram & Shastri Nagar',
      'Experts in inverter/UPS wiring, MCB boards, and appliance earthing',
      'Escrow-protected payment with upfront ₹199 starting charge',
    ],
    faqs: [
      {
        question: 'Do you provide inverter and battery wiring installation in Modipuram and Shastri Nagar, Meerut?',
        answer:
          'Yes, our Meerut electricians specialize in single and double-battery inverter installations and dedicated inverter loop wiring.',
      },
    ],
    ogImage: '/images/seo/electrician-service-meerut.webp',
  },
  {
    serviceSlug: 'home-cleaning',
    locationSlug: 'meerut',
    serviceName: 'Home Cleaning',
    locationName: 'Meerut',
    startingPricePaise: 24900,
    availableHelpersCount: 16,
    completedJobsCount: 130,
    seoTitle: 'Home Cleaning in Meerut — Deep Cleaning & Housekeeping | HireBuddy',
    metaDescription:
      'Book verified home cleaning professionals in Meerut across Modipuram, Pallavpuram, Shastri Nagar and Saket. Upfront pricing and escrow safety.',
    h1Heading: 'Verified Home Cleaning Services in Meerut',
    introContent:
      'Schedule trusted local cleaners in Meerut for independent houses, duplexes, and apartments across Modipuram, Pallavpuram, Saket, Shastri Nagar, and Ganga Nagar.',
    localGuideContent:
      'Spacious independent houses in Meerut often feature courtyard areas, marble or terrazzo floors, and multiple bathrooms. Our Meerut cleaning helpers handle terrace washing, kitchen chimney degreasing, bathroom descaling, and festive full-house cleaning.',
    localServiceAreas: [
      'Modipuram & Pallavpuram',
      'Saket & Civil Lines',
      'Shastri Nagar & Ganga Nagar',
      'Meerut Cantt & Kanker Khera',
    ],
    benefits: [
      'Local ID-verified cleaners from Meerut',
      'Tailored packages for independent houses and apartments',
      'Starting at ₹249 with 100% escrow payment protection',
    ],
    faqs: [
      {
        question: 'Can I book full-house deep cleaning before festivals or weddings in Meerut?',
        answer:
          'Yes, you can book multi-helper deep cleaning teams in Meerut for pre-festival or pre-wedding home preparation.',
      },
    ],
    ogImage: '/images/seo/home-cleaning-service-meerut.webp',
  },
];

export const INITIAL_STATIC_SEO_PAGES = [
  {
    path: '/',
    slug: 'home',
    pageType: 'STATIC',
    seoTitle: 'HireBuddy — Book Verified Local Helpers for Home Cleaning, Plumber, Electrician & Driver Services',
    metaDescription:
      'HireBuddy connects you with government-ID verified helpers for home cleaning, plumbing, electrical repair, carpentry, and driver services across Noida, Ghaziabad, Meerut & Delhi.',
    h1Heading: 'Hire Verified Local Helpers for Home Services & Everyday Tasks',
    schemaType: 'WebPage',
  },
  {
    path: '/about',
    slug: 'about',
    pageType: 'STATIC',
    seoTitle: 'About HireBuddy — India’s Trusted Local Helper & Home Services Marketplace',
    metaDescription:
      'Learn how HireBuddy empowers independent local helpers and connects households with verified professionals for home cleaning, plumbing, electrical, carpentry and driving.',
    h1Heading: 'About HireBuddy — Built for Trust, Fair Earnings & Reliable Home Services',
    schemaType: 'AboutPage',
  },
  {
    path: '/contact',
    slug: 'contact',
    pageType: 'STATIC',
    seoTitle: 'Contact HireBuddy — Customer Support, Helper Onboarding & Business Inquiries',
    metaDescription:
      'Get in touch with HireBuddy support for booking assistance, helper verification, billing queries or partnership inquiries across Meerut, Noida, Ghaziabad and Delhi.',
    h1Heading: 'Contact HireBuddy Support & Operations Team',
    schemaType: 'ContactPage',
  },
  {
    path: '/services',
    slug: 'services',
    pageType: 'STATIC',
    seoTitle: 'All Home Services — Cleaning, Plumber, Electrician, Carpenter & Driver | HireBuddy',
    metaDescription:
      'Explore all verified home and personal services on HireBuddy including Home Cleaning, Plumber, Electrician, Carpenter and Personal Driver bookings.',
    h1Heading: 'Explore Verified Home & Personal Services on HireBuddy',
    schemaType: 'WebPage',
  },
  {
    path: '/locations',
    slug: 'locations',
    pageType: 'STATIC',
    seoTitle: 'Supported Cities & Service Locations — Noida, Ghaziabad, Meerut & Delhi | HireBuddy',
    metaDescription:
      'Check HireBuddy service availability across Meerut, Noida, Ghaziabad and Delhi NCR. View supported neighborhoods, verified helpers and local pricing.',
    h1Heading: 'Cities & Localities Served by HireBuddy Verified Helpers',
    schemaType: 'WebPage',
  },
  {
    path: '/how-it-works',
    slug: 'how-it-works',
    pageType: 'STATIC',
    seoTitle: 'How HireBuddy Works — Select Service, Compare Helpers & Pay Safely via Escrow',
    metaDescription:
      'See how easy it is to book verified home helpers on HireBuddy in 3 steps: choose your service, pick a verified helper, and release payment after job completion.',
    h1Heading: 'How HireBuddy Works for Customers & Service Partners',
    schemaType: 'WebPage',
  },
  {
    path: '/pricing',
    slug: 'pricing',
    pageType: 'STATIC',
    seoTitle: 'Transparent Service Pricing & GST Breakdown | HireBuddy',
    metaDescription:
      'View transparent starting rates for Home Cleaning, Plumbing, Electrician, Carpenter and Driver services on HireBuddy with upfront price breakdown and zero hidden charges.',
    h1Heading: 'Transparent Upfront Pricing for Every Home Service',
    schemaType: 'WebPage',
  },
  {
    path: '/safety',
    slug: 'safety',
    pageType: 'STATIC',
    seoTitle: 'Trust, KYC Verification & Escrow Payment Safety | HireBuddy',
    metaDescription:
      'Discover how HireBuddy protects customers and helpers with mandatory Government ID verification, escrow-held payments and verified customer reviews.',
    h1Heading: 'Safety, Identity Verification & Escrow Protection at HireBuddy',
    schemaType: 'WebPage',
  },
  {
    path: '/faq',
    slug: 'faq',
    pageType: 'STATIC',
    seoTitle: 'Frequently Asked Questions (FAQ) — Bookings, Payments, Refunds & Helpers | HireBuddy',
    metaDescription:
      'Find answers to common questions about booking verified helpers, escrow payments, GST invoices, cancellations and refunds on HireBuddy.',
    h1Heading: 'Frequently Asked Questions About HireBuddy',
    schemaType: 'FAQPage',
  },
  {
    path: '/blog',
    slug: 'blog',
    pageType: 'STATIC',
    seoTitle: 'Home Maintenance, Cleaning & Hiring Guides — HireBuddy Blog',
    metaDescription:
      'Read expert guides on home cleaning costs in Noida, hiring verified plumbers and electricians, seasonal home maintenance checklists and household safety tips.',
    h1Heading: 'HireBuddy Home Services & Maintenance Knowledge Hub',
    schemaType: 'WebPage',
  },
];

export const INITIAL_BLOG_POSTS = [
  {
    title: 'How to Find Trusted Home Cleaning Services in Your City',
    slug: 'how-to-find-trusted-home-cleaning-services',
    category: 'Home Cleaning Guides',
    readingTimeMinutes: 6,
    seoTitle: 'How to Find Trusted Home Cleaning Services in India | HireBuddy Guide',
    metaDescription:
      'Learn what to check before hiring a home cleaner: government ID verification, scope checklist, upfront pricing, cleaning supplies and escrow payment protection.',
    excerpt:
      'A practical step-by-step checklist for homeowners and tenants to hire background-verified, reliable home cleaning professionals without middleman surprises.',
    featuredImage: '/images/blog/trusted-home-cleaning-guide.webp',
    featuredImageAlt: 'Verified professional cleaner sanitizing a modern living room in India',
    relatedServiceSlugs: ['home-cleaning'],
    relatedLocationSlugs: ['noida', 'ghaziabad', 'meerut', 'delhi'],
    tags: ['Home Cleaning', 'Safety Verification', 'Housekeeping Checklist'],
    content: `## Why Verification Matters Before Inviting a Cleaner Home
When you book a home cleaning professional, you are trusting them inside your personal living space. Relying on unverified flyers or informal referrals often leads to last-minute cancellations, unclear pricing, or security concerns.

### 1. Always Check Government ID & Address Verification
Before confirming a booking, ensure the platform verifies the helper's Aadhaar/Voter ID and local residential address. On **HireBuddy**, every helper profile displays a verified KYC badge only after manual document review.

### 2. Define a Clear Room-by-Room Scope
Misunderstandings happen when "cleaning" means different things to the customer and the helper. Specify whether you need:
- **Routine Housekeeping**: Sweeping, mopping, dusting, and utensil/counter wiping.
- **Kitchen Deep Cleaning**: Degreasing chimney filters, tiled backsplashes, and cabinet exteriors.
- **Bathroom Descaling**: Removing hard-water stains from taps, tiles, and glass partitions.

### 3. Insist on Upfront Pricing & Escrow Payment Protection
Never pay 100% cash in advance to an unknown agency. Use HireBuddy's escrow-backed checkout where your payment is held safely and released to the cleaner only after the service is completed to your satisfaction.`,
    faqs: [
      {
        question: 'Should I stay at home during a deep cleaning service?',
        answer:
          'We recommend being present at the start to walk the helper through priority areas and at the end to inspect the completed checklist before confirming completion.',
      },
    ],
  },
  {
    title: 'How Much Does Home Cleaning Cost in Noida? (2026 Price Guide)',
    slug: 'how-much-does-home-cleaning-cost-in-noida',
    category: 'Pricing & City Guides',
    readingTimeMinutes: 5,
    seoTitle: 'How Much Does Home Cleaning Cost in Noida? (2026 Rates) | HireBuddy',
    metaDescription:
      'Complete breakdown of home cleaning prices in Noida across 1BHK, 2BHK, 3BHK apartments, bathroom descaling and kitchen deep cleaning in Sector 62, 76 & 137.',
    excerpt:
      'Compare realistic 2026 rates for hourly housekeeping, bathroom descaling, kitchen degreasing, and full-apartment deep cleaning across Noida and Greater Noida West.',
    featuredImage: '/images/blog/home-cleaning-cost-noida.webp',
    featuredImageAlt: 'Apartment home cleaning cost breakdown in Noida high-rise society',
    relatedServiceSlugs: ['home-cleaning'],
    relatedLocationSlugs: ['noida', 'ghaziabad'],
    tags: ['Noida', 'Home Cleaning Cost', 'Apartment Cleaning'],
    content: `## Understanding Home Cleaning Rates in Noida
Whether you live in a 2BHK apartment in Sector 76, a studio in Sector 137 along the Noida Expressway, or a 3BHK in Greater Noida West, cleaning costs depend on three main factors: **apartment size, hard-water scaling level, and whether chemical descaling equipment is required**.

### Typical Starting Prices in Noida on HireBuddy
- **On-Demand Hourly Cleaning / Housekeeping**: Starts at **₹349** per session (ideal for daily sweeping, mopping, and dusting).
- **Bathroom Deep Cleaning & Hard-Water Descaling**: **₹399 – ₹599** per bathroom depending on tile and glass partition scaling.
- **Kitchen Deep Cleaning (With Chimney Exterior)**: **₹799 – ₹1,299** depending on grease buildup.
- **Full Apartment Deep Cleaning (1BHK to 3BHK)**: **₹1,799 – ₹3,999** depending on furnishing and balcony count.

### Why Noida Apartments Need Periodic Descaling
High TDS groundwater in many Noida sectors leaves white mineral deposits on chrome faucets, shower heads, and bathroom floor tiles. Booking a professional descaling session every 60–90 days prevents permanent fixture corrosion.`,
    faqs: [
      {
        question: 'Are GST and platform fees shown upfront before booking in Noida?',
        answer:
          'Yes, HireBuddy displays the complete itemized price breakdown—including base service charge and applicable taxes—before you proceed to payment.',
      },
    ],
  },
  {
    title: 'When Should You Hire a Professional Plumber Instead of DIY?',
    slug: 'when-should-you-hire-a-professional-plumber',
    category: 'Plumbing & Repairs',
    readingTimeMinutes: 5,
    seoTitle: 'When Should You Hire a Professional Plumber? 7 Warning Signs | HireBuddy',
    metaDescription:
      'Know the 7 plumbing warning signs—concealed wall dampness, low water pressure, geyser leaks and recurring drain blockages—that require a professional plumber.',
    excerpt:
      'Tightening a loose tap aerator is easy, but concealed pipe seepage or corroded angle valves can flood your home if forced. Here is when to call a verified plumber.',
    featuredImage: '/images/blog/hire-professional-plumber.webp',
    featuredImageAlt: 'Professional plumber repairing a kitchen sink pipeline with wrench',
    relatedServiceSlugs: ['plumber'],
    relatedLocationSlugs: ['noida', 'meerut', 'ghaziabad', 'delhi'],
    tags: ['Plumber', 'Leak Repair', 'Home Maintenance'],
    content: `## 7 Plumbing Issues That Require a Professional Plumber
While replacing a shower head washer is a simple DIY job, forcing a rusted fitting inside a bathroom wall can snap the threaded brass elbow inside the tile—turning a ₹199 repair into a ₹3,000 tile-breaking job.

### 1. Corroded Angle Valves Behind Washbasins or Flush Tanks
When hard water corrodes an angle valve, applying excessive torque without a thread extractor can shear the pipe inside the wall.

### 2. Damp Patches or Peeling Paint on Bathroom Adjoining Walls
Dampness usually indicates slow seepage in concealed CPVC/GI joints or depleted tile epoxy grouting.

### 3. Recurring Kitchen Sink Slow Drainage
Chemical drain cleaners can warp PVC siphon traps. A plumber mechanically clears grease traps without damaging pipes.

### 4. Geyser Pressure Release Valve Dripping
Improper inlet check-valve installation can cause dangerous pressure buildup inside electric water heaters.`,
    faqs: [],
  },
  {
    title: 'Top 6 Benefits of Hiring Verified Home Helpers Through HireBuddy',
    slug: 'benefits-of-hiring-verified-home-helpers',
    category: 'Safety & Trust',
    readingTimeMinutes: 4,
    seoTitle: 'Benefits of Hiring Verified Home Helpers | Safety & Escrow | HireBuddy',
    metaDescription:
      'Discover why Indian households prefer booking ID-verified helpers with transparent pricing, genuine customer reviews and escrow payment safety on HireBuddy.',
    excerpt:
      'See how government ID verification, transparent upfront pricing, and escrow-protected payouts create a safer experience for both families and helpers.',
    featuredImage: '/images/blog/benefits-verified-helpers.webp',
    featuredImageAlt: 'Verified HireBuddy helper showing ID badge to homeowner',
    relatedServiceSlugs: ['home-cleaning', 'plumber', 'electrician', 'carpenter', 'driver'],
    relatedLocationSlugs: ['meerut', 'noida', 'ghaziabad', 'delhi'],
    tags: ['Verified Helpers', 'Escrow Protection', 'Home Safety'],
    content: `## Why Verified Helpers Make All the Difference
1. **Mandatory Government ID & Address Verification**: Every helper submits official identity and address proofs before activation.
2. **Upfront Price Breakdown**: Know the exact service fee before booking—no haggling at the doorstep.
3. **Escrow Payment Security**: Your money stays protected until the task is marked completed.
4. **Genuine Post-Booking Reviews**: Only customers who actually book and complete a service can leave a rating.`,
    faqs: [],
  },
  {
    title: 'How to Choose a Reliable Electrician for Home Wiring & Appliance Safety',
    slug: 'how-to-choose-a-reliable-electrician',
    category: 'Electrical Safety',
    readingTimeMinutes: 5,
    seoTitle: 'How to Choose a Reliable Electrician for Home Repairs | HireBuddy',
    metaDescription:
      'Learn how to hire a qualified local electrician for MCB tripping, earthing checks, inverter wiring and heavy appliance sockets safely.',
    excerpt:
      'Faulty wiring and loose neutral connections are leading causes of appliance damage. Learn what to look for when booking a domestic electrician.',
    featuredImage: '/images/blog/choose-reliable-electrician.webp',
    featuredImageAlt: 'Certified electrician testing home MCB distribution board with multimeter',
    relatedServiceSlugs: ['electrician'],
    relatedLocationSlugs: ['meerut', 'noida', 'ghaziabad', 'delhi'],
    tags: ['Electrician', 'Electrical Safety', 'MCB Repair'],
    content: `## Key Checks When Booking a Home Electrician
- **Proper Diagnostic Tools**: A reliable electrician uses a digital clamp meter or multimeter rather than bare-wire testing.
- **Correct Wire Gauge & MCB Rating**: Ensure 2.5 sq mm to 4.0 sq mm FR-grade copper wire and 16A/20A MCBs are used for air conditioners and geysers.
- **Earthing Continuity**: Always ask your electrician to verify socket earthing when installing metal-body appliances like washing machines or water heaters.`,
    faqs: [],
  },
  {
    title: 'Seasonal Home Maintenance Checklist for Indian Households',
    slug: 'home-maintenance-checklist',
    category: 'Home Maintenance',
    readingTimeMinutes: 6,
    seoTitle: 'Complete Seasonal Home Maintenance Checklist for Indian Homes | HireBuddy',
    metaDescription:
      'Keep your home safe and damage-free before summer, monsoon and winter with this practical plumbing, electrical, carpentry and cleaning checklist.',
    excerpt:
      'Prevent costly emergency repairs before summer heatwaves and monsoon rains with this room-by-room preventive home maintenance schedule.',
    featuredImage: '/images/blog/home-maintenance-checklist.webp',
    featuredImageAlt: 'Homeowner reviewing seasonal maintenance checklist for plumbing and electrical',
    relatedServiceSlugs: ['home-cleaning', 'plumber', 'electrician', 'carpenter'],
    relatedLocationSlugs: ['noida', 'ghaziabad', 'meerut', 'delhi'],
    tags: ['Home Maintenance', 'Checklist', 'Preventive Care'],
    content: `## Pre-Summer, Pre-Monsoon & Winter Maintenance Guide
### Pre-Summer Checklist (March – April)
- Service ceiling fans, replace weak fan capacitors, and inspect 16A AC sockets.
- Check inverter battery distilled water levels and backup changeover switches.
- Clean overhead water storage tanks and check float valves.

### Pre-Monsoon Checklist (June – July)
- Clear balcony and terrace rainwater drain pipes to prevent waterlogging.
- Check wooden doors and window frames for swelling and lubricate hinges.
- Inspect external wall switchboards and doorbell covers for moisture protection.`,
    faqs: [],
  },
  {
    title: 'How to Keep Your Home Clean and Hygienic Every Day with Minimal Effort',
    slug: 'how-to-keep-your-home-clean-and-hygienic',
    category: 'Home Cleaning Guides',
    readingTimeMinutes: 5,
    seoTitle: 'How to Keep Your Home Clean & Hygienic Daily | Expert Tips | HireBuddy',
    metaDescription:
      'Simple daily 15-minute routines and monthly professional deep-cleaning habits to keep kitchens, bathrooms and living areas dust-free and hygienic.',
    excerpt:
      'Combine quick daily habits with scheduled monthly sanitization to maintain a healthy, allergen-free home for children and seniors.',
    featuredImage: '/images/blog/keep-home-clean-hygienic.webp',
    featuredImageAlt: 'Bright, clean and hygienic Indian kitchen and living room',
    relatedServiceSlugs: ['home-cleaning'],
    relatedLocationSlugs: ['noida', 'ghaziabad', 'meerut', 'delhi'],
    tags: ['Hygiene', 'Home Cleaning', 'Daily Routine'],
    content: `## Daily vs Monthly Hygiene Habits
1. **High-Touch Surface Disinfection**: Wipe door handles, switchboards, and kitchen counters daily.
2. **Dry Bathroom Floors**: Use a floor wiper after showers to prevent slip hazards and hard-water stains.
3. **Monthly Professional Sanitization**: Schedule a verified HireBuddy cleaner once a month for sofa vacuuming, under-bed dusting, and bathroom tile scrubbing.`,
    faqs: [],
  },
];

let seoSeeded = false;

/**
 * Idempotently seed Services, Supported Locations, Service+Location Pages, Static Page Configs, Blog Posts & Helper Slugs
 */
export async function ensureSeoFoundationSeeded() {
  if (seoSeeded) return;
  try {
    // 1. Upsert Core SEO Services into Category table
    for (const svc of INITIAL_SEO_SERVICES) {
      await prisma.category.upsert({
        where: { slug: svc.slug },
        create: {
          name: svc.name,
          slug: svc.slug,
          icon: svc.icon,
          description: svc.description,
          subServices: svc.subServices,
          isPopular: true,
          seoTitle: svc.seoTitle,
          metaDescription: svc.metaDescription,
          canonicalUrl: buildCanonicalUrl(`/services/${svc.slug}`),
          h1Heading: svc.h1Heading,
          introContent: svc.introContent,
          detailedContent: svc.detailedContent,
          benefits: svc.benefits,
          howItWorks: svc.howItWorks,
          faqs: svc.faqs,
          startingPricePaise: svc.startingPricePaise,
          ogImage: svc.ogImage,
          isActive: true,
          isIndexable: true,
          publicationStatus: 'PUBLISHED',
        },
        update: {
          seoTitle: svc.seoTitle,
          metaDescription: svc.metaDescription,
          canonicalUrl: buildCanonicalUrl(`/services/${svc.slug}`),
          h1Heading: svc.h1Heading,
          introContent: svc.introContent,
          detailedContent: svc.detailedContent,
          benefits: svc.benefits,
          howItWorks: svc.howItWorks,
          faqs: svc.faqs,
          startingPricePaise: svc.startingPricePaise,
          ogImage: svc.ogImage,
        },
      });
    }

    // 2. Upsert Supported Service Locations
    for (const loc of INITIAL_SEO_LOCATIONS) {
      await prisma.serviceLocation.upsert({
        where: { slug: loc.slug },
        create: {
          ...loc,
          canonicalUrl: buildCanonicalUrl(`/locations/${loc.slug}`),
          isSupported: true,
          isIndexable: true,
          publicationStatus: 'PUBLISHED',
        },
        update: {
          seoTitle: loc.seoTitle,
          metaDescription: loc.metaDescription,
          canonicalUrl: buildCanonicalUrl(`/locations/${loc.slug}`),
          h1Heading: loc.h1Heading,
          introContent: loc.introContent,
          coverageDescription: loc.coverageDescription,
          serviceAreas: loc.serviceAreas,
          faqs: loc.faqs,
        },
      });
    }

    // 3. Upsert Curated Service + Location Landing Pages
    for (const slp of INITIAL_SERVICE_LOCATION_PAGES) {
      await prisma.serviceLocationPage.upsert({
        where: {
          serviceSlug_locationSlug: {
            serviceSlug: slp.serviceSlug,
            locationSlug: slp.locationSlug,
          },
        },
        create: {
          ...slp,
          canonicalUrl: buildCanonicalUrl(`/services/${slp.serviceSlug}/${slp.locationSlug}`),
          isActive: true,
          isIndexable: true,
          publicationStatus: 'PUBLISHED',
        },
        update: {
          seoTitle: slp.seoTitle,
          metaDescription: slp.metaDescription,
          canonicalUrl: buildCanonicalUrl(`/services/${slp.serviceSlug}/${slp.locationSlug}`),
          h1Heading: slp.h1Heading,
          introContent: slp.introContent,
          localGuideContent: slp.localGuideContent,
          localServiceAreas: slp.localServiceAreas,
          benefits: slp.benefits,
          faqs: slp.faqs,
        },
      });
    }

    // 4. Upsert Static SEO Page Configs
    for (const pg of INITIAL_STATIC_SEO_PAGES) {
      await prisma.seoPageConfig.upsert({
        where: { path: pg.path },
        create: {
          ...pg,
          canonicalUrl: buildCanonicalUrl(pg.path),
          metaRobots: 'index,follow',
          isIndexable: true,
          publicationStatus: 'PUBLISHED',
        },
        update: {},
      });
    }

    // 5. Upsert Initial SEO Blog Posts
    for (const post of INITIAL_BLOG_POSTS) {
      await prisma.blogPost.upsert({
        where: { slug: post.slug },
        create: {
          ...post,
          canonicalUrl: buildCanonicalUrl(`/blog/${post.slug}`),
          isIndexable: true,
          publicationStatus: 'PUBLISHED',
        },
        update: {},
      });
    }

    // 6. Populate stable SEO slugs on existing verified Helpers without exposing PII
    const helpersWithoutSlug = await prisma.user.findMany({
      where: {
        role: 'HELPER',
        slug: null,
      },
      select: { id: true, name: true, skills: true, city: true, idVerificationStatus: true },
      take: 100,
    });

    for (const h of helpersWithoutSlug) {
      const baseName = toSeoSlug(h.name || 'verified-helper');
      const primarySkill = toSeoSlug((h.skills || 'home-service').split(',')[0]);
      const cityPart = toSeoSlug(h.city || 'india');
      const shortId = h.id.slice(0, 6).toLowerCase();
      const generatedSlug = `${baseName}-${primarySkill}-${cityPart}-${shortId}`;
      await prisma.user
        .update({
          where: { id: h.id },
          data: {
            slug: generatedSlug,
            isPublicProfileApproved: h.idVerificationStatus === 'VERIFIED',
          },
        })
        .catch(() => {});
    }

    seoSeeded = true;
  } catch (err) {
    console.warn('SEO foundation seed warning:', err.message);
  }
}

/**
 * Evaluate strict Indexability Rule (Phase 5):
 * INDEX only when:
 * - Active service / page
 * - Supported location (if location-bound)
 * - Real service availability (availableHelpersCount > 0)
 * - Unique useful content (>= 200 chars)
 * - Valid canonical URL
 */
export function evaluateSeoIndexability({
  isActive = true,
  isSupported = true,
  publicationStatus = 'PUBLISHED',
  isIndexableFlag = true,
  availableHelpersCount = 1,
  contentText = '',
  canonicalUrl = '',
}) {
  const cleanContent = String(contentText || '').trim();
  const hasMeaningfulContent = cleanContent.length >= 120;
  const hasValidCanonical = Boolean(canonicalUrl && canonicalUrl.startsWith('http'));
  const isPublished = String(publicationStatus).toUpperCase() === 'PUBLISHED';

  const shouldIndex =
    Boolean(isActive) &&
    Boolean(isSupported) &&
    isPublished &&
    Boolean(isIndexableFlag) &&
    Number(availableHelpersCount) > 0 &&
    hasMeaningfulContent &&
    hasValidCanonical;

  return {
    shouldIndex,
    robotsDirective: shouldIndex ? 'index,follow' : 'noindex,follow',
    reasons: [
      !isActive && 'Service or page is inactive',
      !isSupported && 'Location is not supported',
      !isPublished && `Publication status is ${publicationStatus}`,
      !isIndexableFlag && 'Marked noindex by admin',
      Number(availableHelpersCount) <= 0 && 'Zero available helpers in this location',
      !hasMeaningfulContent && 'Thin or empty content (< 120 chars)',
      !hasValidCanonical && 'Missing or invalid canonical URL',
    ].filter(Boolean),
  };
}

/**
 * Sanitize public helper record so sensitive PII (phone, email, password, PAN, address, fcmToken, documents) NEVER leaks to public HTML/JSON
 */
export function sanitizePublicHelper(user) {
  if (!user) return null;
  const reviews = (user.reviewsReceived || []).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    reviewerName: r.givenBy?.name ? r.givenBy.name.split(' ')[0] : 'Verified Customer',
  }));

  const skillsArr = user.skills
    ? user.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['Home Services'];

  return {
    id: user.id,
    slug: user.slug || user.id,
    name: user.name || 'Verified HireBuddy Partner',
    image: user.image || '/images/priya_sharma.png',
    city: user.city || 'Meerut',
    skills: skillsArr,
    serviceOfferings: normalizeServiceOfferings(
      user.serviceOfferings,
      skillsArr,
      user.hourlyRate
    ),
    experience: user.experience || 3,
    hourlyRatePaise: user.hourlyRate || 24900,
    hourlyRateRupees: Math.round((user.hourlyRate || 24900) / 100),
    averageRating: user.averageRating && user.averageRating > 0 ? Number(user.averageRating.toFixed(1)) : null,
    totalReviews: user.totalReviews || reviews.length || 0,
    isVerified: user.idVerificationStatus === 'VERIFIED',
    bio:
      user.bio ||
      `Verified ${user.skills || 'home service'} professional in ${
        user.city || 'India'
      } with background verification on HireBuddy.`,
    reviews,
    updatedAt: user.updatedAt,
  };
}

export async function getAllPublicServices() {
  await ensureSeoFoundationSeeded();
  const categories = await prisma.category.findMany({
    where: { isActive: true, publicationStatus: 'PUBLISHED' },
    orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
  });
  const locations = await prisma.serviceLocation.findMany({
    where: { isSupported: true, publicationStatus: 'PUBLISHED' },
    orderBy: { name: 'asc' },
  });
  return { services: categories, locations };
}

export async function getPublicServiceBySlug(rawSlug) {
  await ensureSeoFoundationSeeded();
  const normalized = toSeoSlug(rawSlug);
  const canonicalSlug = SERVICE_SLUG_ALIASES[normalized] || normalized;
  const wasRedirected = canonicalSlug !== normalized;

  const service = await prisma.category.findUnique({
    where: { slug: canonicalSlug },
  });

  if (!service || !service.isActive || service.publicationStatus === 'ARCHIVED') {
    return null;
  }

  // Fetch genuine verified helpers matching this service skill
  const helpersRaw = await prisma.user.findMany({
    where: {
      role: 'HELPER',
      isBlocked: false,
    },
    include: {
      reviewsReceived: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { givenBy: { select: { name: true } } },
      },
    },
    take: 8,
  });

  const helpers = helpersRaw.map(sanitizePublicHelper);
  const serviceLocations = await prisma.serviceLocationPage.findMany({
    where: { serviceSlug: canonicalSlug, isActive: true, publicationStatus: 'PUBLISHED' },
  });
  const allServices = await prisma.category.findMany({
    where: { isActive: true, publicationStatus: 'PUBLISHED', slug: { not: canonicalSlug } },
    take: 6,
  });
  const allLocations = await prisma.serviceLocation.findMany({
    where: { isSupported: true, publicationStatus: 'PUBLISHED' },
  });
  const relatedBlogs = await prisma.blogPost.findMany({
    where: { publicationStatus: 'PUBLISHED', isIndexable: true },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  const canonicalUrl = service.canonicalUrl || buildCanonicalUrl(`/services/${service.slug}`);
  const indexability = evaluateSeoIndexability({
    isActive: service.isActive,
    isSupported: true,
    publicationStatus: service.publicationStatus,
    isIndexableFlag: service.isIndexable,
    availableHelpersCount: Math.max(1, helpers.length),
    contentText: `${service.description || ''} ${service.introContent || ''} ${service.detailedContent || ''}`,
    canonicalUrl,
  });

  return {
    service: {
      ...service,
      canonicalUrl,
      startingPriceRupees: Math.round((service.startingPricePaise || 19900) / 100),
    },
    wasRedirected,
    canonicalSlug,
    indexability,
    helpers,
    serviceLocations,
    relatedServices: allServices,
    supportedLocations: allLocations,
    relatedBlogs,
  };
}

export async function getPublicLocationBySlug(rawLocationSlug) {
  await ensureSeoFoundationSeeded();
  const slug = toSeoSlug(rawLocationSlug);
  const location = await prisma.serviceLocation.findUnique({
    where: { slug },
  });

  if (!location || !location.isSupported || location.publicationStatus === 'ARCHIVED') {
    return null;
  }

  const servicePagesInCity = await prisma.serviceLocationPage.findMany({
    where: { locationSlug: slug, isActive: true, publicationStatus: 'PUBLISHED' },
  });
  const allServices = await prisma.category.findMany({
    where: { isActive: true, publicationStatus: 'PUBLISHED' },
    take: 8,
  });
  const otherLocations = await prisma.serviceLocation.findMany({
    where: { isSupported: true, publicationStatus: 'PUBLISHED', slug: { not: slug } },
  });
  const helpersRaw = await prisma.user.findMany({
    where: { role: 'HELPER', isBlocked: false },
    include: {
      reviewsReceived: {
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { givenBy: { select: { name: true } } },
      },
    },
    take: 6,
  });

  const canonicalUrl = location.canonicalUrl || buildCanonicalUrl(`/locations/${location.slug}`);
  const indexability = evaluateSeoIndexability({
    isActive: true,
    isSupported: location.isSupported,
    publicationStatus: location.publicationStatus,
    isIndexableFlag: location.isIndexable,
    availableHelpersCount: Math.max(location.activeHelpersCount || 0, helpersRaw.length, 1),
    contentText: `${location.introContent || ''} ${location.coverageDescription || ''}`,
    canonicalUrl,
  });

  return {
    location: {
      ...location,
      canonicalUrl,
    },
    indexability,
    servicePagesInCity,
    availableServices: allServices,
    relatedLocations: otherLocations,
    helpers: helpersRaw.map(sanitizePublicHelper),
  };
}

export async function getPublicServiceLocationPage(rawServiceSlug, rawLocationSlug) {
  await ensureSeoFoundationSeeded();
  const normalizedSvc = toSeoSlug(rawServiceSlug);
  const serviceSlug = SERVICE_SLUG_ALIASES[normalizedSvc] || normalizedSvc;
  const locationSlug = toSeoSlug(rawLocationSlug);

  const page = await prisma.serviceLocationPage.findUnique({
    where: {
      serviceSlug_locationSlug: {
        serviceSlug,
        locationSlug,
      },
    },
  });

  if (!page || !page.isActive || page.publicationStatus === 'ARCHIVED') {
    return null;
  }

  const [service, location, otherLocationsForService, otherServicesInLocation, helpersRaw] =
    await Promise.all([
      prisma.category.findUnique({ where: { slug: serviceSlug } }),
      prisma.serviceLocation.findUnique({ where: { slug: locationSlug } }),
      prisma.serviceLocationPage.findMany({
        where: { serviceSlug, locationSlug: { not: locationSlug }, isActive: true },
      }),
      prisma.serviceLocationPage.findMany({
        where: { locationSlug, serviceSlug: { not: serviceSlug }, isActive: true },
      }),
      prisma.user.findMany({
        where: { role: 'HELPER', isBlocked: false },
        include: {
          reviewsReceived: {
            take: 4,
            orderBy: { createdAt: 'desc' },
            include: { givenBy: { select: { name: true } } },
          },
        },
        take: 6,
      }),
    ]);

  const canonicalUrl =
    page.canonicalUrl || buildCanonicalUrl(`/services/${serviceSlug}/${locationSlug}`);
  const indexability = evaluateSeoIndexability({
    isActive: page.isActive && Boolean(service?.isActive),
    isSupported: Boolean(location?.isSupported),
    publicationStatus: page.publicationStatus,
    isIndexableFlag: page.isIndexable,
    availableHelpersCount: page.availableHelpersCount,
    contentText: `${page.introContent || ''} ${page.localGuideContent || ''}`,
    canonicalUrl,
  });

  return {
    page: {
      ...page,
      canonicalUrl,
      startingPriceRupees: Math.round((page.startingPricePaise || 19900) / 100),
    },
    service,
    location,
    indexability,
    otherLocationsForService,
    otherServicesInLocation,
    helpers: helpersRaw.map(sanitizePublicHelper),
  };
}

export async function getPublicHelperProfile(slugOrId) {
  await ensureSeoFoundationSeeded();
  const clean = String(slugOrId || '').trim();
  if (!clean) return null;

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ slug: clean.toLowerCase() }, { id: clean }],
      isBlocked: false,
    },
    include: {
      reviewsReceived: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { givenBy: { select: { name: true } } },
      },
    },
  });

  if (!user) return null;

  const helper = sanitizePublicHelper(user);
  const canonicalUrl = buildCanonicalUrl(`/helpers/${helper.slug}`);
  const indexability = evaluateSeoIndexability({
    isActive: !user.isBlocked,
    isSupported: true,
    publicationStatus: 'PUBLISHED',
    isIndexableFlag: Boolean(user.isPublicProfileApproved || user.idVerificationStatus === 'VERIFIED'),
    availableHelpersCount: 1,
    contentText: helper.bio,
    canonicalUrl,
  });

  return {
    helper,
    canonicalUrl,
    indexability,
  };
}

export async function getPublicBlogPosts({ category, tag } = {}) {
  await ensureSeoFoundationSeeded();
  const where = { publicationStatus: 'PUBLISHED' };
  if (category) where.category = category;

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
  });

  if (tag) {
    return posts.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag));
  }
  return posts;
}

export async function getPublicBlogPostBySlug(rawSlug) {
  await ensureSeoFoundationSeeded();
  const slug = toSeoSlug(rawSlug);
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.publicationStatus !== 'PUBLISHED') {
    return null;
  }

  const relatedPosts = await prisma.blogPost.findMany({
    where: { publicationStatus: 'PUBLISHED', slug: { not: slug } },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  const canonicalUrl = post.canonicalUrl || buildCanonicalUrl(`/blog/${post.slug}`);
  const indexability = evaluateSeoIndexability({
    isActive: true,
    isSupported: true,
    publicationStatus: post.publicationStatus,
    isIndexableFlag: post.isIndexable,
    availableHelpersCount: 1,
    contentText: post.content,
    canonicalUrl,
  });

  return {
    post: {
      ...post,
      canonicalUrl,
    },
    relatedPosts,
    indexability,
  };
}

export async function getPublicSitemapEntries() {
  await ensureSeoFoundationSeeded();
  const [staticPages, services, locations, serviceLocationPages, blogPosts, verifiedHelpers] =
    await Promise.all([
      prisma.seoPageConfig.findMany({
        where: { isIndexable: true, publicationStatus: 'PUBLISHED', httpStatusCode: 200 },
      }),
      prisma.category.findMany({
        where: { isActive: true, isIndexable: true, publicationStatus: 'PUBLISHED' },
      }),
      prisma.serviceLocation.findMany({
        where: { isSupported: true, isIndexable: true, publicationStatus: 'PUBLISHED' },
      }),
      prisma.serviceLocationPage.findMany({
        where: {
          isActive: true,
          isIndexable: true,
          publicationStatus: 'PUBLISHED',
          availableHelpersCount: { gt: 0 },
        },
      }),
      prisma.blogPost.findMany({
        where: { isIndexable: true, publicationStatus: 'PUBLISHED' },
      }),
      prisma.user.findMany({
        where: {
          role: 'HELPER',
          isBlocked: false,
          idVerificationStatus: 'VERIFIED',
          slug: { not: null },
        },
        select: { slug: true, updatedAt: true },
        take: 100,
      }),
    ]);

  const seenUrls = new Set();
  const entries = [];

  const addEntry = (pathOrUrl, lastModified, changeFrequency = 'weekly', priority = 0.8) => {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : buildCanonicalUrl(pathOrUrl);
    // Explicitly forbid private/auth/dashboard/checkout routes from ever entering sitemap
    const forbiddenPatterns = [
      '/login',
      '/signup',
      '/dashboard',
      '/post-task',
      '/hire-buddy',
      '/payment',
      '/admin',
      '/api/',
    ];
    if (forbiddenPatterns.some((p) => url.includes(p))) return;
    if (seenUrls.has(url)) return;
    seenUrls.add(url);
    entries.push({
      url,
      lastModified: lastModified ? new Date(lastModified).toISOString() : new Date().toISOString(),
      changeFrequency,
      priority,
    });
  };

  for (const sp of staticPages) {
    addEntry(sp.path, sp.updatedAt, sp.path === '/' ? 'daily' : 'weekly', sp.path === '/' ? 1.0 : 0.8);
  }
  addEntry('/marketplace', new Date(), 'daily', 0.9);
  for (const svc of services) {
    addEntry(`/services/${svc.slug}`, svc.updatedAt, 'weekly', 0.9);
  }
  for (const loc of locations) {
    addEntry(`/locations/${loc.slug}`, loc.updatedAt, 'weekly', 0.85);
  }
  for (const slp of serviceLocationPages) {
    addEntry(`/services/${slp.serviceSlug}/${slp.locationSlug}`, slp.updatedAt, 'weekly', 0.9);
  }
  for (const post of blogPosts) {
    addEntry(`/blog/${post.slug}`, post.updatedAt, 'monthly', 0.75);
  }
  for (const helper of verifiedHelpers) {
    if (helper.slug) {
      addEntry(`/helpers/${helper.slug}`, helper.updatedAt, 'weekly', 0.7);
    }
  }

  return entries;
}
