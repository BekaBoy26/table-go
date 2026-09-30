import { format, parseISO } from "date-fns";

export const prices = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under 1,000 KGS", min: 0, max: 1000 },
  { label: "1,000–5,000 KGS", min: 1000, max: 5000 },
  { label: "5,000–10,000 KGS", min: 5000, max: 10000 },
  { label: "10,000+ KGS", min: 10000, max: Infinity },
];

/** Ready-made choices for the admin form; custom values can still be typed in. */
export const CUISINES = [
  // traditional in Bishkek
  "Kyrgyz",
  "Uzbek",
  "Kazakh",
  "Uyghur",
  "Dungan",
  "Turkish",
  "Russian",
  "Georgian",
  "Korean",
  "Chinese",
  // other popular ones
  "Japanese",
  "Asian",
  "Italian",
  "European",
  "American",
  "Seafood",
  "Steak",
  "Fast Food",
  "Coffee & Desserts",
  "Vegetarian",
];

export const TAGS = [
  "Traditional",
  "Family Friendly",
  "Romantic",
  "Quiet",
  "Business",
  "Large Groups",
  "Private Rooms",
  "Outdoor Seating",
  "Terrace",
  "Live Music",
  "Karaoke",
  "Kids Area",
  "Halal",
  "Vegetarian Options",
  "Breakfast",
  "Quick",
  "Delivery",
  "Wi-Fi",
  "Parking",
  "Open 24/7",
];

/** Map center when there is nothing to fit (Bishkek). */
export const BISHKEK: [number, number] = [42.8746, 74.5698];

export const toISODate = (day: Date) => format(day, "yyyy-MM-dd");
export const formatDate = (date: string) => format(parseISO(date), "EEE, MMM d");
