import React, { useState } from "react";
import { View } from "react-native";
import { catalogFor, daysBetween, due, fd, fmt, today } from "../logic/due";
import { t } from "../i18n";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Banner, Card, H, T } from "../components/ui";
import { ItemRow, ItemSheet } from "./Service";
import CarSketch from "../components/CarSketch";

export default function Home({ go }: { go: (tab: string) => void }) {
  const c = useColors();
  const { S } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const ds = catalogFor(S.transmission).map((x) => due(S, x.k));
  const bad = ds.filter((d) => d.state === "bad"), warn = ds.filter((d) => d.state === "warn");
  const ok = ds.filter((d) => d.state === "ok"), none = ds.filter((d) => d.state === "none");
  const upcoming = ds.filter((d) => d.state !== "none").sort((a, b) => (a.when || "").localeCompare(b.when || "")).slice(0, 6);
  const lic = S.licenceDue ? daysBetween(today(), S.licenceDue) : null;
  const year = today().slice(0, 4);
  const spent = S.log.filter((l) => l.date?.startsWith(year)).reduce((a, l) => a + (Number(l.cost) || 0), 0);

  const Stat = ({ n, label, color }: { n: number; label: string; color: string }) => (
    <Card style={{ flex: 1, padding: 10, gap: 0 }}>
      <T w="bold" size={24} color={color}>{n}</T>
      <T size={12} color={c.muted}>{label}</T>
    </Card>
  );

  return (
    <View style={{ gap: 12 }}>
      {bad.length ? <Banner status="bad">{t("{x}: ميعادها عدى.", { x: bad.map((d) => t(d.n)).join(t("، ")) })}</Banner> : null}
      {lic != null && lic <= 60 ? <Banner status={lic <= 0 ? "bad" : "warn"}>{lic <= 0 ? t("تجديد الرخصة متأخر ({d})", { d: fd(S.licenceDue) }) : t("تجديد الرخصة باقي عليه {n} يوم ({d})", { n: lic, d: fd(S.licenceDue) })}</Banner> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Stat n={bad.length} label={t("متأخر")} color={c.bad} />
        <Stat n={warn.length} label={t("قرّب ميعاده")} color={c.warn} />
        <Stat n={ok.length} label={t("تمام")} color={c.ok} />
      </View>

      <CarSketch />

      <H>{t("الجاي في الصيانة")}</H>
      {upcoming.length ? (
        <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>{upcoming.map((d) => <ItemRow key={d.k} d={d} onPress={() => setOpen(d.k)} />)}</Card>
      ) : (
        <Card><T color={c.muted}>{t("لسه مفيش بنود متسجلة. روح لصفحة الصيانة وسجّل آخر مرة غيرت فيها كل حاجة.")}</T></Card>
      )}
      {none.length ? <T size={13} color={c.muted} onPress={() => go("service")}>{t("{n} بند لسه من غير تاريخ آخر تغيير. اضغط هنا تسجلهم.", { n: none.length })}</T> : null}

      <H>{t("الرخصة والمصاريف")}</H>
      <Card>
        <Kv k={t("تجديد الرخصة")} v={S.licenceDue ? fd(S.licenceDue) : t("حدد التاريخ من صفحة عربيتي")} />
        <Kv k={t("صرفت السنة دي")} v={t("{n} ج.م", { n: fmt(spent) })} />
        <Kv k={t("عدد الصيانات المسجلة")} v={String(S.log.length)} />
      </Card>
      <ItemSheet k={open} onClose={() => setOpen(null)} />
    </View>
  );
}

export function Kv({ k, v }: { k: string; v: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <T color={c.muted}>{k}</T>
      <T w="semi" style={{ flexShrink: 1 }}>{v}</T>
    </View>
  );
}
