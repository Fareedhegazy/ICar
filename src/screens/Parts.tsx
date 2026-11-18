import * as Location from "expo-location";
import React, { useState } from "react";
import { Linking, Platform, Pressable, View } from "react-native";
import { aiErrorText, askAI } from "../ai";
import { PARTS } from "../data/catalog";
import { getCountry } from "../data/countries";
import { ADVERTISE_URL, FEATURED } from "../data/shops";
import { PartInfo, carContext } from "../logic/due";
import { isRTL, t } from "../i18n";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Btn, Card, H, Row, T } from "../components/ui";

/**
 * Opens a maps search around the user. Location permission is asked only here, when the user wants the
 * nearest shop; if it is refused, maps falls back to its own idea of "near me".
 */
async function maps(q: string) {
  let at = "";
  try {
    if (Platform.OS !== "web") {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.granted) {
        const pos = (await Location.getLastKnownPositionAsync()) || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (pos) at = `/@${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)},14z`;
      }
    }
  } catch {}
  Linking.openURL("https://www.google.com/maps/search/" + encodeURIComponent(q) + at);
}
const images = (q: string) => Linking.openURL("https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(q));

export default function Parts() {
  const c = useColors();
  const { S, update } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const mk = S.car?.make || "", mkAr = (isRTL() && S.car?.make_ar) || mk || S.car?.make_ar || "", md = S.car?.model || "", yr = S.car?.year || "";

  const look = async (p: string) => {
    setBusy(p); setErr((e) => ({ ...e, [p]: "" }));
    try {
      const r = await askAI<PartInfo>("part", { part: t(p), car: carContext(S) });
      update((d) => { d.cache.parts = { ...(d.cache.parts || {}), [p]: r }; });
    } catch (e) { setErr((x) => ({ ...x, [p]: aiErrorText(e) })); }
    setBusy(null);
  };

  const country = getCountry().k;
  const featured = FEATURED.filter((s) => s.country === country && (!s.makes || s.makes.includes(mk.toLowerCase())));

  return (
    <View style={{ gap: 12 }}>
      {featured.map((s) => (
        <Card key={s.name} style={{ borderColor: c.accent }}>
          <Row style={{ justifyContent: "space-between" }}>
            <T w="bold" style={{ flex: 1 }}>{s.name}</T>
            <T size={11} color={c.accent}>{t("محل مميز")}</T>
          </Row>
          {s.city || s.note ? <T size={13} color={c.muted}>{[s.city, s.note].filter(Boolean).join(" · ")}</T> : null}
          <Row>
            {s.phone ? <Btn small title={t("اتصل")} onPress={() => Linking.openURL("tel:" + s.phone)} /> : null}
            {s.maps ? <Btn small kind="soft" title={t("الموقع")} onPress={() => Linking.openURL(s.maps!)} /> : null}
          </Row>
        </Card>
      ))}
      <H>{t("أقرب محلات ليك")}</H>
      <Card>
        <Row>
          <Btn title={t("قطع غيار {make}", { make: mkAr })} onPress={() => maps(t("قطع غيار {make} قريب مني", { make: mkAr }))} />
          <Btn kind="soft" title={t("مراكز صيانة")} onPress={() => maps(t("مركز صيانة {make}", { make: mkAr }))} />
          <Btn kind="soft" title={t("ميكانيكي")} onPress={() => maps(t("ميكانيكي قريب مني"))} />
          <Btn kind="soft" title={t("كهربائي")} onPress={() => maps(t("كهربائي سيارات قريب مني"))} />
          <Btn kind="soft" title={t("ونش")} onPress={() => maps(t("ونش إنقاذ"))} />
        </Row>
        <T size={12} color={c.muted}>{t("بيفتح الخرايط على موقعك. شوف التقييمات وكلم المحل قبل ما تروح.")}</T>
      </Card>
      <Card style={{ backgroundColor: c.sunk }}>
        <T w="semi">{t("عندك محل قطع غيار أو مركز صيانة؟")}</T>
        <T size={13} color={c.muted}>{t("اعرض محلك هنا قدام أصحاب العربيات اللي حواليك.")}</T>
        {ADVERTISE_URL ? <Btn small title={t("أعلن معانا")} onPress={() => Linking.openURL(ADVERTISE_URL)} /> : <T size={12} color={c.muted}>{t("الإعلانات هتبدأ قريب.")}</T>}
      </Card>

      <H>{t("قطع الغيار بالرقم")}</H>
      <T size={13} color={c.muted}>{t("اضغط \"رقم القطعة\" يطلعلك الرقم الأصلي وأرقام البدائل المشهورة. خد الرقم معاك للمحل علشان ماتتلبسش في قطعة غلط.")}</T>
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        {PARTS.map((p) => {
          const info = S.cache.parts?.[p];
          const nums = info ? [...(info.oem || []).map((n) => ({ b: t("أصلي"), oe: true, n })), ...(info.aftermarket || []).map((a) => ({ b: a.brand, oe: false, n: a.number }))] : [];
          return (
            <View key={p} style={{ padding: 12, borderTopWidth: 1, borderTopColor: c.line, gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <T w="semi" style={{ flex: 1 }}>{t(p)}</T>
                {!info ? <Btn small kind="soft" title={t("رقم القطعة")} busy={busy === p} onPress={() => look(p)} /> : null}
                <Btn small kind="soft" title={t("صور")} onPress={() => images(`${t(p)} ${mk} ${md} ${yr}`)} />
              </View>
              {nums.length ? (
                <Row>
                  {nums.map((x) => (
                    <Pressable key={x.b + x.n} onPress={() => images(`${x.n} ${x.oe ? mk : x.b}`)} style={{ backgroundColor: c.sunk, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <T size={12}>{x.b}: {x.n}</T>
                    </Pressable>
                  ))}
                </Row>
              ) : null}
              {info?.spec ? <T size={13} color={c.muted}>{info.spec}</T> : null}
              {info?.note ? <T size={13} color={c.muted}>{info.note}</T> : null}
              {info ? <T size={11} color={c.muted}>{t("الأرقام استرشادية. اتأكد من المحل بنفس رقم الشاسيه.")}</T> : null}
              {err[p] ? <T size={13} color={c.bad}>{err[p]}</T> : null}
            </View>
          );
        })}
      </Card>
    </View>
  );
}
