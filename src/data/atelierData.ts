export type SectionId =
  | 'top'
  | 'wash-clean'
  | 'exterior-detailing'
  | 'interior-detailing'
  | 'correction'
  | 'ceramic'
  | 'colour'
  | 'studio'
  | 'book'
  | 'faq';

export type PackageId = 'gloss' | 'shield' | 'signature';

export type PpfFinishId = 'gloss' | 'stealth';

export type ServiceCategoryId =
  | 'wash-clean'
  | 'exterior-detailing'
  | 'interior-detailing'
  | 'paint-correction'
  | 'ceramic-graphene'
  | 'ppf-protection'
  | 'wrap-customization'
  | 'restoration-specialty';

export type WrapColourId =
  | 'liquid-chrome'
  | 'racing-green'
  | 'papaya'
  | 'nardo-grey'
  | 'pearl-white';

export interface ServiceStat {
  value: string;
  label: string;
}

export interface ServiceStage {
  id: 'correction' | 'ceramic' | 'film' | 'colour';
  categoryId: ServiceCategoryId;
  defaultSubService: string;
  indexLabel: string;
  category: string;
  headline: string;
  description: string;
  stats: ServiceStat[];
  priceFrom: string;
  align: 'left' | 'right';
  finishReadout: string;
  scanTint: string;
}

export interface MainServiceCategory {
  id: ServiceCategoryId;
  index: string;
  title: string;
  summary: string;
  startingPrice: string;
  mappedPackageId: PackageId;
  subServices: string[];
}

export interface WrapColour {
  id: WrapColourId;
  name: string;
  finishType: string;
  swatchHex: string;
  swatchSecondaryHex: string;
  overlayColor: string;
  overlayOpacity: number;
  overlayBlend: 'multiply' | 'color' | 'soft-light' | 'overlay';
  imageFilter: string;
  glowColor: string;
  readout: string;
}

export interface DetailingPackage {
  id: PackageId;
  name: string;
  description: string;
  price: number;
  priceFormatted: string;
  duration: string;
  minDays: number;
  maxDays: number;
  highlights: string[];
}

export interface ChapterItem {
  id: SectionId;
  label: string;
  shortIndex: string;
}

export interface StudioReview {
  id: string;
  headline: string;
  author: string;
  initials: string;
  coInitials: string;
  meta: string;
  serviceTag: string;
  rating: string;
  quote: string;
  secondaryQuote: string;
  showcaseImage: string;
  showcaseAlt: string;
}

export interface StudioFaqItem {
  id: string;
  number: string;
  question: string;
  answer: string;
}

export const STUDIO_INFO = {
  brandName: 'THE DETAILING STUDIO',
  brandHindi: 'थे डिटेलिंग स्टूडियो ग्रेटर नोएडा',
  city: 'Greater Noida',
  address:
    'Plot No 204, Behind ATS Dolce, Sakipur, Zeta I, Greater Noida, Uttar Pradesh 201310',
  shortAddress: 'Plot No 204, Behind ATS Dolce, Zeta I, Greater Noida',
  plusCode: 'FGWF+X9 Greater Noida, Uttar Pradesh',
  phoneDisplay: '081918 11100',
  phoneHref: 'tel:+918191811100',
  hours: 'Open Daily · 9:00 AM – 8:00 PM',
  rating: '4.4',
  reviewCount: 70,
} as const;

export const CHAPTERS: ChapterItem[] = [
  { id: 'top', label: 'Overview', shortIndex: '00' },
  { id: 'wash-clean', label: 'Wash & Clean', shortIndex: '01' },
  { id: 'exterior-detailing', label: 'Exterior Detailing', shortIndex: '02' },
  { id: 'interior-detailing', label: 'Interior Detailing', shortIndex: '03' },
  { id: 'correction', label: 'Polishing & Correction', shortIndex: '04' },
  { id: 'ceramic', label: 'Paint Protection', shortIndex: '05' },
  { id: 'colour', label: 'Wrap & Colour', shortIndex: '06' },
  { id: 'studio', label: 'Zeta I Atelier', shortIndex: '07' },
  { id: 'book', label: 'Book Inspection', shortIndex: '08' },
  { id: 'faq', label: 'FAQ', shortIndex: '09' },
];

