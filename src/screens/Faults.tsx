import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { aiErrorText, askAI } from "../ai";
import { LIGHTS, OBD, WarningLight } from "../data/catalog";
import { carContext } from "../logic/due";
import { t } from "../i18n";
import { usePremium } from "../components/Premium";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Btn, Card, Chip, Field, H, Pill, Row, Sheet, T } from "../components/ui";

const SYMPTOMS = ["صوت تكتكة من الموتور", "رعشة وهي واقفة", "الفرامل بتصفر", "بتسخن في الزحمة", "ريحة بنزين", "التكييف مش بيبرد", "بتشد يمين", "الفتيس بينتر وهو بيغير"];

export default function Faults() {
  const c = useColors();
  const { S } = useStore();
  const [light, setLight] = useState<WarningLight | null>(null);
  const [code, setCode] = useState("");
  const [codeOut, setCodeOut] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [sym, setSym] = useState("");
  const [diag, setDiag] = useState("");
  const [busy, setBusy] = useState(false);
  const { requirePro } = usePremium();

  const lookCode = async () => {
    const k = code.trim().toUpperCase();
    if (!/^[PBCU][0-9A-F]{4}$/.test(k)) { setCodeOut(t("الكود بيبقى حرف (P أو B أو C أو U) وبعده 4 أرقام، زي P0301.")); return; }
    if (OBD[k]) { setCodeOut(`${k}: ${t(OBD[k])}`); return; }
    setCodeBusy(true); setCodeOut("");
    try { const r = await askAI("obd", { code: k, car: carContext(S) }); setCodeOut(r.text); }
    catch (e) { setCodeOut(aiErrorText(e)); }
    setCodeBusy(false);
  };
  const diagnose = async () => {
    if (!sym.trim() || !requirePro()) return;
    setBusy(true); setDiag("");
    const recent = S.log.slice(0, 8).map((l) => `${l.date}: ${l.what}`).join("; ");
    try { const r = await askAI("diagnose", { symptom: sym, car: carContext(S), recent }); setDiag(r.text); }
    catch (e) { setDiag(aiErrorText(e)); }
    setBusy(false);
  };

  const tone = (l: WarningLight) => (l.c === "red" ? [c.badBg, c.bad] : l.c === "amber" ? [c.warnBg, c.warn] : [c.okBg, c.ok]);

  return (
    <View style={{ gap: 12 }}>
      <H>{t("لمبة نورت في التابلوه؟")}</H>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {LIGHTS.map((l) => {
          const [bg, fg] = tone(l);
          return (
            <Pressable key={l.n} onPress={() => setLight(l)} style={{ flexBasis: "47%", flexGrow: 1, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: 14, padding: 10, gap: 6 }}>
              <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}><T w="bold" size={15} color={fg}>{l.s}</T></View>
              <T w="semi" size={14}>{t(l.n)}</T>
              <T size={12} color={c.muted}>{l.c === "red" ? t("أحمر: خطر") : l.c === "amber" ? t("أصفر: تحذير") : t("معلومة")}</T>
            </Pressable>
          );
        })}
      </View>

      <H>{t("كود عطل (OBD)")}</H>
      <Card>
        <Row>
          <Field label={t("الكود")} value={code} onChangeText={setCode} placeholder="P0301" autoCapitalize="characters" maxLength={5} />
          <Btn title={t("اشرح الكود")} onPress={lookCode} busy={codeBusy} style={{ alignSelf: "flex-end" }} />
        </Row>
        {codeOut ? <View style={{ backgroundColor: c.sunk, borderRadius: 12, padding: 12 }}><T size={14}>{codeOut}</T></View> : null}
        <T size={12} color={c.muted}>{t("الكود بيتقري بجهاز OBD2 صغير بلوتوث بيتركب تحت الدركسيون، أو عند أي كهربائي.")}</T>
      </Card>

      <H>{t("اوصف العَرَض بكلامك")}</H>
      <Card>
        <Row>{SYMPTOMS.map((s) => <Chip key={s} label={t(s)} onPress={() => setSym((p) => (p ? p + t("، ") : "") + t(s))} />)}</Row>
        <Field label={t("العَرَض")} multiline value={sym} onChangeText={setSym} placeholder={t("مثال: لما بدوس بنزين على سرعة 60 العربية بتنتر وصوت الموتور بيعلى")} />
        <Btn title={t("شخّص العطل")} onPress={diagnose} busy={busy} disabled={!sym.trim()} />
        {diag ? (
          <View style={{ backgroundColor: c.sunk, borderRadius: 12, padding: 12, gap: 6 }}>
            <T size={14}>{diag}</T>
            <T size={12} color={c.muted}>{t("ده تشخيص مبدئي، والميكانيكي بيأكد بالفحص.")}</T>
          </View>
        ) : null}
      </Card>

      <Sheet visible={!!light} title={light ? t(light.n) : ""} onClose={() => setLight(null)}>
        {light ? (<><Pill status={light.c === "red" ? "bad" : light.c === "amber" ? "warn" : "ok"} label={t(light.u)} /><T>{t(light.m)}</T></>) : null}
      </Sheet>
    </View>
  );
}
