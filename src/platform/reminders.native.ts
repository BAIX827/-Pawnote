import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { PlannedReminder } from "../domain/paw-dates";
import { t } from "../i18n/core";
import type { ReminderPermission } from "./reminders";
export type { ReminderPermission } from "./reminders";

// 爪约 on iPhone and Android: local scheduled notifications, nothing goes through a server.
const CHANNEL = "paw-dates";
const KIND = "paw-date";
export const remindersSupported = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const statusOf = (p: Notifications.NotificationPermissionsStatus): ReminderPermission =>
  p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ? "granted"
    : p.canAskAgain
      ? "undetermined"
      : "denied";
export const reminderPermission = async () => statusOf(await Notifications.getPermissionsAsync());
export async function requestReminderPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return statusOf(current);
  return statusOf(await Notifications.requestPermissionsAsync());
}
async function channel() {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: t("爪约"),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
}

/** Replaces every repeating 爪约 notification with the planned set. A pending "later" one stays. */
export async function syncReminders(planned: PlannedReminder[]) {
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await channel();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  for (const p of planned)
    await Notifications.scheduleNotificationAsync({
      identifier: `${KIND}-${p.key}`,
      content: { title: p.title, body: p.body, data: { kind: KIND, url: p.url ?? "/" } },
      trigger:
        p.weekday === undefined
          ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: p.hour, minute: p.minute, channelId: CHANNEL }
          : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: p.weekday, hour: p.hour, minute: p.minute, channelId: CHANNEL },
    });
}
export async function remindLater(title: string, body: string, minutes: number) {
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await channel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { kind: "paw-date-later", url: "/" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: minutes * 60, channelId: CHANNEL },
  });
}
/** Opens the notification's page (爪窝 for 爪约, 爪信 for the weekly letter) when the owner taps it. */
export function onReminderOpened(open: (url: string) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.kind === KIND || data?.kind === "paw-date-later") open(typeof data.url === "string" ? data.url : "/");
  });
  return () => sub.remove();
}
