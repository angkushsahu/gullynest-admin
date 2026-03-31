export type ListingType = "tenant" | "owner" | "agent";

// Unsplash photo map — main card image per photo ID
export const PHOTO_URLS: Record<string, string> = {
  "ph-a":
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop",
  "ph-b": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80&fit=crop",
  "ph-c":
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80&fit=crop",
  "ph-d":
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop",
  "ph-e": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&fit=crop",
  "ph-f":
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80&fit=crop",
  "ph-g":
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80&fit=crop",
  "ph-h":
    "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80&fit=crop",
};

// Gallery photos: [main, side1, side2, extra1, extra2, extra3]
export const GALLERY_URLS: Record<string, string[]> = {
  "ph-a": [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&fit=crop",
  ],
  "ph-b": [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&fit=crop",
  ],
  "ph-c": [
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&fit=crop",
  ],
  "ph-d": [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&fit=crop",
  ],
  "ph-e": [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&q=80&fit=crop",
  ],
  "ph-f": [
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&fit=crop",
  ],
  "ph-g": [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&fit=crop",
  ],
  "ph-h": [
    "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80&fit=crop",
  ],
};

export interface Listing {
  id: string;
  title: string;
  locality: string;
  bhk: string;
  floor: string;
  furnishing: string;
  rent: number;
  available: string;
  type: ListingType;
  listerName: string;
  serviceFee?: number;
  rating: number;
  answers: number;
  honest: boolean;
  verified: boolean;
  photo: string;
  reraNo?: string;
  description?: string;
  facing?: string;
  totalFloors?: string;
  lat?: number;
  lng?: number;
  brokerageType?: "months" | "fixed" | "none";
  brokerageMonths?: number;
  brokerageAmount?: number;
  brokerageNegotiable?: boolean;
}

export interface Room {
  id: string;
  title: string;
  locality: string;
  rent: number;
  allin: number;
  listerName: string;
  serviceFee?: number;
  flatmates: Flatmate[];
  honest: boolean;
  verified: boolean;
  photo: string;
  rating: number;
  available: string;
  furnishing: string;
  household: string;
}

export interface Flatmate {
  initials: string;
  name: string;
  role: string;
  schedule: string;
  diet: string;
  color: string;
  textColor: string;
  quote?: string;
}

