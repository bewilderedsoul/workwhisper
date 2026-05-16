// prisma/seed.ts
import { PrismaClient, PostType } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- Currencies ----------
// Smart units:
//   INR  → LPA (lakhs/yr): 30 = ₹30L = ₹30,00,000
//   USD/EUR/GBP/SGD/AUD/CAD/AED/CHF/SEK/BRL → thousands/yr: 150 = $150K
//   JPY  → 万 (10K-yen units): 1500 = ¥15,000,000
type Currency = "INR" | "USD" | "EUR" | "GBP" | "SGD" | "AUD" | "CAD" | "AED" | "JPY" | "BRL" | "CHF" | "SEK";

type Office = { city: string; country: string; currency: Currency; weight?: number };

type RoleBand = {
  role: string;
  level: string;
  exp: [number, number];
  // Salary bands per currency. If an office's currency has no band, the office is skipped for this role.
  bands: Partial<Record<Currency, [number, number]>>;
};

type CompanyCfg = {
  bowl: string;
  stockMultiplier?: number;
  bonusMultiplier?: number;
  offices: Office[];
  roles: RoleBand[];
};

// ---------- Bowls ----------
const bowls = [
  { name: "Software Engineers", slug: "software-engineers-india", description: "For software engineers worldwide to share experiences, salaries, and career advice", icon: "💻", isDefault: true },
  { name: "TCS Employees", slug: "tcs-employees", description: "Discussions for TCS employees", icon: "🏢", isDefault: true },
  { name: "Salary Discussions", slug: "salary-discussions", description: "Anonymous salary sharing", icon: "💰", isDefault: true },
  { name: "Infosys", slug: "infosys-india", description: "For Infosys employees", icon: "🔵", isDefault: false },
  { name: "Wipro Employees", slug: "wipro-employees", description: "Wipro community", icon: "🟣", isDefault: false },
  { name: "Startup Life", slug: "startup-india", description: "Discussions about startups: funding, culture, life", icon: "🚀", isDefault: false },
  { name: "Product Managers", slug: "product-managers-india", description: "PM community", icon: "📊", isDefault: false },
  { name: "Work-Life Balance", slug: "work-life-balance", description: "WLB, mental health, burnout", icon: "⚖️", isDefault: false },
  { name: "FAANG", slug: "faang-india", description: "Google, Amazon, Microsoft, Meta, Apple employees", icon: "🌟", isDefault: false },
  { name: "Data Science", slug: "data-science-india", description: "ML / Data Science professionals", icon: "📈", isDefault: false },
  { name: "Europe Tech", slug: "europe-tech", description: "Tech professionals in Europe", icon: "🇪🇺", isDefault: false },
  { name: "US Tech", slug: "us-tech", description: "Tech professionals in the US", icon: "🇺🇸", isDefault: false },
  { name: "APAC Tech", slug: "apac-tech", description: "Tech professionals in Asia-Pacific", icon: "🌏", isDefault: false },
  { name: "LATAM Tech", slug: "latam-tech", description: "Tech professionals in Latin America", icon: "🌎", isDefault: false },
  { name: "Fintech", slug: "fintech", description: "Banking, payments, crypto", icon: "💳", isDefault: false },
];

const usernames = [
  "SilentCoder42", "MumbaiDev88", "BengaluruByte", "DelhiDeveloper",
  "AnonymousEngg", "QuietArchitect", "HydWorkaholic", "PunePolyglot",
  "ChennaiCoder", "NoidaNavigator", "GurgaonGuru", "KolkataKoder",
  "TechTrooper99", "ByteWalker21", "StackStorm77", "CodeMonk55",
  "SilverSprint", "DevDrifter", "NightOwlDev", "ClearheadCoder",
  "GhostInStack", "ZenMaster404", "PixelPilot", "QuantumQuoll",
  "RecursiveRaj", "SyntaxSeeker", "ThunderTuple", "VectorVarun",
  "WizardWidget", "XenialXavier", "YamlYogi", "ZeroDayZoya",
  "SiliconScout", "LondonLambda", "BerlinBuilder", "DublinDevops",
  "SingaporeSwift", "TokyoTraveler", "SydneyShipper", "TorontoTinker",
  "AmsterdamArc", "StockholmStream", "BarcelonaBytes", "ParisPipeline",
  "SeattleStorm", "AustinAxiom", "NYCNomad", "BayAreaBlock",
  "ZurichZap", "DubaiDelta", "SaoPauloSilicon",
];

const WORK = ["Remote", "Hybrid", "Onsite"];
const GENDERS = ["Male", "Female", "PreferNotToSay"];

const SKILL_PACKS = [
  ["Java", "Spring", "Microservices"],
  ["Python", "Django", "PostgreSQL"],
  ["Go", "Kubernetes", "gRPC"],
  ["TypeScript", "React", "Node.js"],
  ["C++", "Distributed Systems"],
  ["Python", "ML", "TensorFlow"],
  ["Scala", "Spark", "Kafka"],
  ["Rust", "WebAssembly"],
  ["Swift", "iOS"],
  ["Kotlin", "Android"],
  ["CUDA", "C++", "Linux"],
  ["AWS", "Terraform", "DevOps"],
  ["GraphQL", "Apollo", "TypeScript"],
  ["Ruby", "Rails", "PostgreSQL"],
  ["Elixir", "Phoenix"],
  ["PyTorch", "LLM", "NLP"],
  ["GCP", "BigQuery", "SQL"],
];