export const MAIN_SERVICE_CATEGORIES: MainServiceCategory[] = [
  {
    id: 'wash-clean',
    index: '01',
    title: 'Wash & Clean',
    summary:
      'pH-neutral snow foam, safe two-bucket hand washes, underbody flush, and crisp cabin vacuuming.',
    startingPrice: '₹800',
    mappedPackageId: 'gloss',
    subServices: [
      'Premium Hand Wash',
      'Foam Wash',
      'Pressure Wash',
      'Underbody Wash',
      'Wheel & Tyre Wash',
      'Engine Bay Cleaning',
      'Interior Vacuuming',
    ],
  },
  {
    id: 'exterior-detailing',
    index: '02',
    title: 'Exterior Detailing',
    summary:
      'Iron and clay decontamination, tar and water-spot removal, trim revival, and brightwork polishing.',
    startingPrice: '₹3,200',
    mappedPackageId: 'gloss',
    subServices: [
      'Exterior Deep Cleaning',
      'Paint Decontamination',
      'Clay Bar Treatment',
      'Tar & Bug Removal',
      'Chrome Polishing',
      'Plastic Trim Restoration',
      'Glass Cleaning',
      'Water Spot Removal',
    ],
  },
  {
    id: 'interior-detailing',
    index: '03',
    title: 'Interior Detailing',
    summary:
      'Deep steam sanitization, leather conditioning, roof liner care, and odour elimination for a factory-fresh cabin.',
    startingPrice: '₹2,500',
    mappedPackageId: 'gloss',
    subServices: [
      'Deep Interior Cleaning',
      'Leather & Fabric Seat Cleaning',
      'Carpet & Mat Shampooing',
      'Dashboard & Door Panel Cleaning',
      'Roof Liner Cleaning',
      'AC Vent Cleaning',
      'Steam Cleaning',
      'Odour Removal & Sanitization',
      'Leather Conditioning',
    ],
  },
  {
    id: 'paint-correction',
    index: '04',
    title: 'Paint Correction',
    summary:
      'Calibrated rotary and dual-action compounding to eliminate swirls, oxidation, and wash-induced scratches.',
    startingPrice: '₹6,500',
    mappedPackageId: 'gloss',
    subServices: [
      'Machine Polishing',
      'Scratch Removal',
      'Swirl Mark Removal',
      'Oxidation Removal',
      'Multi-Stage Paint Correction',
      'Gloss Enhancement',
      'Paint Restoration',
    ],
  },
  {
    id: 'ceramic-graphene',
    index: '05',
    title: 'Ceramic & Graphene Coating',
    summary:
      'High-solids 9H ceramic and graphene protection bonded across paintwork, glass, and alloys.',
    startingPrice: '₹18,500',
    mappedPackageId: 'shield',
    subServices: [
      'Ceramic Coating',
      'Graphene Coating',
      'Nano Coating',
      'Paint Sealant',
      'Car Waxing',
      'Hydrophobic Protection',
      'Glass Coating',
      'Wheel Coating',
    ],
  },
  {
    id: 'ppf-protection',
    index: '06',
    title: 'PPF Protection',
    summary:
      'Self-healing TPU paint protection film in optical gloss, stealth matte, or bespoke colours.',
    startingPrice: '₹22,000',
    mappedPackageId: 'signature',
    subServices: [
      'Full Body PPF',
      'Partial PPF',
      'Front-End PPF',
      'Hood & Bumper Protection',
      'Fender & Door Protection',
      'Mirror & Headlight PPF',
      'Gloss PPF',
      'Matte PPF',
      'Coloured PPF',
    ],
  },
  {
    id: 'wrap-customization',
    index: '07',
    title: 'Wrap & Customization',
    summary:
      'Reversible full or partial vinyl wraps, satin and chrome finishes, carbon accents, and bespoke styling.',
    startingPrice: '₹42,000',
    mappedPackageId: 'signature',
    subServices: [
      'Full & Partial Vinyl Wrap',
      'Colour Change Wrap',
      'Matte, Gloss & Satin Wrap',
      'Chrome Wrap',
      'Carbon Fibre Wrap',
      'Roof Wrap',
      'Decals & Graphics',
      'Custom Styling',
    ],
  },
  {
    id: 'restoration-specialty',
    index: '08',
    title: 'Restoration & Specialty Services',
    summary:
      'Headlight and alloy restoration, dent repair, new-car protection, pickup & drop, and tailored maintenance plans.',
    startingPrice: '₹1,800',
    mappedPackageId: 'shield',
    subServices: [
      'Headlight & Taillight Restoration',
      'Wheel & Alloy Restoration',
      'Tyre Dressing & Protection',
      'Glass Polishing & Tinting',
      'Dent & Scratch Repair',
      'Paint Touch-Up',
      'Engine Bay & Underbody Detailing',
      'Luxury, Classic & Supercar Detailing',
      'Pre-Sale Detailing',
      'New Car Protection',
      'Fleet Detailing',
      'Mobile Detailing',
      'Pickup & Drop',
      'Maintenance Plans',
      'Custom Detailing Packages',
    ],
  },
];

