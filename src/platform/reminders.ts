import type { PlannedReminder } from "../domain/paw-dates";

// The web build has no dependable push, so 爪约 shows due dates on 爪窝 instead (docs/01 8.16).
export type ReminderPermission = "granted" | "denied" | "undetermined" | "unsupported";
export const remindersSupported = false;
export const reminderPermission = async (): Promise<ReminderPermission> => "unsupported";
export const requestReminderPermission = async (): Promise<ReminderPermission> => "unsupported";
export async function syncReminders(_planned: PlannedReminder[]) {}
export async function remindLater(_title: string, _body: string, _minutes: number) {}
export const onReminderOpened = (_open: (url: string) => void) => () => {};
