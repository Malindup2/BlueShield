/**
 * Generate 5000 vessel records spread across global ocean areas.
 * Run: node scripts/generateVessels.js
 * Output: scripts/beeceptor-vessels.json
 */

const fs = require("fs");
const path = require("path");

// Ocean zones — bounding boxes that avoid land masses
const OCEAN_ZONES = [
  // Indian Ocean
  { name: "Indian Ocean - Central", minLat: -20, maxLat: 5, minLon: 60, maxLon: 90 },
  { name: "Indian Ocean - South", minLat: -40, maxLat: -20, minLon: 50, maxLon: 100 },
  { name: "Bay of Bengal", minLat: 5, maxLat: 18, minLon: 80, maxLon: 95 },
  { name: "Arabian Sea", minLat: 8, maxLat: 22, minLon: 58, maxLon: 75 },
  { name: "Mozambique Channel", minLat: -25, maxLat: -12, minLon: 35, maxLon: 45 },
  // Pacific Ocean
  { name: "North Pacific", minLat: 20, maxLat: 45, minLon: 150, maxLon: 180 },
  { name: "North Pacific West", minLat: 20, maxLat: 45, minLon: -180, maxLon: -140 },
  { name: "Central Pacific", minLat: -10, maxLat: 20, minLon: 160, maxLon: 180 },
  { name: "Central Pacific East", minLat: -10, maxLat: 20, minLon: -180, maxLon: -120 },
  { name: "South Pacific", minLat: -40, maxLat: -10, minLon: 160, maxLon: 180 },
  { name: "South Pacific East", minLat: -40, maxLat: -10, minLon: -180, maxLon: -80 },
  { name: "East China Sea", minLat: 25, maxLat: 33, minLon: 122, maxLon: 130 },
  { name: "South China Sea", minLat: 5, maxLat: 22, minLon: 108, maxLon: 120 },
  { name: "Philippine Sea", minLat: 10, maxLat: 25, minLon: 125, maxLon: 140 },
  { name: "Sea of Japan", minLat: 35, maxLat: 45, minLon: 130, maxLon: 140 },
  { name: "Coral Sea", minLat: -25, maxLat: -10, minLon: 150, maxLon: 165 },
  { name: "Tasman Sea", minLat: -45, maxLat: -30, minLon: 150, maxLon: 170 },
  // Atlantic Ocean
  { name: "North Atlantic", minLat: 30, maxLat: 55, minLon: -50, maxLon: -10 },
  { name: "Central Atlantic", minLat: 5, maxLat: 30, minLon: -50, maxLon: -15 },
  { name: "South Atlantic", minLat: -40, maxLat: -5, minLon: -35, maxLon: 10 },
  { name: "Gulf of Mexico", minLat: 22, maxLat: 30, minLon: -97, maxLon: -83 },
  { name: "Caribbean Sea", minLat: 10, maxLat: 20, minLon: -85, maxLon: -60 },
  { name: "North Sea", minLat: 51, maxLat: 60, minLon: -2, maxLon: 8 },
  { name: "Norwegian Sea", minLat: 62, maxLat: 70, minLon: -5, maxLon: 15 },
  { name: "Baltic Sea", minLat: 54, maxLat: 65, minLon: 12, maxLon: 28 },
  { name: "Mediterranean West", minLat: 35, maxLat: 43, minLon: -5, maxLon: 15 },
  { name: "Mediterranean East", minLat: 32, maxLat: 40, minLon: 15, maxLon: 35 },
  { name: "Black Sea", minLat: 41, maxLat: 46, minLon: 28, maxLon: 41 },
  // Shipping lanes
  { name: "Strait of Malacca", minLat: 1, maxLat: 7, minLon: 98, maxLon: 105 },
  { name: "Persian Gulf", minLat: 24, maxLat: 30, minLon: 48, maxLon: 56 },
  { name: "Red Sea", minLat: 13, maxLat: 28, minLon: 33, maxLon: 43 },
  { name: "Gulf of Aden", minLat: 11, maxLat: 15, minLon: 43, maxLon: 51 },
  { name: "English Channel", minLat: 49, maxLat: 51, minLon: -5, maxLon: 2 },
  { name: "Off East Africa", minLat: -10, maxLat: 5, minLon: 42, maxLon: 55 },
  { name: "Off West Africa", minLat: -5, maxLat: 15, minLon: -20, maxLon: -5 },
  { name: "Bering Sea", minLat: 52, maxLat: 62, minLon: 165, maxLon: 180 },
  { name: "Southern Ocean", minLat: -60, maxLat: -45, minLon: -180, maxLon: 180 },
  { name: "Off Sri Lanka", minLat: 4, maxLat: 10, minLon: 78, maxLon: 85 },
];

