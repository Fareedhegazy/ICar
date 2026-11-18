// ICar Premium: the paid tier. Core maintenance tracking stays free.
// Payments are not wired yet: the sheet offers a free trial that unlocks Premium on this phone,
// and "Subscribe" says payment is coming. Plug the store purchase into `subscribe` later.
import React, { createContext, useContext, useState } from "react";
import { View } from "react-native";
import { getCountry } from "../data/countries";
import { t } from "../i18n";
import { addDays, fd, fmt, cur, today } from "../logic/due";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Banner, Btn, Card, Chip, Row, Sheet, T } from "./ui";

export const TRIAL_DAYS = 14;

/** Monthly and yearly price per currency, set to local purchasing power. */
const PRICES: Record<string, [number, number]> = {
  EGP: [59, 499], SAR: [15, 129], AED: [15, 129], QAR: [15, 129], KWD: [1.5, 12], BHD: [1.5, 12], OMR: [1.5, 12],
  JOD: [2, 16], IQD: [4000, 32000], LYD: [15, 120], SDG: [1500, 12000], MAD: [29, 249], DZD: [400, 3200], TND: [9, 75],
  EUR: [2.99, 24.99], CHF: [2.99, 24.99], GBP: [2.49, 19.99], USD: [2.99, 24.99], CAD: [3.99, 32.99],
};
export const premiumPrice = () => PRICES[getCountry().cur] || PRICES.USD;

export const FEATURES = [
  { i: "📷", n: "قراءة الرخصة بالكاميرا" },
  { i: "🩺", n: "تشخيص الأعطال بالذكاء الاصطناعي" },
  { i: "📤", n: "تصدير ومشاركة سجل الصيانة" },
  { i: "🚗", n: "أكتر من عربية (قريباً)" },
];

type Ctx = { isPro: boolean; requirePro: () => boolean; openPremium: () => void };
const PremiumCtx = createContext<Ctx | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const c = useColors();
  const { S, update } = useStore();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<0 | 1>(1);
  const [note, setNote] = useState("");
  const isPro = !!S.premium?.until && S.premium.until >= today();
  const [mo, yr] = premiumPrice();
  const price = (n: number) => `${fmt(n)} ${cur()}`;

  const trial = () => {
    update((d) => { d.premium = { until: addDays(today(), TRIAL_DAYS), trialUsed: true }; });
    setNote(""); setOpen(false);
  };
  const subscribe = () => setNote(t("الدفع من جوه التطبيق هيتفعل قريب. لحد كده جرّب Premium ببلاش."));

  const value: Ctx = {
    isPro,
    openPremium: () => { setNote(""); setOpen(true); },
    requirePro: () => { if (isPro) return true; setNote(""); setOpen(true); return false; },
  };

  return (
    <PremiumCtx.Provider value={value}>
      {children}
      <Sheet visible={open} title="ICar Premium" onClose={() => setOpen(false)}>
        <T color={c.muted}>{t("المتابعة والتنبيهات والسجل ببلاش دايماً. Premium بيضيف المميزات دي:")}</T>
        <Card>
          {FEATURES.map((f) => (
            <View key={f.n} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <T size={18}>{f.i}</T><T style={{ flex: 1 }}>{t(f.n)}</T>
            </View>
          ))}
        </Card>
        {isPro ? (
          <Banner status="ok">{t("Premium شغال لحد {d}.", { d: fd(S.premium?.until) })}</Banner>
        ) : (
          <>
            <Row>
              <Chip label={`${t("شهري")}: ${price(mo)}`} on={plan === 0} onPress={() => setPlan(0)} />
              <Chip label={`${t("سنوي")}: ${price(yr)}`} on={plan === 1} onPress={() => setPlan(1)} />
            </Row>
            {plan === 1 ? <T size={12} color={c.muted}>{t("السنوي بيوفّر حوالي {p}٪", { p: Math.round((1 - yr / (mo * 12)) * 100) })}</T> : null}
            <Btn title={t("اشترك")} onPress={subscribe} />
            {!S.premium?.trialUsed ? <Btn kind="soft" title={t("جرّب {n} يوم ببلاش", { n: TRIAL_DAYS })} onPress={trial} /> : null}
            {note ? <Banner status="info">{note}</Banner> : null}
          </>
        )}
      </Sheet>
    </PremiumCtx.Provider>
  );
}

export function usePremium() {
  const v = useContext(PremiumCtx);
  if (!v) throw new Error("usePremium outside PremiumProvider");
  return v;
}

/** Card for the My car page: shows Premium status and opens the sheet. */
export function PremiumCard() {
  const c = useColors();
  const { S } = useStore();
  const { isPro, openPremium } = usePremium();
  return (
    <Card style={{ borderColor: c.accent }}>
      <Row style={{ justifyContent: "space-between" }}>
        <T w="bold" size={16}>ICar Premium</T>
        <Btn small kind={isPro ? "soft" : "primary"} title={isPro ? t("التفاصيل") : t("اعرف أكتر")} onPress={openPremium} />
      </Row>
      <T size={13} color={c.muted}>{isPro ? t("Premium شغال لحد {d}.", { d: fd(S.premium?.until) }) : t("قراءة الرخصة، تشخيص الأعطال بالذكاء الاصطناعي، وتصدير السجل.")}</T>
    </Card>
  );
}
