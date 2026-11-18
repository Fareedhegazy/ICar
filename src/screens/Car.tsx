import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Image, Switch, View } from "react-native";
import { aiErrorText, askAI } from "../ai";
import { Transmission } from "../data/catalog";
import { Car as CarT, carContext, cfg, today } from "../logic/due";
import { ensurePermission } from "../notify";
import { COUNTRIES, countryName, countryOf } from "../data/countries";
import { LANGS, Lang, isRTL, t } from "../i18n";
import { useStore } from "../store";
import { useColors } from "../theme";
import { Banner, Btn, Card, Chip, DateField, Field, H, Row, Sheet, T } from "../components/ui";
import { Kv } from "./Home";

type Extract = Partial<CarT> & { inspection_year?: number | null; licence_expiry?: string | null };

/** Photo of the licence -> car data. Chassis, engine and plate numbers are never requested or stored. */
export function LicenceScan({ onDone }: { onDone: () => void }) {
  const c = useColors();
  const { update } = useStore();
  const [uri, setUri] = useState<string | null>(null);
  const [msg, setMsg] = useState(t("صورة واضحة، من غير انعكاس نور"));
  const [busy, setBusy] = useState(false);

  const run = async (camera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1 };
    let res: ImagePicker.ImagePickerResult;
    if (camera) {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      if (!p.granted) { setMsg(t("محتاج إذن الكاميرا. تقدر ترفع صورة من المعرض بدلها.")); return; }
      res = await ImagePicker.launchCameraAsync(opts);
    } else res = await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setUri(a.uri); setBusy(true); setMsg(t("بقرا الرخصة..."));
    try {
      const small = await ImageManipulator.manipulateAsync(a.uri, [{ resize: { width: Math.min(1600, a.width || 1600) } }], { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true });
      const out = await askAI<Extract>("licence", {}, small.base64 || undefined);
      update((d) => {
        d.car = { make: out.make || "", make_ar: out.make_ar || "", model: out.model || "", year: String(out.year || ""), body: out.body || "", cc: String(out.cc || ""), cylinders: String(out.cylinders || ""), fuel: out.fuel || "", color: out.color || "" };
        if (out.licence_expiry) d.licenceDue = out.licence_expiry;
        else if (out.inspection_year && !d.licenceDue) d.licenceDue = `${out.inspection_year}-01-01`;
        d.cache = {};
      });
      setMsg(t("اتقرت الرخصة. راجع البيانات تحت وكمّل العداد."));
      onDone();
    } catch (e) { setMsg(aiErrorText(e)); }
    setBusy(false);
  };

  return (
    <View style={{ borderWidth: 2, borderStyle: "dashed", borderColor: c.line, borderRadius: 16, padding: 18, alignItems: "center", gap: 10 }}>
      {uri ? <Image source={{ uri }} style={{ width: "100%", height: 170, borderRadius: 10 }} resizeMode="contain" /> : null}
      <Row style={{ justifyContent: "center" }}>
        <Btn title={t("صوّر الرخصة")} onPress={() => run(true)} busy={busy} />
        <Btn kind="soft" title={t("من المعرض")} onPress={() => run(false)} disabled={busy} />
      </Row>
      <T size={12} color={c.muted}>{msg}</T>
    </View>
  );
}

