import { CATALOG, CatalogItem, Transmission } from "../data/catalog";
import { Lang, deviceLang, getLang, locale, t } from "../i18n";

export type ItemState = { km?: number; mo?: number; lastKm?: number | null; lastDate?: string | null };
export type LogEntry = { id: string; date: string; km: number | null; what: string; cost?: string; where?: string; note?: string; items: string[] };
export type Car = { make: string; make_ar: string; model: string; year: string; body: string; cc: string; cylinders: string; fuel: string; color: string };
export type PartInfo = { oem?: string[]; aftermarket?: { brand: string; number: string }[]; spec?: string; note?: string };
export type AppState = {
  car: Car | null;
  odo: number;
  odoDate: string | null;
  monthlyKm: number;
  transmission: Transmission;
  licenceDue: string;
  items: Record<string, ItemState>;
  log: LogEntry[];
  cache: { specs?: { rows: { k: string; v: string }[]; note?: string }; parts?: Record<string, PartInfo>; price?: { low: number; high: number; why?: string; tips?: string; at: string } };
  notify: boolean;
  lang: Lang;
};

export const blankState = (): AppState => ({
  car: null, odo: 0, odoDate: null, monthlyKm: 1500, transmission: "manual", licenceDue: "", items: {}, log: [], cache: {}, notify: true, lang: deviceLang(),
});

export type Status = "ok" | "warn" | "bad" | "none";
export type Due = CatalogItem & {
  lastKm?: number | null; lastDate?: string | null;
  state: Status; byKm?: number | null; byDate?: string | null; remKm?: number | null; when?: string; daysLeft?: number; frac: number;
};

export const today = () => toISO(new Date());
export function toISO(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
export const parseISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const addMonths = (s: string, m: number) => { const x = parseISO(s); x.setMonth(x.getMonth() + m); return toISO(x); };
export const addDays = (s: string, n: number) => { const x = parseISO(s); x.setDate(x.getDate() + n); return toISO(x); };
export const daysBetween = (a: string, b: string) => Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 864e5);

const DFS: Record<string, Intl.DateTimeFormat> = {};
const df = (opts: Intl.DateTimeFormatOptions, key: string) => (DFS[getLang() + key] ||= new Intl.DateTimeFormat(locale(), opts));
export const fd = (s?: string | null) => (s ? df({ day: "numeric", month: "long", year: "numeric" }, "long").format(parseISO(s)) : "");
export const fmonth = (d: Date) => df({ month: "short" }, "mon").format(d);
export const fmt = (n: number | string | null | undefined) => Number(n || 0).toLocaleString(getLang() === "ar" ? "en-US" : locale());

export function catalogFor(t: Transmission) {
  return CATALOG.filter((x) => !x.trans || ([] as Transmission[]).concat(x.trans).includes(t));
}

export function cfg(S: AppState, k: string) {
  const base = CATALOG.find((x) => x.k === k)!;
  const it = S.items[k] || {};
  return { ...base, km: it.km ?? base.km, mo: it.mo ?? base.mo, lastKm: it.lastKm, lastDate: it.lastDate };
}

/** Next due = whichever comes first: the distance interval or the time interval. */
export function due(S: AppState, k: string): Due {
  const c = cfg(S, k);
  if (c.follow) {
    const f = cfg(S, c.follow);
    if (c.lastKm == null && !c.lastDate && (f.lastKm != null || f.lastDate)) Object.assign(c, { lastKm: f.lastKm, lastDate: f.lastDate, km: f.km, mo: f.mo });
  }
  if (c.lastKm == null && !c.lastDate) return { ...c, state: "none", frac: 1 };
  const t = today();
  let byKm: number | null = null, byDate: string | null = null, remKm: number | null = null, kmDate: string | null = null;
  if (c.km && c.lastKm != null) {
    byKm = c.lastKm + c.km; remKm = byKm - S.odo;
    kmDate = addDays(t, Math.round(remKm / ((S.monthlyKm || 1500) / 30)));
  }
  if (c.mo && c.lastDate) byDate = addMonths(c.lastDate, c.mo);
  const when = [kmDate, byDate].filter(Boolean).sort()[0] as string | undefined;
  if (!when) return { ...c, state: "none", frac: 1 };
  const daysLeft = daysBetween(t, when);
  let frac = 1;
  if (remKm != null && c.km) frac = Math.min(frac, remKm / c.km);
  if (byDate && c.lastDate) frac = Math.min(frac, daysBetween(t, byDate) / (daysBetween(c.lastDate, byDate) || 1));
  const state: Status = (remKm != null && remKm <= 0) || daysLeft <= 0 ? "bad" : frac <= 0.15 || daysLeft <= 30 || (remKm != null && remKm <= 1000) ? "warn" : "ok";
  return { ...c, byKm, byDate, remKm, when, daysLeft, frac: Math.max(0, Math.min(1, frac)), state };
}

export function dueText(d: Due) {
  if (d.state === "none") return t("سجّل آخر مرة اتغير فيها علشان أحسبلك المعاد");
  const parts: string[] = [];
  if (d.byKm != null && d.remKm != null) parts.push(d.remKm <= 0 ? t("فات ميعاده بـ {n} كم", { n: fmt(-d.remKm) }) : t("باقي {n} كم (عند {at})", { n: fmt(d.remKm), at: fmt(d.byKm) }));
  if (d.byDate) parts.push((d.daysLeft ?? 1) <= 0 && (d.byKm == null || (d.remKm ?? 1) > 0) ? t("ميعاده عدى {d}", { d: fd(d.byDate) }) : t("أو قبل {d}", { d: fd(d.byDate) }));
  return parts.join(" · ");
}

const STATUS: Record<Status, string> = { ok: "تمام", warn: "قرّب", bad: "متأخر", none: "مش متسجل" };
export const statusLabel = (s: Status) => t(STATUS[s]);

export function carName(S: AppState) {
  const c = S.car;
  const make = getLang() === "ar" ? c?.make_ar || c?.make : c?.make || c?.make_ar;
  return c ? [make, c.model, c.year].filter(Boolean).join(" ") : t("عربيتي");
}
/** Car description sent to the AI server. Kept in English so it reads the same whatever the UI language. */
export function carContext(S: AppState) {
  const c = S.car || ({} as Car);
  const tr = S.transmission === "auto" ? "automatic" : S.transmission === "amt" ? "robotised manual (Easytronic/SensoDrive)" : "manual";
  return `${c.make || c.make_ar || ""} ${c.model || ""} ${c.body || ""}, year ${c.year || ""}, engine ${c.cc || ""} cc ${c.cylinders || ""} cyl ${c.fuel || ""}, ${tr} gearbox, odometer ${S.odo} km, used in Egypt`;
}
