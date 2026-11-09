// PROTOTYPE — throwaway. Question: "What does the Notification Feed look like
// and how does it behave?" (wayfinder ticket #9). In-memory mock data only.
import { UserRole } from "~/db/schema";

export type ProtoNotification = {
  id: string;
  kind:
    | "refund-approved"
    | "refund-declined"
    | "refund-raised"
    | "question-asked"
    | "reply-posted"
    | "seat-claimed";
  actor: string | null; // null = Cadence itself
  text: string;
  to: string;
  at: string; // ISO
  read: boolean;
  seen: boolean;
};

const ago = (mins: number) =>
  new Date(Date.now() - mins * 60_000).toISOString();

const student: ProtoNotification[] = [
  { id: "s1", kind: "reply-posted", actor: "Dana Instructor", text: "replied to a question on “Hooks in depth”", to: "/courses", at: ago(12), read: false, seen: false },
  { id: "s2", kind: "refund-declined", actor: null, text: "Your Refund Request for “TypeScript Pro” was declined", to: "/settings", at: ago(60 * 5), read: false, seen: true },
  { id: "s3", kind: "reply-posted", actor: "Sam Student", text: "replied to a question on “Generics 101”", to: "/courses", at: ago(60 * 30), read: true, seen: true },
  { id: "s4", kind: "refund-approved", actor: null, text: "Your Refund Request for “CSS Grid Mastery” was approved", to: "/settings", at: ago(60 * 24 * 4), read: true, seen: true },
];

const teamAdmin: ProtoNotification[] = [
  { id: "t1", kind: "seat-claimed", actor: "Priya Patel", text: "claimed a Seat on “React Fundamentals”", to: "/team", at: ago(3), read: false, seen: false },
  { id: "t2", kind: "seat-claimed", actor: "Lee Wong", text: "claimed a Seat on “React Fundamentals”", to: "/team", at: ago(45), read: false, seen: false },
  { id: "t3", kind: "refund-approved", actor: null, text: "Your Refund Request for “Node at Scale” (Team Licence) was approved", to: "/team", at: ago(60 * 26), read: true, seen: true },
];

const instructor: ProtoNotification[] = [
  { id: "i1", kind: "question-asked", actor: "Sam Student", text: "asked a question on “useEffect pitfalls”", to: "/instructor/questions", at: ago(8), read: false, seen: false },
  { id: "i2", kind: "reply-posted", actor: "Sam Student", text: "replied to a question on “useEffect pitfalls”", to: "/instructor/questions", at: ago(2), read: false, seen: false },
  { id: "i3", kind: "question-asked", actor: "Avery Admin", text: "asked a question on “Context vs props”", to: "/instructor/questions", at: ago(60 * 3), read: false, seen: true },
  { id: "i4", kind: "question-asked", actor: "Jo Learner", text: "asked a question on “Suspense basics”", to: "/instructor/questions", at: ago(60 * 24 * 2), read: true, seen: true },
];

const admin: ProtoNotification[] = [
  { id: "a1", kind: "refund-raised", actor: "Sam Student", text: "requested a refund for “TypeScript Pro”", to: "/admin/refunds", at: ago(20), read: false, seen: false },
  { id: "a2", kind: "refund-raised", actor: "Priya Patel", text: "requested a refund for “Node at Scale” (Team Licence)", to: "/admin/refunds", at: ago(60 * 7), read: false, seen: true },
  { id: "a3", kind: "refund-raised", actor: "Jo Learner", text: "requested a refund for “CSS Grid Mastery”", to: "/admin/refunds", at: ago(60 * 24 * 6), read: true, seen: true },
];

export function mockNotificationsFor(
  role: UserRole | null,
  isTeamAdmin: boolean
): ProtoNotification[] {
  if (!role) return [];
  const list =
    role === UserRole.Admin
      ? admin
      : role === UserRole.Instructor
        ? instructor
        : isTeamAdmin
          ? [...teamAdmin, ...student]
          : student;
  return [...list]
    .map((n) => ({ ...n }))
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function relativeTime(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function dayBucket(iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (h < 24) return "Today";
  if (h < 48) return "Yesterday";
  return "Earlier";
}