export const LISTINGS: Listing[] = [
  {
    id: "1",
    title: "2 BHK · Koramangala 5th Block",
    locality: "Koramangala",
    bhk: "2 BHK",
    floor: "3rd",
    furnishing: "Semi-furnished",
    rent: 28000,
    available: "Apr 1, 2026",
    type: "tenant",
    listerName: "Riya K.",
    serviceFee: 5000,
    rating: 4.9,
    answers: 5,
    honest: true,
    verified: true,
    photo: "ph-a",
    facing: "East",
    totalFloors: "6",
  },
  {
    id: "2",
    title: "1 BHK · HSR Layout Sector 2",
    locality: "HSR Layout",
    bhk: "1 BHK",
    floor: "Ground",
    furnishing: "Semi-furnished",
    rent: 14500,
    available: "Immediate",
    type: "owner",
    listerName: "Suresh K.",
    rating: 4.7,
    answers: 0,
    honest: false,
    verified: true,
    photo: "ph-b",
    facing: "West",
    totalFloors: "4",
  },
  {
    id: "3",
    title: "2 BHK · Indiranagar 12th Main",
    locality: "Indiranagar",
    bhk: "2 BHK",
    floor: "2nd",
    furnishing: "Fully furnished",
    rent: 32000,
    available: "Apr 15, 2026",
    type: "agent",
    listerName: "Ramesh Properties",
    reraNo: "PRM/KA/RERA/1234/AG",
    rating: 4.6,
    answers: 0,
    honest: false,
    verified: true,
    photo: "ph-c",
    facing: "North",
    totalFloors: "5",
    brokerageType: "months",
    brokerageMonths: 1,
    brokerageNegotiable: true,
  },
  {
    id: "4",
    title: "2 BHK · Bellandur",
    locality: "Bellandur",
    bhk: "2 BHK",
    floor: "2nd",
    furnishing: "Semi-furnished",
    rent: 22000,
    available: "Apr 5, 2026",
    type: "tenant",
    listerName: "Arun M.",
    serviceFee: 4000,
    rating: 4.8,
    answers: 4,
    honest: true,
    verified: false,
    photo: "ph-d",
    facing: "East",
    totalFloors: "8",
  },
  {
    id: "5",
    title: "3 BHK · Whitefield",
    locality: "Whitefield",
    bhk: "3 BHK",
    floor: "4th",
    furnishing: "Fully furnished",
    rent: 38000,
    available: "May 1, 2026",
    type: "agent",
    listerName: "PropSquare",
    reraNo: "PRM/KA/RERA/5678/AG",
    rating: 4.5,
    answers: 0,
    honest: false,
    verified: true,
    photo: "ph-e",
    facing: "South",
    totalFloors: "10",
    brokerageType: "fixed",
    brokerageAmount: 40000,
    brokerageNegotiable: false,
  },
  {
    id: "6",
    title: "1 BHK · Jayanagar 4th Block",
    locality: "Jayanagar",
    bhk: "1 BHK",
    floor: "1st",
    furnishing: "Unfurnished",
    rent: 18000,
    available: "Mar 25, 2026",
    type: "owner",
    listerName: "Padma N.",
    rating: 4.4,
    answers: 0,
    honest: false,
    verified: false,
    photo: "ph-f",
    facing: "West",
    totalFloors: "3",
  },
  {
    id: "7",
    title: "2 BHK · Electronic City Phase 1",
    locality: "Electronic City",
    bhk: "2 BHK",
    floor: "5th",
    furnishing: "Fully furnished",
    rent: 19000,
    available: "Apr 10, 2026",
    type: "tenant",
    listerName: "Priya S.",
    serviceFee: 3500,
    rating: 4.9,
    answers: 5,
    honest: true,
    verified: true,
    photo: "ph-g",
    facing: "East",
    totalFloors: "12",
  },
  {
    id: "8",
    title: "3 BHK · BTM Layout",
    locality: "BTM Layout",
    bhk: "3 BHK",
    floor: "3rd",
    furnishing: "Semi-furnished",
    rent: 30000,
    available: "Immediate",
    type: "owner",
    listerName: "Venkat R.",
    rating: 4.6,
    answers: 0,
    honest: false,
    verified: true,
    photo: "ph-h",
    facing: "North",
    totalFloors: "6",
  },
];

export const ROOMS: Room[] = [
  {
    id: "r1",
    title: "Room in 3 BHK · Indiranagar 12th Main",
    locality: "Indiranagar",
    rent: 12000,
    allin: 14300,
    listerName: "Priya D.",
    serviceFee: 3000,
    flatmates: [
      {
        initials: "NK",
        name: "Nidhi K.",
        role: "UX Designer",
        schedule: "Morning person",
        diet: "Vegetarian",
        color: "#EEEDFE",
        textColor: "#3C3489",
        quote: "I love a clean kitchen and good Wi-Fi. Quiet after 9pm.",
      },
      {
        initials: "RS",
        name: "Rohan S.",
        role: "Product Manager",
        schedule: "Flexible hours",
        diet: "Vegetarian",
        color: "#E1F5EE",
        textColor: "#0F6E56",
        quote: "Sociable but I respect space. We cook together Sundays sometimes.",
      },
    ],
    honest: true,
    verified: true,
    photo: "ph-c",
    rating: 4.8,
    available: "Mar 25, 2026",
    furnishing: "Fully furnished",
    household: "Vegetarian",
  },
  {
    id: "r2",
    title: "Room in 2 BHK · Marathahalli",
    locality: "Marathahalli",
    rent: 9500,
    allin: 11200,
    listerName: "Kavya T.",
    flatmates: [
      {
        initials: "KT",
        name: "Kavya T.",
        role: "Software Engineer",
        schedule: "Late evenings",
        diet: "Non-veg OK",
        color: "#FAEEDA",
        textColor: "#854F0B",
        quote: "Work from home most days. Like a quiet flat on weekdays.",
      },
    ],
    honest: false,
    verified: true,
    photo: "ph-g",
    rating: 4.5,
    available: "Immediate",
    furnishing: "Semi-furnished",
    household: "Any",
  },
];

