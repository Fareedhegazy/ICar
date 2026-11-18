import React, { useState } from "react";
import { Linking, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Text as SvgText } from "react-native-svg";
import { ZONES, Zone } from "../data/zones";
import { Status, carName, catalogFor, due } from "../logic/due";
import { ItemRow, ItemSheet } from "../screens/Service";
import { t } from "../i18n";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Card, Chip, H, Row, Sheet, T, pillColors } from "./ui";

const RANK: Record<Status, number> = { bad: 3, warn: 2, ok: 1, none: 0 };

// Side-view outlines in a 360x170 box, car facing left.
const HATCH =
  "M10 140 L8 112 Q9 96 16 92 L120 78 Q140 58 168 42 Q178 38 190 38 L282 38 Q300 40 312 52 L338 74 Q348 84 349 100 L347 140 L303 140 A28 28 0 0 0 247 140 L113 140 A28 28 0 0 0 57 140 Z";
const SEDAN =
  "M10 140 L8 112 Q9 96 16 92 L120 78 Q140 58 168 42 Q178 38 190 38 L250 38 Q264 40 276 52 L300 72 L340 76 Q350 80 351 100 L349 140 L303 140 A28 28 0 0 0 247 140 L113 140 A28 28 0 0 0 57 140 Z";
const WIN_FRONT = "M130 76 Q146 60 170 47 L216 46 L216 76 Z";
const WIN_REAR_HATCH = "M222 76 L222 46 L280 45 Q294 48 304 58 L320 74 Z";
const WIN_REAR_SEDAN = "M222 76 L222 46 L250 45 Q262 48 272 58 L290 74 Z";

export default function CarSketch() {
  const c = useColors();
  const { S } = useStore();
  const [zone, setZone] = useState<Zone | null>(null);
  const [item, setItem] = useState<string | null>(null);
  const sedan = /سيدان|sedan|berline|limousine|stufenheck|berlina/i.test(S.car?.body || "");
  const allowed = new Set(catalogFor(S.transmission).map((x) => x.k));

  const zoneItems = (z: Zone) => z.items.filter((k) => allowed.has(k)).map((k) => due(S, k));
  const zoneStatus = (z: Zone): Status => zoneItems(z).reduce<Status>((w, d) => (RANK[d.state] > RANK[w] ? d.state : w), "none");
  const dot = (s: Status) => (s === "none" ? c.petrol2 : pillColors(c, s)[1]);
  const img = (p: string) => Linking.openURL("https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(`${t(p)} ${carName(S)}`));

  return (
    <View style={{ gap: 10 }}>
      <H>{t("عربيتك")}</H>
      <Card style={{ paddingHorizontal: 6 }}>
        <View style={{ direction: "ltr" }}>
          <Svg viewBox="0 0 360 172" width="100%" height={undefined} style={{ aspectRatio: 360 / 172 }}>
            <Line x1="0" y1="166" x2="360" y2="166" stroke={c.line} strokeWidth="2" />
            <Path d={sedan ? SEDAN : HATCH} fill={c.sunk} stroke={c.ink} strokeWidth="2.2" strokeLinejoin="round" />
            <Path d={WIN_FRONT} fill={c.surface} stroke={c.muted} strokeWidth="1.4" />
            <Path d={sedan ? WIN_REAR_SEDAN : WIN_REAR_HATCH} fill={c.surface} stroke={c.muted} strokeWidth="1.4" />
            <Line x1="219" y1="78" x2="219" y2="138" stroke={c.muted} strokeWidth="1.2" strokeDasharray="4 3" />
            <Line x1="150" y1="104" x2="164" y2="104" stroke={c.muted} strokeWidth="2.5" strokeLinecap="round" />
            <Line x1="232" y1="104" x2="246" y2="104" stroke={c.muted} strokeWidth="2.5" strokeLinecap="round" />
            <Ellipse cx="17" cy="100" rx="6" ry="4" fill={c.warnBg} stroke={c.muted} />
            <Ellipse cx={sedan ? 346 : 343} cy="90" rx="4" ry="7" fill={c.badBg} stroke={c.muted} />
            {[85, 275].map((x) => (
              <G key={x}>
                <Circle cx={x} cy="140" r="24" fill={c.ink} />
                <Circle cx={x} cy="140" r="12" fill={c.muted} />
                <Circle cx={x} cy="140" r="4" fill={c.sunk} />
              </G>
            ))}
            {ZONES.map((z, i) => {
              const s = zoneStatus(z);
              return (
                <G key={z.k} onPress={() => setZone(z)}>
                  <Circle cx={z.x} cy={z.y} r="16" fill="transparent" />
                  <Circle cx={z.x} cy={z.y} r="11" fill={dot(s)} stroke={c.surface} strokeWidth="2.5" />
                  <SvgText x={z.x} y={z.y + 4} fontSize="11" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">{i + 1}</SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
        <T size={12} color={c.muted} style={{ textAlign: "center" }}>{t("دوس على أي رقم أو اسم يظهرلك مكوناته وحالة صيانته")}</T>
        <Row style={{ justifyContent: "center" }}>
          {ZONES.map((z, i) => {
            const s = zoneStatus(z);
            return <Chip key={z.k} label={`${i + 1}. ${t(z.n)}${s === "bad" ? " ●" : ""}`} onPress={() => setZone(z)} />;
          })}
        </Row>
      </Card>

      <Sheet visible={!!zone && !item} title={zone ? t(zone.n) : ""} onClose={() => setZone(null)}>
        {zone ? (
          <>
            <T color={c.muted}>{t(zone.desc)}</T>
            <T w="semi">{t("المكونات")}</T>
            <T size={12} color={c.muted}>{t("دوس على أي قطعة تشوف صورتها.")}</T>
            <Row>{zone.parts.map((p) => <Chip key={p} label={t(p)} onPress={() => img(p)} />)}</Row>
            {zoneItems(zone).length ? (
              <>
                <T w="semi">{t("الصيانة الدورية للجزء ده")}</T>
                <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
                  {zoneItems(zone).map((d) => <ItemRow key={d.k} d={d} onPress={() => setItem(d.k)} />)}
                </Card>
              </>
            ) : (
              <T size={13} color={c.muted}>{t("الجزء ده مالوش صيانة دورية بمعاد ثابت. افحصه لو حسيت بأي حاجة غريبة.")}</T>
            )}
          </>
        ) : null}
      </Sheet>
      <ItemSheet k={item} onClose={() => setItem(null)} />
    </View>
  );
}
