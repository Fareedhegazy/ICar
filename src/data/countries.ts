// Countries ICar knows: currency, local name, and the car-listing sites used for price comparison.
// The device region picks the default; the user confirms or changes it on the My car page.
import { getLocales } from "expo-localization";

export type Country = { k: string; ar: string; en: string; cur: string; curAr?: string; sites: { n: string; d: string }[] };

export const COUNTRIES: Country[] = [
  { k: "EG", ar: "مصر", en: "Egypt", cur: "EGP", curAr: "ج.م", sites: [{ n: "Hatla2ee", d: "hatla2ee.com" }, { n: "ContactCars", d: "contactcars.com" }, { n: "Dubizzle", d: "dubizzle.com.eg" }] },
  { k: "SA", ar: "السعودية", en: "Saudi Arabia", cur: "SAR", curAr: "ر.س", sites: [{ n: "Haraj", d: "haraj.com.sa" }, { n: "Syarah", d: "syarah.com" }] },
  { k: "AE", ar: "الإمارات", en: "United Arab Emirates", cur: "AED", curAr: "د.إ", sites: [{ n: "Dubizzle", d: "dubizzle.com" }, { n: "DubiCars", d: "dubicars.com" }] },
  { k: "KW", ar: "الكويت", en: "Kuwait", cur: "KWD", curAr: "د.ك", sites: [{ n: "4Sale", d: "q8car.com" }] },
  { k: "QA", ar: "قطر", en: "Qatar", cur: "QAR", curAr: "ر.ق", sites: [{ n: "Qatar Sale", d: "qatarsale.com" }] },
  { k: "BH", ar: "البحرين", en: "Bahrain", cur: "BHD", curAr: "د.ب", sites: [] },
  { k: "OM", ar: "عُمان", en: "Oman", cur: "OMR", curAr: "ر.ع", sites: [] },
  { k: "JO", ar: "الأردن", en: "Jordan", cur: "JOD", curAr: "د.أ", sites: [{ n: "OpenSooq", d: "jo.opensooq.com" }] },
  { k: "LB", ar: "لبنان", en: "Lebanon", cur: "USD", curAr: "$", sites: [] },
  { k: "IQ", ar: "العراق", en: "Iraq", cur: "IQD", curAr: "د.ع", sites: [{ n: "OpenSooq", d: "iq.opensooq.com" }] },
  { k: "LY", ar: "ليبيا", en: "Libya", cur: "LYD", curAr: "د.ل", sites: [{ n: "OpenSooq", d: "ly.opensooq.com" }] },
  { k: "SD", ar: "السودان", en: "Sudan", cur: "SDG", curAr: "ج.س", sites: [] },
  { k: "MA", ar: "المغرب", en: "Morocco", cur: "MAD", curAr: "د.م", sites: [{ n: "Avito", d: "avito.ma" }, { n: "Moteur.ma", d: "moteur.ma" }] },
  { k: "DZ", ar: "الجزائر", en: "Algeria", cur: "DZD", curAr: "د.ج", sites: [{ n: "Ouedkniss", d: "ouedkniss.com" }] },
  { k: "TN", ar: "تونس", en: "Tunisia", cur: "TND", curAr: "د.ت", sites: [{ n: "Automobile.tn", d: "automobile.tn" }] },
  { k: "FR", ar: "فرنسا", en: "France", cur: "EUR", sites: [{ n: "leboncoin", d: "leboncoin.fr" }, { n: "La Centrale", d: "lacentrale.fr" }] },
  { k: "BE", ar: "بلجيكا", en: "Belgium", cur: "EUR", sites: [{ n: "AutoScout24", d: "autoscout24.be" }] },
  { k: "CH", ar: "سويسرا", en: "Switzerland", cur: "CHF", sites: [{ n: "AutoScout24", d: "autoscout24.ch" }] },
  { k: "DE", ar: "ألمانيا", en: "Germany", cur: "EUR", sites: [{ n: "mobile.de", d: "mobile.de" }, { n: "AutoScout24", d: "autoscout24.de" }] },
  { k: "AT", ar: "النمسا", en: "Austria", cur: "EUR", sites: [{ n: "willhaben", d: "willhaben.at" }, { n: "AutoScout24", d: "autoscout24.at" }] },
  { k: "IT", ar: "إيطاليا", en: "Italy", cur: "EUR", sites: [{ n: "Subito", d: "subito.it" }, { n: "AutoScout24", d: "autoscout24.it" }] },
  { k: "ES", ar: "إسبانيا", en: "Spain", cur: "EUR", sites: [{ n: "coches.net", d: "coches.net" }] },
  { k: "NL", ar: "هولندا", en: "Netherlands", cur: "EUR", sites: [{ n: "Marktplaats", d: "marktplaats.nl" }] },
  { k: "GB", ar: "بريطانيا", en: "United Kingdom", cur: "GBP", sites: [{ n: "Auto Trader", d: "autotrader.co.uk" }] },
  { k: "US", ar: "أمريكا", en: "United States", cur: "USD", sites: [{ n: "Cars.com", d: "cars.com" }, { n: "Autotrader", d: "autotrader.com" }] },
  { k: "CA", ar: "كندا", en: "Canada", cur: "CAD", sites: [{ n: "AutoTrader", d: "autotrader.ca" }] },
];

export const countryOf = (k?: string | null) => COUNTRIES.find((c) => c.k === k) || COUNTRIES[0];

/** Country from the phone's region setting (no permission needed). Falls back to Egypt. */
export function deviceCountry(): string {
  try {
    const r = getLocales()[0]?.regionCode?.toUpperCase() || "";
    if (COUNTRIES.some((c) => c.k === r)) return r;
  } catch {}
  return "EG";
}

/** Country name in the UI language: Arabic list for Arabic, the platform's names for others when available. */
export function countryName(c: Country, lang: string): string {
  if (lang === "ar") return c.ar;
  try {
    const DN = (Intl as unknown as { DisplayNames?: new (l: string[], o: { type: string }) => { of: (k: string) => string | undefined } }).DisplayNames;
    if (DN) return new DN([lang], { type: "region" }).of(c.k) || c.en;
  } catch {}
  return c.en;
}

// Active country, set by the store before each render (like the language), so helpers need no state argument.
let active = "EG";
export const setCountry = (k: string) => { active = k; };
export const getCountry = () => countryOf(active);
