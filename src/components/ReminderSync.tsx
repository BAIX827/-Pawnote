import { useEffect, useMemo } from "react";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { allReminders } from "../domain/paw-mail";
import { useLang } from "../i18n";
import { onReminderOpened, syncReminders } from "../platform/reminders";

/** Keeps the device's 爪约 and 爪信 notifications in step with the saved routines, pet and language. */
export default function ReminderSync() {
  const { state, ready, blocked } = useStore();
  const lang = useLang();
  // The day is part of the key, so a launch on a new day re-checks the quiet line.
  const day = new Date().toDateString();
  const plan = useMemo(
    () => (ready && !blocked ? JSON.stringify(allReminders(state, lang)) : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only what the plan reads
    [ready, blocked, state.pet, state.events, state.routines, state.mailReminder, lang, day],
  );
  useEffect(() => {
    if (!plan) return;
    const timer = setTimeout(() => void syncReminders(JSON.parse(plan)).catch(() => {}), 800);
    return () => clearTimeout(timer);
  }, [plan]);
  useEffect(() => onReminderOpened((url) => router.navigate(url as "/")), []);
  return null;
}