export const SERVICE_STAGES: ServiceStage[] = [
  {
    id: 'correction',
    categoryId: 'paint-correction',
    defaultSubService: 'Multi-Stage Paint Correction',
    indexLabel: '01 / 04 · Paint correction',
    category: 'Paint correction',
    headline: 'Swirls out. Mirror in.',
    description:
      'Daily Greater Noida dust and improper washes leave haze, swirls and oxidation. We machine-polish every panel under inspection light until the paint reflects like glass again.',
    stats: [
      { value: '90%+', label: 'swirls removed' },
      { value: 'Multi-stage', label: 'cut and refine' },
      { value: '1–2 days', label: 'in the studio' },
    ],
    priceFrom: '₹6,500',
    align: 'left',
    finishReadout: 'Obsidian · mirror cut',
    scanTint: 'rgba(255, 184, 112, 0.72)',
  },
  {
    id: 'ceramic',
    categoryId: 'ceramic-graphene',
    defaultSubService: 'Graphene Coating',
    indexLabel: '02 / 04 · Ceramic & graphene coating',
    category: 'Ceramic & graphene',
    headline: 'Gloss you could fall into.',
    description:
      'A 9H nano-ceramic or graphene shield bonds permanently to clear coat. Deeper colour, tight water beading, UV defense, and effortless weekly washes.',
    stats: [
      { value: '9H / 10H', label: 'ceramic & graphene' },
      { value: '5 years', label: 'protection warranty' },
      { value: '−70%', label: 'wash effort' },
    ],
    priceFrom: '₹18,500',
    align: 'right',
    finishReadout: 'Obsidian · 9H graphene',
    scanTint: 'rgba(143, 227, 255, 0.7)',
  },
  {
    id: 'film',
    categoryId: 'ppf-protection',
    defaultSubService: 'Full Body PPF',
    indexLabel: '03 / 04 · PPF protection',
    category: 'PPF protection',
    headline: 'Stone chips hit the film.',
    description:
      'Self-healing TPU film absorbs expressway gravel and road debris—not your factory paint. Choose Gloss PPF for deep clarity, Matte PPF for stealth satin, or Coloured PPF.',
    stats: [
      { value: '8.5 mil', label: 'self-healing TPU' },
      { value: 'Heat-heals', label: 'minor scratches' },
      { value: '5–10 yrs', label: 'film warranty' },
    ],
    priceFrom: '₹22,000',
    align: 'left',
    finishReadout: 'Obsidian · matte PPF',
    scanTint: 'rgba(236, 232, 223, 0.65)',
  },
  {
    id: 'colour',
    categoryId: 'wrap-customization',
    defaultSubService: 'Colour Change Wrap',
    indexLabel: 'Bespoke · Wrap & customization',
    category: 'Colour change wrap',
    headline: 'Any colour. Paint untouched.',
    description:
      'Transform your vehicle with reversible vinyl or coloured PPF—matte, satin, gloss, chrome, or carbon fibre accents. Select a finish to preview.',
    stats: [
      { value: '100%', label: 'factory paint safe' },
      { value: 'Tucked', label: 'seamless edges' },
      { value: '4–6 days', label: 'studio installation' },
    ],
    priceFrom: '₹42,000',
    align: 'right',
    finishReadout: 'British Racing Emerald · satin',
    scanTint: 'rgba(24, 110, 76, 0.72)',
  },
];

