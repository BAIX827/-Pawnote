import { useEffect, useState } from "react";
import { useStore } from "../data/store";
import { nextOccasions } from "../domain/occasions";
import { dueRoutines, othersCalling, remindersPaused } from "../domain/paw-dates";
import HomeLetters from "./HomeLetters";
import OccasionPreview from "./OccasionPreview";
import PawDatesCard from "./PawDatesCard";

/**
 * 爪窝's one note for today (docs/01 8.37): a 爪约 that has come round, else a birthday or home day
 * within a week, else a new letter or the 爪格 invitation, else nothing.
 */
export default function TodayNote() {
  const { state } = useStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  if (!state.pet) return null;
  const paused = remindersPaused(state.events);
  const calling = !paused && (dueRoutines(state.routines ?? [], now).length > 0 || othersCalling(state, now).length > 0);
  const occasion = !paused && nextOccasions(state.pet, now, state.preferences).some((o) => o.inDays <= 7);
  return (
    <>
      <PawDatesCard quiet />
      {!calling && (occasion ? <OccasionPreview /> : <HomeLetters />)}
    </>
  );
}
