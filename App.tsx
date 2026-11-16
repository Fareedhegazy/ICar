import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from "@expo-google-fonts/ibm-plex-sans-arabic";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ActivityIndicator, I18nManager, Pressable, ScrollView, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Cluster } from "./src/components/Cluster";
import { T } from "./src/components/ui";
import CarScreen from "./src/screens/Car";
import Faults from "./src/screens/Faults";
import Home from "./src/screens/Home";
import Log from "./src/screens/Log";
import Parts from "./src/screens/Parts";
import Price from "./src/screens/Price";
import Service from "./src/screens/Service";
import { StoreProvider, useStore } from "./src/store";
import { useColors } from "./src/theme";

// Arabic-first: lay everything out right-to-left.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const TABS = [
  { id: "home", t: "الرئيسية", i: "⌂" },
  { id: "service", t: "الصيانة", i: "🔧" },
  { id: "log", t: "السجل", i: "☰" },
  { id: "faults", t: "الأعطال", i: "⚠" },
  { id: "parts", t: "القطع", i: "⚙" },
  { id: "price", t: "السعر", i: "£" },
  { id: "car", t: "عربيتي", i: "🚗" },
];

function Shell() {
  const c = useColors();
  const ins = useSafeAreaInsets();
  const { S, ready } = useStore();
  const [tab, setTab] = useState("home");
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.accent} /></View>;

  const cur = !S.car && tab !== "faults" ? "car" : tab;
  const go = (t: string) => setTab(t);
  const screen = { home: <Home go={go} />, service: <Service />, log: <Log />, faults: <Faults />, parts: <Parts />, price: <Price />, car: <CarScreen go={go} /> }[cur];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        <Cluster />
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>{screen}</View>
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 6, paddingBottom: 6 + ins.bottom, paddingHorizontal: 6 }}>
        {TABS.map((t) => {
          const on = t.id === cur;
          return (
            <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ flex: 1, alignItems: "center", paddingVertical: 4, borderRadius: 10, backgroundColor: on ? c.sunk : "transparent" }}>
              <T size={17} color={on ? c.accent : c.muted} style={{ lineHeight: 22 }}>{t.i}</T>
              <T size={11} color={on ? c.accent : c.muted} numberOfLines={1}>{t.t}</T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold, IBMPlexSansArabic_700Bold });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
