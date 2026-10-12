"use client";

import { useState } from "react";
import { Bell, Send, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { cn } from "@/lib/utils";
import { ASTRO_DEEP_LINKS, DEEP_LINKS } from "./utils";
import { sendPush } from "@/actions/marketing";

const TITLE_MAX = 50;
const MAX_USERS = 100;
const ID_FORMAT = { users: /^U\d{5,}$/, astrologers: /^A\d{3,}$/ };

/** "U10001, u10002,,U10001" (or "A201, A202") → unique valid IDs + the invalid entries. */
function parseUserIds(raw, recipients) {
  const re = ID_FORMAT[recipients];
  const parts = raw.split(/[,\s]+/).map((p) => p.trim().toUpperCase()).filter(Boolean);
  const unique = [...new Set(parts)];
  return { valid: unique.filter((id) => re.test(id)), invalid: unique.filter((id) => !re.test(id)) };
}
const BODY_MAX = 150;

const SEGMENTS = {
  users: [
    { value: "recharged_30d", label: "Recharged in last 30 days" },
    { value: "low_balance", label: "Wallet balance < ₹50" },
    { value: "followers", label: "Follows an astrologer" },
    { value: "inactive_14d", label: "Inactive for 14+ days" },
    { value: "new_7d", label: "Joined in last 7 days" },
  ],
  astrologers: [
    { value: "online_now", label: "Online right now" },
    { value: "inactive_7d", label: "Not online in 7+ days" },
    { value: "new_30d", label: "Approved in last 30 days" },
    { value: "top_rated", label: "Rated 4.5★ or more" },
  ],
};

const RECIPIENTS = {
  users: { noun: "user", all: "All users", few: "Few users", placeholder: "U10234, U10235, U10236", app: "Astro app" },
  astrologers: { noun: "astrologer", all: "All astrologers", few: "Few astrologers", placeholder: "A201, A202, A203", app: "AstroSide" },
};

function Radio({ name, value, checked, onChange, children }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
        checked ? "border-primary bg-primary-soft text-primary-ink" : "border-border text-text-2 hover:bg-surface-2"
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="accent-[var(--primary)]" />
      {children}
    </label>
  );
}