// ---------- Helpers ----------
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function weighted<T extends { weight?: number }>(arr: T[]): T {
  const total = arr.reduce((s, x) => s + (x.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const x of arr) {
    r -= x.weight ?? 1;
    if (r <= 0) return x;
  }
  return arr[arr.length - 1];
}

// ---------- Office presets (re-used across companies) ----------
const US_BIG: Office[] = [
  { city: "Mountain View", country: "United States", currency: "USD", weight: 3 },
  { city: "San Francisco", country: "United States", currency: "USD", weight: 3 },
  { city: "New York", country: "United States", currency: "USD", weight: 3 },
  { city: "Seattle", country: "United States", currency: "USD", weight: 3 },
  { city: "Austin", country: "United States", currency: "USD", weight: 2 },
  { city: "Boston", country: "United States", currency: "USD", weight: 1 },
];
const INDIA_BIG: Office[] = [
  { city: "Bangalore", country: "India", currency: "INR", weight: 4 },
  { city: "Hyderabad", country: "India", currency: "INR", weight: 3 },
  { city: "Gurgaon", country: "India", currency: "INR", weight: 2 },
  { city: "Pune", country: "India", currency: "INR", weight: 2 },
  { city: "Mumbai", country: "India", currency: "INR", weight: 1 },
  { city: "Chennai", country: "India", currency: "INR", weight: 1 },
];
const EU_BIG: Office[] = [
  { city: "London", country: "United Kingdom", currency: "GBP", weight: 4 },
  { city: "Dublin", country: "Ireland", currency: "EUR", weight: 3 },
  { city: "Berlin", country: "Germany", currency: "EUR", weight: 2 },
  { city: "Amsterdam", country: "Netherlands", currency: "EUR", weight: 2 },
  { city: "Zurich", country: "Switzerland", currency: "CHF", weight: 2 },
  { city: "Paris", country: "France", currency: "EUR", weight: 2 },
  { city: "Stockholm", country: "Sweden", currency: "SEK", weight: 1 },
  { city: "Munich", country: "Germany", currency: "EUR", weight: 1 },
];
const APAC_BIG: Office[] = [
  { city: "Singapore", country: "Singapore", currency: "SGD", weight: 3 },
  { city: "Tokyo", country: "Japan", currency: "JPY", weight: 2 },
  { city: "Sydney", country: "Australia", currency: "AUD", weight: 2 },
  { city: "Melbourne", country: "Australia", currency: "AUD", weight: 1 },
  { city: "Hong Kong", country: "Hong Kong", currency: "USD", weight: 1 },
  { city: "Seoul", country: "South Korea", currency: "USD", weight: 1 },
];
const CANADA: Office[] = [
  { city: "Toronto", country: "Canada", currency: "CAD", weight: 3 },
  { city: "Vancouver", country: "Canada", currency: "CAD", weight: 2 },
  { city: "Montreal", country: "Canada", currency: "CAD", weight: 1 },
];
const MIDDLE_EAST: Office[] = [
  { city: "Dubai", country: "United Arab Emirates", currency: "AED", weight: 3 },
  { city: "Abu Dhabi", country: "United Arab Emirates", currency: "AED", weight: 1 },
  { city: "Tel Aviv", country: "Israel", currency: "USD", weight: 2 },
];
const LATAM: Office[] = [
  { city: "São Paulo", country: "Brazil", currency: "BRL", weight: 3 },
  { city: "Mexico City", country: "Mexico", currency: "USD", weight: 2 },
  { city: "Buenos Aires", country: "Argentina", currency: "USD", weight: 1 },
];

// FAANG-tier salary bands — anchor numbers, in smart units per currency.
// Each role gets its own object below; this is just illustrative.
const FAANG_OFFICES: Office[] = [...US_BIG, ...INDIA_BIG, ...EU_BIG, ...APAC_BIG, ...CANADA, ...MIDDLE_EAST, ...LATAM];

// ---------- Companies ----------
const COMPANIES: Record<string, CompanyCfg> = {
  // ============= FAANG =============
  "Google": {
    bowl: "faang-india",
    stockMultiplier: 0.7, bonusMultiplier: 0.15,
    offices: FAANG_OFFICES,
    roles: [
      { role: "Software Engineer L3", level: "Junior", exp: [0, 2],
        bands: { USD: [160, 200], INR: [22, 30], GBP: [80, 110], EUR: [70, 100], SGD: [110, 150], AUD: [140, 180], CAD: [130, 170], CHF: [115, 145], AED: [280, 380], JPY: [1100, 1500], BRL: [200, 280], SEK: [550, 750] } },
      { role: "Software Engineer L4", level: "Mid", exp: [2, 5],
        bands: { USD: [220, 300], INR: [38, 55], GBP: [110, 150], EUR: [100, 140], SGD: [150, 210], AUD: [180, 240], CAD: [170, 230], CHF: [145, 190], AED: [380, 520], JPY: [1500, 2100], BRL: [280, 420], SEK: [750, 1000] } },
      { role: "Software Engineer L5", level: "Senior", exp: [5, 9],
        bands: { USD: [330, 450], INR: [60, 85], GBP: [160, 220], EUR: [150, 200], SGD: [220, 300], AUD: [250, 340], CAD: [240, 320], CHF: [195, 260], AED: [550, 780], JPY: [2200, 3000], BRL: [430, 620], SEK: [1050, 1450] } },
      { role: "Staff Engineer L6", level: "Staff", exp: [9, 14],
        bands: { USD: [490, 700], INR: [95, 130], GBP: [230, 320], EUR: [220, 300], SGD: [310, 440], AUD: [360, 480], CAD: [340, 470], CHF: [280, 380], AED: [800, 1100], JPY: [3100, 4400], BRL: [630, 900], SEK: [1500, 2100] } },
      { role: "Product Manager", level: "Senior", exp: [4, 8],
        bands: { USD: [280, 400], INR: [45, 70], GBP: [140, 200], EUR: [130, 180], SGD: [200, 280], AUD: [220, 300], CAD: [210, 290], AED: [500, 720], JPY: [2000, 2700], BRL: [400, 580] } },
    ],
  },

  "Amazon": {
    bowl: "faang-india",
    stockMultiplier: 0.55, bonusMultiplier: 0.1,
    offices: FAANG_OFFICES,
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2],
        bands: { USD: [130, 170], INR: [18, 24], GBP: [65, 90], EUR: [60, 85], SGD: [90, 125], AUD: [110, 140], CAD: [100, 135], AED: [220, 320], JPY: [900, 1300], BRL: [150, 220] } },
      { role: "SDE-2", level: "Mid", exp: [2, 6],
        bands: { USD: [195, 270], INR: [28, 42], GBP: [95, 130], EUR: [85, 120], SGD: [130, 180], AUD: [155, 210], CAD: [145, 200], AED: [320, 460], JPY: [1300, 1900], BRL: [240, 360] } },
      { role: "SDE-3", level: "Senior", exp: [6, 10],
        bands: { USD: [340, 480], INR: [50, 68], GBP: [160, 220], EUR: [150, 200], SGD: [220, 300], AUD: [240, 320], CAD: [230, 310], AED: [520, 750], JPY: [2200, 3000], BRL: [420, 600] } },
      { role: "Principal Engineer", level: "Principal", exp: [10, 15],
        bands: { USD: [500, 750], INR: [80, 110], GBP: [240, 340], EUR: [230, 320], SGD: [310, 440], AUD: [340, 470], CAD: [330, 460], AED: [780, 1100], JPY: [3200, 4500], BRL: [620, 880] } },
      { role: "Applied Scientist", level: "Mid", exp: [3, 7],
        bands: { USD: [240, 340], INR: [40, 60], GBP: [115, 160], EUR: [105, 145], SGD: [160, 220], AUD: [180, 240], CAD: [170, 230] } },
    ],
  },

  "Microsoft": {
    bowl: "faang-india",
    stockMultiplier: 0.5, bonusMultiplier: 0.15,
    offices: [...US_BIG, ...INDIA_BIG, ...EU_BIG, ...APAC_BIG, ...CANADA,
      { city: "Redmond", country: "United States", currency: "USD", weight: 4 }],
    roles: [
      { role: "SDE-I (L59)", level: "Junior", exp: [0, 2],
        bands: { USD: [150, 190], INR: [20, 26], GBP: [70, 100], EUR: [65, 95], SGD: [95, 130], AUD: [115, 150], CAD: [105, 140], CHF: [110, 140] } },
      { role: "SDE-II (L61)", level: "Mid", exp: [2, 5],
        bands: { USD: [210, 285], INR: [32, 45], GBP: [105, 145], EUR: [95, 135], SGD: [140, 195], AUD: [165, 220], CAD: [155, 210], CHF: [150, 195] } },
      { role: "Senior SDE (L63)", level: "Senior", exp: [5, 9],
        bands: { USD: [310, 420], INR: [50, 68], GBP: [150, 210], EUR: [140, 190], SGD: [205, 285], AUD: [230, 310], CAD: [220, 295], CHF: [200, 270] } },
      { role: "Principal SDE (L65)", level: "Principal", exp: [9, 14],
        bands: { USD: [430, 600], INR: [75, 100], GBP: [220, 310], EUR: [200, 280], SGD: [290, 410] } },
      { role: "Partner SDE (L67)", level: "Director", exp: [14, 20],
        bands: { USD: [600, 900], INR: [110, 150], GBP: [310, 440] } },
    ],
  },

  "Meta": {
    bowl: "faang-india",
    stockMultiplier: 0.85, bonusMultiplier: 0.15,
    offices: [...US_BIG, { city: "Menlo Park", country: "United States", currency: "USD", weight: 4 },
      ...INDIA_BIG.slice(0, 3),
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 3 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 2 },
      { city: "Singapore", country: "Singapore", currency: "SGD", weight: 2 },
      { city: "Tel Aviv", country: "Israel", currency: "USD", weight: 1 }],
    roles: [
      { role: "E3 Software Engineer", level: "Junior", exp: [0, 2],
        bands: { USD: [180, 230], INR: [28, 40], GBP: [90, 125], EUR: [80, 115], SGD: [120, 165] } },
      { role: "E4 Software Engineer", level: "Mid", exp: [2, 5],
        bands: { USD: [260, 350], INR: [40, 55], GBP: [130, 180], EUR: [120, 170], SGD: [170, 240] } },
      { role: "E5 Software Engineer", level: "Senior", exp: [5, 9],
        bands: { USD: [400, 550], INR: [65, 90], GBP: [200, 280], EUR: [180, 250], SGD: [260, 360] } },
      { role: "E6 Staff Engineer", level: "Staff", exp: [9, 14],
        bands: { USD: [600, 850], INR: [95, 130], GBP: [290, 410], EUR: [270, 380] } },
    ],
  },

  "Apple": {
    bowl: "faang-india",
    stockMultiplier: 0.4, bonusMultiplier: 0.1,
    offices: [{ city: "Cupertino", country: "United States", currency: "USD", weight: 4 },
      ...US_BIG.slice(0, 4),
      ...INDIA_BIG.slice(0, 3),
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 2 },
      { city: "Munich", country: "Germany", currency: "EUR", weight: 2 },
      { city: "Tokyo", country: "Japan", currency: "JPY", weight: 1 },
      { city: "Singapore", country: "Singapore", currency: "SGD", weight: 1 },
      { city: "Shanghai", country: "China", currency: "USD", weight: 1 }],
    roles: [
      { role: "ICT2 Engineer", level: "Junior", exp: [1, 3],
        bands: { USD: [165, 210], INR: [25, 35], GBP: [80, 110], EUR: [75, 105], JPY: [1100, 1500], SGD: [110, 150] } },
      { role: "ICT3 Engineer", level: "Mid", exp: [3, 6],
        bands: { USD: [240, 320], INR: [40, 55], GBP: [120, 170], EUR: [115, 160], JPY: [1700, 2300], SGD: [160, 220] } },
      { role: "ICT4 Engineer", level: "Senior", exp: [6, 10],
        bands: { USD: [340, 470], INR: [60, 80], GBP: [180, 250], EUR: [170, 240] } },
      { role: "ICT5 Engineer", level: "Staff", exp: [10, 14],
        bands: { USD: [470, 650], INR: [85, 115] } },
    ],
  },

  "Netflix": {
    bowl: "faang-india",
    stockMultiplier: 0, bonusMultiplier: 0, // Netflix pays all-cash
    offices: [{ city: "Los Gatos", country: "United States", currency: "USD", weight: 4 },
      { city: "Los Angeles", country: "United States", currency: "USD", weight: 2 },
      { city: "New York", country: "United States", currency: "USD", weight: 1 },
      { city: "Amsterdam", country: "Netherlands", currency: "EUR", weight: 2 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 2 },
      { city: "Tokyo", country: "Japan", currency: "JPY", weight: 1 },
      { city: "Mumbai", country: "India", currency: "INR", weight: 1 }],
    roles: [
      { role: "Senior Software Engineer", level: "Senior", exp: [5, 9],
        bands: { USD: [450, 650], INR: [80, 110], GBP: [220, 320], EUR: [220, 300], JPY: [2800, 3800] } },
      { role: "Staff Engineer", level: "Staff", exp: [9, 14],
        bands: { USD: [650, 950], INR: [120, 150], GBP: [310, 440], EUR: [300, 420] } },
    ],
  },

  "NVIDIA": {
    bowl: "faang-india",
    stockMultiplier: 0.7, bonusMultiplier: 0.12,
    offices: [{ city: "Santa Clara", country: "United States", currency: "USD", weight: 4 },
      ...US_BIG.slice(0, 4),
      ...INDIA_BIG.slice(0, 5),
      { city: "Tel Aviv", country: "Israel", currency: "USD", weight: 2 },
      { city: "Shanghai", country: "China", currency: "USD", weight: 1 },
      { city: "Tokyo", country: "Japan", currency: "JPY", weight: 1 },
      { city: "Munich", country: "Germany", currency: "EUR", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [1, 3],
        bands: { USD: [150, 200], INR: [22, 32], EUR: [70, 100], JPY: [1100, 1500] } },
      { role: "Senior Software Engineer", level: "Mid", exp: [3, 6],
        bands: { USD: [220, 310], INR: [38, 55], EUR: [110, 155], JPY: [1700, 2300] } },
      { role: "Principal Engineer", level: "Senior", exp: [7, 12],
        bands: { USD: [350, 520], INR: [65, 95] } },
      { role: "Deep Learning Engineer", level: "Senior", exp: [4, 8],
        bands: { USD: [280, 420], INR: [45, 70] } },
      { role: "GPU Architect", level: "Staff", exp: [10, 15],
        bands: { USD: [450, 700], INR: [80, 120] } },
    ],
  },

  // ============= Top-tier US tech =============
  "Stripe": {
    bowl: "faang-india",
    stockMultiplier: 0.7, bonusMultiplier: 0.1,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 4 },
      { city: "South San Francisco", country: "United States", currency: "USD", weight: 2 },
      { city: "New York", country: "United States", currency: "USD", weight: 2 },
      { city: "Seattle", country: "United States", currency: "USD", weight: 1 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 3 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 2 },
      { city: "Singapore", country: "Singapore", currency: "SGD", weight: 1 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 2 },
      { city: "Toronto", country: "Canada", currency: "CAD", weight: 1 }],
    roles: [
      { role: "L1 Engineer", level: "Junior", exp: [0, 2],
        bands: { USD: [180, 230], INR: [25, 35], GBP: [90, 130], EUR: [85, 120], SGD: [115, 160], CAD: [120, 160] } },
      { role: "L2 Engineer", level: "Mid", exp: [2, 5],
        bands: { USD: [280, 380], INR: [40, 55], GBP: [140, 200], EUR: [130, 180], SGD: [180, 250], CAD: [180, 250] } },
      { role: "L3 Engineer", level: "Senior", exp: [5, 9],
        bands: { USD: [420, 580], INR: [60, 85], GBP: [220, 300], EUR: [210, 290], SGD: [280, 380] } },
      { role: "L4 Staff Engineer", level: "Staff", exp: [9, 14],
        bands: { USD: [580, 800], INR: [100, 140], GBP: [300, 410], EUR: [290, 400] } },
    ],
  },

  "Databricks": {
    bowl: "faang-india",
    stockMultiplier: 0.9, bonusMultiplier: 0.1,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 4 },
      { city: "Mountain View", country: "United States", currency: "USD", weight: 2 },
      { city: "Seattle", country: "United States", currency: "USD", weight: 2 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Amsterdam", country: "Netherlands", currency: "EUR", weight: 1 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 }],
    roles: [
      { role: "Software Engineer L4", level: "Mid", exp: [2, 5],
        bands: { USD: [280, 380], INR: [45, 60], GBP: [140, 200], EUR: [130, 180] } },
      { role: "Senior Software Engineer L5", level: "Senior", exp: [5, 9],
        bands: { USD: [420, 580], INR: [70, 95], GBP: [220, 300], EUR: [210, 290] } },
      { role: "Staff Engineer L6", level: "Staff", exp: [9, 14],
        bands: { USD: [600, 850], INR: [105, 145] } },
    ],
  },

  "Snowflake": {
    bowl: "us-tech",
    stockMultiplier: 0.7, bonusMultiplier: 0.1,
    offices: [{ city: "San Mateo", country: "United States", currency: "USD", weight: 4 },
      { city: "Bellevue", country: "United States", currency: "USD", weight: 2 },
      { city: "Berlin", country: "Germany", currency: "EUR", weight: 1 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { USD: [260, 360], EUR: [120, 170] } },
      { role: "Senior Software Engineer", level: "Senior", exp: [5, 9],
        bands: { USD: [400, 550], EUR: [200, 280] } },
    ],
  },

  "Datadog": {
    bowl: "us-tech",
    stockMultiplier: 0.4, bonusMultiplier: 0.1,
    offices: [{ city: "New York", country: "United States", currency: "USD", weight: 4 },
      { city: "Boston", country: "United States", currency: "USD", weight: 2 },
      { city: "Paris", country: "France", currency: "EUR", weight: 2 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 1 }],
    roles: [
      { role: "Software Engineer II", level: "Junior", exp: [1, 3],
        bands: { USD: [160, 210], EUR: [75, 105] } },
      { role: "Software Engineer III", level: "Mid", exp: [3, 6],
        bands: { USD: [220, 300], EUR: [110, 155] } },
      { role: "Senior Engineer", level: "Senior", exp: [6, 10],
        bands: { USD: [320, 440], EUR: [170, 230] } },
    ],
  },

  "Coinbase": {
    bowl: "fintech",
    stockMultiplier: 0.6, bonusMultiplier: 0,
    offices: [{ city: "Remote US", country: "United States", currency: "USD", weight: 3 },
      { city: "New York", country: "United States", currency: "USD", weight: 2 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 2 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 1 }],
    roles: [
      { role: "Software Engineer L4", level: "Mid", exp: [2, 5],
        bands: { USD: [220, 320], GBP: [110, 160], EUR: [110, 155] } },
      { role: "Senior Engineer L5", level: "Senior", exp: [5, 9],
        bands: { USD: [340, 480], GBP: [170, 240], EUR: [170, 230] } },
    ],
  },

  "Figma": {
    bowl: "us-tech",
    stockMultiplier: 0.8, bonusMultiplier: 0.1,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 4 },
      { city: "New York", country: "United States", currency: "USD", weight: 2 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { USD: [260, 360], GBP: [130, 180] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { USD: [400, 560], GBP: [200, 280] } },
    ],
  },

  "Airbnb": {
    bowl: "us-tech",
    stockMultiplier: 0.6, bonusMultiplier: 0.1,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 4 },
      { city: "Seattle", country: "United States", currency: "USD", weight: 1 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 1 },
      { city: "Tokyo", country: "Japan", currency: "JPY", weight: 1 }],
    roles: [
      { role: "Software Engineer III", level: "Mid", exp: [2, 5],
        bands: { USD: [240, 340], EUR: [110, 160], JPY: [1500, 2100] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { USD: [360, 500], EUR: [170, 240], JPY: [2200, 3000] } },
    ],
  },

  "Uber": {
    bowl: "faang-india",
    stockMultiplier: 0.5, bonusMultiplier: 0.15,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 4 },
      { city: "New York", country: "United States", currency: "USD", weight: 2 },
      { city: "Amsterdam", country: "Netherlands", currency: "EUR", weight: 2 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 2 },
      { city: "Toronto", country: "Canada", currency: "CAD", weight: 1 }],
    roles: [
      { role: "Software Engineer II", level: "Junior", exp: [0, 2],
        bands: { USD: [160, 210], INR: [22, 30], EUR: [80, 115], CAD: [110, 150] } },
      { role: "Software Engineer III", level: "Mid", exp: [2, 5],
        bands: { USD: [230, 320], INR: [35, 50], EUR: [120, 170], CAD: [150, 210] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { USD: [340, 470], INR: [55, 75], EUR: [180, 250] } },
    ],
  },

  "LinkedIn": {
    bowl: "faang-india",
    stockMultiplier: 0.5, bonusMultiplier: 0.15,
    offices: [{ city: "Sunnyvale", country: "United States", currency: "USD", weight: 4 },
      { city: "New York", country: "United States", currency: "USD", weight: 1 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 2 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 2 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { USD: [220, 300], INR: [30, 42], EUR: [110, 155] } },
      { role: "Senior Software Engineer", level: "Senior", exp: [5, 9],
        bands: { USD: [330, 460], INR: [55, 75], EUR: [170, 230] } },
      { role: "Staff Engineer", level: "Staff", exp: [9, 14],
        bands: { USD: [480, 680], INR: [85, 115] } },
    ],
  },

  "Salesforce": {
    bowl: "faang-india",
    stockMultiplier: 0.35, bonusMultiplier: 0.12,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 3 },
      { city: "Indianapolis", country: "United States", currency: "USD", weight: 1 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 2 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 1 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 3 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 2 },
      { city: "Sydney", country: "Australia", currency: "AUD", weight: 1 },
      { city: "Tokyo", country: "Japan", currency: "JPY", weight: 1 }],
    roles: [
      { role: "MTS", level: "Junior", exp: [1, 3],
        bands: { USD: [150, 195], INR: [22, 28], GBP: [70, 100], EUR: [65, 95], AUD: [110, 145] } },
      { role: "SMTS", level: "Mid", exp: [3, 6],
        bands: { USD: [210, 290], INR: [36, 50], GBP: [105, 145], EUR: [95, 135], AUD: [150, 200] } },
      { role: "Lead MTS", level: "Senior", exp: [6, 10],
        bands: { USD: [310, 430], INR: [60, 80], GBP: [150, 210], EUR: [140, 195] } },
      { role: "Principal MTS", level: "Principal", exp: [10, 15],
        bands: { USD: [430, 600], INR: [90, 115] } },
    ],
  },

  "Adobe": {
    bowl: "faang-india",
    stockMultiplier: 0.3, bonusMultiplier: 0.12,
    offices: [{ city: "San Jose", country: "United States", currency: "USD", weight: 3 },
      { city: "Seattle", country: "United States", currency: "USD", weight: 1 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Noida", country: "India", currency: "INR", weight: 3 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 1 }],
    roles: [
      { role: "MTS-1", level: "Junior", exp: [1, 3],
        bands: { USD: [140, 180], INR: [22, 30], GBP: [70, 95], EUR: [65, 90] } },
      { role: "MTS-2", level: "Mid", exp: [3, 6],
        bands: { USD: [195, 270], INR: [35, 50], GBP: [100, 140], EUR: [95, 130] } },
      { role: "Senior MTS", level: "Senior", exp: [6, 10],
        bands: { USD: [290, 400], INR: [55, 75] } },
    ],
  },

  "Atlassian": {
    bowl: "apac-tech",
    stockMultiplier: 0.4, bonusMultiplier: 0.1,
    offices: [{ city: "Sydney", country: "Australia", currency: "AUD", weight: 4 },
      { city: "San Francisco", country: "United States", currency: "USD", weight: 2 },
      { city: "Mountain View", country: "United States", currency: "USD", weight: 1 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Amsterdam", country: "Netherlands", currency: "EUR", weight: 1 },
      { city: "Yokohama", country: "Japan", currency: "JPY", weight: 1 }],
    roles: [
      { role: "P40 Engineer", level: "Mid", exp: [3, 6],
        bands: { USD: [200, 280], AUD: [170, 230], INR: [32, 42], EUR: [105, 145], JPY: [1400, 1900] } },
      { role: "P50 Senior Engineer", level: "Senior", exp: [6, 10],
        bands: { USD: [300, 420], AUD: [250, 340], INR: [50, 70], EUR: [160, 220] } },
      { role: "P60 Principal Engineer", level: "Principal", exp: [10, 14],
        bands: { USD: [430, 600], AUD: [350, 480], INR: [80, 110] } },
    ],
  },

  "Canva": {
    bowl: "apac-tech",
    stockMultiplier: 0.4, bonusMultiplier: 0.1,
    offices: [{ city: "Sydney", country: "Australia", currency: "AUD", weight: 4 },
      { city: "Melbourne", country: "Australia", currency: "AUD", weight: 2 },
      { city: "Manila", country: "Philippines", currency: "USD", weight: 2 },
      { city: "Austin", country: "United States", currency: "USD", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { AUD: [140, 190], USD: [180, 240] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { AUD: [210, 290], USD: [260, 360] } },
    ],
  },

  "Shopify": {
    bowl: "us-tech",
    stockMultiplier: 0.6, bonusMultiplier: 0.05,
    offices: [{ city: "Remote Canada", country: "Canada", currency: "CAD", weight: 4 },
      { city: "Toronto", country: "Canada", currency: "CAD", weight: 2 },
      { city: "Ottawa", country: "Canada", currency: "CAD", weight: 1 },
      { city: "Remote US", country: "United States", currency: "USD", weight: 2 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 1 }],
    roles: [
      { role: "L4 Developer", level: "Mid", exp: [2, 5],
        bands: { CAD: [150, 200], USD: [180, 250], EUR: [110, 150] } },
      { role: "L5 Senior Developer", level: "Senior", exp: [5, 9],
        bands: { CAD: [210, 290], USD: [270, 380], EUR: [160, 220] } },
      { role: "L6 Staff Developer", level: "Staff", exp: [9, 14],
        bands: { CAD: [290, 400], USD: [380, 520] } },
    ],
  },

  "Spotify": {
    bowl: "europe-tech",
    stockMultiplier: 0.3, bonusMultiplier: 0.1,
    offices: [{ city: "Stockholm", country: "Sweden", currency: "SEK", weight: 4 },
      { city: "New York", country: "United States", currency: "USD", weight: 2 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 },
      { city: "Berlin", country: "Germany", currency: "EUR", weight: 1 }],
    roles: [
      { role: "Backend Engineer II", level: "Mid", exp: [2, 5],
        bands: { SEK: [600, 850], USD: [200, 280], GBP: [80, 120], EUR: [75, 110] } },
      { role: "Senior Backend Engineer", level: "Senior", exp: [5, 9],
        bands: { SEK: [850, 1200], USD: [300, 420], GBP: [120, 170], EUR: [110, 160] } },
    ],
  },

  "Booking.com": {
    bowl: "europe-tech",
    stockMultiplier: 0.1, bonusMultiplier: 0.15,
    offices: [{ city: "Amsterdam", country: "Netherlands", currency: "EUR", weight: 5 },
      { city: "Manchester", country: "United Kingdom", currency: "GBP", weight: 1 }],
    roles: [
      { role: "Software Developer II", level: "Mid", exp: [2, 5],
        bands: { EUR: [70, 95] } },
      { role: "Senior Developer", level: "Senior", exp: [5, 9],
        bands: { EUR: [95, 135], GBP: [90, 130] } },
      { role: "Principal Developer", level: "Principal", exp: [9, 14],
        bands: { EUR: [140, 200] } },
    ],
  },

  "Klarna": {
    bowl: "fintech",
    stockMultiplier: 0.2, bonusMultiplier: 0.1,
    offices: [{ city: "Stockholm", country: "Sweden", currency: "SEK", weight: 4 },
      { city: "Berlin", country: "Germany", currency: "EUR", weight: 2 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { SEK: [550, 780], EUR: [70, 95], GBP: [75, 100] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { SEK: [800, 1100], EUR: [95, 135], GBP: [105, 145] } },
    ],
  },

  "Revolut": {
    bowl: "fintech",
    stockMultiplier: 0.3, bonusMultiplier: 0.15,
    offices: [{ city: "London", country: "United Kingdom", currency: "GBP", weight: 3 },
      { city: "Vilnius", country: "Lithuania", currency: "EUR", weight: 2 },
      { city: "Krakow", country: "Poland", currency: "EUR", weight: 2 },
      { city: "Singapore", country: "Singapore", currency: "SGD", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { GBP: [70, 105], EUR: [55, 80], SGD: [110, 150] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { GBP: [110, 160], EUR: [80, 120], SGD: [160, 230] } },
    ],
  },

  "Wise": {
    bowl: "fintech",
    stockMultiplier: 0.15, bonusMultiplier: 0.1,
    offices: [{ city: "London", country: "United Kingdom", currency: "GBP", weight: 3 },
      { city: "Tallinn", country: "Estonia", currency: "EUR", weight: 2 },
      { city: "Budapest", country: "Hungary", currency: "EUR", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { GBP: [70, 100], EUR: [55, 80] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { GBP: [110, 160], EUR: [85, 120] } },
    ],
  },

  "SAP": {
    bowl: "europe-tech",
    stockMultiplier: 0.1, bonusMultiplier: 0.15,
    offices: [{ city: "Walldorf", country: "Germany", currency: "EUR", weight: 4 },
      { city: "Berlin", country: "Germany", currency: "EUR", weight: 2 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Palo Alto", country: "United States", currency: "USD", weight: 2 }],
    roles: [
      { role: "Associate Developer", level: "Fresher", exp: [0, 1],
        bands: { EUR: [55, 70], INR: [12, 16] } },
      { role: "Developer Associate", level: "Junior", exp: [2, 4],
        bands: { EUR: [65, 85], INR: [18, 25], USD: [120, 160] } },
      { role: "Senior Developer", level: "Mid", exp: [4, 8],
        bands: { EUR: [85, 115], INR: [28, 42], USD: [180, 240] } },
    ],
  },

  // ============= APAC unicorns =============
  "Grab": {
    bowl: "apac-tech",
    stockMultiplier: 0.3, bonusMultiplier: 0.1,
    offices: [{ city: "Singapore", country: "Singapore", currency: "SGD", weight: 4 },
      { city: "Jakarta", country: "Indonesia", currency: "USD", weight: 2 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 2 },
      { city: "Ho Chi Minh City", country: "Vietnam", currency: "USD", weight: 1 }],
    roles: [
      { role: "Software Engineer 2", level: "Junior", exp: [1, 3],
        bands: { SGD: [85, 115], USD: [40, 60], INR: [18, 25] } },
      { role: "Software Engineer 3", level: "Mid", exp: [3, 6],
        bands: { SGD: [120, 170], USD: [60, 90], INR: [28, 40] } },
      { role: "Senior Engineer", level: "Senior", exp: [6, 10],
        bands: { SGD: [170, 240], USD: [85, 130], INR: [42, 60] } },
    ],
  },

  "Sea (Shopee)": {
    bowl: "apac-tech",
    stockMultiplier: 0.2, bonusMultiplier: 0.15,
    offices: [{ city: "Singapore", country: "Singapore", currency: "SGD", weight: 4 },
      { city: "Shenzhen", country: "China", currency: "USD", weight: 2 },
      { city: "Bangkok", country: "Thailand", currency: "USD", weight: 1 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [1, 3],
        bands: { SGD: [80, 110], USD: [45, 65] } },
      { role: "Senior Engineer", level: "Senior", exp: [4, 8],
        bands: { SGD: [140, 200], USD: [75, 115] } },
    ],
  },

  "ByteDance": {
    bowl: "apac-tech",
    stockMultiplier: 0.4, bonusMultiplier: 0.15,
    offices: [{ city: "Singapore", country: "Singapore", currency: "SGD", weight: 3 },
      { city: "Beijing", country: "China", currency: "USD", weight: 2 },
      { city: "Mountain View", country: "United States", currency: "USD", weight: 2 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 },
      { city: "Tokyo", country: "Japan", currency: "JPY", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { SGD: [130, 180], USD: [200, 280], GBP: [90, 130], JPY: [1500, 2100] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { SGD: [200, 280], USD: [320, 450], GBP: [140, 200] } },
    ],
  },

  "Rakuten": {
    bowl: "apac-tech",
    stockMultiplier: 0.1, bonusMultiplier: 0.1,
    offices: [{ city: "Tokyo", country: "Japan", currency: "JPY", weight: 5 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { JPY: [800, 1100], INR: [22, 32] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { JPY: [1100, 1600], INR: [40, 60] } },
    ],
  },

  "LINE": {
    bowl: "apac-tech",
    stockMultiplier: 0.1, bonusMultiplier: 0.1,
    offices: [{ city: "Tokyo", country: "Japan", currency: "JPY", weight: 4 },
      { city: "Seoul", country: "South Korea", currency: "USD", weight: 2 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { JPY: [800, 1100], USD: [60, 90] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { JPY: [1100, 1600], USD: [90, 130] } },
    ],
  },

  // ============= LATAM =============
  "Mercado Libre": {
    bowl: "latam-tech",
    stockMultiplier: 0.1, bonusMultiplier: 0.1,
    offices: [{ city: "Buenos Aires", country: "Argentina", currency: "USD", weight: 3 },
      { city: "São Paulo", country: "Brazil", currency: "BRL", weight: 3 },
      { city: "Mexico City", country: "Mexico", currency: "USD", weight: 2 }],
    roles: [
      { role: "Software Engineer Sr", level: "Mid", exp: [3, 6],
        bands: { USD: [35, 55], BRL: [180, 280] } },
      { role: "Tech Lead", level: "Senior", exp: [6, 10],
        bands: { USD: [55, 85], BRL: [280, 420] } },
    ],
  },

  "Nubank": {
    bowl: "latam-tech",
    stockMultiplier: 0.3, bonusMultiplier: 0.1,
    offices: [{ city: "São Paulo", country: "Brazil", currency: "BRL", weight: 4 },
      { city: "Mexico City", country: "Mexico", currency: "USD", weight: 1 },
      { city: "Berlin", country: "Germany", currency: "EUR", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { BRL: [160, 240], USD: [40, 60], EUR: [60, 85] } },
      { role: "Senior Software Engineer", level: "Senior", exp: [5, 9],
        bands: { BRL: [250, 380], USD: [60, 90], EUR: [85, 120] } },
    ],
  },

  "Rappi": {
    bowl: "latam-tech",
    stockMultiplier: 0.2, bonusMultiplier: 0.1,
    offices: [{ city: "Bogotá", country: "Colombia", currency: "USD", weight: 3 },
      { city: "Mexico City", country: "Mexico", currency: "USD", weight: 2 },
      { city: "São Paulo", country: "Brazil", currency: "BRL", weight: 2 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { USD: [25, 45], BRL: [140, 220] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { USD: [50, 80], BRL: [240, 360] } },
    ],
  },

  // ============= Middle East =============
  "Careem": {
    bowl: "salary-discussions",
    stockMultiplier: 0.1, bonusMultiplier: 0.15,
    offices: [{ city: "Dubai", country: "United Arab Emirates", currency: "AED", weight: 4 },
      { city: "Cairo", country: "Egypt", currency: "USD", weight: 2 },
      { city: "Karachi", country: "Pakistan", currency: "USD", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { AED: [250, 380], USD: [25, 45] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { AED: [400, 600], USD: [40, 70] } },
    ],
  },

  "Talabat": {
    bowl: "salary-discussions",
    stockMultiplier: 0, bonusMultiplier: 0.15,
    offices: [{ city: "Dubai", country: "United Arab Emirates", currency: "AED", weight: 3 },
      { city: "Kuwait City", country: "Kuwait", currency: "USD", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Mid", exp: [2, 5],
        bands: { AED: [220, 340] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9],
        bands: { AED: [380, 560] } },
    ],
  },

  // ============= Indian unicorns (kept from before, India-only) =============
  "Flipkart": {
    bowl: "salary-discussions",
    stockMultiplier: 0.3, bonusMultiplier: 0.18,
    offices: [
      { city: "Bangalore", country: "India", currency: "INR", weight: 4 },
      { city: "Mumbai", country: "India", currency: "INR", weight: 1 },
    ],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [16, 22] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [26, 38] } },
      { role: "SDE-3", level: "Senior", exp: [5, 9], bands: { INR: [42, 60] } },
      { role: "Principal Engineer", level: "Principal", exp: [9, 14], bands: { INR: [70, 90] } },
      { role: "PM-2", level: "Mid", exp: [3, 6], bands: { INR: [28, 40] } },
    ],
  },
  "Swiggy": {
    bowl: "salary-discussions",
    stockMultiplier: 0.25, bonusMultiplier: 0.15,
    offices: [{ city: "Bangalore", country: "India", currency: "INR", weight: 4 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [15, 20] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [24, 36] } },
      { role: "SDE-3", level: "Senior", exp: [5, 9], bands: { INR: [40, 58] } },
    ],
  },
  "Zomato": {
    bowl: "startup-india",
    stockMultiplier: 0.25, bonusMultiplier: 0.1,
    offices: [{ city: "Gurgaon", country: "India", currency: "INR", weight: 4 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [0, 2], bands: { INR: [14, 20] } },
      { role: "Senior Engineer", level: "Mid", exp: [2, 5], bands: { INR: [24, 38] } },
      { role: "Staff Engineer", level: "Staff", exp: [7, 12], bands: { INR: [45, 65] } },
    ],
  },
  "Razorpay": {
    bowl: "startup-india",
    stockMultiplier: 0.25, bonusMultiplier: 0.12,
    offices: [{ city: "Bangalore", country: "India", currency: "INR", weight: 4 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [16, 22] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [26, 38] } },
      { role: "SDE-3", level: "Senior", exp: [5, 9], bands: { INR: [42, 58] } },
    ],
  },
  "CRED": {
    bowl: "startup-india",
    stockMultiplier: 0.4, bonusMultiplier: 0.1,
    offices: [{ city: "Bangalore", country: "India", currency: "INR", weight: 4 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [22, 30] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [38, 55] } },
      { role: "SDE-3", level: "Senior", exp: [5, 9], bands: { INR: [60, 85] } },
    ],
  },
  "PhonePe": {
    bowl: "startup-india",
    stockMultiplier: 0.3, bonusMultiplier: 0.12,
    offices: [{ city: "Bangalore", country: "India", currency: "INR", weight: 4 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [16, 22] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [26, 38] } },
      { role: "SDE-3", level: "Senior", exp: [5, 9], bands: { INR: [42, 60] } },
    ],
  },
  "Zepto": {
    bowl: "startup-india",
    stockMultiplier: 0.3, bonusMultiplier: 0.1,
    offices: [{ city: "Mumbai", country: "India", currency: "INR", weight: 3 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 1 }],
    roles: [
      { role: "Backend Engineer", level: "Mid", exp: [2, 5], bands: { INR: [20, 30] } },
      { role: "Senior Backend Engineer", level: "Senior", exp: [5, 8], bands: { INR: [35, 50] } },
    ],
  },
  "Meesho": {
    bowl: "startup-india",
    stockMultiplier: 0.3, bonusMultiplier: 0.1,
    offices: [{ city: "Bangalore", country: "India", currency: "INR", weight: 4 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [18, 26] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [30, 44] } },
      { role: "SDE-3", level: "Senior", exp: [5, 9], bands: { INR: [50, 70] } },
    ],
  },
  "Paytm": {
    bowl: "startup-india",
    stockMultiplier: 0.15, bonusMultiplier: 0.08,
    offices: [{ city: "Noida", country: "India", currency: "INR", weight: 4 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [13, 18] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [22, 32] } },
    ],
  },
  "Freshworks": {
    bowl: "startup-india",
    stockMultiplier: 0.15, bonusMultiplier: 0.1,
    offices: [{ city: "Chennai", country: "India", currency: "INR", weight: 3 },
      { city: "San Mateo", country: "United States", currency: "USD", weight: 1 }],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [0, 2], bands: { INR: [12, 18] } },
      { role: "Senior Engineer", level: "Mid", exp: [3, 6], bands: { INR: [22, 35], USD: [180, 240] } },
    ],
  },
  "Postman": {
    bowl: "startup-india",
    stockMultiplier: 0.3, bonusMultiplier: 0.1,
    offices: [{ city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "San Francisco", country: "United States", currency: "USD", weight: 1 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [20, 28] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [32, 48], USD: [180, 250] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9], bands: { INR: [55, 75] } },
    ],
  },
  "Dream11": {
    bowl: "startup-india",
    stockMultiplier: 0.2, bonusMultiplier: 0.15,
    offices: [{ city: "Mumbai", country: "India", currency: "INR", weight: 4 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [18, 26] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [30, 45] } },
    ],
  },
  "MakeMyTrip": {
    bowl: "salary-discussions",
    stockMultiplier: 0.15, bonusMultiplier: 0.1,
    offices: [{ city: "Gurgaon", country: "India", currency: "INR", weight: 4 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [12, 17] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [20, 30] } },
      { role: "SDE-3", level: "Senior", exp: [5, 9], bands: { INR: [35, 50] } },
    ],
  },
  "Myntra": {
    bowl: "salary-discussions",
    stockMultiplier: 0.2, bonusMultiplier: 0.12,
    offices: [{ city: "Bangalore", country: "India", currency: "INR", weight: 4 }],
    roles: [
      { role: "SDE-1", level: "Junior", exp: [0, 2], bands: { INR: [15, 22] } },
      { role: "SDE-2", level: "Mid", exp: [2, 5], bands: { INR: [26, 38] } },
    ],
  },
  "Groww": {
    bowl: "startup-india",
    stockMultiplier: 0.3, bonusMultiplier: 0.1,
    offices: [{ city: "Bangalore", country: "India", currency: "INR", weight: 3 }],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [0, 2], bands: { INR: [18, 25] } },
      { role: "Senior Engineer", level: "Mid", exp: [3, 6], bands: { INR: [30, 45] } },
    ],
  },

  // ============= Indian services =============
  "TCS": {
    bowl: "tcs-employees",
    stockMultiplier: 0, bonusMultiplier: 0.05,
    offices: [
      { city: "Mumbai", country: "India", currency: "INR", weight: 3 },
      { city: "Chennai", country: "India", currency: "INR", weight: 3 },
      { city: "Pune", country: "India", currency: "INR", weight: 2 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 2 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 1 },
      { city: "New York", country: "United States", currency: "USD", weight: 1 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 },
    ],
    roles: [
      { role: "Associate Software Engineer", level: "Fresher", exp: [0, 1],
        bands: { INR: [4, 5], USD: [70, 90], GBP: [35, 45] } },
      { role: "Software Engineer", level: "Junior", exp: [2, 4],
        bands: { INR: [5, 8], USD: [85, 110], GBP: [40, 55] } },
      { role: "IT Analyst", level: "Mid", exp: [4, 7],
        bands: { INR: [8, 12], USD: [110, 140] } },
      { role: "Associate Consultant", level: "Senior", exp: [7, 11],
        bands: { INR: [13, 18] } },
    ],
  },
  "Infosys": {
    bowl: "infosys-india",
    stockMultiplier: 0, bonusMultiplier: 0.07,
    offices: [
      { city: "Bangalore", country: "India", currency: "INR", weight: 4 },
      { city: "Pune", country: "India", currency: "INR", weight: 3 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 2 },
      { city: "Chennai", country: "India", currency: "INR", weight: 2 },
      { city: "Mumbai", country: "India", currency: "INR", weight: 1 },
      { city: "Charlotte", country: "United States", currency: "USD", weight: 1 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 },
      { city: "Frankfurt", country: "Germany", currency: "EUR", weight: 1 },
    ],
    roles: [
      { role: "Systems Engineer", level: "Fresher", exp: [0, 1],
        bands: { INR: [4, 5], USD: [70, 90] } },
      { role: "Senior Systems Engineer", level: "Junior", exp: [2, 4],
        bands: { INR: [5, 8], USD: [85, 110], GBP: [35, 50] } },
      { role: "Technology Analyst", level: "Mid", exp: [4, 7],
        bands: { INR: [8, 12], USD: [105, 135], GBP: [45, 65] } },
      { role: "Senior Technology Analyst", level: "Senior", exp: [7, 11],
        bands: { INR: [12, 18], EUR: [50, 70] } },
      { role: "Technology Lead", level: "Lead", exp: [9, 14],
        bands: { INR: [18, 25] } },
    ],
  },
  "Wipro": {
    bowl: "wipro-employees",
    stockMultiplier: 0, bonusMultiplier: 0.05,
    offices: [
      { city: "Bangalore", country: "India", currency: "INR", weight: 4 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 2 },
      { city: "Pune", country: "India", currency: "INR", weight: 2 },
      { city: "Atlanta", country: "United States", currency: "USD", weight: 1 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 },
    ],
    roles: [
      { role: "Project Engineer", level: "Fresher", exp: [0, 1], bands: { INR: [3.5, 4.5] } },
      { role: "Senior Project Engineer", level: "Junior", exp: [2, 4],
        bands: { INR: [5, 8], USD: [70, 95] } },
      { role: "Technical Lead", level: "Senior", exp: [6, 10],
        bands: { INR: [10, 16], USD: [100, 130], GBP: [50, 70] } },
    ],
  },
  "Accenture": {
    bowl: "salary-discussions",
    stockMultiplier: 0.02, bonusMultiplier: 0.08,
    offices: [
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 2 },
      { city: "Pune", country: "India", currency: "INR", weight: 2 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 2 },
      { city: "New York", country: "United States", currency: "USD", weight: 2 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 2 },
    ],
    roles: [
      { role: "Associate Software Engineer", level: "Fresher", exp: [0, 1],
        bands: { INR: [4.5, 6], EUR: [40, 55], USD: [75, 95] } },
      { role: "Application Developer", level: "Junior", exp: [2, 4],
        bands: { INR: [7, 11], EUR: [50, 70], USD: [95, 125], GBP: [40, 55] } },
      { role: "Senior Developer", level: "Mid", exp: [4, 8],
        bands: { INR: [13, 20], EUR: [70, 95], USD: [125, 160], GBP: [55, 75] } },
    ],
  },
  "IBM": {
    bowl: "salary-discussions",
    stockMultiplier: 0.1, bonusMultiplier: 0.08,
    offices: [
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Pune", country: "India", currency: "INR", weight: 2 },
      { city: "Armonk", country: "United States", currency: "USD", weight: 2 },
      { city: "Toronto", country: "Canada", currency: "CAD", weight: 1 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 },
    ],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [1, 3],
        bands: { INR: [8, 12], USD: [100, 130], GBP: [40, 55], CAD: [75, 100] } },
      { role: "Advisory Engineer", level: "Mid", exp: [4, 8],
        bands: { INR: [14, 22], USD: [140, 180], GBP: [60, 85], CAD: [110, 145] } },
      { role: "Senior Engineer", level: "Senior", exp: [8, 14],
        bands: { INR: [26, 40], USD: [180, 240] } },
    ],
  },

  // ============= Banks / fintech (kept) =============
  "Goldman Sachs": {
    bowl: "fintech",
    stockMultiplier: 0.15, bonusMultiplier: 0.4,
    offices: [
      { city: "New York", country: "United States", currency: "USD", weight: 4 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 3 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Hong Kong", country: "Hong Kong", currency: "USD", weight: 1 },
      { city: "Singapore", country: "Singapore", currency: "SGD", weight: 1 },
    ],
    roles: [
      { role: "Analyst", level: "Junior", exp: [0, 2],
        bands: { USD: [120, 160], GBP: [60, 85], INR: [22, 30], SGD: [85, 115] } },
      { role: "Associate", level: "Mid", exp: [3, 6],
        bands: { USD: [200, 280], GBP: [110, 150], INR: [35, 50], SGD: [140, 200] } },
      { role: "Vice President", level: "Senior", exp: [7, 12],
        bands: { USD: [320, 460], GBP: [180, 250], INR: [60, 90] } },
    ],
  },
  "JPMorgan Chase": {
    bowl: "fintech",
    stockMultiplier: 0.1, bonusMultiplier: 0.25,
    offices: [
      { city: "New York", country: "United States", currency: "USD", weight: 4 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 2 },
      { city: "Mumbai", country: "India", currency: "INR", weight: 3 },
      { city: "Singapore", country: "Singapore", currency: "SGD", weight: 1 },
    ],
    roles: [
      { role: "Software Engineer II", level: "Junior", exp: [1, 3],
        bands: { USD: [120, 160], GBP: [55, 75], INR: [16, 22], SGD: [80, 110] } },
      { role: "Software Engineer III", level: "Mid", exp: [3, 6],
        bands: { USD: [180, 240], GBP: [85, 120], INR: [26, 38] } },
      { role: "Vice President", level: "Senior", exp: [7, 12],
        bands: { USD: [280, 380], GBP: [140, 200], INR: [50, 75] } },
    ],
  },
  "Morgan Stanley": {
    bowl: "fintech",
    stockMultiplier: 0.1, bonusMultiplier: 0.25,
    offices: [
      { city: "New York", country: "United States", currency: "USD", weight: 3 },
      { city: "Mumbai", country: "India", currency: "INR", weight: 3 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 2 },
    ],
    roles: [
      { role: "Analyst", level: "Junior", exp: [0, 2], bands: { USD: [120, 160], INR: [18, 26], GBP: [55, 75] } },
      { role: "Associate", level: "Mid", exp: [3, 6], bands: { USD: [180, 250], INR: [32, 48], GBP: [85, 120] } },
    ],
  },
  "Visa": {
    bowl: "fintech",
    stockMultiplier: 0.2, bonusMultiplier: 0.12,
    offices: [
      { city: "Foster City", country: "United States", currency: "USD", weight: 3 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 2 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 },
      { city: "Singapore", country: "Singapore", currency: "SGD", weight: 1 },
    ],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [1, 3],
        bands: { USD: [130, 175], INR: [18, 26], GBP: [65, 90], SGD: [90, 125] } },
      { role: "Senior Engineer", level: "Mid", exp: [3, 7],
        bands: { USD: [195, 270], INR: [30, 45], GBP: [100, 140], SGD: [140, 195] } },
    ],
  },

  // ============= Misc kept =============
  "Oracle": {
    bowl: "salary-discussions",
    stockMultiplier: 0.15, bonusMultiplier: 0.1,
    offices: [
      { city: "Austin", country: "United States", currency: "USD", weight: 3 },
      { city: "Redwood Shores", country: "United States", currency: "USD", weight: 2 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 1 },
    ],
    roles: [
      { role: "MTS", level: "Junior", exp: [1, 3], bands: { USD: [130, 175], INR: [18, 25] } },
      { role: "Senior MTS", level: "Mid", exp: [4, 8], bands: { USD: [190, 260], INR: [32, 45] } },
      { role: "Principal MTS", level: "Senior", exp: [8, 14], bands: { USD: [280, 380], INR: [55, 75] } },
    ],
  },
  "Cisco": {
    bowl: "salary-discussions",
    stockMultiplier: 0.15, bonusMultiplier: 0.1,
    offices: [
      { city: "San Jose", country: "United States", currency: "USD", weight: 3 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Pune", country: "India", currency: "INR", weight: 1 },
    ],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [1, 3], bands: { USD: [130, 175], INR: [12, 18] } },
      { role: "Senior Engineer", level: "Mid", exp: [3, 7], bands: { USD: [195, 270], INR: [25, 38] } },
    ],
  },
  "Intel": {
    bowl: "salary-discussions",
    stockMultiplier: 0.2, bonusMultiplier: 0.12,
    offices: [
      { city: "Santa Clara", country: "United States", currency: "USD", weight: 3 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
      { city: "Munich", country: "Germany", currency: "EUR", weight: 1 },
    ],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [1, 3], bands: { USD: [130, 175], INR: [14, 20], EUR: [60, 85] } },
      { role: "Senior Engineer", level: "Mid", exp: [3, 6], bands: { USD: [200, 280], INR: [26, 38], EUR: [85, 120] } },
    ],
  },
  "Qualcomm": {
    bowl: "salary-discussions",
    stockMultiplier: 0.3, bonusMultiplier: 0.12,
    offices: [
      { city: "San Diego", country: "United States", currency: "USD", weight: 3 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 3 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 1 },
    ],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [1, 3], bands: { USD: [130, 180], INR: [16, 22] } },
      { role: "Senior Engineer", level: "Mid", exp: [3, 6], bands: { USD: [200, 280], INR: [28, 40] } },
      { role: "Staff Engineer", level: "Senior", exp: [7, 12], bands: { USD: [320, 440], INR: [50, 70] } },
    ],
  },
  "ServiceNow": {
    bowl: "us-tech",
    stockMultiplier: 0.4, bonusMultiplier: 0.1,
    offices: [
      { city: "Santa Clara", country: "United States", currency: "USD", weight: 3 },
      { city: "Hyderabad", country: "India", currency: "INR", weight: 2 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 1 },
    ],
    roles: [
      { role: "Software Engineer", level: "Junior", exp: [1, 3], bands: { USD: [150, 200], INR: [22, 32], EUR: [70, 95] } },
      { role: "Senior Engineer", level: "Mid", exp: [3, 7], bands: { USD: [220, 310], INR: [38, 55], EUR: [110, 150] } },
    ],
  },
  "Walmart Global Tech": {
    bowl: "us-tech",
    stockMultiplier: 0.3, bonusMultiplier: 0.15,
    offices: [
      { city: "Bentonville", country: "United States", currency: "USD", weight: 3 },
      { city: "Bangalore", country: "India", currency: "INR", weight: 3 },
    ],
    roles: [
      { role: "SDE-2", level: "Junior", exp: [1, 3], bands: { USD: [150, 200], INR: [22, 30] } },
      { role: "SDE-3", level: "Mid", exp: [3, 6], bands: { USD: [220, 310], INR: [35, 50] } },
      { role: "Staff SDE", level: "Staff", exp: [8, 13], bands: { USD: [350, 480], INR: [60, 85] } },
    ],
  },

  // ============= New: more US companies =============
  "DoorDash": {
    bowl: "us-tech", stockMultiplier: 0.5, bonusMultiplier: 0.1,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 3 },
      { city: "New York", country: "United States", currency: "USD", weight: 1 }],
    roles: [
      { role: "Software Engineer E4", level: "Mid", exp: [2, 5], bands: { USD: [220, 310] } },
      { role: "Senior Engineer E5", level: "Senior", exp: [5, 9], bands: { USD: [340, 470] } },
    ],
  },
  "Lyft": {
    bowl: "us-tech", stockMultiplier: 0.45, bonusMultiplier: 0.1,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 3 }],
    roles: [
      { role: "Software Engineer L4", level: "Mid", exp: [2, 5], bands: { USD: [220, 300] } },
      { role: "Senior Engineer L5", level: "Senior", exp: [5, 9], bands: { USD: [330, 460] } },
    ],
  },
  "Pinterest": {
    bowl: "us-tech", stockMultiplier: 0.5, bonusMultiplier: 0.1,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 3 },
      { city: "Toronto", country: "Canada", currency: "CAD", weight: 1 }],
    roles: [
      { role: "Software Engineer L4", level: "Mid", exp: [2, 5], bands: { USD: [220, 310], CAD: [150, 210] } },
      { role: "Senior Engineer L5", level: "Senior", exp: [5, 9], bands: { USD: [330, 460], CAD: [220, 300] } },
    ],
  },
  "Cloudflare": {
    bowl: "us-tech", stockMultiplier: 0.5, bonusMultiplier: 0.1,
    offices: [{ city: "San Francisco", country: "United States", currency: "USD", weight: 3 },
      { city: "Austin", country: "United States", currency: "USD", weight: 1 },
      { city: "London", country: "United Kingdom", currency: "GBP", weight: 1 },
      { city: "Lisbon", country: "Portugal", currency: "EUR", weight: 1 }],
    roles: [
      { role: "Systems Engineer", level: "Mid", exp: [2, 5], bands: { USD: [200, 280], GBP: [90, 130], EUR: [70, 100] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9], bands: { USD: [300, 420], GBP: [140, 195], EUR: [100, 145] } },
    ],
  },
  "MongoDB": {
    bowl: "us-tech", stockMultiplier: 0.4, bonusMultiplier: 0.1,
    offices: [{ city: "New York", country: "United States", currency: "USD", weight: 3 },
      { city: "Dublin", country: "Ireland", currency: "EUR", weight: 1 },
      { city: "Sydney", country: "Australia", currency: "AUD", weight: 1 }],
    roles: [
      { role: "Software Engineer II", level: "Mid", exp: [2, 5], bands: { USD: [190, 260], EUR: [85, 120], AUD: [140, 190] } },
      { role: "Senior Engineer", level: "Senior", exp: [5, 9], bands: { USD: [280, 390], EUR: [130, 180], AUD: [200, 280] } },
    ],
  },
};