export default function CarScreen({ go }: { go: (tab: string) => void }) {
  const c = useColors();
  const { S, update } = useStore();
  const [f, setF] = useState<CarT>({ make: "", make_ar: "", model: "", year: "", body: "", cc: "", cylinders: "", fuel: "", color: "" });
  const [trans, setTrans] = useState<Transmission>(S.transmission);
  const [odo, setOdo] = useState(""), [monthly, setMonthly] = useState(""), [lic, setLic] = useState(""), [oil, setOil] = useState("");
  const [specBusy, setSpecBusy] = useState(false), [specErr, setSpecErr] = useState("");
  const [pickCountry, setPickCountry] = useState(false);
  const country = countryOf(S.country);
  const setCountryTo = (k: string) => {
    update((d) => { if (d.country !== k) d.cache.price = undefined; d.country = k; d.countryConfirmed = true; });
    setPickCountry(false);
  };

  useEffect(() => {
    if (S.car) setF(S.car);
    setTrans(S.transmission); setOdo(S.odo ? String(S.odo) : ""); setMonthly(String(S.monthlyKm || "")); setLic(S.licenceDue || ""); setOil(String(cfg(S, "engine_oil").km || ""));
  }, [S.car, S.transmission, S.licenceDue]);

  const set = (k: keyof CarT) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!f.make.trim() && !f.make_ar.trim()) return;
    update((d) => {
      const prev = d.car;
      d.car = { ...f };
      if (!prev || prev.model !== f.model || prev.year !== f.year || prev.cc !== f.cc) d.cache = {};
      d.transmission = trans;
      const o = Number(odo); if (o && o !== d.odo) { d.odo = o; d.odoDate = today(); }
      d.monthlyKm = Number(monthly) || 1500; d.licenceDue = lic;
      const ok = Number(oil); if (ok) { (d.items.engine_oil ||= {}).km = ok; (d.items.oil_filter ||= {}).km = ok; }
    });
    await ensurePermission().catch(() => false);
    go("home");
  };
  const loadSpecs = async () => {
    setSpecBusy(true); setSpecErr("");
    try { const r = await askAI<{ rows: { k: string; v: string }[]; note?: string }>("specs", { car: carContext(S) }); update((d) => { d.cache.specs = r; }); }
    catch (e) { setSpecErr(aiErrorText(e)); }
    setSpecBusy(false);
  };

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <T size={13} color={c.muted}>{t("اللغة")} · Language</T>
        <Row>{LANGS.map((l) => <Chip key={l.k} label={l.n} on={S.lang === l.k} onPress={() => update((d) => { d.lang = l.k as Lang; d.cache = {}; })} />)}</Row>
        <T size={13} color={c.muted}>{t("الدولة")}</T>
        <Row>
          <T w="semi">{countryName(country, S.lang)}</T>
          {!S.countryConfirmed ? <Btn small title={t("أيوه، صح")} onPress={() => setCountryTo(country.k)} /> : null}
          <Btn small kind="soft" title={t("غيّر الدولة")} onPress={() => setPickCountry(true)} />
        </Row>
        {!S.countryConfirmed ? <T size={12} color={c.muted}>{t("حددناها من إعدادات موبايلك. أكّدها أو غيّرها علشان العملة والأسعار ومواقع الإعلانات تبقى مظبوطة.")}</T> : null}
      </Card>
      <Sheet visible={pickCountry} title={t("اختار دولتك")} onClose={() => setPickCountry(false)}>
        <Row>{COUNTRIES.map((x) => <Chip key={x.k} label={countryName(x, S.lang)} on={S.country === x.k} onPress={() => setCountryTo(x.k)} />)}</Row>
      </Sheet>
      {!S.car ? (
        <>
          <H>{t("ابدأ بصورة الرخصة")}</H>
          <T color={c.muted}>{t("صوّر وش الرخصة اللي فيه الماركة والموديل والسي سي، والتطبيق هيطلّع بيانات عربيتك. أرقام الشاسيه والموتور واللوحة مش بتتحفظ.")}</T>
          <LicenceScan onDone={() => {}} />
          <T size={13} color={c.muted}>{t("أو اكتب البيانات بإيدك تحت.")}</T>
        </>
      ) : null}

      <H>{t("بيانات العربية")}</H>
      <Card>
        <Row><Field label={t("الماركة (إنجليزي)")} value={f.make} onChangeText={set("make")} placeholder="Citroen" />{isRTL() ? <Field label="الماركة (عربي)" value={f.make_ar} onChangeText={set("make_ar")} placeholder="ستروين" /> : null}</Row>
        <Row><Field label={t("الموديل")} value={f.model} onChangeText={set("model")} placeholder="C3" /><Field label={t("سنة الصنع")} keyboardType="number-pad" value={f.year} onChangeText={set("year")} /></Row>
        <Row><Field label={t("الهيكل")} value={f.body} onChangeText={set("body")} placeholder={t("هاتشباك")} /><Field label={t("السعة (سي سي)")} keyboardType="number-pad" value={f.cc} onChangeText={set("cc")} /></Row>
        <Row><Field label={t("عدد السلندرات")} keyboardType="number-pad" value={f.cylinders} onChangeText={set("cylinders")} /><Field label={t("الوقود")} value={f.fuel} onChangeText={set("fuel")} placeholder={t("بنزين")} /></Row>
        <Field label={t("اللون")} value={f.color} onChangeText={set("color")} />
        <T size={13} color={c.muted}>{t("الفتيس")}</T>
        <Row>
          <Chip label={t("عادي (مانيوال)")} on={trans === "manual"} onPress={() => setTrans("manual")} />
          <Chip label={t("روبوت (ايزي ترونيك / سنسودرايف)")} on={trans === "amt"} onPress={() => setTrans("amt")} />
          <Chip label={t("أوتوماتيك")} on={trans === "auto"} onPress={() => setTrans("auto")} />
        </Row>
        <Row><Field label={t("العداد دلوقتي (كم)")} keyboardType="number-pad" value={odo} onChangeText={setOdo} /><Field label={t("متوسط المشي في الشهر (كم)")} keyboardType="number-pad" value={monthly} onChangeText={setMonthly} /></Row>
        <Row><DateField label={t("تاريخ تجديد الرخصة")} value={lic} onChange={setLic} /><Field label={t("بتغير الزيت كل (كم)")} keyboardType="number-pad" value={oil} onChangeText={setOil} /></Row>
        <Btn title={t("حفظ")} onPress={save} disabled={!f.make.trim() && !f.make_ar.trim()} />
      </Card>

      {S.car ? (
        <>
          <H right={<Btn small kind="soft" title={S.cache.specs ? t("تحديث") : t("اعرض المواصفات")} onPress={loadSpecs} busy={specBusy} />}>{t("مواصفات العربية")}</H>
          {S.cache.specs ? (
            <Card>
              {S.cache.specs.rows.map((r) => <Kv key={r.k} k={r.k} v={r.v} />)}
              {S.cache.specs.note ? <T size={13} color={c.muted}>{S.cache.specs.note}</T> : null}
              <T size={12} color={c.muted}>{t("مواصفات استرشادية، راجع كتيب العربية للتأكيد.")}</T>
            </Card>
          ) : (
            <Card><T size={13} color={c.muted}>{t("اضغط \"اعرض المواصفات\" يطلعلك كود الموتور والقوة وكمية الزيت ونوعه ومقاس الكاوتش وغيرها.")}</T></Card>
          )}
          {specErr ? <Banner status="bad">{specErr}</Banner> : null}

          <H>{t("الإشعارات")}</H>
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <T style={{ flex: 1 }}>{t("فكّرني بمواعيد الصيانة وتجديد الرخصة")}</T>
              <Switch value={S.notify} onValueChange={async (v) => { if (v) await ensurePermission(); update((d) => { d.notify = v; }); }} trackColor={{ true: c.petrol2, false: c.line }} />
            </View>
            <T size={12} color={c.muted}>{t("إشعار قبل كل بند بأسبوع ويوم المعاد، وقبل تجديد الرخصة بشهر وبأسبوع.")}</T>
          </Card>
        </>
      ) : null}
    </View>
  );
}
