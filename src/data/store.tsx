import { t } from "../i18n/core";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, emptyState } from "../domain/types";
import { isAppState } from "./validation";
const KEY = "paw-life:v1";
type Store = {
  state: AppState;
  update: React.Dispatch<React.SetStateAction<AppState>>;
  ready: boolean;
  error: string;
  toast: string;
  notify: (message: string) => void;
  reset: () => void;
  raw: string | null;
  blocked: boolean;
  restore: (backup: AppState) => Promise<void>;
  restoring: boolean;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, update] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [raw, setRaw] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const restoreLock = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const initial = useRef(true);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (!alive) return;
        if (value) {
          setRaw(value);
          try {
            const parsed: unknown = JSON.parse(value);
            if (!isAppState(parsed)) throw new Error();
            update(parsed);
          } catch {
            setBlocked(true);
            setError(t("本机数据读取异常。请先导出原始备份，再确认清空重建。"));
          }
        }
        setReady(true);
      })
      .catch(() => {
        if (alive) {
          setError(t("无法读取本机存储，请检查存储权限与剩余空间。"));
          setBlocked(true);
          setReady(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready || blocked) return;
    if (initial.current) {
      initial.current = false;
      return;
    }
    const serialized = JSON.stringify(state);
    queue.current = queue.current.then(async () => {
      try {
        await AsyncStorage.setItem(KEY, serialized);
        setError("");
        setRaw(serialized);
      } catch {
        setError(
          "本机保存失败，可能是存储空间不足。请先导出备份，当前页面仍保留你的记录。",
        );
      }
    });
  }, [state, ready, blocked]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(t);
  }, [toast]);
  const reset = () => {
    initial.current = false;
    setBlocked(false);
    setError("");
    update(emptyState());
  };
  const restore = async (backup: AppState) => {
    if (restoreLock.current) throw new Error(t("正在恢复，请稍候。"));
    if (!isAppState(backup)) throw new Error(t("备份内容无法读取。"));
    restoreLock.current = true;
    setRestoring(true);
    const serialized = JSON.stringify(backup);
    const write = queue.current.then(() => AsyncStorage.setItem(KEY, serialized));
    queue.current = write.catch(() => {});
    try {
      await write;
      initial.current = false;
      setRaw(serialized);
      setError("");
      setBlocked(false);
      update(backup);
    } catch {
      throw new Error(t("恢复保存失败，请检查剩余空间后重试。当前记录已保留。"));
    } finally {
      restoreLock.current = false;
      setRestoring(false);
    }
  };
  return (
    <Context.Provider
      value={{
        state,
        update,
        ready,
        error,
        toast,
        notify: setToast,
        reset,
        raw,
        blocked,
        restore,
        restoring,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("Store missing");
  return value;
}