// ---------- Generation ----------
type SalaryEntry = {
  company: string;
  role: string;
  level: string;
  experience: number;
  baseSalary: number;
  bonus: number;
  stock: number;
  city: string;
  country: string;
  currency: Currency;
  location: string; // "City, Country"
  workArrangement: string;
  gender?: string;
  skills: string[];
  bowl: string;
};

function generateSalaryEntries(): SalaryEntry[] {
  const entries: SalaryEntry[] = [];

  for (const [company, cfg] of Object.entries(COMPANIES)) {
    for (const r of cfg.roles) {
      // 6–9 entries per role band to cover multiple offices
      const count = 6 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        // Pick an office whose currency has a band defined
        const eligibleOffices = cfg.offices.filter((o) => r.bands[o.currency]);
        if (eligibleOffices.length === 0) continue;
        const office = weighted(eligibleOffices);
        const band = r.bands[office.currency]!;
        const base = Math.round(rand(band[0], band[1]) * 10) / 10;
        const stockMul = cfg.stockMultiplier ?? 0.2;
        const bonusMul = cfg.bonusMultiplier ?? 0.1;
        const stock = Math.round(base * stockMul * (0.6 + Math.random() * 0.8) * 10) / 10;
        const bonus = Math.round(base * bonusMul * (0.6 + Math.random() * 0.8) * 10) / 10;
        const exp = Math.floor(rand(r.exp[0], r.exp[1] + 0.99));

        entries.push({
          company,
          role: r.role,
          level: r.level,
          experience: exp,
          baseSalary: Math.round(base),
          bonus: Math.round(bonus),
          stock: Math.round(stock),
          city: office.city,
          country: office.country,
          currency: office.currency,
          location: `${office.city}, ${office.country}`,
          workArrangement: pick(WORK),
          gender: Math.random() < 0.3 ? pick(GENDERS) : undefined,
          skills: pick(SKILL_PACKS),
          bowl: cfg.bowl,
        });
      }
    }
  }
  return entries;
}

