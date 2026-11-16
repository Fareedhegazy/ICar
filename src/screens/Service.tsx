import React, { useState } from "react";
import { Linking, View } from "react-native";
import { Due, carName, catalogFor, cfg, due, dueText, fd, fmt, statusLabel, today } from "../logic/due";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Btn, Card, DateField, Field, Gauge, H, Pill, Row, Sheet, T } from "../components/ui";

export function ItemRow({ d, onPress }: { d: Due; onPress: () => void }) {
  const c = useColors();
  const bar = d.state === "ok" ? c.ok : d.state === "warn" ? c.warn : d.state === "bad" ? c.bad : c.line;
  return (
    <View style={{ flexDirection: "row", gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: c.line, alignItems: "center" }}>
      <View style={{ width: 5, alignSelf: "stretch", borderRadius: 4, backgroundColor: bar }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T w="semi">{d.n}</T>
        <T size={13} color={c.muted}>{dueText(d)}</T>
        {d.state !== "none" ? <Gauge frac={d.frac} status={d.state} /> : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Pill status={d.state} label={statusLabel[d.state]} />
        <Btn small kind="soft" title={d.state === "none" ? "سجّل" : "اتغير"} onPress={onPress} />
      </View>
    </View>
  );
}

export function ItemSheet({ k, onClose }: { k: string | null; onClose: () => void }) {
  const c = useColors();
  const { S, update } = useStore();
  const it = k ? cfg(S, k) : null;
  const [date, setDate] = useState(today());
  const [km, setKm] = useState("");
  const [cost, setCost] = useState("");
  const [where, setWhere] = useState("");
  const [ikm, setIkm] = useState("");
  const [imo, setImo] = useState("");
  React.useEffect(() => {
    if (!it) return;
    setDate(today()); setKm(S.odo ? String(S.odo) : ""); setCost(""); setWhere("");
    setIkm(it.km ? String(it.km) : ""); setImo(it.mo ? String(it.mo) : "");
  }, [k]);
  if (!it || !k) return null;

  const save = (changed: boolean) => {
    update((d) => {
      const x = (d.items[k] ||= {});
      x.km = ikm === "" ? 0 : Number(ikm);
      x.mo = imo === "" ? 0 : Number(imo);
      if (changed) {
        const odo = km === "" ? null : Number(km);
        x.lastDate = date; x.lastKm = odo;
        if (k === "engine_oil") { const f = (d.items.oil_filter ||= {}); f.lastDate = date; f.lastKm = odo; f.km = x.km; f.mo = x.mo; }
        if (odo != null && odo > d.odo) { d.odo = odo; d.odoDate = date; }
        d.log.unshift({ id: Date.now().toString(36), date, km: odo, what: it.n + (k === "engine_oil" ? " + فلتر الزيت" : ""), cost, where, items: [k] });
        d.log.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      }
    });
    onClose();
  };

  return (
    <Sheet visible title={it.n} onClose={onClose}>
      <T size={14} color={c.muted}>{it.note}</T>
      <Row>
        <DateField label="اتغير بتاريخ" value={date} onChange={setDate} />
        <Field label="العداد وقتها (كم)" keyboardType="number-pad" value={km} onChangeText={setKm} />
      </Row>
      <Row>
        <Field label="التكلفة (ج.م)" keyboardType="number-pad" value={cost} onChangeText={setCost} />
        <Field label="المكان / الميكانيكي" value={where} onChangeText={setWhere} />
      </Row>
      <Row>
        <Field label="يتغير كل (كم)" keyboardType="number-pad" value={ikm} onChangeText={setIkm} placeholder="بالوقت بس" />
        <Field label="أو كل (شهر)" keyboardType="number-pad" value={imo} onChangeText={setImo} />
      </Row>
      <Row>
        <Btn title="سجّل التغيير" onPress={() => save(true)} />
        <Btn kind="soft" title="احفظ الفترة بس" onPress={() => save(false)} />
      </Row>
      {it.lastDate || it.lastKm != null ? (
        <T size={13} color={c.muted}>آخر تغيير متسجل: {fd(it.lastDate)} {it.lastKm != null ? `عند ${fmt(it.lastKm)} كم` : ""}</T>
      ) : null}
    </Sheet>
  );
}

export default function Service() {
  const c = useColors();
  const { S } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const order = { bad: 0, warn: 1, ok: 2, none: 3 } as const;
  const ds = catalogFor(S.transmission).map((x) => due(S, x.k)).sort((a, b) => order[a.state] - order[b.state] || (a.when || "").localeCompare(b.when || ""));
  return (
    <View style={{ gap: 12 }}>
      <H>بنود الصيانة الدورية</H>
      <T size={13} color={c.muted}>
        المعاد بيتحسب بالكيلو أو بالوقت، أيهما أقرب، على جدول "الاستخدام الشاق" بتاع المصنع لأنه المناسب لحر وتراب وزحمة مصر. التطبيق هيبعتلك إشعار قبل كل معاد بأسبوع ويوم المعاد نفسه.
      </T>
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        {ds.map((d) => <ItemRow key={d.k} d={d} onPress={() => setOpen(d.k)} />)}
      </Card>
      <T size={13} color={c.muted}>متوسط مشيك في الشهر: {fmt(S.monthlyKm)} كم. ده بيتعدل لوحده لما تحدّث العداد.</T>
      <Btn kind="soft" small title={`صور قطع ${carName(S)}`} onPress={() => Linking.openURL("https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(carName(S) + " قطع غيار"))} />
      <ItemSheet k={open} onClose={() => setOpen(null)} />
    </View>
  );
}
