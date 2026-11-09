export const COUNTRIES = [
  { code: "CA", flag: "🇨🇦", name: "Canada",    sym: "C$",  program: "Aeroplan" },
  { code: "US", flag: "🇺🇸", name: "USA",        sym: "$",   program: "Chase UR / MileagePlus" },
  { code: "IN", flag: "🇮🇳", name: "India",      sym: "₹",   program: "Flying Returns" },
  { code: "HK", flag: "🇭🇰", name: "Hong Kong",  sym: "HK$", program: "Asia Miles" },
];

// Award-chart cabin codes (static; mirrors the backend /cabin-codes table).
export const CABIN_CODES = { economy: "Y", premium_economy: "W", business: "J", first: "F" };
export const CABIN_CODE_HINT = "F = First · J = Business · W = Premium Economy · Y = Economy";

export const CABINS = [
  { v: "economy",         l: "Economy",         i: "💺" },
  { v: "premium_economy", l: "Premium Economy",  i: "🛋" },
  { v: "business",        l: "Business Class",   i: "✨" },
  { v: "first",           l: "First Class",      i: "👑" },
];

export const MONTHS = ["Any month","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const PEAK = new Set([6,7,8,12]);
export const SHOULDER = new Set([4,5]);

// Route order: [path, label]. Drives both the tab bar and the sitemap.
export const TABS = [
  ["/calculator", "✈ Flights"],
  ["/hotels",     "🏨 Hotels"],
  ["/gap",        "🎯 Points Gap"],
  ["/cards",      "💳 Cards"],
  ["/spots",      "⭐ Sweet Spots"],
  ["/about",      "ℹ About"],
];

export const HOTEL_DESTINATIONS = [
  "Tokyo","Paris","London","New York","Bali","Dubai","Singapore","Bangkok",
  "Rome","Barcelona","Sydney","Maldives","Amsterdam","Hong Kong","Istanbul",
  "Cancun","Phuket","Kuala Lumpur","Seoul","Vienna","Prague","Lisbon",
  "Cape Town","Miami","Las Vegas","Vancouver","Toronto","Mumbai","Delhi",
];

// Typical monthly spending proportions used to build the spending plan.
export const SPEND_PROPS = {
  groceries: 0.26, dining: 0.20, gas: 0.10, travel: 0.12,
  transit: 0.05, entertainment: 0.05, shopping: 0.08, hotel: 0.06, general: 0.08,
};

export const REVIEWS = [
  { name: "Sarah M.", country: "CA", trip: "Toronto → Tokyo", points: "65,000 Aeroplan", saving: "$4,200", text: "PointsPath showed me exactly which card to use and how to hit the spending threshold. Flew business to Japan — seats I could never afford otherwise!", avatar: "👩" },
  { name: "Raj P.",   country: "IN", trip: "Mumbai → London", points: "70,000 Air India", saving: "₹1.8L",  text: "The Points Gap calculator was a game-changer. I set a 9-month goal, followed the strategy, and booked a flat-bed on Air India One.", avatar: "👨" },
  { name: "Kevin T.", country: "US", trip: "NYC → Paris",     points: "55,000 Chase UR",  saving: "$3,100", text: "Used Chase Sapphire Reserve transfer to Air France. PointsPath's sweet spots section found this route — 55k for business is incredible value.", avatar: "🧑" },
  { name: "Mei L.",   country: "HK", trip: "HKG → Maldives",  points: "30,000 Asia Miles", saving: "HK$8,000", text: "Transferred Citi points to Asia Miles and redeemed at Category 5 resort. The hotel points calculator showed me exactly how many nights I could afford.", avatar: "👩‍💼" },
  { name: "Alex W.",  country: "CA", trip: "Vancouver → NYC", points: "15,000 Aeroplan",   saving: "$890",   text: "Domestic transborder sweet spot. Booked in under 5 minutes after finding the route on PointsPath. Cards tab helped me earn the bonus points fast.", avatar: "🙋" },
  { name: "Priya K.", country: "IN", trip: "Delhi → Dubai",   points: "22,000 Axis Edge",  saving: "₹42,000", text: "The card strategy was spot on — Axis Magnus 12x travel rate let me hit 80,000 points in 4 months just from regular spending.", avatar: "👩‍🦱" },
];

// City → continent mapping, used to group the city <select> into <optgroup>s.
export const CITY_REGION = {
  // Canada
  Toronto:"Canada", Montreal:"Canada", Vancouver:"Canada", Calgary:"Canada",
  Edmonton:"Canada", Ottawa:"Canada", Winnipeg:"Canada", Halifax:"Canada",
  "Quebec City":"Canada", Victoria:"Canada", Kelowna:"Canada", Regina:"Canada",
  Saskatoon:"Canada", Whitehorse:"Canada", Yellowknife:"Canada",
  "Prince George":"Canada", Kamloops:"Canada", Abbotsford:"Canada",
  // USA
  "New York":"USA", "Los Angeles":"USA", Chicago:"USA", Miami:"USA",
  "San Francisco":"USA", Washington:"USA", Boston:"USA", Seattle:"USA",
  Denver:"USA", Houston:"USA", Atlanta:"USA", Dallas:"USA",
  Phoenix:"USA", "Las Vegas":"USA", Minneapolis:"USA", Detroit:"USA",
  Philadelphia:"USA", Orlando:"USA",
  // Latin America
  "Mexico City":"Latin America", Cancun:"Latin America",
  "Buenos Aires":"Latin America", "São Paulo":"Latin America",
  Lima:"Latin America", "Bogotá":"Latin America", Santiago:"Latin America",
  // Europe
  London:"Europe", Paris:"Europe", Frankfurt:"Europe", Amsterdam:"Europe",
  Rome:"Europe", Madrid:"Europe", Barcelona:"Europe", Lisbon:"Europe",
  Vienna:"Europe", Istanbul:"Europe", Athens:"Europe", Zurich:"Europe",
  Copenhagen:"Europe", Stockholm:"Europe", Oslo:"Europe", Dublin:"Europe",
  Brussels:"Europe", Prague:"Europe", Warsaw:"Europe", Budapest:"Europe",
  Munich:"Europe", Milan:"Europe",
  // Middle East
  Dubai:"Middle East", "Abu Dhabi":"Middle East", Doha:"Middle East",
  Riyadh:"Middle East", "Tel Aviv":"Middle East", Amman:"Middle East",
  "Kuwait City":"Middle East", Muscat:"Middle East",
  // East Asia
  Tokyo:"East Asia", Seoul:"East Asia", Beijing:"East Asia",
  Shanghai:"East Asia", "Hong Kong":"East Asia", Taipei:"East Asia", Osaka:"East Asia",
  // Southeast Asia
  Singapore:"SE Asia", Bangkok:"SE Asia", "Kuala Lumpur":"SE Asia",
  Jakarta:"SE Asia", Bali:"SE Asia", Manila:"SE Asia",
  "Ho Chi Minh":"SE Asia", Hanoi:"SE Asia",
  // South Asia
  Mumbai:"South Asia", Delhi:"South Asia", Bengaluru:"South Asia",
  Chennai:"South Asia", Hyderabad:"South Asia", Kolkata:"South Asia",
  Kochi:"South Asia", Ahmedabad:"South Asia", Goa:"South Asia",
  Jaipur:"South Asia", Pune:"South Asia", Amritsar:"South Asia",
  Varanasi:"South Asia", Leh:"South Asia", Jammu:"South Asia",
  // Oceania
  Sydney:"Oceania", Melbourne:"Oceania", Auckland:"Oceania",
  Brisbane:"Oceania", Perth:"Oceania", Christchurch:"Oceania",
  // Africa
  Johannesburg:"Africa", Nairobi:"Africa", "Cape Town":"Africa",
  Cairo:"Africa", Casablanca:"Africa",
  // HK domestic / nearby
  Macau:"Nearby", Shenzhen:"Nearby", Guangzhou:"Nearby",
};

// Well-known official issuer homepages — used ONLY as a non-sponsored
// "Learn more" fallback link when a card has no affiliate_url. Never invent
// a URL for an issuer not listed here.
export const ISSUER_HOMEPAGES = {
  "American Express": "https://www.amex.com",
  Amex: "https://www.amex.com",
  Chase: "https://www.chase.com",
  TD: "https://www.td.com",
  CIBC: "https://www.cibc.com",
  RBC: "https://www.rbc.com",
  Scotiabank: "https://www.scotiabank.com",
  BMO: "https://www.bmo.com",
  "Capital One": "https://www.capitalone.com",
  Citi: "https://www.citi.com",
  "HDFC Bank": "https://www.hdfcbank.com",
  HDFC: "https://www.hdfcbank.com",
  "Axis Bank": "https://www.axisbank.com",
  Axis: "https://www.axisbank.com",
  "ICICI Bank": "https://www.icicibank.com",
  ICICI: "https://www.icicibank.com",
  SBI: "https://www.sbicard.com",
  HSBC: "https://www.hsbc.ca",
};

export const REGION_ORDER = [
  "Canada","USA","Latin America","Europe","Middle East",
  "East Asia","SE Asia","South Asia","Oceania","Africa","Nearby","Other",
];
