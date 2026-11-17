import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Field, Icon, demoPhoto, display } from "../components/ui";
import { useStore } from "../data/store";
import { allEvents } from "../domain/household";
import { newestFirst } from "../domain/life";
import {
  addRelayMoment, relayFromEntry, relayFromLinkParam, RELAY_BRIDGE_MAX, RELAY_CAPTION_MAX,
  RELAY_LIMIT, RELAY_TITLE_MAX, type MomentRelay, type RelayMoment,
} from "../domain/moment-relay";
import { SPECIES_INFO } from "../domain/pet-profile";
import type { LifeEvent } from "../domain/types";
import { t } from "../i18n";
import { sendRelayLink, shareableRelayUrl } from "../platform/relay-share";

const sample: MomentRelay = {
  version: 1,
  title: "The box wins",
  moments: [
    { petName: "Miso", species: "cat", category: "sleep", caption: "The new bed looked expensive. The box it came in looked perfect." },
    { petName: "Clover", species: "rabbit", category: "chaos", caption: "I flipped my cardboard tunnel. It is now a roof.", bridge: "Miso found a cardboard bed. I built a cardboard house." },
    { petName: "Pip", species: "bird", category: "chaos", caption: "I shredded my paper toy into confetti. You're welcome.", bridge: "Clover built with cardboard. I took it apart." },
  ],
};
const palettes = ["#FBE5B5", "#ECC9D3", "#DDE9B9"];
const petKind = (moment: RelayMoment) => moment.speciesName ?? t(SPECIES_INFO[moment.species].label);
const petEmoji = (moment: RelayMoment) => SPECIES_INFO[moment.species].emoji;
type Mode = "start" | "continue";

function captionFromDiary(entry: LifeEvent | undefined): string {
  if (!entry) return "";
  const voice = entry.stories.diary.text;
  return voice.split("\n").map((line) => line.trim()).find((line) => line &&
    line.length <= RELAY_CAPTION_MAX && !line.includes(entry.description.trim())) ?? "";
}

export default function MomentRelayScreen() {
  const { relay: token, moment: entryId } = useLocalSearchParams<{ relay?: string | string[]; moment?: string }>();
  const incoming = typeof token === "string" ? relayFromLinkParam(token) : null;
  if (token !== undefined && !incoming) return (
    <View style={css.page}>
      <Text accessibilityRole="header" style={css.heading}>This relay link couldn’t be opened.</Text>
      <Text style={css.detail}>Ask the sender for a new link.</Text>
      <Button label="Back to Pet Relay" onPress={() => router.replace("/")} />
    </View>
  );
  return <Relay key={JSON.stringify([token, entryId])} incoming={incoming} entryId={entryId} />;
}

