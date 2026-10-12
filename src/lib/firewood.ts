// Vedkalkylen: hur mycket ved kunden eldar, och vad det blir per leverans.

export const PRICE_PER_M3 = 1295; // kr per m³ löst i säck, hemkörning ingår
export const SACK_LITERS = 40; // storlek på en säck vid stadig leverans

export const SEASON_MONTHS = 8; // eldningssäsongen, ca oktober–maj
export const WEEKS_PER_MONTH = 52 / 12;
export const SEASON_WEEKS = SEASON_MONTHS * WEEKS_PER_MONTH; // 34,7 veckor

// ---------------------------------------------------------------------------
// Vedens egenskaper — torr björkved i 20 cm längder, levererad löst i säck
// ---------------------------------------------------------------------------
export const LOG_LENGTH_M = 0.2; // längd på en vedkloss (m)
export const LOG_DIAMETER_M = 0.09; // diameter på en vedkloss (m)
export const LOOSE_FILL = 0.5; // andel ved i en löst fylld kubik (resten luft)
export const BIRCH_DENSITY_KG_M3 = 670; // kg per m³ fast björkved vid ca 20 % fukt
export const ENERGY_PER_KG = 4.2; // kWh per kg björkved vid ca 20 % fukt

// Volymen av en kloss (cylinder) = π × r² × längd
export const LOG_SOLID_M3 = Math.PI * Math.pow(LOG_DIAMETER_M / 2, 2) * LOG_LENGTH_M; // 1,27 liter

// Klossar per kubik löst i säck = andel ved ÷ volym per kloss
export const BLOCKS_PER_M3 = Math.round(LOOSE_FILL / LOG_SOLID_M3); // ca 393 st

// Vikt och värme per kubik löst i säck
export const KG_PER_M3 = Math.round(LOOSE_FILL * BIRCH_DENSITY_KG_M3); // ca 335 kg
export const KWH_PER_M3 = KG_PER_M3 * ENERGY_PER_KG; // ca 1 400 kWh

// null = hela säsongen på en gång, annars antal veckor mellan leveranserna
export type IntervalWeeks = null | 1 | 2 | 4;

export const DELIVERY_OPTIONS: { intervalWeeks: IntervalWeeks; label: string }[] = [
  { intervalWeeks: null, label: "Allt på en gång" },
  { intervalWeeks: 1, label: "Varje vecka" },
  { intervalWeeks: 2, label: "Varannan vecka" },
  { intervalWeeks: 4, label: "Var fjärde vecka" },
];

// Liter ved som går åt i veckan
export function litersPerWeek(firingsPerWeek: number, blocksPerFiring: number) {
  return ((firingsPerWeek * blocksPerFiring) / BLOCKS_PER_M3) * 1000;
}

export type Delivery = {
  liters: number; // per leverans
  sacks: number | null; // antal säckar per leverans, null när allt kommer på en gång
  priceKr: number; // per leverans
};

export function delivery(weeklyLiters: number, intervalWeeks: IntervalWeeks): Delivery {
  if (intervalWeeks === null) {
    // Hela säsongen, avrundat uppåt till halv kubik så att den säkert räcker
    const m3 = Math.max(1, Math.ceil((weeklyLiters * SEASON_WEEKS) / 500) / 2);
    return { liters: m3 * 1000, sacks: null, priceKr: Math.round(m3 * PRICE_PER_M3) };
  }
  // Hela säckar som räcker till nästa leverans
  const sacks = Math.max(1, Math.ceil((weeklyLiters * intervalWeeks) / SACK_LITERS));
  const liters = sacks * SACK_LITERS;
  return { liters, sacks, priceKr: Math.round((liters / 1000) * PRICE_PER_M3) };
}
