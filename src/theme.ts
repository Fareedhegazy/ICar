import { useColorScheme } from "react-native";

const light = {
  bg: "#F2F5FA", surface: "#FFFFFF", sunk: "#E8EEF7", ink: "#101B2D", muted: "#5A6882", line: "#D8E0EE",
  accent: "#FF7A45", accentInk: "#FFFFFF", petrol: "#0B3D63", petrol2: "#0E7C86", petrolInk: "#FFFFFF",
  ok: "#1F9D6B", warn: "#C98500", bad: "#E0453A", okBg: "#DFF5EC", warnBg: "#FFF2D6", badBg: "#FDE4E1",
};
const dark: typeof light = {
  bg: "#0A111C", surface: "#121C2B", sunk: "#0E1724", ink: "#E8EEF7", muted: "#8E9CB4", line: "#1F2B3D",
  accent: "#FF8A5B", accentInk: "#1F0C03", petrol: "#0B2C4A", petrol2: "#0B5C66", petrolInk: "#EAF6FA",
  ok: "#4FD39A", warn: "#F2BC48", bad: "#FF7468", okBg: "#0F2A20", warnBg: "#2D2410", badBg: "#35171A",
};
export type Colors = typeof light;
export const useColors = (): Colors => (useColorScheme() === "dark" ? dark : light);

export const F = {
  regular: "IBMPlexSansArabic_400Regular",
  medium: "IBMPlexSansArabic_500Medium",
  semi: "IBMPlexSansArabic_600SemiBold",
  bold: "IBMPlexSansArabic_700Bold",
};