function Relay({ incoming, entryId }: { incoming: MomentRelay | null; entryId?: string }) {
  const { state, update } = useStore();
  const actual = incoming ?? state.relay ?? null;
  const relay = actual ?? sample;
  const last = relay.moments.length - 1;
  const ownsPet = !!state.pet && !state.demo;
  const [active, setActive] = useState(actual ? last : 0);
  const [mode, setMode] = useState<Mode | null>(entryId && ownsPet ? (actual && last + 1 < RELAY_LIMIT ? "continue" : "start") : null);
  const [eventId, setEventId] = useState(entryId ?? "");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState(() => captionFromDiary(entryId && ownsPet ? allEvents(state).find((event) => event.id === entryId) : undefined));
  const [bridge, setBridge] = useState("");
  const [notice, setNotice] = useState("");
  const [link, setLink] = useState("");
  const [entryPage, setEntryPage] = useState(0);
  const [handoff, setHandoff] = useState<Mode | null>(null);
  const base = mode === "continue" ? actual : null;
  const entries = ownsPet && mode ? allEvents(state) : [];
  const selected = entries.find((entry) => entry.id === eventId);
  const otherRelay = !!state.relay && !!incoming && JSON.stringify(incoming) !== JSON.stringify(state.relay);
  const replacing = otherRelay || (!!state.relay && mode === "start");
  const previous = base?.moments.at(-1);
  const pickable = selected ? [] : newestFirst(entries).sort((a, b) =>
    Number(b.category === previous?.category) - Number(a.category === previous?.category));

  function openComposer(nextMode: Mode) {
    if (!ownsPet || !allEvents(state).length) {
      setHandoff(nextMode);
      return;
    }
    setMode(nextMode);
    setEventId("");
    setTitle("");
    setCaption("");
    setBridge("");
    setNotice("");
    setLink("");
    setEntryPage(0);
  }

  function add() {
    if (!selected) return;
    try {
      const next = addRelayMoment(base, title, relayFromEntry(selected, caption, base ? bridge : undefined));
      update((current) => ({ ...current, relay: next }));
      setActive(next.moments.length - 1);
      setMode(null);
      setNotice("Moment added. Your relay is ready to pass on.");
      if (incoming || entryId) router.replace("/");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn’t add this moment.");
    }
  }

  async function share() {
    if (!actual) return;
    try {
      const url = shareableRelayUrl(actual);
      const copied = await sendRelayLink(url);
      if (copied) setNotice("Relay link copied.");
      if (copied === false) setLink(url);
    } catch {
      setNotice("Couldn’t share this link. Try again.");
    }
  }

  return (
    <View style={css.page}>
      <View style={css.header}>
        <Text accessibilityRole="header" style={css.heading}>Pet Relay</Text>
        {ownsPet && !mode && <Button label="My pet" tone="plain" icon="book-open" onPress={() => router.push("/today")} />}
      </View>
      {mode && ownsPet ? (
        <View style={css.compose}>
          <Text accessibilityRole="header" style={css.subhead}>{base ? "Take the next turn" : "Start a relay"}</Text>
          {previous && <View style={css.source}>
            <Text style={css.fieldLabel}>{previous.petName}’s turn</Text>
            <Text style={css.detail}>“{previous.caption}”</Text>
          </View>}
          {selected ? <>
            <View style={css.source}>
              <Text style={css.fieldLabel}>From {selected.petSnapshot.name}’s diary</Text>
              <Text style={css.detail}>{selected.description}</Text>
            </View>
            <Button label="Choose a different entry" tone="plain" onPress={() => { setEventId(""); setCaption(""); }} />
            {!base && <RelayField label="Relay title" value={title} onChange={setTitle} maxLength={RELAY_TITLE_MAX} placeholder="The box wins" />}
            <RelayField label="In your pet’s voice" value={caption} onChange={setCaption} maxLength={RELAY_CAPTION_MAX}
              placeholder="The box it came in looked perfect." multiline />
            {base && <RelayField label="What connects the two moments?" value={bridge} onChange={setBridge} maxLength={RELAY_BRIDGE_MAX}
              placeholder="We both found a better use for the box." />}
            <Text style={css.detail}>Anyone with your link can read the pet name, species and text you add here.</Text>
            {replacing && <Text style={css.detail}>Adding this moment replaces the relay saved on this device.</Text>}
            <Button label="Add to relay" icon="arrow-right" onPress={add} disabled={!caption.trim() || !(base ? bridge.trim() : title.trim())} />
          </> : <>
            <Text style={css.detail}>Choose a moment from your diary.</Text>
            {pickable.slice(entryPage * 6, entryPage * 6 + 6).map((entry) => (
              <Pressable key={entry.id} accessibilityRole="button" style={css.entry} onPress={() => {
                setEventId(entry.id);
                setCaption(captionFromDiary(entry));
              }}>
                  <Text style={css.fieldLabel}>{entry.stories.diary.title}</Text>
                <Text style={css.detail} numberOfLines={2}>{entry.description}</Text>
              </Pressable>
            ))}
            <View style={css.actions}>
              {entryPage > 0 && <Button label="Newer entries" tone="plain" onPress={() => setEntryPage(entryPage - 1)} />}
              {(entryPage + 1) * 6 < pickable.length && <Button label="Older entries" tone="plain" onPress={() => setEntryPage(entryPage + 1)} />}
            </View>
          </>}
          <Button label="Cancel" tone="plain" onPress={() => { setMode(null); setNotice(""); }} />
        </View>
      ) : <>
        <RelayBoard relay={relay} isSample={!actual} active={Math.min(active, last)} setActive={setActive} />
        <View style={css.compose}>
          {actual ? <>
            {last + 1 < RELAY_LIMIT && <Button label="Add your pet’s moment" icon="plus" onPress={() => openComposer("continue")} />}
            <Button label="Share relay" icon="share-2" tone="soft" onPress={() => void share()} />
            <Button label="Start a new relay" tone="plain" onPress={() => openComposer("start")} />
          </> : <>
            <Text style={css.detail}>Pick a real moment from your pet’s diary. Pass it to a friend so their pet can add a moment of their own.</Text>
            <Button label="Start a relay" icon="arrow-right" onPress={() => openComposer("start")} />
          </>}
          {handoff && <>
            <Text style={css.detail}>{ownsPet ? "Save a diary entry to take a turn." : "Add your pet and save a diary entry to take a turn."}</Text>
            {handoff === "continue" && otherRelay && <Text style={css.detail}>Opening the diary saves this relay in place of the relay on this device.</Text>}
            <Button label={ownsPet ? "Write a diary entry" : "Add your pet"} onPress={() => {
              if (handoff === "continue" && incoming) update((current) => ({ ...current, relay: incoming }));
              if (ownsPet) router.push("/record");
              else router.push({ pathname: "/onboarding", params: { relaySetup: "1" } });
            }} />
          </>}
        </View>
      </>}
      {!!notice && <Text accessibilityRole="alert" style={css.detail}>{notice}</Text>}
      {!!link && <View style={css.compose}>
        <Text style={css.fieldLabel}>Copy this link</Text>
        <Text selectable style={css.link}>{link}</Text>
      </View>}
    </View>
  );
}

