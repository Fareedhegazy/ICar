import React, { useState } from "react";
import { Linking, View } from "react-native";
import { aiErrorText, askAI } from "../ai";
import { carContext, carName, fd, fmt, today } from "../logic/due";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Btn, Card, Chip, Field, H, Row, T } from "../components/ui";

const CONDS = ["ممتازة", "كويسة", "متوسطة", "محتاجة شغل"];
const PAINTS = ["فابريكا بالكامل", "رشة أو اتنين", "دهان كتير"];

export default function Price() {
  const c = useColors();
  const { S, update } = useStore();
  const [cond, setCond] = useState("كويسة");
  const [paint, setPaint] = useState("رشة أو اتنين");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const p = S.cache.price;
  const q = carName(S) + " مستعمل سعر";
  const search = (site?: string) => Linking.openURL("https://www.google.com/search?q=" + encodeURIComponent((site ? `site:${site} ` : "") + q));

  const estimate = async () => {
    setBusy(true); setErr("");
    try {
      const r = await askAI<{ low: number; high: number; why?: string; tips?: string }>("price", { car: carContext(S), condition: cond, paint, note, date: today() });
      update((d) => { d.cache.price = { ...r, at: today() }; });
    } catch (e) { setErr(aiErrorText(e)); }
    setBusy(false);
  };

  return (
    <View style={{ gap: 12 }}>
      <H>سعر عربيتك في السوق</H>
      <Card>
        <T size={13} color={c.muted}>حالة العربية</T>
        <Row>{CONDS.map((x) => <Chip key={x} label={x} on={cond === x} onPress={() => setCond(x)} />)}</Row>
        <T size={13} color={c.muted}>الدهان</T>
        <Row>{PAINTS.map((x) => <Chip key={x} label={x} on={paint === x} onPress={() => setPaint(x)} />)}</Row>
        <Field label="ملاحظات تأثر على السعر" value={note} onChangeText={setNote} placeholder="مثال: كاوتش جديد، تكييف شغال، فبريكا جوه" />
        <Btn title="قدّر السعر" onPress={estimate} busy={busy} />
        {err ? <T color={c.bad} size={13}>{err}</T> : null}
      </Card>
      {p ? (
        <Card>
          <T size={12} color={c.muted}>التقدير بتاريخ {fd(p.at)}</T>
          <T w="bold" size={26}>{fmt(p.low)} – {fmt(p.high)} ج.م</T>
          {p.why ? <T size={14}>{p.why}</T> : null}
          {p.tips ? <T size={14}><T w="semi" size={14}>يزوّد السعر: </T>{p.tips}</T> : null}
          <T size={12} color={c.muted}>تقدير بالذكاء الاصطناعي، مش سعر رسمي. قارنه بالإعلانات الحالية.</T>
        </Card>
      ) : null}
      <H>قارن بالإعلانات الحالية</H>
      <Row>
        <Btn small kind="soft" title="هتلاقي" onPress={() => search("hatla2ee.com")} />
        <Btn small kind="soft" title="كونتكت كارز" onPress={() => search("contactcars.com")} />
        <Btn small kind="soft" title="دوبيزل" onPress={() => search("dubizzle.com.eg")} />
        <Btn small kind="soft" title="جوجل" onPress={() => search()} />
      </Row>
    </View>
  );
}
