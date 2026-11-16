import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { AppState, addDays, catalogFor, due, fd, parseISO, today } from "./logic/due";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const CHANNEL = "maintenance";

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: "مواعيد الصيانة", importance: Notifications.AndroidImportance.HIGH });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** 10 AM on a given day, local time. */
function at10(iso: string) {
  const d = parseISO(iso);
  d.setHours(10, 0, 0, 0);
  return d;
}

/**
 * Cancels every scheduled reminder and plans them again from the current state.
 * Each maintenance item gets a reminder 7 days before it is due and one on the day.
 * The licence renewal gets reminders 30 and 7 days before.
 * iOS keeps at most 64 pending notifications, so we keep the nearest 60.
 */
export async function rescheduleAll(S: AppState) {
  if (Platform.OS === "web") return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!S.notify || !S.car) return;

  const now = Date.now();
  const plan: { date: Date; title: string; body: string }[] = [];
  const add = (iso: string, title: string, body: string) => {
    const d = at10(iso);
    if (d.getTime() > now + 60_000) plan.push({ date: d, title, body });
  };

  for (const c of catalogFor(S.transmission)) {
    const d = due(S, c.k);
    if (d.state === "none" || !d.when) continue;
    if (d.state === "bad") {
      add(addDays(today(), 1), `${c.n}: ميعاده عدى`, "اعمله في أقرب وقت، وسجّله في ICar بعد ما تخلص.");
      continue;
    }
    add(addDays(d.when, -7), `${c.n} بعد أسبوع`, `المعاد المتوقع ${fd(d.when)}. ابدأ جهّز القطعة.`);
    add(d.when, `النهارده ميعاد ${c.n}`, "لما تغيره سجّله في ICar علشان أحسبلك المعاد الجاي.");
  }
  if (S.licenceDue) {
    add(addDays(S.licenceDue, -30), "تجديد رخصة العربية بعد شهر", `ميعاد التجديد ${fd(S.licenceDue)}. جهّز الفحص والتأمين وادفع المخالفات.`);
    add(addDays(S.licenceDue, -7), "تجديد الرخصة بعد أسبوع", `ميعاد التجديد ${fd(S.licenceDue)}.`);
  }

  plan.sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const p of plan.slice(0, 60)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: p.title, body: p.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.date, channelId: CHANNEL },
    });
  }
}