export const WRAP_COLOURS: WrapColour[] = [
  {
    id: 'liquid-chrome',
    name: 'Liquid chrome',
    finishType: 'Mirror metallic',
    swatchHex: '#DCE2E9',
    swatchSecondaryHex: '#8E99A6',
    overlayColor: '#D6E0EC',
    overlayOpacity: 0.12,
    overlayBlend: 'soft-light',
    imageFilter: 'contrast(1.08) brightness(1.03) saturate(0.95)',
    glowColor: 'rgba(220, 232, 245, 0.65)',
    readout: 'Liquid chrome · mirror',
  },
  {
    id: 'racing-green',
    name: 'Racing green',
    finishType: 'Deep metallic gloss',
    swatchHex: '#1D5E3F',
    swatchSecondaryHex: '#0A281A',
    overlayColor: '#156B42',
    overlayOpacity: 0.74,
    overlayBlend: 'multiply',
    imageFilter: 'contrast(1.16) brightness(1.02) saturate(1.18)',
    glowColor: 'rgba(64, 186, 122, 0.68)',
    readout: 'Racing green · gloss',
  },
  {
    id: 'papaya',
    name: 'Papaya',
    finishType: 'Signature satin-gloss',
    swatchHex: '#EB6E1F',
    swatchSecondaryHex: '#9D3B08',
    overlayColor: '#EE6D1C',
    overlayOpacity: 0.74,
    overlayBlend: 'multiply',
    imageFilter: 'contrast(1.12) brightness(1.08) saturate(1.24)',
    glowColor: 'rgba(255, 142, 66, 0.72)',
    readout: 'Papaya · satin gloss',
  },
  {
    id: 'nardo-grey',
    name: 'Nardo grey',
    finishType: 'Architectural solid',
    swatchHex: '#7A818A',
    swatchSecondaryHex: '#4A5058',
    overlayColor: '#6C737C',
    overlayOpacity: 0.66,
    overlayBlend: 'multiply',
    imageFilter: 'contrast(1.04) brightness(0.9) saturate(0.2)',
    glowColor: 'rgba(170, 178, 190, 0.62)',
    readout: 'Nardo grey · solid gloss',
  },
  {
    id: 'pearl-white',
    name: 'Pearl white',
    finishType: 'Tri-coat satin pearl',
    swatchHex: '#F4F1E8',
    swatchSecondaryHex: '#C9C3B4',
    overlayColor: '#F5EFE0',
    overlayOpacity: 0.34,
    overlayBlend: 'soft-light',
    imageFilter: 'contrast(1.02) brightness(1.16) saturate(0.75)',
    glowColor: 'rgba(255, 246, 224, 0.7)',
    readout: 'Pearl white · tri-coat',
  },
];

export const PACKAGES: DetailingPackage[] = [
  {
    id: 'gloss',
    name: 'Gloss',
    description:
      'Foam wash, clay decontamination, multi-stage correction, and paint sealant.',
    price: 6500,
    priceFormatted: '₹6,500',
    duration: '1–2 days',
    minDays: 1,
    maxDays: 2,
    highlights: [
      'Premium hand wash, iron decontamination & clay bar treatment',
      '2-stage swirl mark & oxidation removal under LED inspection',
      'Hydrophobic SiO2 paint sealant & tyre dressing',
    ],
  },
  {
    id: 'shield',
    name: 'Shield',
    description:
      'Paint correction, 9H ceramic or graphene coating, glass and alloy protection.',
    price: 18500,
    priceFormatted: '₹18,500',
    duration: '2–3 days',
    minDays: 2,
    maxDays: 3,
    highlights: [
      'Multi-stage mirror paint correction across every panel',
      'Dual-layer 9H ceramic or graphene coating with warranty',
      'Hydrophobic glass coating, wheel coating & deep cabin vacuum',
    ],
  },
  {
    id: 'signature',
    name: 'Signature',
    description:
      'Full-body self-healing TPU PPF, ceramic top-coat, and deep interior detailing.',
    price: 65000,
    priceFormatted: '₹65,000',
    duration: '4–5 days',
    minDays: 4,
    maxDays: 5,
    highlights: [
      'Full-body Gloss, Matte, or Coloured TPU PPF with tucked edges',
      'Ceramic top-coat over film for slick hydrophobic beading',
      'Deep interior steam sanitization, leather conditioning & pickup/drop',
    ],
  },
];

