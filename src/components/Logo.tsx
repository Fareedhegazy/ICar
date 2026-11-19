// ICar logo mark: a "C" drawn as a gauge around an "i". Same artwork as /assets/icon.png.
import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const TICKS = [
  { d: "M610 682L630 716", w: 16, o: 0.95 },
  { d: "M548 719L553 744", w: 10, o: 0.6 },
  { d: "M476 719L471 744", w: 10, o: 0.6 },
  { d: "M414 682L394 716", w: 16, o: 0.95 },
  { d: "M351 647L331 664", w: 10, o: 0.6 },
  { d: "M315 584L290 593", w: 10, o: 0.6 },
  { d: "M316 512L276 512", w: 16, o: 0.95 },
  { d: "M315 440L290 431", w: 10, o: 0.6 },
  { d: "M351 377L331 360", w: 10, o: 0.6 },
  { d: "M414 342L394 308", w: 16, o: 0.95 },
  { d: "M476 305L471 280", w: 10, o: 0.6 },
  { d: "M548 305L553 280", w: 10, o: 0.6 },
  { d: "M610 342L630 308", w: 16, o: 0.95 },
];
const ORANGE = "#F47B35";

export function LogoMark({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="150 150 724 724">
      <Path d="M734.9 712.7 A300 300 0 1 1 734.9 311.3" fill="none" stroke={color} strokeWidth={116} strokeLinecap="round" />
      <Path d="M734.9 712.7 A300 300 0 0 1 553.8 809.1" fill="none" stroke={ORANGE} strokeWidth={116} />
      <Circle cx={734.9} cy={712.7} r={58} fill={ORANGE} />
      {TICKS.map((tk, i) => <Path key={i} d={tk.d} stroke={color} strokeWidth={tk.w} strokeLinecap="round" opacity={tk.o} />)}
      <Rect x={464} y={470} width={96} height={236} rx={48} fill={color} />
      <Circle cx={512} cy={378} r={54} fill={ORANGE} />
    </Svg>
  );
}