function RelayField({ label, value, onChange, maxLength, placeholder, multiline }: {
  label: string; value: string; onChange: (value: string) => void; maxLength: number; placeholder: string; multiline?: boolean;
}) {
  return <View style={css.field}>
    <Text style={css.fieldLabel}>{label}</Text>
    <Field accessibilityLabel={label} value={value} onChangeText={onChange} maxLength={maxLength} placeholder={placeholder} multiline={multiline} />
  </View>;
}

function RelayBoard({ relay, isSample, active, setActive }: {
  relay: MomentRelay; isSample: boolean; active: number; setActive: (index: number) => void;
}) {
  const { width } = useWindowDimensions();
  const moment = relay.moments[active];
  const next = relay.moments[active + 1];
  const wide = width >= 620;
  return (
    <View style={css.board}>
      <View style={css.header}>
        <Text style={css.status}>{isSample ? "Sample relay" : relay.moments.length === RELAY_LIMIT ? "Completed relay" : "In play"}</Text>
        <Text style={css.status}>{active + 1} / {relay.moments.length}</Text>
      </View>
      <Text accessibilityRole="header" style={css.relayTitle}>{relay.title}</Text>
      <View style={css.trail}>
        {relay.moments.map((station, index) => (
          <View key={index} style={css.station}>
            {index > 0 && <View style={css.track} />}
            <Pressable accessibilityRole="button" accessibilityLabel={`Stop ${index + 1}, ${station.petName}`}
              accessibilityState={{ selected: active === index }} onPress={() => setActive(index)}
              style={({ pressed }) => [css.stationButton, (active === index || pressed) && css.stationActive]}>
              <Text style={css.stationIcon}>{petEmoji(station)}</Text>
            </Pressable>
          </View>
        ))}
        {relay.moments.length < RELAY_LIMIT && <View style={css.station}>
          <View style={css.track} />
          <View style={css.nextStation}><Icon name="plus" size={17} color={ink} /></View>
        </View>}
      </View>
      <View style={[css.postcard, { backgroundColor: palettes[active % palettes.length] }, wide && css.postcardWide]}>
        {isSample && active === 0 && (
          <Image source={demoPhoto} accessibilityLabel="Sample cat photo" style={[css.samplePhoto, wide && css.samplePhotoWide]} />
        )}
        <View style={css.quoteBlock}>
          <View style={css.byline}>
            <Text style={css.bylineEmoji}>{petEmoji(moment)}</Text>
            <View style={css.bylineName}>
              <Text style={css.fieldLabel}>{moment.petName}</Text>
              <Text style={css.species}>{petKind(moment)}</Text>
            </View>
          </View>
          <Text style={css.quote}>“{moment.caption}”</Text>
          {!!moment.bridge && <View style={css.bridge}>
            <Icon name="corner-down-right" size={17} color={ink} />
            <Text style={[css.detail, { flex: 1 }]}>{moment.bridge}</Text>
          </View>}
        </View>
      </View>
      <View style={css.actions}>
        {active > 0 && <Button label="Previous" tone="plain" icon="arrow-left" onPress={() => setActive(active - 1)} />}
        {next && <Button label={`Next: ${next.petName}`} tone="soft" icon="arrow-right" onPress={() => setActive(active + 1)} />}
      </View>
    </View>
  );
}

