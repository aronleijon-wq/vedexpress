// Leveransområdet på ett ställe: texterna på sidan och adresskontrollen i
// beställningsformuläret läser härifrån, så området ändras med en enda ändring.
export const DELIVERY_AREA = {
  name: "Stockholms län",
  // De tre första siffrorna i postnumret: 1xx xx samt 761–764 xx (Norrtälje).
  postcodeRanges: [
    [100, 199],
    [761, 764],
  ],
} as const;

// Läser postnumret ("123 45" eller "12345") ur adressen. Det sista används,
// eftersom postnumret skrivs efter gatuadressen och ett husnummer annars kan
// misstas för postnummer.
export function isDeliveryArea(address: string) {
  const postcode = [...address.matchAll(/\b(\d{3}) ?\d{2}\b/g)].at(-1);
  const prefix = Number(postcode?.[1]);
  return DELIVERY_AREA.postcodeRanges.some(([min, max]) => prefix >= min && prefix <= max);
}
