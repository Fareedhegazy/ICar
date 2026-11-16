import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, blankState } from "./logic/due";
import { rescheduleAll } from "./notify";

const KEY = "icar.state.v1";
type Ctx = { S: AppState; ready: boolean; update: (fn: (draft: AppState) => void) => void };
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [S, setS] = useState<AppState>(blankState());
  const [ready, setReady] = useState(false);
  const notifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) setS({ ...blankState(), ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (d: AppState) => void) => {
    setS((prev) => {
      const next: AppState = JSON.parse(JSON.stringify(prev));
      fn(next);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      // Re-plan phone notifications after the state settles.
      if (notifyTimer.current) clearTimeout(notifyTimer.current);
      notifyTimer.current = setTimeout(() => { rescheduleAll(next).catch(() => {}); }, 800);
      return next;
    });
  }, []);

  return <StoreCtx.Provider value={{ S, ready, update }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}