export const STUDIO_REVIEWS: StudioReview[] = [
  {
    id: 'rev-1',
    headline: 'Mirror Gloss & Careful Handcrafted Attention',
    author: 'Shazia Adil',
    initials: 'SA',
    coInitials: 'GN',
    meta: 'Verified Google Review · Greater Noida',
    serviceTag: 'Paint Correction & 9H Ceramic',
    rating: '5.0 / 5',
    quote:
      'I had an absolutely wonderful experience at The Detailing Studio, Greater Noida—excellent workmanship, transparent pricing, and attentive care from start to finish.',
    secondaryQuote:
      'Every panel was inspected under calibrated studio lighting before handover, leaving a deep liquid reflection and effortless maintenance weeks later.',
    showcaseImage: '/assets/detailing/video-01/frames/frame_00010.webp',
    showcaseAlt:
      'Black Porsche gleaming under overhead studio LED lighting after paint correction and detailing',
  },
  {
    id: 'rev-2',
    headline: 'Seamless Self-Healing PPF & Transparent Guidance',
    author: 'Adil Iqbal',
    initials: 'AI',
    coInitials: 'ZI',
    meta: 'Verified Google Review · Zeta I',
    serviceTag: 'Full-Body TPU PPF',
    rating: '5.0 / 5',
    quote:
      'Best PPF studio in Greater Noida with honest, transparent pricing and polite staff who walk you through every panel before handover.',
    secondaryQuote:
      'All film edges are cleanly tucked with zero visible seams, preserving the factory clear coat against daily expressway stone chips and dust.',
    showcaseImage: '/assets/detailing/video-02/frames/frame_00098.webp',
    showcaseAlt:
      'Tight hydrophobic water beading across mirror-black protected automotive clear coat',
  },
  {
    id: 'rev-3',
    headline: 'Studio-Grade Graphene Depth & Zero Swirls',
    author: 'Rohan Malhotra',
    initials: 'RM',
    coInitials: 'GN',
    meta: 'Verified Studio Client · Greater Noida',
    serviceTag: 'Multi-Stage Correction & Graphene',
    rating: '5.0 / 5',
    quote:
      'Brought in a swirl-heavy black coupe and got back paintwork clearer than showroom delivery—zero holograms under harsh sunlight.',
    secondaryQuote:
      'Single-vehicle bay discipline really shows in the final curing and trim finishing; water sheets straight off after every rinse.',
    showcaseImage: '/assets/detailing/video-02/frames/frame_00085.webp',
    showcaseAlt:
      'Detailer in black gloves applying ceramic protection onto a mirror-black hood under studio lights',
  },
];

export const STUDIO_FAQS: StudioFaqItem[] = [
  {
    id: 'faq-01',
    number: '01',
    question: 'What is professional car detailing?',
    answer:
      'Car detailing is a deep cleaning, restoration and protection process that enhances your vehicle’s interior, exterior and overall appearance beyond a regular car wash.',
  },
  {
    id: 'faq-02',
    number: '02',
    question: 'How long does a detailing service take?',
    answer:
      "The duration depends on the service selected and your vehicle's condition. Some services take a few hours, while paint correction and protection treatments may require more time.",
  },
  {
    id: 'faq-03',
    number: '03',
    question: 'Can detailing remove scratches from my car?',
    answer:
      'Minor scratches and swirl marks can often be reduced through paint correction. Deeper scratches may require additional repair.',
  },
  {
    id: 'faq-04',
    number: '04',
    question: 'How long does paint protection last?',
    answer:
      'Durability depends on the protection product, application quality, driving conditions and maintenance.',
  },
  {
    id: 'faq-05',
    number: '05',
    question: 'What is the difference between polishing and paint correction?',
    answer:
      'Polishing enhances gloss and smoothness, while paint correction focuses on correcting paint defects such as swirl marks, scratches, haze and oxidation.',
  },
  {
    id: 'faq-06',
    number: '06',
    question: 'Does a car wrap damage the original paint?',
    answer:
      'A professionally installed and properly removed wrap generally protects the original paint. However, pre-existing paint damage, poor-quality paint or improper removal can affect the result.',
  },
  {
    id: 'faq-07',
    number: '07',
    question: 'How often should I get my car detailed?',
    answer:
      'It depends on your driving habits, environment and maintenance. Regular cleaning helps maintain your vehicle, while deep detailing can be scheduled periodically as needed.',
  },
  {
    id: 'faq-08',
    number: '08',
    question: 'Do I need an appointment before visiting?',
    answer:
      'We recommend booking in advance to ensure availability and allow us to provide the right detailing service for your vehicle.',
  },
];

export const INSPECTION_SLOTS = [
  '09:30 AM',
  '11:00 AM',
  '01:30 PM',
  '03:30 PM',
  '05:30 PM',
] as const;

export const WRAP_ADDON_PRICE = 42000;
export const INTERIOR_ADDON_PRICE = 3500;
