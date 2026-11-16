// Client for the ICar AI backend (Supabase Edge Function "icar-ai").
// The Claude API key lives only on the server, never in the app.
const BASE = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export type AiTask = "licence" | "specs" | "part" | "obd" | "diagnose" | "price";

export const aiAvailable = () => Boolean(BASE && ANON);

export async function askAI<T = { text: string }>(task: AiTask, payload: Record<string, unknown>, imageBase64?: string): Promise<T> {
  if (!aiAvailable()) throw new Error("not_configured");
  const res = await fetch(`${BASE}/functions/v1/icar-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}`, apikey: ANON as string },
    body: JSON.stringify({ task, payload, image: imageBase64 }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `http_${res.status}`);
  return body as T;
}

export function aiErrorText(e: unknown) {
  const m = e instanceof Error ? e.message : "";
  if (m === "not_configured") return "خدمة الذكاء الاصطناعي لسه مش متوصلة في النسخة دي.";
  if (m === "rate_limited") return "طلبات كتير ورا بعض. استنى دقيقة وجرب تاني.";
  if (m === "refused") return "ماقدرتش أجاوب على الطلب ده.";
  if (m === "bad_image") return "الصورة مش واضحة. جرب صورة أوضح من غير انعكاس نور.";
  return "حصلت مشكلة في الاتصال. اتأكد من النت وجرب تاني.";
}
