import React, { useState } from "react";
import { View } from "react-native";
import { catalogFor, fmt, parseISO, today } from "../logic/due";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Btn, Card, Chip, DateField, Field, H, Row, Sheet, T } from "../components/ui";

const MONTH = new Intl.DateTimeFormat("ar-EG", { month: "short" });

export default function Log() {
  const c = useColors();
  const { S, update } = useStore();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);
  const [date, setDate] = useState(today());
  const [km, setKm] = useState("");
  const [what, setWhat] = useState("");
  const [cost, setCost] = useState("");
  const [where, setWhere] = useState("");
  const [note, setNote] = useState("");
  const [ks, setKs] = useState<string[]>([]);

  const start = () => { setDate(today()); setKm(S.odo ? String(S.odo) : ""); setWhat(""); setCost(""); setWhere(""); setNote(""); setKs([]); setOpen(true); };
  const save = () => {
    if (!what.trim() && !ks.length) return;
    const odo = km === "" ? null : Number(km);
    update((d) => {
      ks.forEach((k) => { const x = (d.items[k] ||= {}); x.lastDate = date; x.lastKm = odo; });
      if (odo != null && odo > d.odo) { d.odo = odo; d.odoDate = date; }
      const names = catalogFor(d.transmission).filter((x) => ks.includes(x.k)).map((x) => x.n).join(" + ");
      d.log.push({ id: Date.now().toString(36), date, km: odo, what: what.trim() || names, cost, where, note, items: ks });
      d.log.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    });
    setOpen(false);
  };
  const del = (id: string) => {
    if (armed !== id) { setArmed(id); setTimeout(() => setArmed((a) => (a === id ? null : a)), 3000); return; }
    update((d) => { d.log = d.log.filter((l) => l.id !== id); });
    setArmed(null);
  };
  const total = S.log.reduce((a, l) => a + (Number(l.cost) || 0), 0);

  return (
    <View style={{ gap: 12 }}>
      <H right={<Btn small title="+ صيانة جديدة" onPress={start} />}>سجل الصيانة</H>
      {S.log.length ? (
        <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
          {S.log.map((l) => {
            const d = l.date ? parseISO(l.date) : null;
            return (
              <View key={l.id} style={{ flexDirection: "row", gap: 12, padding: 12, borderTopWidth: 1, borderTopColor: c.line, alignItems: "flex-start" }}>
                <View style={{ backgroundColor: c.sunk, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignItems: "center", minWidth: 54 }}>
                  {d ? (<><T w="bold" size={18}>{d.getDate()}</T><T size={11}>{MONTH.format(d)} {d.getFullYear()}</T></>) : <T>—</T>}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w="semi">{l.what}</T>
                  <T size={13} color={c.muted}>{[l.km != null ? `عند ${fmt(l.km)} كم` : "", l.where].filter(Boolean).join(" · ")}</T>
                  {l.note ? <T size={13} color={c.muted}>{l.note}</T> : null}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  {l.cost ? <T w="semi">{fmt(l.cost)} ج.م</T> : null}
                  <Btn small kind="soft" title={armed === l.id ? "متأكد؟" : "مسح"} onPress={() => del(l.id)} />
                </View>
              </View>
            );
          })}
        </Card>
      ) : (
        <Card><T color={c.muted}>لسه مفيش صيانات. أول ما تسجل تغيير بند من صفحة الصيانة هيظهر هنا، أو ضيف صيانة حرة (كهربا، سمكرة، إصلاح).</T></Card>
      )}
      {S.log.length ? <T size={13} color={c.muted}>الإجمالي: {fmt(total)} ج.م</T> : null}

      <Sheet visible={open} title="صيانة جديدة" onClose={() => setOpen(false)}>
        <Row>
          <DateField label="التاريخ" value={date} onChange={setDate} />
          <Field label="العداد (كم)" keyboardType="number-pad" value={km} onChangeText={setKm} />
        </Row>
        <Field label="إيه اللي اتعمل" value={what} onChangeText={setWhat} placeholder="مثال: تغيير مساعدين أمامي" />
        <Row>
          <Field label="التكلفة (ج.م)" keyboardType="number-pad" value={cost} onChangeText={setCost} />
          <Field label="المكان" value={where} onChangeText={setWhere} />
        </Row>
        <Field label="ملاحظات" multiline value={note} onChangeText={setNote} />
        <T size={13} color={c.muted}>لو ده بند من الصيانة الدورية علّمه علشان يتحسب ميعاده الجاي:</T>
        <Row>
          {catalogFor(S.transmission).map((x) => (
            <Chip key={x.k} label={x.n} on={ks.includes(x.k)} onPress={() => setKs((p) => (p.includes(x.k) ? p.filter((y) => y !== x.k) : [...p, x.k]))} />
          ))}
        </Row>
        <Btn title="حفظ" onPress={save} disabled={!what.trim() && !ks.length} />
      </Sheet>
    </View>
  );
}
