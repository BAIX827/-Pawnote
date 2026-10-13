import { AppState, LifeEvent, Pet, PetBundle, SoundMemory } from "./types";

// Several pets per home (docs/01 8.23). The current pet keeps living in the top-level fields, so every
// screen stays one pet's view; the others wait in `household` with all of their own records, and
// switching swaps the two. A new pet is set up through onboarding, then takes the current spot.
export const MAX_PETS = 10;

export const bundleOf = (state: AppState): PetBundle | null =>
  state.pet
    ? {
        pet: state.pet,
        events: state.events,
        routines: state.routines,
        pawsona: state.pawsona,
        mailRead: state.mailRead,
        circle: state.circle,
        sounds: state.sounds,
      }
    : null;

const withBundle = (state: AppState, b: PetBundle): AppState => ({
  ...state,
  pet: b.pet,
  events: b.events,
  routines: b.routines,
  pawsona: b.pawsona,
  mailRead: b.mailRead,
  circle: b.circle,
  sounds: b.sounds,
  draft: null,
});

/** The current pet first, then the others in the order they were added. */
export const homePets = (state: AppState): Pet[] =>
  [state.pet, ...(state.household ?? []).map((b) => b.pet)].filter((p): p is Pet => !!p);

/** Every pet's records, the current pet's included. */
export const allEvents = (state: AppState): LifeEvent[] => [
  ...state.events,
  ...(state.household ?? []).flatMap((b) => b.events),
];

/** Ids of the pets whose names appear in what the owner wrote. */
export const mentionedPets = (description: string, pets: Pet[]): string[] =>
  pets.filter((p) => p.name.trim() && description.toLowerCase().includes(p.name.trim().toLowerCase())).map((p) => p.id);

/** Makes the pet with this id the current one. */
export function switchPet(state: AppState, petId: string): AppState {
  if (state.pet?.id === petId) return state;
  const target = state.household?.find((b) => b.pet.id === petId);
  if (!target) return state;
  const current = bundleOf(state);
  const rest = (state.household ?? []).filter((b) => b.pet.id !== petId);
  return withBundle({ ...state, household: current ? [...rest, current] : rest }, target);
}

/** Puts the current pet aside and makes `pet` the new current pet with an empty diary. */
export function addPet(state: AppState, pet: Pet): AppState {
  if (homePets(state).length >= MAX_PETS) throw new Error("too many pets");
  const current = bundleOf(state);
  return withBundle(
    { ...state, household: current ? [...(state.household ?? []), current] : state.household },
    { pet, events: [], sounds: [] },
  );
}

/** Removes a pet that isn't the current one, with its records and the relationships set for it. */
export function removePet(state: AppState, petId: string): AppState {
  if (state.pet?.id === petId) return state;
  return {
    ...state,
    household: (state.household ?? []).filter((b) => b.pet.id !== petId),
    bonds: state.bonds?.filter((b) => b.a !== petId && b.b !== petId),
  };
}

/** Every pet's sound list, the current pet's first, for storage that keeps audio outside the state. */
export const soundLists = (state: AppState): SoundMemory[][] =>
  [state.sounds, ...(Array.isArray(state.household) ? state.household : []).map((b) => b?.sounds)].filter((s): s is SoundMemory[] => Array.isArray(s));

/** The state with every pet's sounds passed through `fn`. */
export const mapSounds = (state: AppState, fn: (s: SoundMemory) => SoundMemory): AppState => ({
  ...state,
  ...(state.sounds ? { sounds: state.sounds.map(fn) } : {}),
  ...(state.household ? { household: state.household.map((b) => (b.sounds ? { ...b, sounds: b.sounds.map(fn) } : b)) } : {}),
});
