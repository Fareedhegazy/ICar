import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import React from "react";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, TextProps, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Status, fd, parseISO, toISO } from "../logic/due";
import { Colors, F, useColors } from "../theme";

export function T({ style, w = "regular", size = 15, color, ...p }: TextProps & { w?: keyof typeof F; size?: number; color?: string }) {
  const c = useColors();
  return <Text {...p} style={[{ fontFamily: F[w], fontSize: size, color: color || c.ink, lineHeight: Math.round(size * 1.6) }, style]} />;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 }, style]}>{children}</View>;
}

export function H({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
      <T w="bold" size={19}>{children}</T>
      {right}
    </View>
  );
}

type BtnKind = "primary" | "soft" | "ghost";
export function Btn({ title, onPress, kind = "primary", small, disabled, busy, style }: { title: string; onPress: () => void; kind?: BtnKind; small?: boolean; disabled?: boolean; busy?: boolean; style?: ViewStyle }) {
  const c = useColors();
  const bg = kind === "primary" ? c.accent : kind === "soft" ? c.sunk : "transparent";
  const fg = kind === "primary" ? c.accentInk : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        { backgroundColor: bg, borderRadius: small ? 9 : 12, paddingVertical: small ? 6 : 11, paddingHorizontal: small ? 12 : 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        kind === "ghost" && { borderWidth: 1, borderColor: c.line },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={fg} size="small" /> : null}
      <T w="semi" size={small ? 13 : 15} color={fg}>{title}</T>
    </Pressable>
  );
}

export function pillColors(c: Colors, s: Status) {
  return s === "ok" ? [c.okBg, c.ok] : s === "warn" ? [c.warnBg, c.warn] : s === "bad" ? [c.badBg, c.bad] : [c.sunk, c.muted];
}
export function Pill({ status, label }: { status: Status; label: string }) {
  const c = useColors();
  const [bg, fg] = pillColors(c, status);
  return <View style={{ backgroundColor: bg, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 2 }}><T w="semi" size={12} color={fg}>{label}</T></View>;
}

export function Field({ label, ...p }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 4, flexGrow: 1, flexBasis: 140 }}>
      <T size={13} color={c.muted}>{label}</T>
      <TextInput placeholderTextColor={c.muted} {...p} style={[styles.input, { backgroundColor: c.sunk, borderColor: c.line, color: c.ink, fontFamily: F.regular }, p.multiline && { minHeight: 80, textAlignVertical: "top" }]} />
    </View>
  );
}

export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const c = useColors();
  const [show, setShow] = React.useState(false);
  const date = value ? parseISO(value) : new Date();
  const open = () => {
    if (Platform.OS === "android") DateTimePickerAndroid.open({ value: date, mode: "date", onChange: (_e, d) => d && onChange(toISO(d)) });
    else setShow(true);
  };
  return (
    <View style={{ gap: 4, flexGrow: 1, flexBasis: 140 }}>
      <T size={13} color={c.muted}>{label}</T>
      <Pressable onPress={open} style={[styles.input, { backgroundColor: c.sunk, borderColor: c.line, justifyContent: "center" }]}>
        <T color={value ? c.ink : c.muted}>{value ? fd(value) : "اختار التاريخ"}</T>
      </Pressable>
      {show && Platform.OS === "ios" ? (
        <DateTimePicker value={date} mode="date" display="inline" locale="ar-EG" onChange={(_e, d) => { if (d) onChange(toISO(d)); setShow(false); }} />
      ) : null}
    </View>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={{ borderWidth: 1, borderColor: on ? c.petrol2 : c.line, backgroundColor: on ? c.petrol2 : c.surface, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
      <T size={13} color={on ? c.petrolInk : c.ink}>{label}</T>
    </Pressable>
  );
}

export function Gauge({ frac, status }: { frac: number; status: Status }) {
  const c = useColors();
  const [, fg] = pillColors(c, status);
  return (
    <View style={{ height: 6, borderRadius: 6, backgroundColor: c.sunk, overflow: "hidden", marginTop: 6 }}>
      <View style={{ width: `${Math.round(frac * 100)}%`, height: "100%", backgroundColor: fg }} />
    </View>
  );
}

export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const c = useColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
          <T w="bold" size={18}>{title}</T>
          <Pressable onPress={onClose} accessibilityLabel="إغلاق" hitSlop={12}><T size={24} color={c.muted}>×</T></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function Banner({ status, children }: { status: Status | "info"; children: React.ReactNode }) {
  const c = useColors();
  const [bg, fg] = status === "info" ? [c.sunk, c.ink] : pillColors(c, status);
  return <View style={{ backgroundColor: bg, borderRadius: 14, padding: 12 }}><T color={fg}>{children}</T></View>;
}

export const Row = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }, style]}>{children}</View>
);

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, fontSize: 15, minHeight: 44, textAlign: "right" },
});