// ---------- Normal posts ----------
const normalPosts = [
  { title: "TCS RTO update — 5 days a week from next month", content: "Just got the email.", bowl: "tcs-employees" },
  { title: "Why is Infosys salary revision always below inflation?", content: "Got 6% hike. Inflation is 7%+.", bowl: "infosys-india" },
  { title: "Asked for promotion for 2 years, finally quit", content: "Every 6 months promised, never came.", bowl: "software-engineers-india" },
  { title: "Bay Area vs NYC vs Seattle — real cost of living math", content: "Did the math on take-home after tax + rent. Surprising results.", bowl: "us-tech" },
  { title: "Moving from London to Dublin for the tax break — worth it?", content: "Dublin pays less in EUR but tax is lighter. Anyone made the jump?", bowl: "europe-tech" },
  { title: "Singapore vs Sydney vs Tokyo for a senior eng?", content: "Got 3 offers across APAC. SGD vs AUD vs JPY — comparing TC after rent is a nightmare.", bowl: "apac-tech" },
  { title: "Honest review: working at a top MNC vs Indian startup", content: "MNC pros: stability, brand. Startup pros: growth, pay.", bowl: "startup-india" },
  { title: "How do Mumbai and Bangalore salaries actually compare?", content: "₹30 LPA Mumbai vs ₹28 LPA Bangalore — CoL matters.", bowl: "salary-discussions" },
  { title: "Salary negotiation actually works — my proof", content: "Got ₹18 LPA, said expecting ₹23 LPA, came back ₹21.5 + 1.5 signing.", bowl: "salary-discussions" },
  { title: "$500K TC before 30 — is it realistic in the US?", content: "Yes, but the path is narrow. FAANG by year 4-5 at senior level.", bowl: "us-tech" },
  { title: "Dubai tax-free salary — how much do you actually save?", content: "AED 30K/month sounds great but accommodation and schools eat into it.", bowl: "salary-discussions" },
];

