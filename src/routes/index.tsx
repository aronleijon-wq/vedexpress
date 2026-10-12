import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DELIVERY_AREA, isDeliveryArea } from "@/lib/delivery-area";
import {
  BLOCKS_PER_M3,
  DELIVERY_OPTIONS,
  KG_PER_M3,
  KWH_PER_M3,
  LOG_DIAMETER_M,
  LOG_LENGTH_M,
  LOG_SOLID_M3,
  LOOSE_FILL,
  PRICE_PER_M3,
  SACK_LITERS,
  SEASON_WEEKS,
  WEEKS_PER_MONTH,
  delivery,
  litersPerWeek,
  type IntervalWeeks,
} from "@/lib/firewood";
import { Flame, Truck, TreePine, Check, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VedExpress — Torr ved med hemkörning" },
      {
        name: "description",
        content:
          `Räkna ut hur mycket ved du eldar och få torr björkved hemkörd inom ${DELIVERY_AREA.name} — hela säsongen på en gång eller i säckar varje vecka.`,
      },
      { property: "og:title", content: "VedExpress — Torr ved med hemkörning" },
      {
        property: "og:description",
        content:
          `Räkna ut hur mycket ved du eldar — hela säsongen på en gång eller i säckar varje vecka. Hemkörning inom ${DELIVERY_AREA.name}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

// Standardvärden för eldandet — går att justera på sidan
const DEFAULT_FIRINGS_PER_WEEK = 6; // eldningar per vecka
const DEFAULT_BLOCKS_PER_FIRING = 20; // vedklossar per eldning

function num(value: number, decimals = 0) {
  return value.toLocaleString("sv-SE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Högst en decimal och ingen onödig ",0": 11 m³, 10,5 m³, 34,7 veckor
function short(value: number) {
  return value.toLocaleString("sv-SE", { maximumFractionDigits: 1 });
}

function sacksText(sacks: number) {
  return `${sacks} ${sacks === 1 ? "säck" : "säckar"}`;
}

function Index() {
  const [ordered, setOrdered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [firingsPerWeek, setFiringsPerWeek] = useState(DEFAULT_FIRINGS_PER_WEEK);
  const [blocksPerFiring, setBlocksPerFiring] = useState(
    DEFAULT_BLOCKS_PER_FIRING,
  );
  const [intervalWeeks, setIntervalWeeks] = useState<IntervalWeeks>(null);

  const blocksPerWeek = firingsPerWeek * blocksPerFiring; // 120 klossar/v
  const weeklyLiters = litersPerWeek(firingsPerWeek, blocksPerFiring); // 305 liter/v
  const order = delivery(weeklyLiters, intervalWeeks);
  const intervalLabel =
    DELIVERY_OPTIONS.find((o) => o.intervalWeeks === intervalWeeks)?.label ?? "";
  // Veckor som en leverans ska räcka: hela säsongen eller fram till nästa leverans
  const weeksPerDelivery = intervalWeeks ?? SEASON_WEEKS;

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
            Räkna ut hur mycket ved du eldar — vi kör hem exakt den mängden, hela
            säsongen på en gång eller i säckar varje vecka.
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
            Ange hur du eldar och välj hur du vill få veden.
          </p>

          {/* Eldningsvanor */}
          <div className="mt-8">
            <p className="text-sm font-medium">Så ofta eldar du</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Räkna med alla kaminer i huset tillsammans.
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
            <p className="mt-3 text-sm text-muted-foreground">
              {num(blocksPerWeek)} klossar i veckan blir ca{" "}
              <span className="font-semibold text-foreground">
                {num(weeklyLiters)} liter ved i veckan
              </span>
              .
            </p>
          </div>

          {/* Leveranssätt */}
          <div className="mt-8">
            <p className="text-sm font-medium">Hur vill du få veden?</p>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 sm:grid-cols-4">
              {DELIVERY_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={intervalWeeks === option.intervalWeeks}
                  onClick={() => setIntervalWeeks(option.intervalWeeks)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    intervalWeeks === option.intervalWeeks
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="mt-8 rounded-xl bg-accent p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {order.sacks === null
                ? "Du behöver för hela säsongen (oktober–maj)"
                : `Leverans ${intervalLabel.toLowerCase()}`}
            </p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-accent-foreground">
              {order.sacks === null
                ? `${short(order.liters / 1000)} m³`
                : sacksText(order.sacks)}
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {num(order.priceKr)} kr{order.sacks !== null && " per leverans"}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.sacks === null
                ? `${num(PRICE_PER_M3)} kr/m³`
                : `à ${SACK_LITERS} liter, räcker till nästa leverans`}{" "}
              — hemkörning ingår inom {DELIVERY_AREA.name}
            </p>
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
                = 1 000 liter × {num(LOOSE_FILL * 100)} % ved (resten är luft i
                säcken) ÷ {num(LOG_SOLID_M3 * 1000, 2)} liter ={" "}
                {num(BLOCKS_PER_M3)} klossar per m³
              </li>
              <li>
                <span className="font-medium text-foreground">3. Åtgång</span> ={" "}
                {firingsPerWeek} eldningar × {blocksPerFiring} klossar ={" "}
                {num(blocksPerWeek)} klossar ÷ {num(BLOCKS_PER_M3)} ={" "}
                {num(weeklyLiters)} liter i veckan
              </li>
              <li>
                <span className="font-medium text-foreground">
                  4. {order.sacks === null ? "Hela säsongen" : "Per leverans"}
                </span>{" "}
                = {num(weeklyLiters)} liter × {short(weeksPerDelivery)} veckor ={" "}
                {num(weeklyLiters * weeksPerDelivery)} liter →{" "}
                <span className="font-semibold text-foreground">
                  {order.sacks === null
                    ? `${short(order.liters / 1000)} m³`
                    : `${sacksText(order.sacks)} à ${SACK_LITERS} liter`}
                </span>{" "}
                (avrundat uppåt)
              </li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Torr björkved, {num(LOG_LENGTH_M * 100)} cm längder, löst i säck. En
              kubikmeter innehåller ca {num(KG_PER_M3)} kg ved ({num(BLOCKS_PER_M3)}{" "}
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
                    // Mängd, pris och räcktid gäller per leverans
                    volume_m3: order.liters / 1000,
                    price_kr: order.priceKr,
                    firings_per_week: firingsPerWeek,
                    blocks_per_firing: blocksPerFiring,
                    months: Math.round((weeksPerDelivery / WEEKS_PER_MONTH) * 10) / 10,
                    ...(intervalWeeks !== null
                      ? {
                          delivery_interval_weeks: intervalWeeks,
                          sacks_per_delivery: order.sacks,
                        }
                      : {}),
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
                  {order.sacks === null
                    ? `${short(order.liters / 1000)} m³ björkved för hela säsongen — ${num(order.priceKr)} kr`
                    : `${sacksText(order.sacks)} björkved à ${SACK_LITERS} liter ${intervalLabel.toLowerCase()} — ${num(order.priceKr)} kr per leverans`}{" "}
                  inkl. hemkörning inom {DELIVERY_AREA.name}.
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
