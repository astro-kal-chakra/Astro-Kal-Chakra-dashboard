"use server";

import { ApiError, api, seg } from "@/lib/api";
import { bool, num, run, str } from "@/lib/action";

/** "YYYY-MM-DD" (IST) → ISO. Starts at 00:00, ends at 23:59:59 so the last day is included. */
const istDate = (v, endOfDay = false) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) ? `${v}T${endOfDay ? "23:59:59" : "00:00:00"}+05:30` : undefined);

/* ---------------- Banners ---------------- */
const TONES = ["violet", "amber", "rose", "teal", "sky"];
const IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_IMAGE_BYTES = 500 * 1024;

/**
 * Create (`id` null) or update a banner from the editor form. A chosen image is
 * uploaded first (PNG/JPG ≤ 500 KB) and its URL saved on the banner.
 */
export async function saveBanner(id, formData) {
  return run(async () => {
    const body = {
      title: str(formData.get("title")),
      placement: str(formData.get("placement")),
      target: str(formData.get("target")),
      startsAt: istDate(formData.get("startsAt")),
      endsAt: istDate(formData.get("endsAt"), true),
      eyebrow: str(formData.get("eyebrow")),
      subtitle: str(formData.get("subtitle")),
      cta: str(formData.get("cta")),
    };
    if (formData.get("removeImage") === "on") body.removeImage = true;
    const tone = str(formData.get("tone"));
    if (TONES.includes(tone)) body.tone = tone;

    const file = formData.get("image");
    if (file && typeof file !== "string" && file.size) {
      if (!IMAGE_TYPES.includes(file.type)) throw new ApiError(400, "BAD_FILE", "Use a PNG or JPG image.");
      if (file.size > MAX_IMAGE_BYTES) throw new ApiError(400, "FILE_TOO_LARGE", "The image is larger than 500 KB.");
      const form = new FormData();
      form.append("file", file, file.name);
      body.image = (await api("/banners/image", { method: "POST", form })).url;
    }
    return id ? api(`/banners/${seg(id)}`, { method: "PATCH", body }) : api("/banners", { method: "POST", body });
  });
}

export async function pauseBanner(id) {
  return run(() => api(`/banners/${seg(id)}/pause`, { method: "POST" }));
}

export async function resumeBanner(id) {
  return run(() => api(`/banners/${seg(id)}/resume`, { method: "POST" }));
}

/* ---------------- Coupons ---------------- */
export async function createCoupon(d = {}) {
  const type = d.type === "flat" ? "flat" : "percent";
  const value = num(d.value);
  return run(() =>
    api("/coupons", {
      method: "POST",
      body: {
        code: str(d.code)?.toUpperCase(),
        type,
        value,
        maxDiscount: type === "flat" ? value : num(d.maxDiscount) ?? null,
        minRecharge: num(d.minRecharge) ?? 0,
        limit: num(d.limit) ?? null,
        perUser: num(d.perUser) ?? 1,
        expiresAt: istDate(d.expiresAt, true),
      },
    })
  );
}

export async function pauseCoupon(id) {
  return run(() => api(`/coupons/${seg(id)}/pause`, { method: "POST" }));
}

export async function activateCoupon(id) {
  return run(() => api(`/coupons/${seg(id)}/activate`, { method: "POST" }));
}

/* ---------------- Recharge packs ---------------- */
/** Only one pack can be highlighted as "Popular" — the backend clears the others. */
export async function savePack(id, d = {}) {
  const body = { label: str(d.label), amount: num(d.amount), bonus: num(d.bonus) ?? 0, highlight: bool(d.highlight) };
  return run(() => (id ? api(`/recharge-packs/${seg(id)}`, { method: "PATCH", body }) : api("/recharge-packs", { method: "POST", body })));
}

export async function setPackActive(id, active) {
  return run(() => api(`/recharge-packs/${seg(id)}/active`, { method: "POST", body: { active: Boolean(active) } }));
}

/* ---------------- Referral rules ---------------- */
const TRIGGERS = ["signup", "first_recharge", "first_session"];

export async function saveReferralRules(d = {}) {
  return run(() =>
    api("/referral", {
      method: "PUT",
      body: {
        enabled: bool(d.enabled),
        referrerReward: num(d.referrerReward),
        refereeReward: num(d.refereeReward),
        trigger: TRIGGERS.includes(d.trigger) ? d.trigger : "first_recharge",
        minRecharge: num(d.minRecharge),
        maxRewardsPerUser: num(d.maxRewardsPerUser),
        rewardExpiryDays: num(d.rewardExpiryDays),
      },
    })
  );
}

/* ---------------- Push ---------------- */
const SEGMENTS = {
  users: ["recharged_30d", "low_balance", "followers", "inactive_14d", "new_7d"],
  astrologers: ["online_now", "inactive_7d", "new_30d", "top_rated"],
};

/**
 * Send now, schedule or save a draft, to app users or astrologers (AstroSide app).
 * Max 10 sends per admin per hour; user promotions are held until quiet hours end (backend rules).
 */
export async function sendPush(d = {}) {
  const recipients = d.recipients === "astrologers" ? "astrologers" : "users";
  const audience = ["all", "segment", "users"].includes(d.audience) ? d.audience : "all";
  const custom = d.deepLink === "custom";
  // datetime-local has no zone; the dashboard is used in India.
  const scheduleAt = d.when === "later" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(d.scheduleAt ?? "")) ? `${d.scheduleAt}:00+05:30` : undefined;
  return run(() =>
    api("/push", {
      method: "POST",
      body: {
        title: str(d.title),
        body: str(d.body),
        recipients,
        audience,
        segment: audience === "segment" && SEGMENTS[recipients].includes(d.segment) ? d.segment : undefined,
        userIds: audience === "users" ? str(d.userIds) : undefined,
        deepLink: custom ? "custom" : str(d.deepLink),
        customLink: custom ? str(d.customLink) : undefined,
        when: ["now", "later", "draft"].includes(d.when) ? d.when : "now",
        scheduleAt,
      },
      withMessage: true,
    })
  );
}

export async function sendPushDraft(id) {
  return run(() => api(`/push/${seg(id)}/send`, { method: "POST" }));
}

export async function cancelPush(id) {
  return run(() => api(`/push/${seg(id)}/cancel`, { method: "POST" }));
}
