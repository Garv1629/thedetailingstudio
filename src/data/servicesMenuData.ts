export type ServiceMenuCategoryId =
  | 'wash-clean'
  | 'exterior-detailing'
  | 'interior-detailing'
  | 'polishing-paint-correction'
  | 'paint-protection';

export type ServiceCategoryIconKey =
  | 'droplets'
  | 'armchair'
  | 'car'
  | 'sparkles'
  | 'shield';

export interface DetailingServiceItem {
  id: string;
  name: string;
  /** Editable short description displayed when the service row is selected */
  description: string;
  /** Editable placeholder pricing field — replace with studio rates when ready */
  pricePlaceholder: string;
  /** Editable placeholder duration field — replace with bay timings when ready */
  durationPlaceholder: string;
}

export interface DetailingServiceCategory {
  id: ServiceMenuCategoryId;
  index: string;
  title: string;
  icon: ServiceCategoryIconKey;
  services: DetailingServiceItem[];
}

/**
 * Shared editable placeholders for service pricing and duration.
 * Update individual service objects below when publishing fixed studio tariffs.
 */
export const DEFAULT_PRICE_PLACEHOLDER = 'Price on request';
export const DEFAULT_DURATION_PLACEHOLDER = 'Confirmed upon inspection';

export const SERVICES_MENU_CATEGORIES: DetailingServiceCategory[] = [
  {
    id: 'wash-clean',
    index: '01',
    title: 'Wash & Clean',
    icon: 'droplets',
    services: [
      {
        id: 'wash-foam-wash',
        name: 'Foam Wash',
        description:
          'Dense pH-neutral snow foam pre-soak to lift road film and surface dust safely before contact washing.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'wash-premium-hand-wash',
        name: 'Premium Hand Wash',
        description:
          'Controlled two-bucket microfibre hand wash using plush mitts and filtered water to preserve gloss.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'wash-pressure-wash',
        name: 'Pressure Wash',
        description:
          'Precision-calibrated high-pressure rinse across wheel arches, lower sills, and intricate grille channels.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'wash-wheel-tyre-cleaning',
        name: 'Wheel & Tyre Cleaning',
        description:
          'Dedicated acid-free alloy barrel agitation, lug-nut brushing, and thorough tyre sidewall scrubbing.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'wash-interior-vacuuming',
        name: 'Interior Vacuuming',
        description:
          'Fine-nozzle cabin vacuuming across seat bolsters, floor carpets, console crevices, and luggage compartments.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
    ],
  },
  {
    id: 'exterior-detailing',
    index: '02',
    title: 'Exterior Detailing',
    icon: 'car',
    services: [
      {
        id: 'exterior-deep-cleaning',
        name: 'Exterior Deep Cleaning',
        description:
          'Intensive multi-step exterior cleanse detailing emblems, fuel caps, door shuts, and window seals.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'exterior-paint-decontamination',
        name: 'Paint Decontamination',
        description:
          'Chemical iron fallout dissolution and fine clay-bar pass to leave clearcoat completely smooth and bare.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'exterior-wheel-tyre-detailing',
        name: 'Wheel & Tyre Detailing',
        description:
          'Deep wheel-face decontamination, brake-dust removal, and satin non-sling tyre conditioning.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'exterior-glass-cleaning',
        name: 'Glass Cleaning',
        description:
          'Optical-grade interior and exterior glass polishing to remove traffic haze, mineral spots, and wiper film.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'exterior-chrome-trim-restoration',
        name: 'Chrome & Trim Restoration',
        description:
          'Hand-polishing of brightwork and exhaust tips alongside UV revival for weathered exterior plastics.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
    ],
  },
  {
    id: 'interior-detailing',
    index: '03',
    title: 'Interior Detailing',
    icon: 'armchair',
    services: [
      {
        id: 'interior-deep-cleaning',
        name: 'Interior Deep Cleaning',
        description:
          'Comprehensive top-to-bottom cabin restoration targeting vents, switches, headliners, and high-touch trim.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'interior-seat-upholstery',
        name: 'Seat & Upholstery Cleaning',
        description:
          'Gentle fibre extraction and pH-balanced agitation to lift embedded stains while preserving stitching integrity.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'interior-carpet-floor-mat',
        name: 'Carpet & Floor Mat Cleaning',
        description:
          'Deep pile brushing, hot-water extraction, and sanitizing rinse for plush carpets and all-weather mats.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'interior-dashboard-console',
        name: 'Dashboard & Console Cleaning',
        description:
          'Soft-bristle detailing around instrument clusters, piano-black trim, and screens finished with a matte UV shield.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'interior-leather-conditioning',
        name: 'Leather Cleaning & Conditioning',
        description:
          'Low-foam leather pore cleansing followed by breathable matte nourishment to keep hides supple and crack-free.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
    ],
  },
  {
    id: 'polishing-paint-correction',
    index: '04',
    title: 'Polishing & Paint Correction',
    icon: 'sparkles',
    services: [
      {
        id: 'correction-machine-polishing',
        name: 'Machine Polishing',
        description:
          'Dual-action and rotary machine refinement calibrated to your clearcoat hardness for uniform reflection.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'correction-swirl-mark-removal',
        name: 'Swirl Mark Removal',
        description:
          'Targeted micro-abrasive cutting under high-CRI inspection lamps to eliminate wash-induced spiderwebbing.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'correction-scratch-correction',
        name: 'Scratch Correction',
        description:
          'Localized clearcoat levelling to safely diminish surface scuffs and isolated linear paint defects.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'correction-oxidation-removal',
        name: 'Oxidation Removal',
        description:
          'Restorative compounding that strips dull, sun-faded clearcoat layers to revive rich original colour depth.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'correction-gloss-enhancement',
        name: 'Gloss Enhancement',
        description:
          'Fine jewelling polish pass engineered to maximize optical clarity, crispness, and liquid mirror reflections.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
    ],
  },
  {
    id: 'paint-protection',
    index: '05',
    title: 'Paint Protection',
    icon: 'shield',
    services: [
      {
        id: 'protection-graphene-coating',
        name: 'Graphene Coating',
        description:
          'Advanced graphene-infused protective matrix engineered for high slickness, reduced water spotting, and deep gloss.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'protection-paint-sealant',
        name: 'Paint Sealant',
        description:
          'Synthetic polymer clearcoat barrier delivering durable UV resistance, chemical shielding, and crisp sheen.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'protection-car-wax',
        name: 'Car Wax Protection',
        description:
          'Hand-applied concours-grade carnauba wax layer providing warm, deep lustre and smooth water runoff.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
      {
        id: 'protection-hydrophobic',
        name: 'Hydrophobic Protection',
        description:
          'High-contact-angle hydrophobic topcoat that repels water, mud, and grime for effortless routine maintenance.',
        pricePlaceholder: DEFAULT_PRICE_PLACEHOLDER,
        durationPlaceholder: DEFAULT_DURATION_PLACEHOLDER,
      },
    ],
  },
];