const VESSEL_PREFIXES = ["MV", "FV", "MT", "SS", "HMS", "RV", "SY", "MY"];
const VESSEL_NAMES_PART1 = [
  "Ocean", "Sea", "Pacific", "Atlantic", "Blue", "Golden", "Silver", "Iron",
  "Crystal", "Storm", "Coral", "Emerald", "Northern", "Southern", "Eastern",
  "Western", "Royal", "Grand", "Swift", "Deep", "Star", "Sun", "Moon", "Wind",
  "Wave", "Pearl", "Jade", "Ruby", "Diamond", "Amber", "Crimson", "Neptune",
  "Poseidon", "Triton", "Aurora", "Polaris", "Viking", "Dragon", "Phoenix",
  "Falcon", "Eagle", "Horizon", "Infinity", "Liberty", "Fortune", "Spirit",
  "Guardian", "Pioneer", "Voyager", "Navigator", "Mariner", "Venture", "Titan",
  "Atlas", "Olympus", "Zenith", "Summit", "Apex", "Prime", "Nova", "Stellar",
  "Mystic", "Majestic", "Regal", "Sovereign", "Imperial", "Noble", "Brave",
  "Valiant", "Bold", "Fierce", "Mighty", "Proud", "Glory", "Honor", "Harmony"
];
const VESSEL_NAMES_PART2 = [
  "Star", "Voyager", "Explorer", "Trader", "Runner", "Breeze", "Tide", "Current",
  "Dream", "Quest", "Spirit", "Pride", "Hope", "Grace", "Dawn", "Dusk",
  "Light", "Shadow", "Arrow", "Blade", "Shield", "Crown", "Knight", "Ranger",
  "Hunter", "Seeker", "Drifter", "Cruiser", "Clipper", "Carrier", "Express",
  "Venture", "Journey", "Passage", "Crossing", "Wanderer", "Rover", "Scout",
  "Pathfinder", "Trailblazer", "Pioneer", "Sentinel", "Guardian", "Protector",
  "Defender", "Champion", "Conqueror", "Victory", "Triumph", "Glory", "Legend",
  "Destiny", "Fortune", "Treasure", "Jewel", "Gem", "Pearl", "Crest", "Wave",
  "Surge", "Thunder", "Lightning", "Tempest", "Cyclone", "Typhoon", "Gale",
  "Monsoon", "Mistral", "Zephyr", "Sirocco", "Phantom", "Mirage", "Specter"
];

const VESSEL_TYPES = [
  "Bulk Carrier", "Container Ship", "Tanker", "General Cargo", "Ro-Ro Cargo",
  "Chemical Tanker", "LNG Tanker", "Oil Tanker", "Fishing Vessel", "Trawler",
  "Longliner", "Purse Seiner", "Gillnetter", "Passenger Ship", "Cruise Ship",
  "Ferry", "Tugboat", "Supply Vessel", "Research Vessel", "Dredger",
  "Cable Layer", "Icebreaker", "Patrol Vessel", "Naval Vessel",
  "Yacht", "Sailing Vessel", "Reefer", "Heavy Lift", "FPSO", "Platform Supply"
];