const ink = "#29243B";
const css = StyleSheet.create({
  page: { gap: 14, width: "100%", alignSelf: "center", maxWidth: 630 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  heading: { color: ink, fontFamily: display, fontSize: 32, lineHeight: 42, letterSpacing: -0.8, flexShrink: 1 },
  board: { backgroundColor: "#E5DEF5", borderWidth: 2, borderColor: ink, borderRadius: 23, padding: 15, gap: 12 },
  status: { color: ink, fontSize: 13, fontWeight: "700" },
  relayTitle: { color: ink, fontFamily: display, fontSize: 29, lineHeight: 35, letterSpacing: -0.6 },
  trail: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginVertical: 2 },
  station: { flexDirection: "row", alignItems: "center" },
  stationButton: { width: 36, height: 44, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F3FB", borderColor: "#9284A8", borderWidth: 1 },
  stationActive: { backgroundColor: "#FEE2AA", borderColor: ink, borderWidth: 2 },
  stationIcon: { fontSize: 18 },
  track: { width: 5, height: 2, backgroundColor: "#9284A8" },
  nextStation: { width: 30, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", borderColor: "#66567E", borderWidth: 1, borderStyle: "dashed" },
  postcard: { overflow: "hidden", borderRadius: 15, borderColor: ink, borderWidth: 1.5 },
  postcardWide: { flexDirection: "row" },
  samplePhoto: { width: "100%", height: 128, backgroundColor: "#DDC9AA" },
  samplePhotoWide: { width: 160, height: "100%", minHeight: 180 },
  quoteBlock: { gap: 11, padding: 15, flex: 1 },
  byline: { flexDirection: "row", alignItems: "center", gap: 8 },
  bylineEmoji: { fontSize: 19 },
  bylineName: { flex: 1 },
  species: { color: "#514658", fontSize: 13 },
  quote: { color: ink, fontSize: 23, lineHeight: 30, fontWeight: "700", letterSpacing: -0.4 },
  bridge: { flexDirection: "row", alignItems: "flex-start", gap: 7, borderTopWidth: 1, borderColor: "#0003", paddingTop: 10 },
  actions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  compose: { padding: 15, gap: 10, backgroundColor: "#FFFCF7", borderWidth: 1, borderColor: "#C7BDB0", borderRadius: 16 },
  subhead: { color: ink, fontSize: 22, fontWeight: "800" },
  detail: { color: ink, fontSize: 14, lineHeight: 21 },
  field: { gap: 5 },
  fieldLabel: { color: ink, fontWeight: "700", fontSize: 15 },
  source: { gap: 5, padding: 10, backgroundColor: "#F3EBDE", borderRadius: 8 },
  entry: { gap: 5, padding: 12, minHeight: 52, borderColor: "#C7BDB0", borderWidth: 1, borderRadius: 10 },
  link: { color: "#554485", fontSize: 14 },
});
