// PROTOTYPE — throwaway. Three structurally different Notification Feeds.
// A: bell in the sidebar header → dropdown. Badge = unseen count.
// B: "Notifications" nav item → full page in <main>. Badge = unread count.
// C: bell in the sidebar footer → right slide-over with Unread/All tabs. Badge = dot.
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  MessageSquare,
  Receipt,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useFeed } from "./state";
import { dayBucket, relativeTime, type ProtoNotification } from "./data";

function KindIcon({ kind }: { kind: ProtoNotification["kind"] }) {
  const cls = "size-4";
  if (kind.startsWith("refund")) return <Receipt className={cls} />;
  if (kind === "seat-claimed") return <UsersRound className={cls} />;
  return <MessageSquare className={cls} />;
}

function Sentence({ n }: { n: ProtoNotification }) {
  return (
    <span>
      {n.actor && <span className="font-semibold">{n.actor} </span>}
      {n.text}
    </span>
  );
}

function useOpenItem() {
  const { markRead, setOpen } = useFeed();
  const navigate = useNavigate();
  return (n: ProtoNotification) => {
    markRead(n.id);
    setOpen(false);
    navigate(n.to + "?variant=" + new URLSearchParams(location.search).get("variant"));
  };
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
      <Bell className="size-6 opacity-40" />
      You're all caught up.
    </div>
  );
}

// ─── Variant A: header bell + dropdown ───
export function VariantAHeader() {
  const { items, unseen, open, setOpen, markAllSeen, markAllRead } = useFeed();
  const openItem = useOpenItem();
  return (
    <div className="relative ml-auto">
      <button
        onClick={() => {
          setOpen(!open);
          markAllSeen();
        }}
        className="relative rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
        title="Notifications"
      >
        <Bell className="size-4" />
        {unseen > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
            {unseen}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-50 w-96 rounded-lg border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all as read
            </button>
          </div>
          {items.length === 0 ? (
            <Empty />
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => openItem(n)}
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                    <span className="flex-1"><Sentence n={n} /></span>
                    <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(n.at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Variant B: nav item + full page ───
export function VariantBNav() {
  const { unread, open, setOpen } = useFeed();
  return (
    <button
      onClick={() => setOpen(true)}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        open
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Bell className="size-4" />
      Notifications
      {unread > 0 && (
        <span className="ml-auto rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
          {unread}
        </span>
      )}
    </button>
  );
}

export function VariantBPage() {
  const { items, markAllRead, markRead, setOpen } = useFeed();
  const openItem = useOpenItem();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const shown = filter === "all" ? items : items.filter((n) => !n.read);
  const groups = ["Today", "Yesterday", "Earlier"].map((g) => ({
    g,
    rows: shown.filter((n) => dayBucket(n.at) === g),
  }));
  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">What happened while you were away.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5 text-sm">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn("rounded px-3 py-1 capitalize", filter === f && "bg-accent font-medium")}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={markAllRead} className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
            <CheckCheck className="size-4" /> Mark all read
          </button>
          <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-accent" title="Close">
            <X className="size-4" />
          </button>
        </div>
      </div>
      {shown.length === 0 ? (
        <Empty />
      ) : (
        groups.filter((x) => x.rows.length).map(({ g, rows }) => (
          <section key={g} className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</h2>
            <div className="divide-y rounded-lg border">
              {rows.map((n) => (
                <div key={n.id} className={cn("flex items-center gap-4 p-4", !n.read && "bg-primary/5")}>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <KindIcon kind={n.kind} />
                  </div>
                  <div className="flex-1 text-sm">
                    <Sentence n={n} />
                    <div className="text-xs text-muted-foreground">{relativeTime(n.at)} ago</div>
                  </div>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="rounded p-1 text-muted-foreground hover:bg-accent" title="Mark read">
                      <Check className="size-4" />
                    </button>
                  )}
                  <button onClick={() => openItem(n)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    View
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

// ─── Variant C: footer bell + slide-over ───
export function VariantCFooter() {
  const { unseen, setOpen, markAllSeen } = useFeed();
  return (
    <button
      onClick={() => {
        setOpen(true);
        markAllSeen();
      }}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      {unseen > 0 ? <BellRing className="size-4 text-primary" /> : <Bell className="size-4" />}
      Notifications
      {unseen > 0 && <span className="ml-auto size-2 rounded-full bg-red-600" />}
    </button>
  );
}

export function VariantCPanel() {
  const { items, open, setOpen, markAllRead, markRead } = useFeed();
  const openItem = useOpenItem();
  const [tab, setTab] = useState<"unread" | "all">("unread");
  if (!open) return null;
  const shown = tab === "all" ? items : items.filter((n) => !n.read);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <aside className="relative flex h-full w-[420px] flex-col border-l bg-background shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-semibold">Notifications</span>
          <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-accent"><X className="size-4" /></button>
        </div>
        <div className="flex items-center gap-4 border-b px-4 text-sm">
          {(["unread", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("-mb-px border-b-2 py-2 capitalize", tab === t ? "border-primary font-medium" : "border-transparent text-muted-foreground")}
            >
              {t} {t === "unread" && `(${items.filter((n) => !n.read).length})`}
            </button>
          ))}
          <button onClick={markAllRead} className="ml-auto text-xs text-primary hover:underline">Mark all read</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {shown.length === 0 ? (
            <Empty />
          ) : (
            shown.map((n) => (
              <div key={n.id} className="group flex gap-3 border-b px-4 py-3 hover:bg-accent/50">
                <div className="mt-0.5 text-muted-foreground"><KindIcon kind={n.kind} /></div>
                <button onClick={() => openItem(n)} className="flex-1 text-left text-sm">
                  <Sentence n={n} />
                  <div className="mt-0.5 text-xs text-muted-foreground">{relativeTime(n.at)}</div>
                </button>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} title="Mark read" className="self-center">
                    <span className="block size-2.5 rounded-full bg-primary group-hover:hidden" />
                    <Check className="hidden size-4 text-muted-foreground group-hover:block" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