const COUNTRIES = [
  "Panama", "Liberia", "Marshall Islands", "Hong Kong", "Singapore",
  "Malta", "Bahamas", "Greece", "China", "Japan", "South Korea",
  "Norway", "Germany", "United Kingdom", "Denmark", "Italy", "Turkey",
  "India", "Indonesia", "Philippines", "Vietnam", "Thailand", "Malaysia",
  "Sri Lanka", "Bangladesh", "Myanmar", "UAE", "Saudi Arabia", "Iran",
  "Oman", "Russia", "Ukraine", "Netherlands", "Belgium", "France",
  "Spain", "Portugal", "Brazil", "Argentina", "Chile", "Peru", "Colombia",
  "Mexico", "USA", "Canada", "Australia", "New Zealand", "South Africa",
  "Nigeria", "Kenya", "Tanzania", "Egypt", "Morocco", "Algeria", "Tunisia",
  "Croatia", "Cyprus", "Bermuda", "Antigua and Barbuda", "Cayman Islands",
  "Isle of Man", "Tuvalu", "Vanuatu", "Comoros", "Palau", "Belize"
];

const FIRST_NAMES = [
  "James", "Chen", "Henrik", "Ravi", "Ahmed", "Takeshi", "Maria", "Dimitri",
  "Oluwaseun", "Park", "Klaus", "Andrei", "Suresh", "Jean-Pierre", "Erik",
  "Mohammed", "Li", "Kenji", "Nikolai", "Sven", "Giovanni", "Sergio",
  "Fernando", "Carlos", "Pedro", "Antonio", "Hiroshi", "Yuki", "Kim",
  "Hans", "Wilhelm", "Piotr", "Ivan", "Boris", "Viktor", "Aleksei",
  "Raj", "Arjun", "Vijay", "Anil", "Abdul", "Omar", "Hassan", "Youssef",
  "Kofi", "Kwame", "Chidi", "Emeka", "Budi", "Wayan", "Somchai", "Nguyen",
  "Tran", "Pham", "Singh", "Kaur", "Nadia", "Fatima", "Elena", "Sofia",
  "Anna", "Ingrid", "Astrid", "Olga", "Mei", "Yuna", "Sakura", "Priya",
  "George", "William", "Robert", "Michael", "David", "Thomas", "Richard"
];

const LAST_NAMES = [
  "Carter", "Wei", "Larsen", "Jayawardena", "Al-Rashid", "Yamamoto", "Santos",
  "Papadopoulos", "Adebayo", "Joon-ho", "Müller", "Volkov", "Patel", "Dubois",
  "Johansson", "Tanaka", "Kim", "Park", "Petrov", "Ivanov", "Rossi", "Garcia",
  "Rodriguez", "Martinez", "Lopez", "Gonzalez", "Silva", "Costa", "Fernandez",
  "Schmidt", "Fischer", "Wagner", "Becker", "Nielsen", "Andersen", "Hansen",
  "Eriksson", "Lindqvist", "Nakamura", "Suzuki", "Watanabe", "Sato", "Kato",
  "Chen", "Wang", "Zhang", "Liu", "Yang", "Huang", "Zhou", "Wu",
  "Krishnamurthy", "Sharma", "Gupta", "Singh", "Kumar", "Reddy", "Nair",
  "Okafor", "Mensah", "Achebe", "Nkosi", "Mbeki", "Toure", "Diallo",
  "Nguyen", "Tran", "Le", "Pham", "Hoang", "Sukarno", "Wijaya", "Siregar",
  "O'Brien", "MacDonald", "Campbell", "Stewart", "Morrison", "Thomson"
];

