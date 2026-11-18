import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useStore } from "../../data/store";
import {
  enrolPet,
  communityAvailable,
  readCommunity,
  type World,
  type MomentDetailData,
  type Conversation,
} from "../../platform/community";
export type Params = {
  panel?: string;
  entry?: string;
  profile?: string;
  post?: string;
  chat?: string;
};
const empty: World = {
  pet: null,
  code: null,
  profile: null,
  posts: [],
  friends: [],
  saved: [],
  relations: [],
  mentions: [],
  more: false,
};

export function useCommunitySession(p: Params) {
  const { state } = useStore(),
    pet = state.pet,
    real = !!pet && !state.demo;
  const [world, setWorld] = useState<World>(empty),
    [detail, setDetail] = useState<MomentDetailData | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(communityAvailable);
  const lock = useRef(false),
    focused = useRef(false),
    epoch = useRef(0);
  const local = real ? pet.id : "";
  const reload = useCallback(async () => {
    if (!communityAvailable) return;
    const ticket = ++epoch.current;
    try {
      if (p.chat) {
        const result = await readCommunity("chat", {
          pet: p.chat,
        });
        if (ticket === epoch.current) setConversation(result);
      } else if (p.post) {
        const result = await readCommunity("post", {
          id: p.post,
        });
        if (ticket === epoch.current) setDetail(result);
      } else {
        const result = await readCommunity("world", {
          local,
          ...(p.profile ? { profile: p.profile } : {}),
        });
        if (ticket === epoch.current) setWorld(result);
      }
      if (ticket !== epoch.current) return;
      setError("");
    } catch (e) {
      if (ticket === epoch.current) {
        setError(e instanceof Error ? e.message : "Could not load community.");
        setDetail(null);
        setConversation(null);
        setWorld(empty);
      }
    } finally {
      if (ticket === epoch.current) setLoading(false);
    }
  }, [local, p.profile, p.post, p.chat]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void reload();
      const foreground = AppState.addEventListener("change", (state) => {
        if (state === "active" && !lock.current) void reload();
      });
      const timer = p.chat
        ? setInterval(() => {
            if (!lock.current && AppState.currentState === "active")
              void reload();
          }, 8000)
        : null;
      return () => {
        focused.current = false;
        foreground.remove();
        epoch.current++;
        if (timer) clearInterval(timer);
      };
    }, [reload, p.chat]),
  );
  async function run(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    epoch.current++;
    setLoading(false);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const setup = async () => {
    if (!pet || !real) throw new Error("Add your own pet first.");
    await enrolPet(pet);
  };
  const write = () =>
    real
      ? router.push("/record")
      : router.push({ pathname: "/onboarding", params: { next: "record" } });
  const [paging, setPaging] = useState(false);
  async function more() {
    if (paging || !world.more) return;
    setPaging(true);
    const ticket = epoch.current;
    try {
      const next = await readCommunity("world", {
        local,
        before: String(world.posts[world.posts.length - 1].id),
        ...(p.profile ? { profile: p.profile } : {}),
      });
      if (ticket === epoch.current)
        setWorld((w) => ({
          ...w,
          more: next.more,
          posts: [
            ...w.posts,
            ...next.posts.filter(
              (n) => !w.posts.some((old) => old.id === n.id),
            ),
          ],
        }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setPaging(false);
    }
  }

  function afterMutation(post?: number) {
    if (!focused.current) return;
    if (post)
      router.replace({
        pathname: "/community",
        params: { post: String(post) },
      });
    else router.replace("/");
  }
  return {
    world,
    detail,
    conversation,
    setConversation,
    pet,
    real,
    local,
    reload,
    setup,
    write,
    more,
    paging,
    loading,
    busy,
    run,
    notice,
    setNotice,
    error,
    afterMutation,
  };
}
export type CommunitySession = ReturnType<typeof useCommunitySession>;
