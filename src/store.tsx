import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initialData, type Data } from "../shared/workspace";
import { validateWorkspace } from "../shared/validation";
import { api } from "./api";
export * from "../shared/workspace";
type Snapshot = { data: Data; revision: number };
type User = { id: string; username: string };
type Store = {
  data: Data;
  user: User | null;
  loading: boolean;
  saving: boolean;
  saveError: string;
  toast: string;
  commit: (change: (draft: Data) => void, message?: string) => boolean;
  notify: (message: string) => void;
  refresh: () => Promise<void>;
  flush: () => Promise<void>;
  authenticate: (
    mode: "login" | "register",
    username: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initialData),
    [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(""),
    [toast, setToast] = useState("");
  const state = useRef(data),
    revision = useRef(0),
    pending = useRef<Promise<void>>(Promise.resolve()),
    count = useRef(0),
    generation = useRef(0);
  function apply(snapshot: Snapshot) {
    if (snapshot.revision < revision.current) return;
    revision.current = snapshot.revision;
    state.current = snapshot.data;
    setData(snapshot.data);
  }
  async function refresh() {
    if (count.current) return;
    const snapshot = await api<Snapshot>("workspace");
    if (!count.current) apply(snapshot);
  }
  useEffect(() => {
    api<{ user: User | null } & Snapshot>("auth")
      .then((result) => {
        setUser(result.user);
        if (result.user) apply(result);
      })
      .catch((e) => setSaveError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    const events = new EventSource("/api/events");
    events.onerror = () =>
      setSaveError(
        "Live updates are disconnected. Adler will reconnect automatically.",
      );
    events.onopen = () =>
      setSaveError((message) =>
        message.startsWith("Live updates") ? "" : message,
      );
    events.onmessage = () => {
      if (!count.current) void refresh().catch((e) => setSaveError(e.message));
    };
    const onFocus = () => {
      void refresh().catch((e) => setSaveError(e.message));
    };
    window.addEventListener("focus", onFocus);
    return () => {
      events.close();
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
  }, [data.theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  function commit(change: (draft: Data) => void, message?: string) {
    if (!user) {
      setSaveError("Sign in before saving changes.");
      return false;
    }
    try {
      const next = structuredClone(state.current);
      change(next);
      const validated = validateWorkspace(next);
      state.current = validated;
      setData(validated);
      setSaving(true);
      setSaveError("");
      count.current++;
      const batch = generation.current;
      pending.current = pending.current.then(async () => {
        try {
          if (batch !== generation.current) return;
          const result = await api<Snapshot>("workspace", {
            data: validated,
            revision: revision.current,
            requestId: crypto.randomUUID(),
          });
          revision.current = result.revision;
          if (message) setToast(message);
        } catch (error) {
          generation.current++;
          const message =
            error instanceof Error
              ? error.message
              : "The change could not be saved.";
          setSaveError(
            `${message} Your unsaved changes were not applied. Review the latest records before retrying.`,
          );
          try {
            apply(await api<Snapshot>("workspace"));
          } catch {}
        } finally {
          count.current--;
          if (!count.current) {
            setSaving(false);
            try {
              apply(await api<Snapshot>("workspace"));
            } catch {}
          }
        }
      });
      return true;
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "This change could not be saved.",
      );
      return false;
    }
  }
  async function authenticate(
    mode: "login" | "register",
    username: string,
    password: string,
  ) {
    const result = await api<{ user: User } & Snapshot>(`auth/${mode}`, {
      username,
      password,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    revision.current = 0;
    apply(result);
    setUser(result.user);
    setSaveError("");
  }
  async function logout() {
    await pending.current;
    await api("auth/logout", {});
    setUser(null);
    revision.current = 0;
    state.current = initialData();
    setData(state.current);
  }
  return (
    <StoreContext.Provider
      value={{
        data,
        user,
        loading,
        saving,
        saveError,
        toast,
        commit,
        notify: setToast,
        refresh,
        flush: () => pending.current,
        authenticate,
        logout,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store provider is required");
  return store;
}
