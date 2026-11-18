// ICar AI backend: one Supabase Edge Function that holds the Claude API key
// and turns each app request into a Claude Messages API call.
// Deploy:  supabase functions deploy icar-ai
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Optional: ICAR_MODEL to override the model (default claude-opus-5-5).
import Anthropic from "npm:@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
const MODEL = Deno.env.get("ICAR_MODEL") || "claude-opus-5-5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

type Body = { task: string; payload: Record<string, string>; image?: string; lang?: string; country?: string; currency?: string };

// The app sends the user's language; every text the model writes (including JSON string values) must be in it.
const LANG_NAME: Record<string, string> = { en: "English", fr: "French", de: "German", it: "Italian" };
function system(lang = "ar", country = "Egypt", currency = "EGP") {
  const base =
    "إنت مساعد تطبيق ICar لأصحاب العربيات. مختصر وعملي، ومن غير Markdown. " +
    "لو مش متأكد من رقم قطعة أو معلومة ماتخترعهاش. " +
    `The user lives in ${country}: give prices and costs in ${currency}, and think of that country's market, climate and parts availability.`;
  const name = LANG_NAME[lang];
  if (!name) return base + (country === "Egypt" ? " رد دايماً بالعامية المصرية." : " رد بالعربي الفصيح البسيط.");
  return base + ` IMPORTANT: The user reads ${name}. Write every answer, and every text value inside JSON (spec names, notes, reasons, tips, body type, fuel, colour), in ${name}. Keep JSON keys, part numbers and codes unchanged.`;
}

function prompt(task: string, p: Record<string, string>, country: string, currency: string): { text: string; json: boolean } {
  switch (task) {
    case "licence":
      return {
        json: true,
        text: `دي صورة رخصة سيارة (وثيقة تسجيل مركبة) من ${country}. استخرج بيانات العربية فقط. ممنوع ترجع رقم الشاسيه أو رقم الموتور أو رقم اللوحة أو اسم المالك أو أي رقم تعريفي.
رجّع JSON بس بالشكل ده:
{"make":"الماركة بالإنجليزي مثل Citroen","make_ar":"الماركة بالعربي كما في الرخصة","model":"مثل C3","year":2007,"body":"هاتشباك/سيدان...","cc":1587,"cylinders":4,"fuel":"بنزين/سولار/غاز","color":"اللون","inspection_year":2028,"licence_expiry":"YYYY-MM-DD أو null"}
اكتب null لأي حقل مش واضح. لو الصورة مش رخصة عربية رجّع {"error":"bad_image"}.`,
      };
    case "specs":
      return {
        json: true,
        text: `العربية: ${p.car}.
رجّع JSON بس: {"rows":[{"k":"اسم المواصفة","v":"القيمة"}],"note":"ملحوظة قصيرة عن أشهر مشاكل الموديل ده"}
بالترتيب: كود الموتور، القوة (حصان)، العزم، نوع الفتيس، سعة تانك البنزين، كمية زيت الموتور مع الفلتر، لزوجة الزيت المناسبة لجو ${country}، كمية ونوع زيت الفتيس، سعة سائل التبريد، مقاس الكاوتش، ضغط الهوا أمامي/خلفي، البطارية (أمبير)، سير كاتينة ولا جنزير، استهلاك البنزين التقريبي.`,
      };
    case "part":
      return {
        json: true,
        text: `العربية: ${p.car}. القطعة: "${p.part}".
رجّع JSON بس: {"oem":["رقم القطعة الأصلي OE"],"aftermarket":[{"brand":"Bosch/Mann/Valeo/TRW/Sachs...","number":"الرقم"}],"spec":"مواصفة مختصرة (مقاس/كمية/لزوجة)","note":"ملحوظة شراء قصيرة"}
من 2 لـ 4 بدائل مشهورة في ${country}. أي رقم مش متأكد منه ماتكتبوش.`,
      };
    case "obd":
      return { json: false, text: `العربية: ${p.car}.\nاشرح كود العطل ${p.code} في 5 أسطر: معناه، أشهر الأسباب بالترتيب، أخطر حاجة ممكن تحصل، وهل ينفع أسوق بيها.` };
    case "diagnose":
      return {
        json: false,
        text: `إنت ميكانيكي خبير في ${country}. العربية: ${p.car}. آخر صيانات: ${p.recent || "مفيش"}.
العَرَض: "${p.symptom}"
رد منظم وقصير:
1) أكتر 3 أسباب محتملة بالترتيب مع نسبة تقريبية
2) تفحص إيه بنفسك قبل الميكانيكي
3) الخطورة: ينفع تسوق ولا لأ
4) تكلفة تقريبية بـ ${currency} لكل سبب`,
      };
    case "price":
      return {
        json: true,
        text: `إنت خبير في سوق العربيات المستعملة في ${country}. قدّر سعر البيع الحالي (${p.date}) للعربية دي:
${p.car}. الحالة: ${p.condition}. الدهان: ${p.paint}. ملاحظات: ${p.note || "مفيش"}.
رجّع JSON بس: {"low":رقم بـ ${currency},"high":رقم بـ ${currency},"why":"سطرين عن العوامل اللي حددت السعر","tips":"3 حاجات تزود سعرها قبل البيع"}`,
      };
    default:
      throw new Error("unknown_task");
  }
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { task, payload, image, lang, country = "Egypt", currency = "EGP" } = (await req.json()) as Body;
    const { text, json: wantJson } = prompt(task, payload || {}, country, currency);
    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    if (image) content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } });
    content.push({ type: "text", text });

    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: system(lang, country, currency),
      output_config: { effort: task === "diagnose" || task === "price" ? "medium" : "low" },
      // If a safety classifier declines, let the API retry on a fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content }],
    });

    if (msg.stop_reason === "refusal") return json(422, { error: "refused" });
    const out = msg.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("").trim();
    if (!wantJson) return json(200, { text: out });

    const start = out.indexOf("{"), end = out.lastIndexOf("}");
    const parsed = JSON.parse(out.slice(start, end + 1));
    if (parsed.error) return json(422, { error: parsed.error });
    return json(200, parsed);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json(429, { error: "rate_limited" });
    if (e instanceof Anthropic.APIError) return json(502, { error: "upstream", status: e.status });
    return json(400, { error: e instanceof Error ? e.message : "bad_request" });
  }
});