export const ROOM_QA: Record<string, { q: string; a: string }[]> = {
  r1: [
    {
      q: "What would you warn the next flatmate about?",
      a: "Indiranagar 12th Main gets noisy on Friday evenings due to the bars. Around 9–11pm you can hear it if your room faces the road. Our rooms face inward so it's fine. The lift is slow but works reliably.",
    },
    {
      q: "What's great about living here that photos won't show?",
      a: "The neighbourhood is quieter than I expected given the main road. Great micro-delivery scene — groceries, food, pharmacy all within 10 minutes. Society is clean and well-managed by the residents.",
    },
  ],
  r2: [
    {
      q: "What would you warn the next flatmate about?",
      a: "Marathahalli traffic can be brutal between 8–10am and 5–8pm. If you WFH like me it's fine. The building has limited parking so plan accordingly if you have a vehicle.",
    },
    {
      q: "What's great about living here that photos won't show?",
      a: "The terrace is open on weekends and has great views. Very internet-friendly building — I get 200 Mbps consistently for WFH. Neighbours keep to themselves which I love.",
    },
  ],
};

export const INSIDER_QA = [
  {
    q: "What would you warn the next tenant about?",
    a: "The 5th Cross pub gets noisy on Friday and Saturday nights between 10pm–midnight. Light sleepers will notice it. A fan or earplugs helps. Building is very quiet on weekdays.",
  },
  {
    q: "How responsive is the landlord when something breaks?",
    a: "Suresh responds within a day usually. Fixed the geyser in 2 days. He's old-fashioned about WhatsApp but reliable. Call him for urgent things.",
  },
  {
    q: "What surprised you after month one?",
    a: "The east-facing windows give incredible morning light but the kitchen gets warm by afternoon. The nearby bakery smell on Sundays is genuinely delightful.",
  },
  {
    q: "What's great about this flat that photos won't show?",
    a: "Watchman Raju is incredibly helpful. Grocery store 50m away delivers in 15 minutes. Society is actually friendly — people say hi in the lift.",
  },
  {
    q: "Describe a typical Sunday morning.",
    a: "Quiet until about 10am. Street food cart appears — poha and coffee. Park nearby fills up. Very liveable, slow-paced morning energy.",
  },
];

export const ADMIN_LISTINGS_DATA = [
  {
    id: "GN-1847",
    title: "2 BHK · Koramangala",
    lister: "Riya K.",
    phone: "+91 98765 XXXXX",
    type: "tenant" as ListingType,
    rent: 28000,
    fee: 5000,
    status: "pending",
    submitted: "2 hrs ago",
    photo: "ph-a",
    answers: 4,
    honest: true,
    verified: false,
  },
  {
    id: "GN-1848",
    title: "1 BHK · HSR Layout",
    lister: "Suresh K.",
    phone: "+91 87654 XXXXX",
    type: "owner" as ListingType,
    rent: 14500,
    fee: 0,
    status: "pending",
    submitted: "4 hrs ago",
    photo: "ph-b",
    answers: 0,
    honest: false,
    verified: false,
  },
  {
    id: "GN-1849",
    title: "3 BHK · Whitefield",
    lister: "Ramesh Properties",
    phone: "+91 76543 XXXXX",
    type: "agent" as ListingType,
    rent: 38000,
    fee: 0,
    status: "live",
    submitted: "1 day ago",
    photo: "ph-e",
    answers: 0,
    honest: false,
    verified: true,
  },
  {
    id: "GN-1850",
    title: "2 BHK · Bellandur",
    lister: "Arun M.",
    phone: "+91 65432 XXXXX",
    type: "tenant" as ListingType,
    rent: 22000,
    fee: 4000,
    status: "pending",
    submitted: "6 hrs ago",
    photo: "ph-d",
    answers: 3,
    honest: true,
    verified: false,
  },
  {
    id: "GN-1851",
    title: "1 BHK · Jayanagar",
    lister: "Padma N.",
    phone: "+91 54321 XXXXX",
    type: "owner" as ListingType,
    rent: 18000,
    fee: 0,
    status: "live",
    submitted: "2 days ago",
    photo: "ph-f",
    answers: 0,
    honest: false,
    verified: false,
  },
  {
    id: "GN-1852",
    title: "2 BHK · BTM Layout",
    lister: "Venkat R.",
    phone: "+91 43210 XXXXX",
    type: "owner" as ListingType,
    rent: 30000,
    fee: 0,
    status: "rejected",
    submitted: "3 days ago",
    photo: "ph-h",
    answers: 0,
    honest: false,
    verified: false,
  },
  {
    id: "GN-1853",
    title: "3 BHK · Indiranagar",
    lister: "PropSquare",
    phone: "+91 32109 XXXXX",
    type: "agent" as ListingType,
    rent: 45000,
    fee: 0,
    status: "live",
    submitted: "1 day ago",
    photo: "ph-c",
    answers: 0,
    honest: false,
    verified: true,
  },
  {
    id: "GN-1854",
    title: "2 BHK · Electronic City",
    lister: "Priya S.",
    phone: "+91 21098 XXXXX",
    type: "tenant" as ListingType,
    rent: 19000,
    fee: 3500,
    status: "pending",
    submitted: "8 hrs ago",
    photo: "ph-g",
    answers: 5,
    honest: true,
    verified: false,
  },
];

