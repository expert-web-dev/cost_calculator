// We'll use string identifiers for icons rather than React components
// to avoid JSX transformation issues in this file

export const HOME_SIZES = [
  {
    value: "studio",
    label: "Studio",
    iconName: "Building",
  },
  {
    value: "1bedroom",
    label: "1 Bedroom",
    iconName: "Home",
  },
  {
    value: "2bedroom",
    label: "2 Bedroom",
    iconName: "Home",
  },
  {
    value: "3bedroom",
    label: "3+ Bedroom",
    iconName: "House",
  },
];

export const ADDITIONAL_ITEMS = [
  { value: "none", label: "No special items" },
  { value: "piano", label: "Piano" },
  { value: "artwork", label: "Artwork/Antiques" },
  { value: "gym", label: "Home Gym Equipment" },
  { value: "multiple", label: "Multiple special items" },
];

export const FLEXIBILITY_OPTIONS = [
  { value: "exact", label: "Exact date only" },
  { value: "1-2days", label: "1-2 days flexibility" },
  { value: "1week", label: "Up to a week" },
  { value: "flexible", label: "Very flexible" },
];

// Base costs for different home sizes (in USD)
export const BASE_COSTS = {
  studio: { diy: 150, hybrid: 500, fullService: 900 },
  "1bedroom": { diy: 200, hybrid: 650, fullService: 1200 },
  "2bedroom": { diy: 250, hybrid: 800, fullService: 1500 },
  "3bedroom": { diy: 300, hybrid: 950, fullService: 1800 },
};

// Cost per mile (in USD)
export const COST_PER_MILE = { diy: 0.5, hybrid: 1.5, fullService: 2.5 };

// Additional costs for special items (in USD)
export const ADDITIONAL_ITEM_COSTS = {
  none: { diy: 0, hybrid: 0, fullService: 0 },
  piano: { diy: 100, hybrid: 200, fullService: 300 },
  artwork: { diy: 50, hybrid: 100, fullService: 200 },
  gym: { diy: 75, hybrid: 150, fullService: 250 },
  multiple: { diy: 150, hybrid: 300, fullService: 400 },
};

// Sample moving companies for recommendations
export const SAMPLE_COMPANIES = [
  {
    name: "FastMove Pros",
    rating: 4.8,
    description: "Local company with 15+ years experience",
    available: true,
  },
  {
    name: "SmartBox Moving",
    rating: 4.6,
    description: "Container-based moving service",
    available: true,
  },
  {
    name: "Premium Movers Inc.",
    rating: 4.9,
    description: "Full-service moving specialists",
    available: false,
  },
  {
    name: "Budget Moving Co.",
    rating: 4.4,
    description: "Affordable moving solutions",
    available: true,
  },
];
