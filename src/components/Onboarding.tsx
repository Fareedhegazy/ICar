// First-launch walkthrough: the intro video (when present) followed by short slides on how ICar works.
// Shown once; the user can skip it, and replay it from the My car page.
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { introVideoFor } from "../data/intro";
import { getLang, t } from "../i18n";
import { useColors } from "../theme";
import { Logo } from "./Logo";
import { Btn, T } from "./ui";

const SLIDES = [
  { i: "📷", h: "صوّر الرخصة وخلاص", b: "التطبيق بيطلّع بيانات عربيتك ومواصفاتها لوحده. أو اكتبها بإيدك في دقيقة." },
  { i: "🔧", h: "كل الصيانة في مكان واحد", b: "سجّل آخر مرة غيرت فيها كل حاجة، والتطبيق يحسب المعاد الجاي ويفكّرك قبلها بأسبوع." },
  { i: "⚠", h: "لمبة نورت؟ صوت غريب؟", b: "اعرف معنى لمبات التابلوه وأكواد الأعطال، واوصف العَرَض يطلعلك الأسباب المحتملة." },
  { i: "⚙", h: "قطع الغيار والسعر", b: "أرقام القطع الأصلية والبدائل، أقرب محلات ليك، وسعر عربيتك في السوق." },
];

function IntroVideo({ src }: { src: number }) {
  const player = useVideoPlayer(src, (p) => { p.loop = false; p.play(); });
  return <VideoView player={player} style={{ width: "100%", aspectRatio: 9 / 16, maxHeight: 520, borderRadius: 16 }} contentFit="contain" nativeControls />;
}

export function Onboarding({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const c = useColors();
  const video = introVideoFor(getLang());
  // The video already walks through the app and ends on "Let's start", so when it exists it replaces the slides.
  const steps = video != null ? 1 : SLIDES.length;
  const [i, setI] = useState(0);
  const isVideo = video != null && i === 0;
  const s = video != null ? undefined : SLIDES[i];
  const finish = () => { setI(0); onDone(); };
  const last = i === steps - 1;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={finish}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.petrol }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
          <Logo height={34} color={c.petrolInk} />
          {!last || isVideo ? (
            <Pressable onPress={finish} hitSlop={10} style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", borderRadius: 9, paddingHorizontal: 12, paddingVertical: 6 }}>
              <T w="semi" size={13} color={c.petrolInk}>{t("تخطّي")}</T>
            </Pressable>
          ) : null}
        </View>
        <View style={{ flex: 1, padding: 24, justifyContent: "center", alignItems: "center", gap: 18 }}>
          {isVideo ? (
            <IntroVideo key={video} src={video as number} />
          ) : s ? (
            <>
              <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
                <T size={56} style={{ lineHeight: 72 }}>{s.i}</T>
              </View>
              <T w="bold" size={24} color={c.petrolInk} style={{ textAlign: "center" }}>{t(s.h)}</T>
              <T size={16} color={c.petrolInk} style={{ textAlign: "center", opacity: 0.85 }}>{t(s.b)}</T>
            </>
          ) : null}
        </View>
        <View style={{ padding: 24, gap: 16 }}>
          {steps > 1 ? <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
            {Array.from({ length: steps }).map((_, k) => (
              <View key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? c.accent : "rgba(255,255,255,0.35)" }} />
            ))}
          </View> : null}
          <Btn title={last ? t("يلا نبدأ") : t("التالي")} onPress={() => (last ? finish() : setI(i + 1))} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