export const SEARCHER_USERS = [
  {
    id: "u1",
    initials: "AM",
    color: "#E1F5EE",
    tc: "#0F6E56",
    name: "Arjun M.",
    phone: "+91 98765 XXXXX",
    joined: "Mar 10",
    packs: 1,
    used: 8,
    remaining: 17,
    last: "2 days ago",
  },
  {
    id: "u2",
    initials: "PK",
    color: "#EEEDFE",
    tc: "#3C3489",
    name: "Preethi K.",
    phone: "+91 87654 XXXXX",
    joined: "Mar 8",
    packs: 2,
    used: 43,
    remaining: 7,
    last: "Today",
  },
  {
    id: "u3",
    initials: "MR",
    color: "#FAEEDA",
    tc: "#854F0B",
    name: "Meena R.",
    phone: "+91 76543 XXXXX",
    joined: "Mar 18",
    packs: 1,
    used: 3,
    remaining: 22,
    last: "Today",
  },
  {
    id: "u4",
    initials: "KS",
    color: "#E8F0FB",
    tc: "#185FA5",
    name: "Karan S.",
    phone: "+91 65432 XXXXX",
    joined: "Mar 12",
    packs: 1,
    used: 19,
    remaining: 6,
    last: "3 days ago",
  },
  {
    id: "u5",
    initials: "NS",
    color: "#EBFAEB",
    tc: "#005A03",
    name: "Nisha S.",
    phone: "+91 54321 XXXXX",
    joined: "Mar 5",
    packs: 3,
    used: 67,
    remaining: 8,
    last: "Yesterday",
  },
];

export const AGENT_PASSES = [
  {
    name: "Ramesh Properties",
    rera: "PRM/KA/RERA/1234/AG",
    bought: "Mar 1",
    expires: "Apr 1",
    used: 7,
    max: 10,
    revenue: 1999,
    status: "Active",
    daysLeft: 12,
  },
  {
    name: "PropSquare",
    rera: "PRM/KA/RERA/5678/AG",
    bought: "Mar 5",
    expires: "Apr 5",
    used: 3,
    max: 10,
    revenue: 1999,
    status: "Active",
    daysLeft: 16,
  },
  {
    name: "Bangalore Homes",
    rera: "PRM/KA/RERA/9012/AG",
    bought: "Feb 15",
    expires: "Mar 15",
    used: 10,
    max: 10,
    revenue: 1999,
    status: "Expired",
    daysLeft: 0,
  },
  {
    name: "City Rentals",
    rera: "PRM/KA/RERA/3456/AG",
    bought: "Mar 18",
    expires: "Apr 18",
    used: 2,
    max: 10,
    revenue: 1999,
    status: "Active",
    daysLeft: 29,
  },
  {
    name: "KeyBridge Realty",
    rera: "PRM/KA/RERA/7890/AG",
    bought: "Mar 17",
    expires: "Apr 17",
    used: 5,
    max: 10,
    revenue: 1999,
    status: "Active",
    daysLeft: 28,
  },
  {
    name: "Nest Finders",
    rera: "PRM/KA/RERA/2345/AG",
    bought: "Mar 10",
    expires: "Apr 10",
    used: 8,
    max: 10,
    revenue: 1999,
    status: "Active",
    daysLeft: 21,
  },
  {
    name: "HomePath BLR",
    rera: "PRM/KA/RERA/6789/AG",
    bought: "Mar 3",
    expires: "Apr 3",
    used: 10,
    max: 10,
    revenue: 1999,
    status: "Expiring",
    daysLeft: 14,
  },
];
