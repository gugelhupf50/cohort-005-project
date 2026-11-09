// PROTOTYPE — throwaway. In-memory Feed state + variant switcher bar.
import { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { UserRole } from "~/db/schema";
import { mockNotificationsFor, type ProtoNotification } from "./data";

export const VARIANTS = {
  A: "Bell + dropdown",
  B: "Notifications page",
  C: "Slide-over panel",
} as const;
export type VariantKey = keyof typeof VARIANTS;

type FeedState = {
  variant: VariantKey;
  items: ProtoNotification[];
  unread: number;
  unseen: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  markAllSeen: () => void;
  clear: () => void;
};

const Ctx = createContext<FeedState | null>(null);

export function useFeed() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useFeed outside FeedProvider");
  return s;
}

export function FeedProvider({
  userId,
  role,
  isTeamAdmin,
  children,
}: {
  userId: number | null;
  role: UserRole | null;
  isTeamAdmin: boolean;
  children: React.ReactNode;
}) {
  const [params] = useSearchParams();
  const raw = params.get("variant") ?? "A";
  const variant = (raw in VARIANTS ? raw : "A") as VariantKey;
  const [items, setItems] = useState(() =>
    mockNotificationsFor(role, isTeamAdmin)
  );
  const [open, setOpen] = useState(false);

  // DevUI user switch → fresh Feed (the stale-Feed question, in miniature).
  useEffect(() => {
    setItems(mockNotificationsFor(role, isTeamAdmin));
    setOpen(false);
  }, [userId, role, isTeamAdmin]);

  const state: FeedState = {
    variant,
    items,
    unread: items.filter((n) => !n.read).length,
    unseen: items.filter((n) => !n.seen).length,
    open,
    setOpen,
    markRead: (id) =>
      setItems((xs) =>
        xs.map((n) => (n.id === id ? { ...n, read: true, seen: true } : n))
      ),
    markAllRead: () =>
      setItems((xs) => xs.map((n) => ({ ...n, read: true, seen: true }))),
    markAllSeen: () => setItems((xs) => xs.map((n) => ({ ...n, seen: true }))),
    clear: () => setItems([]),
  };

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function PrototypeSwitcher() {
  const [params, setParams] = useSearchParams();
  const { variant, items, unread, unseen, open, clear } = useFeed();
  const keys = Object.keys(VARIANTS) as VariantKey[];

  function go(delta: number) {
    const i = (keys.indexOf(variant) + delta + keys.length) % keys.length;
    const next = new URLSearchParams(params);
    next.set("variant", keys[i]);
    setParams(next, { replace: true, preventScrollReset: true });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-zinc-900 px-2 py-1.5 text-xs text-white shadow-xl ring-2 ring-fuchsia-500">
      <div className="flex items-center gap-2">
        <button onClick={() => go(-1)} className="rounded-full p-1 hover:bg-white/10">
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-semibold">
          PROTOTYPE {variant} ({VARIANTS[variant]})
        </span>
        <button onClick={() => go(1)} className="rounded-full p-1 hover:bg-white/10">
          <ChevronRight className="size-4" />
        </button>
        <span className="border-l border-white/20 pl-2 font-mono text-white/70">
          items={items.length} unread={unread} unseen={unseen} open={String(open)}
        </span>
        <button onClick={clear} className="rounded-full px-2 py-0.5 hover:bg-white/10">
          empty
        </button>
      </div>
    </div>
  );
}
