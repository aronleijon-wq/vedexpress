import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DELIVERY_AREA, isDeliveryArea } from "@/lib/delivery-area";
import { Flame, Truck, TreePine, Check, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VedExpress — Torr ved med hemkörning" },
      {
        name: "description",
        content:
          `Räkna ut hur mycket ved du behöver för säsongen, och hur länge den räcker i månader. Beställ med hemkörning inom ${DELIVERY_AREA.name}. Torr björkved, levererad direkt till din dörr.`,
      },
      { property: "og:title", content: "VedExpress — Torr ved med hemkörning" },
      {
        property: "og:description",
        content:
          `Räkna ut hur mycket ved du behöver för säsongen, och hur länge den räcker i månader. Hemkörning inom ${DELIVERY_AREA.name}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const PRICE_PER_M3 = 1295;

// ---------------------------------------------------------------------------
// Vedens egenskaper — torr björkved sågad i 20 cm längder
// ---------------------------------------------------------------------------
const LOG_LENGTH_M = 0.2; // längd på en vedkloss (m)
const LOG_DIAMETER_M = 0.09; // diameter på en vedkloss (m)
const STACK_FACTOR = 0.7; // andel av en uppmätt kubik som är ren ved (resten luft)
const BIRCH_DENSITY_KG_M3 = 670; // kg per m³ fast björkved vid ca 20 % fukt (≈ 2 800 kWh/m³ fast)
const ENERGY_PER_KG = 4.2; // kWh per kg björkved vid ca 20 % fukt

// ---------------------------------------------------------------------------
// Eldandet — standardvärden som går att justera på sidan
// ---------------------------------------------------------------------------
const DEFAULT_FIRINGS_PER_WEEK = 6; // eldningar per vecka
const DEFAULT_BLOCKS_PER_FIRING = 20; // vedklossar per eldning

const DAYS_PER_WEEK = 7;
const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const SEASON_MONTHS = 8; // eldningssäsongen, ca oktober–maj
const SEASON_WEEKS = SEASON_MONTHS * (WEEKS_PER_YEAR / MONTHS_PER_YEAR); // 34,7 v

// Ekvation 1: volymen av en enda kloss (cylinder) = pi * r^2 * langd
const LOG_SOLID_M3 =
  Math.PI * Math.pow(LOG_DIAMETER_M / 2, 2) * LOG_LENGTH_M; // 0,00127 m3

// Ekvation 2: klossar per uppmatt kubik = 1 / (ren volym / staplingsfaktor)
const BLOCKS_PER_M3 = Math.round(1 / (LOG_SOLID_M3 / STACK_FACTOR)); // ca 550 st

// Ekvation 3: vikt per uppmatt kubik = staplingsfaktor * treetthet
const KG_PER_M3 = Math.round(STACK_FACTOR * BIRCH_DENSITY_KG_M3); // ca 469 kg

// Ekvation 4: vikt per kloss = kg per kubik / klossar per kubik
const KG_PER_BLOCK = KG_PER_M3 / BLOCKS_PER_M3; // ca 0,85 kg

// Ekvation 5: energi per kloss = vikt per kloss * kWh per kg
const KWH_PER_BLOCK = KG_PER_BLOCK * ENERGY_PER_KG; // ca 3,6 kWh

// Ekvation 6: energi per kubik = kg per kubik * kWh per kg
const KWH_PER_M3 = KG_PER_M3 * ENERGY_PER_KG; // ca 1 970 kWh

function num(value: number, decimals = 0) {
  return value.toLocaleString("sv-SE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function Index() {
  const [mode, setMode] = useState<"stoves" | "house">("house");
  const [stoves, setStoves] = useState(1);
  const [area, setArea] = useState(120);
  const [ordered, setOrdered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [firingsPerWeek, setFiringsPerWeek] = useState(DEFAULT_FIRINGS_PER_WEEK);
  const [blocksPerFiring, setBlocksPerFiring] = useState(
    DEFAULT_BLOCKS_PER_FIRING,
  );

  const volume = useMemo(() => {
    const v = mode === "stoves" ? stoves * 3 : area * 0.05;
    return Math.max(1, Math.round(v * 2) / 2);
  }, [mode, stoves, area]);

  const price = Math.round(volume * PRICE_PER_M3);

  // Ekvation 7-9: hur mycket du eldar bort per tidsenhet
  const blocksPerWeek = firingsPerWeek * blocksPerFiring; // 120 klossar/v
  const blocksPerDay = blocksPerWeek / DAYS_PER_WEEK; // 17,1 klossar/d
  const blocksPerMonth =
    blocksPerWeek * (WEEKS_PER_YEAR / MONTHS_PER_YEAR); // 520 klossar/man

  // Ekvation 11: antal klossar i din leverans
  const totalBlocks = volume * BLOCKS_PER_M3; // 3 300 klossar

  // Ekvation 12-14: racktiden
  const days = totalBlocks / blocksPerDay; // 192 dagar
  const weeks = totalBlocks / blocksPerWeek; // 27,5 v
  const months = totalBlocks / blocksPerMonth; // 6,3 man

  // Ekvation 15: klossar och eldningar per vecka som räcker hela säsongen
  // (avrundat nedåt, så att veden säkert räcker)
  const blocksPerWeekForSeason = Math.floor(totalBlocks / SEASON_WEEKS); // 95 klossar/v
  const firingsForSeason = Math.floor(blocksPerWeekForSeason / blocksPerFiring); // 4 eldningar/v

  const seasonShare = Math.min(1, months / SEASON_MONTHS);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
          <Flame className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">VedExpress</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20">
        {/* Hero */}
        <section className="py-12 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Torr ved, levererad till din dörr
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Räkna ut hur mycket ved du behöver för att värma ditt hus hela
            säsongen — vi kör hem exakt den mängden.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <TreePine className="h-4 w-4 text-primary" /> 100 % torr björkved
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Hemkörning ingår
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Endast {DELIVERY_AREA.name}
            </span>
          </div>
        </section>

        {/* Calculator */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold">Räkna ut ditt vedbehov</h2>
          <p className="mt-1 text-muted-foreground">
            Välj det som passar dig bäst.
          </p>

          {/* Mode toggle */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("house")}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === "house"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Husets storlek
            </button>
            <button
              type="button"
              onClick={() => setMode("stoves")}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === "stoves"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Antal kaminer
            </button>
          </div>

          {/* Inputs */}
          <div className="mt-8">
            {mode === "house" ? (
              <div>
                <label className="block text-sm font-medium">
                  Hur stort är ditt hus?{" "}
                  <span className="font-bold text-primary">{area} m²</span>
                </label>
                <input
                  type="range"
                  min={40}
                  max={300}
                  step={10}
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className="mt-3 w-full accent-[oklch(0.55_0.15_55)]"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>40 m²</span>
                  <span>300 m²</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium">
                  Hur många kaminer eldar du i?{" "}
                  <span className="font-bold text-primary">{stoves} st</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={stoves}
                  onChange={(e) => setStoves(Number(e.target.value))}
                  className="mt-3 w-full accent-[oklch(0.55_0.15_55)]"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>5</span>
                </div>
              </div>
            )}
          </div>

          {/* Eldningsvanor */}
          <div className="mt-8">
            <p className="text-sm font-medium">Så ofta eldar du</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Justera efter hur du faktiskt använder kaminen.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  Eldningar i veckan
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Färre eldningar i veckan"
                    onClick={() => setFiringsPerWeek((v) => Math.max(1, v - 1))}
                    className="h-8 w-8 rounded-lg border border-border text-lg font-bold leading-none text-muted-foreground transition-colors hover:text-foreground"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-bold text-primary">
                    {firingsPerWeek}
                  </span>
                  <button
                    type="button"
                    aria-label="Fler eldningar i veckan"
                    onClick={() => setFiringsPerWeek((v) => Math.min(7, v + 1))}
                    className="h-8 w-8 rounded-lg border border-border text-lg font-bold leading-none text-muted-foreground transition-colors hover:text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  Klossar per eldning
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Färre klossar per eldning"
                    onClick={() =>
                      setBlocksPerFiring((v) => Math.max(5, v - 5))
                    }
                    className="h-8 w-8 rounded-lg border border-border text-lg font-bold leading-none text-muted-foreground transition-colors hover:text-foreground"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-lg font-bold text-primary">
                    {blocksPerFiring}
                  </span>
                  <button
                    type="button"
                    aria-label="Fler klossar per eldning"
                    onClick={() =>
                      setBlocksPerFiring((v) => Math.min(40, v + 5))
                    }
                    className="h-8 w-8 rounded-lg border border-border text-lg font-bold leading-none text-muted-foreground transition-colors hover:text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="mt-8 rounded-xl bg-accent p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Du behöver för hela säsongen
            </p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-accent-foreground">
              {volume.toLocaleString("sv-SE")} m³
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {price.toLocaleString("sv-SE")} kr{" "}
            </p>
            <p className="text-sm text-muted-foreground">
              {PRICE_PER_M3.toLocaleString("sv-SE")} kr/m³ — hemkörning ingår
              inom {DELIVERY_AREA.name}
            </p>
          </div>

          {/* How long it lasts */}
          <div className="mt-4 rounded-xl border border-border p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Hur länge räcker {volume.toLocaleString("sv-SE")} m³?
            </p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-primary">
              {num(months, 1)} månader
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {num(weeks, 1)} veckor · {num(days)} dagar · {num(totalBlocks)}{" "}
              vedklossar
            </p>

            <div className="mt-5">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${seasonShare * 100}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {months >= SEASON_MONTHS ? (
                  <>
                    Räcker hela säsongen (oktober–maj) och{" "}
                    {num(months - SEASON_MONTHS, 1)} månader utöver den.
                  </>
                ) : (
                  <>
                    Säsongen i {DELIVERY_AREA.name} är ca {SEASON_MONTHS} månader
                    (oktober–maj). Ska veden räcka hela säsongen kan du elda{" "}
                    <span className="font-semibold text-foreground">
                      ca {num(blocksPerWeekForSeason)} klossar i veckan
                    </span>
                    {firingsForSeason >= 1 && (
                      <>
                        {" "}
                        — t.ex. {firingsForSeason} eldningar à {blocksPerFiring}{" "}
                        klossar
                      </>
                    )}
                    .
                  </>
                )}
              </p>
            </div>

          </div>

          {/* So the customer can follow the maths */}
          <details className="mt-4 rounded-xl border border-border px-5 py-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Så har vi räknat
            </summary>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  1. Volym per kloss
                </span>{" "}
                = π × ({num(LOG_DIAMETER_M * 100)} cm ÷ 2)² ×{" "}
                {num(LOG_LENGTH_M * 100)} cm = {num(LOG_SOLID_M3 * 1000, 2)}{" "}
                liter ren ved
              </li>
              <li>
                <span className="font-medium text-foreground">
                  2. Klossar per kubik
                </span>{" "}
                = 1 000 liter ÷ ({num(LOG_SOLID_M3 * 1000, 2)} liter ÷{" "}
                {num(STACK_FACTOR * 100)} % stapling) = {num(BLOCKS_PER_M3)}{" "}
                klossar per m³
              </li>
              <li>
                <span className="font-medium text-foreground">
                  3. Vikt per kloss
                </span>{" "}
                = ({num(STACK_FACTOR * 100)} % × {num(BIRCH_DENSITY_KG_M3)}{" "}
                kg/m³) ÷ {num(BLOCKS_PER_M3)} = {num(KG_PER_BLOCK, 2)} kg
              </li>
              <li>
                <span className="font-medium text-foreground">
                  4. Energi per kloss
                </span>{" "}
                = {num(KG_PER_BLOCK, 2)} kg × {num(ENERGY_PER_KG, 1)} kWh/kg ={" "}
                {num(KWH_PER_BLOCK, 1)} kWh — det ger {num(KWH_PER_M3)} kWh per
                m³ björkved
              </li>
              <li>
                <span className="font-medium text-foreground">5. Åtgång</span> ={" "}
                {firingsPerWeek} eldningar × {blocksPerFiring} klossar ={" "}
                {num(blocksPerWeek)} klossar/vecka × {num(52 / 12, 2)} ={" "}
                {num(blocksPerMonth)} klossar/månad
              </li>
              <li>
                <span className="font-medium text-foreground">
                  6. Räcktid
                </span>{" "}
                = {num(totalBlocks)} klossar ÷ {num(blocksPerWeek)} ={" "}
                {num(weeks, 1)} veckor × {num(12 / 52, 3)} ={" "}
                <span className="font-semibold text-foreground">
                  {num(months, 1)} månader
                </span>
              </li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Torr björkved, {num(LOG_LENGTH_M * 100)} cm längder. Uppmätt kubik
              innehåller ca {num(KG_PER_M3)} kg ved ({num(BLOCKS_PER_M3)}{" "}
              klossar) och ger ca {num(KWH_PER_M3)} kWh värme.
            </p>
          </details>

          <a
            href="#kop"
            className="mt-6 block w-full rounded-xl bg-primary px-6 py-4 text-center text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Köp nu
          </a>
        </section>

        {/* Order */}
        <section
          id="kop"
          className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          {ordered ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <Check className="h-7 w-7 text-primary" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">
                Tack för din beställning!
              </h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Vi hör av oss inom kort för att boka en leveranstid som passar
                dig. Din ved är på väg!
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Beställ din ved</h2>
              <p className="mt-1 text-muted-foreground">
                Fyll i dina uppgifter — vi ringer upp och bokar leverans. Vi kör
                hem inom {DELIVERY_AREA.name}.
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const address = String(data.get("address") ?? "");
                  if (!isDeliveryArea(address)) {
                    setAddressError(
                      `Vi levererar inom ${DELIVERY_AREA.name} — kontrollera postnumret i adressen.`,
                    );
                    return;
                  }
                  setAddressError(null);
                  setSubmitting(true);
                  setOrderError(null);
                  const { error } = await supabase.from("orders").insert({
                    name: String(data.get("name") ?? "").trim(),
                    phone: String(data.get("phone") ?? "").trim(),
                    address,
                    volume_m3: volume,
                    price_kr: price,
                    firings_per_week: firingsPerWeek,
                    blocks_per_firing: blocksPerFiring,
                    months: Math.round(months * 10) / 10,
                  });
                  setSubmitting(false);
                  if (error) {
                    setOrderError(
                      "Något gick fel när beställningen skickades. Försök igen eller ring oss.",
                    );
                    return;
                  }
                  setOrdered(true);
                }}
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium">
                    Namn
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    maxLength={100}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ditt namn"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Telefonnummer
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    maxLength={20}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="070-123 45 67"
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium"
                  >
                    Leveransadress
                  </label>
                  <input
                    id="address"
                    name="address"
                    required
                    maxLength={200}
                    aria-invalid={addressError ? true : undefined}
                    onChange={() => addressError && setAddressError(null)}
                    className={`mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring ${
                      addressError ? "border-destructive" : "border-input"
                    }`}
                    placeholder="Gatuadress, postnummer och ort"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hemkörning ingår — leverans inom {DELIVERY_AREA.name}.
                  </p>
                  {addressError && (
                    <p className="mt-1 text-sm font-medium text-destructive">
                      {addressError}
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                  <span className="font-medium">Din beställning:</span>{" "}
                  {volume.toLocaleString("sv-SE")} m³ björkved —{" "}
                  {price.toLocaleString("sv-SE")} kr inkl. hemkörning inom{" "}
                  {DELIVERY_AREA.name}. Räcker ca {num(months, 1)} månader vid{" "}
                  {firingsPerWeek} eldningar i veckan.
                </div>
                {orderError && (
                  <p className="text-sm font-medium text-destructive">
                    {orderError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Skickar…" : "Skicka beställning"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" /> VedExpress
          </span>
          <span>Torr ved · Hemkörning i {DELIVERY_AREA.name}</span>
        </div>
      </footer>
    </div>
  );
}