const COMPANY_PREFIXES = [
  "Pacific", "Atlantic", "Global", "Ocean", "Maritime", "Sea", "Blue",
  "Golden", "Silver", "Northern", "Southern", "Eastern", "Western", "Royal",
  "Imperial", "Grand", "Premier", "Elite", "Prime", "United", "Allied",
  "Continental", "Trans", "Inter", "Euro", "Asia", "Indo", "Afro",
  "Nordic", "Baltic", "Mediterranean", "Caribbean", "Coral", "Pearl",
  "Star", "Sun", "Crown", "Diamond", "Emerald", "Phoenix", "Dragon",
  "Eagle", "Falcon", "Titan", "Atlas", "Neptune", "Poseidon", "Triton",
  "Apex", "Summit", "Zenith", "Horizon", "Infinity", "Liberty", "Victory"
];

const COMPANY_SUFFIXES = [
  "Shipping Co", "Maritime Ltd", "Logistics SA", "Marine Holdings",
  "Freight Lines", "Carriers Inc", "Transport GmbH", "Navigation AS",
  "Sealines Pty Ltd", "Fisheries Co", "Ocean Services", "Fleet Management",
  "Vessel Operations", "Ship Management", "Trading Corp", "Marine Group",
  "Shipping Lines", "Deep Sea Ltd", "Offshore Holdings", "Marine Pvt Ltd",
  "Shipping LLC", "Maritime Corp", "Logistics Ltd", "Freight Holdings",
  "Carriers Ltd", "Transport SA", "Navigation Ltd", "Sealines Inc",
  "Shipping AB", "Marine SAS", "Maritime BV", "Shipping Pte Ltd"
];

const STATUSES = ["MOVING", "ANCHORED", "MOORED", "FISHING", "DRIFTING"];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMMSI(index) {
  // MMSI format: 9 digits, first 3 = MID (country code)
  const mid = 200 + (index % 600);
  const serial = String(index).padStart(6, "0");
  return `${mid}${serial}`;
}

function generateVesselName(index) {
  const prefix = pick(VESSEL_PREFIXES);
  const part1 = pick(VESSEL_NAMES_PART1);
  const part2 = pick(VESSEL_NAMES_PART2);
  // Add number suffix for uniqueness on some vessels
  const suffix = index % 3 === 0 ? ` ${Math.floor(rand(1, 20))}` : "";
  return `${prefix} ${part1} ${part2}${suffix}`;
}

function generateVessels(count) {
  const vessels = [];
  const usedNames = new Set();

  for (let i = 0; i < count; i++) {
    const zone = pick(OCEAN_ZONES);
    const lat = parseFloat(rand(zone.minLat, zone.maxLat).toFixed(5));
    const lon = parseFloat(rand(zone.minLon, zone.maxLon).toFixed(5));

    let name = generateVesselName(i);
    while (usedNames.has(name)) {
      name = generateVesselName(i) + ` ${Math.floor(rand(20, 999))}`;
    }
    usedNames.add(name);

    const type = pick(VESSEL_TYPES);
    const isFishing = type.includes("Fish") || type === "Trawler" || type === "Longliner" || type === "Purse Seiner" || type === "Gillnetter";
    const status = isFishing ? (Math.random() < 0.6 ? "FISHING" : pick(STATUSES)) : pick(STATUSES);
    const speed = status === "ANCHORED" || status === "MOORED" ? 0 :
                  status === "DRIFTING" ? parseFloat(rand(0, 2).toFixed(1)) :
                  status === "FISHING" ? parseFloat(rand(1, 8).toFixed(1)) :
                  parseFloat(rand(3, 22).toFixed(1));

    vessels.push({
      mmsi: generateMMSI(i),
      name: name,
      latitude: lat,
      longitude: lon,
      type: type,
      speed: speed,
      course: parseFloat(rand(0, 360).toFixed(1)),
      status: status,
      ownerName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      owningCompany: `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)}`,
      owningCountry: pick(COUNTRIES)
    });
  }

  return vessels;
}

console.log("Generating 5000 vessels across global oceans...");
const vessels = generateVessels(5000);
const outputPath = path.join(__dirname, "beeceptor-vessels.json");
fs.writeFileSync(outputPath, JSON.stringify(vessels, null, 2));
console.log(`Done! Written to ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