export function PushComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState("users");
  const [audience, setAudience] = useState("all");
  const [segment, setSegment] = useState(SEGMENTS.users[0].value);
  const [userIds, setUserIds] = useState("");
  const [link, setLink] = useState(DEEP_LINKS[0].value);
  const [when, setWhen] = useState("now");
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of marketing:edit — the backend enforces the same check (and rate limits sends).
  if (!can("marketing", "edit")) return null;

  const r = RECIPIENTS[recipients];
  const links = recipients === "astrologers" ? ASTRO_DEEP_LINKS : DEEP_LINKS;
  const switchRecipients = (next) => {
    setRecipients(next);
    setSegment(SEGMENTS[next][0].value);
    setUserIds("");
    setLink((next === "astrologers" ? ASTRO_DEEP_LINKS : DEEP_LINKS)[0].value);
  };

  const ids = parseUserIds(userIds, recipients);
  const usersError =
    audience !== "users"
      ? null
      : ids.invalid.length
        ? `Not a valid ${r.noun} ID: ${ids.invalid.join(", ")}`
        : ids.valid.length > MAX_USERS
          ? `Up to ${MAX_USERS} ${r.noun}s at a time. Use a segment for larger audiences.`
          : null;

  const reset = () => {
    setTitle("");
    setBody("");
    setUserIds("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (audience === "users" && (usersError || !ids.valid.length)) return;
    const form = new FormData(e.currentTarget);
    setSending(true);
    const res = await sendPush({
      ...Object.fromEntries(form),
      recipients,
      audience,
      segment,
      userIds: ids.valid.join(","),
      deepLink: link,
      when,
    });
    setSending(false);
    if (!res.ok) return toast(res.error.message, { type: "error" });
    const who =
      audience === "all"
        ? r.all.toLowerCase()
        : audience === "segment"
          ? `${r.noun}s · ${SEGMENTS[recipients].find((s) => s.value === segment)?.label}`
          : `${ids.valid.length} ${r.noun}${ids.valid.length === 1 ? "" : "s"} (${ids.valid.slice(0, 3).join(", ")}${ids.valid.length > 3 ? "…" : ""})`;
    toast(when === "now" ? "Notification sent" : "Notification scheduled", {
      description: res.data?.message && res.data.message !== "OK" ? res.data.message : when === "now" ? `Sending to ${who}.` : `Goes to ${who} on ${String(form.get("scheduleAt")).replace("T", " at ")}.`,
    });
    reset();
  };

  return (
    <Card>
      <CardHeader title="New push notification" />
      <CardBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form onSubmit={submit} className="min-w-0 space-y-4">
            <Field label="Title" htmlFor="pn-title" hint={`${title.length}/${TITLE_MAX}`}>
              <Input id="pn-title" name="title" required maxLength={TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your daily horoscope is here" />
            </Field>
            <Field label="Message" htmlFor="pn-body" hint={`${body.length}/${BODY_MAX}`}>
              <Textarea id="pn-body" name="body" required rows={3} maxLength={BODY_MAX} value={body} onChange={(e) => setBody(e.target.value)} placeholder="See what the stars say about your day." />
            </Field>

            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold text-text-2">Send to</legend>
              <div className="flex flex-wrap gap-2">
                <Radio name="recipients" value="users" checked={recipients === "users"} onChange={switchRecipients}>
                  App users
                </Radio>
                <Radio name="recipients" value="astrologers" checked={recipients === "astrologers"} onChange={switchRecipients}>
                  Astrologers
                </Radio>
              </div>
              {recipients === "astrologers" && (
                <p className="mt-1.5 text-xs text-muted">Goes to approved astrologers in the AstroSide app, right away (no quiet-hours hold).</p>
              )}
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold text-text-2">Audience</legend>
              <div className="flex flex-wrap gap-2">
                <Radio name="audience" value="all" checked={audience === "all"} onChange={setAudience}>
                  {r.all}
                </Radio>
                <Radio name="audience" value="segment" checked={audience === "segment"} onChange={setAudience}>
                  Segment
                </Radio>
                <Radio name="audience" value="users" checked={audience === "users"} onChange={setAudience}>
                  {r.few}
                </Radio>
              </div>
              {audience === "segment" && (
                <Select aria-label="Segment" name="segment" value={segment} onChange={(e) => setSegment(e.target.value)} options={SEGMENTS[recipients]} className="mt-2" />
              )}
              {audience === "users" && (
                <div className="mt-2">
                  <Textarea
                    aria-label={recipients === "astrologers" ? "Astrologer IDs" : "User IDs"}
                    name="userIds"
                    required
                    rows={2}
                    value={userIds}
                    onChange={(e) => setUserIds(e.target.value)}
                    placeholder={r.placeholder}
                    className={cn("min-h-0 font-mono", usersError && "border-danger focus:border-danger")}
                  />
                  <p className={cn("mt-1.5 text-xs", usersError ? "text-danger" : "text-muted")}>
                    {usersError ??
                      (ids.valid.length
                        ? `${ids.valid.length} ${r.noun}${ids.valid.length === 1 ? "" : "s"} selected · duplicates removed`
                        : `Separate ${r.noun} IDs with commas · up to ${MAX_USERS}`)}
                  </p>
                  {ids.valid.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {ids.valid.slice(0, 20).map((id) => (
                        <li key={id} className="rounded-md bg-primary-soft px-2 py-0.5 font-mono text-xs font-semibold text-primary-ink">
                          {id}
                        </li>
                      ))}
                      {ids.valid.length > 20 && <li className="px-1 py-0.5 text-xs text-muted">+{ids.valid.length - 20} more</li>}
                    </ul>
                  )}
                </div>
              )}
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Opens" htmlFor="pn-link">
                <Select id="pn-link" name="deepLink" value={link} onChange={(e) => setLink(e.target.value)} options={[...links, { value: "custom", label: "Custom deep link…" }]} />
              </Field>
              {link === "custom" && (
                <Field label="Custom deep link" htmlFor="pn-custom">
                  <Input id="pn-custom" name="customLink" required pattern="app://.+" placeholder="app://astrologer/A214" className="font-mono" />
                </Field>
              )}
            </div>

            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold text-text-2">When</legend>
              <div className="flex flex-wrap items-center gap-2">
                <Radio name="when" value="now" checked={when === "now"} onChange={setWhen}>
                  Send now
                </Radio>
                <Radio name="when" value="later" checked={when === "later"} onChange={setWhen}>
                  Schedule
                </Radio>
                {when === "later" && <Input aria-label="Send at" name="scheduleAt" type="datetime-local" required className="w-full sm:w-56" />}
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button onClick={reset}>Clear</Button>
              <Button type="submit" variant="primary" loading={sending} disabled={Boolean(usersError)} icon={when === "now" ? <Send /> : <CalendarClock />}>
                {when === "now" ? "Send now" : "Schedule"}
              </Button>
            </div>
          </form>

          <PhonePreview title={title} body={body} app={r.app} />
        </div>
      </CardBody>
    </Card>
  );
}

function PhonePreview({ title, body, app }) {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <p className="mb-2 text-center text-xs font-semibold text-muted">Preview</p>
      <div className="rounded-[2rem] border-4 border-border-strong bg-linear-to-b from-indigo-900 via-violet-900 to-slate-900 p-3 pt-6 shadow-card">
        <p className="text-center text-3xl font-light text-white/90 tabular-nums">12:00</p>
        <p className="mb-5 text-center text-[11px] text-white/60">Thursday, 1 October</p>
        <div className="rounded-2xl bg-white/90 p-3 text-slate-900 shadow-lg backdrop-blur">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="flex size-4 items-center justify-center rounded bg-violet-600 text-white">
              <Bell className="size-2.5" />
            </span>
            <span className="font-semibold">{app}</span>
            <span className="ml-auto">now</span>
          </div>
          <p className="truncate text-[13px] font-bold">{title || "Notification title"}</p>
          <p className="line-clamp-3 text-xs text-slate-700">{body || "Your message appears here."}</p>
        </div>
        <div className="h-24" />
      </div>
    </div>
  );
}