async function main() {
  console.log("🌱 Starting global seed...");

  // Bowls
  const createdBowls: Record<string, string> = {};
  for (const bowl of bowls) {
    const created = await prisma.bowl.upsert({ where: { slug: bowl.slug }, update: {}, create: bowl });
    createdBowls[bowl.slug] = created.id;
  }
  console.log(`✅ ${bowls.length} bowls`);

  // Users
  const createdUsers: string[] = [];
  for (const username of usernames) {
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: { username, karma: Math.floor(Math.random() * 500) },
    });
    createdUsers.push(user.id);
  }
  console.log(`✅ ${createdUsers.length} users`);

  // Reset SALARY posts
  await prisma.post.deleteMany({ where: { type: PostType.SALARY } });

  // Generate salary entries
  const generated = generateSalaryEntries();
  console.log(`✨ Generating ${generated.length} salary records across ${Object.keys(COMPANIES).length} companies and ${new Set(generated.map((e) => e.country)).size} countries...`);

  let idx = 0;
  for (const e of generated) {
    const bowlId = createdBowls[e.bowl] || createdBowls["salary-discussions"];
    if (!bowlId) continue;
    const totalComp = e.baseSalary + e.bonus + e.stock;
    await prisma.post.create({
      data: {
        title: `${e.role} at ${e.company} — ${e.location}`,
        content: `${e.experience} years experience. Base ${e.baseSalary} + bonus ${e.bonus} + stock ${e.stock} = total ${totalComp} ${e.currency}.`,
        type: PostType.SALARY,
        userId: createdUsers[idx % createdUsers.length],
        bowlId,
        score: Math.floor(Math.random() * 100),
        company: e.company,
        role: e.role,
        level: e.level,
        experience: e.experience,
        baseSalary: e.baseSalary,
        bonus: e.bonus,
        stock: e.stock,
        totalComp,
        location: e.location,
        country: e.country,
        currency: e.currency,
        workArrangement: e.workArrangement,
        gender: e.gender,
        skills: e.skills,
      },
    });
    idx++;
  }
  console.log(`✅ ${generated.length} salary posts`);

  // Normal posts — only seed if scarce
  const existingNormal = await prisma.post.count({ where: { type: PostType.NORMAL } });
  if (existingNormal < 5) {
    for (let i = 0; i < normalPosts.length; i++) {
      const np = normalPosts[i];
      const bowlId = createdBowls[np.bowl] || createdBowls["software-engineers-india"];
      if (!bowlId) continue;
      await prisma.post.create({
        data: {
          title: np.title,
          content: np.content,
          type: PostType.NORMAL,
          userId: createdUsers[(i + 5) % createdUsers.length],
          bowlId,
          score: Math.floor(Math.random() * 300),
        },
      });
    }
    console.log("✅ Normal posts created");
  }

  // Member counts
  for (const [, id] of Object.entries(createdBowls)) {
    await prisma.bowl.update({
      where: { id },
      data: { memberCount: Math.floor(Math.random() * 50000) + 1000 },
    });
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
