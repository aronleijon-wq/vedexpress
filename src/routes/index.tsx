import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Truck, TreePine, Check, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vedlagret — Torr ved med hemkörning" },
      {
        name: "description",
        content:
          "Räkna ut hur mycket ved du behöver för säsongen och beställ med hemkörning inom Stockholms län. Torr björkved, levererad direkt till din dörr.",
      },
      { property: "og:title", content: "Vedlagret — Torr ved med hemkörning" },
      {
        property: "og:description",
        content:
          "Räkna ut hur mycket ved du behöver för säsongen och beställ med hemkörning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const PRICE_PER_M3 = 1295;

// Leverans sker endast inom Stockholms län: postnummer 1xx xx samt 761–764 xx.
function isDeliveryArea(address: string) {
  const postal = address.match(/(\d{3})\s?\d{2}/);
  const pnr = postal ? Number(postal[1]) : NaN;
  return (pnr >= 100 && pnr <= 199) || (pnr >= 761 && pnr <= 764);
}

function Index() {
  const [mode, setMode] = useState<"stoves" | "house">("house");
  const [stoves, setStoves] = useState(1);
  const [area, setArea] = useState(120);
  const [ordered, setOrdered] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const volume = useMemo(() => {
    const v = mode === "stoves" ? stoves * 3 : area * 0.05;
    return Math.max(1, Math.round(v * 2) / 2);
  }, [mode, stoves, area]);

  const price = Math.round(volume * PRICE_PER_M3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
          <Flame className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">Vedlagret</span>
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
              <MapPin className="h-4 w-4 text-primary" /> Endast Stockholms län
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
              inom Stockholms län
            </p>
          </div>

          <a
            href="#kop"
            className="mt-6 block w-full rounded-xl bg-primary px-6 py-4 text-center text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Köp nu
          </a>
        </section>

        {/* Order */}
        <section id="kop" className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {ordered ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <Check className="h-7 w-7 text-primary" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">Tack för din beställning!</h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Vi hör av oss inom kort för att boka en leveranstid som passar
                dig. Din ved är på väg!
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Beställ din ved</h2>
              <p className="mt-1 text-muted-foreground">
                Fyll i dina uppgifter — vi ringer upp och bokar leverans.
                Vi kör hem inom Stockholms län.
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const address = String(
                    new FormData(e.currentTarget).get("address") ?? "",
                  );
                  if (!isDeliveryArea(address)) {
                    setAddressError(
                      "Vi levererar inom Stockholms län — kontrollera postnumret i adressen.",
                    );
                    return;
                  }
                  setAddressError(null);
                  setOrdered(true);
                }}
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium">
                    Namn
                  </label>
                  <input
                    id="name"
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
                    type="tel"
                    required
                    maxLength={20}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="070-123 45 67"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium">
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
                    Hemkörning ingår — leverans inom Stockholms län.
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
                  {price.toLocaleString("sv-SE")} kr inkl. hemkörning inom
                  Stockholms län
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Skicka beställning
                </button>
              </form>
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" /> Vedlagret
          </span>
          <span>Torr ved · Hemkörning i Stockholms län</span>
        </div>
      </footer>
    </div>
  );
}
