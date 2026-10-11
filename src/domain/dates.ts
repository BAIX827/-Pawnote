const pad = (value: number) => String(value).padStart(2, "0");

/** Calendar keys use the owner's local time, including timestamps with a UTC offset. */
export const monthKey = (value: string | Date) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};
export const dayKey = (value: string | Date) => {
  const date = new Date(value);
  return `${monthKey(date)}-${pad(date.getDate())}`;
};
export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
/** A local calendar day number; daylight saving changes do not change the day count. */
export const dayNumber = (date: Date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
