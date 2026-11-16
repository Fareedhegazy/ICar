import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { carName, daysBetween, fd, fmt, today } from "../logic/due";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Btn, Field, Sheet, T } from "./ui";

export function Cluster() {
  const c = useColors();
  const { S, update } = useStore();
  const ins = useSafeAreaInsets();
  const [odoOpen, setOdoOpen] = useState(false);
  const [odo, setOdo] = useState("");
  const digits = String(Math.max(0, Math.round(S.odo || 0))).padStart(6, "0").split("");

  const saveOdo = () => {
    const v = Number(odo);
    if (!v) return;
    update((d) => {
      if (d.odo && d.odoDate && v > d.odo) {
        const days = daysBetween(d.odoDate, today());
        if (days >= 14) d.monthlyKm = Math.round(((v - d.odo) / days) * 30);
      }
      d.odo = v;
      d.odoDate = today();
    });
    setOdoOpen(false);
  };

  return (
    <LinearGradient colors={[c.petrol, c.petrol2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: ins.top + 14, paddingHorizontal: 16, paddingBottom: 20, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flexShrink: 1 }}>
          <T w="bold" size={13} color={c.petrolInk} style={{ letterSpacing: 1.5, writingDirection: "ltr" }}>
            I<T w="bold" size={13} color={c.accent}>CAR</T>
          </T>
          <T w="bold" size={22} color={c.petrolInk}>{S.car ? carName(S) : "ICar"}</T>
          <T size={13} color={c.petrolInk} style={{ opacity: 0.8 }}>
            {S.car ? [S.car.body, S.car.cc && `${S.car.cc} سي سي`, S.car.fuel, S.car.color].filter(Boolean).join(" · ") : "صيانة، أعطال، قطع غيار، وسعر عربيتك في مكان واحد"}
          </T>
        </View>
        {S.car ? <Btn small kind="ghost" title="تحديث العداد" onPress={() => { setOdo(String(S.odo || "")); setOdoOpen(true); }} style={{ borderColor: "rgba(255,255,255,0.5)" }} /> : null}
      </View>
      {S.car ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <View style={{ flexDirection: "row", direction: "ltr", gap: 3, alignItems: "center" }}>
            {digits.map((d, i) => (
              <View key={i} style={{ width: 26, height: 36, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}>
                <T w="semi" size={20} color="#F4F7F9" style={{ lineHeight: 26 }}>{d}</T>
              </View>
            ))}
            <T size={13} color={c.petrolInk} style={{ marginLeft: 4, opacity: 0.8 }}>km</T>
          </View>
          {S.odoDate ? <T size={12} color={c.petrolInk} style={{ opacity: 0.75 }}>آخر تحديث {fd(S.odoDate)}</T> : null}
        </View>
      ) : null}

      <Sheet visible={odoOpen} title="تحديث العداد" onClose={() => setOdoOpen(false)}>
        <Field label="قراءة العداد دلوقتي (كم)" keyboardType="number-pad" value={odo} onChangeText={setOdo} />
        <T size={13} color={c.muted}>حدّث العداد كل كام أسبوع علشان المواعيد تبقى دقيقة. الحالي: {fmt(S.odo)} كم</T>
        <Btn title="حفظ" onPress={saveOdo} />
      </Sheet>
    </LinearGradient>
  );
}
