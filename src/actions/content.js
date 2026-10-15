"use server";

import { ApiError, api, seg } from "@/lib/api";
import { num, run, str } from "@/lib/action";

/* ---------------- Horoscopes (daily / weekly / monthly / yearly) ---------------- */
const PERIODS = ["daily", "weekly", "monthly", "yearly"];
const day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) ? v : undefined);

/** All 12 signs for the period that contains `date` (YYYY-MM-DD; default today). */
export async function getHoroscopes(period = "daily", date) {
  const p = PERIODS.includes(period) ? period : "daily";
  return run(() => api("/horoscopes", { query: { period: p, date: day(date) } }), { refresh: false });
}

/**
 * Saves one sign for the period containing `date`. `sections`: [{ title, text }] in display order (any number).
 * Publishing needs content:approve.
 */
export async function saveHoroscope(sign, d = {}, publish = false, { period = "daily", date, sections = [] } = {}) {
  return run(() =>
    api(`/horoscopes/${seg(sign)}`, {
      method: "PUT",
      body: {
        period: PERIODS.includes(period) ? period : "daily",
        date: day(date),
        text: str(d.text),
        sections: sections.map((x) => ({ title: str(x.title), text: str(x.text) })).filter((x) => x.title || x.text),
        luckyColor: str(d.luckyColor),
        luckyNumber: num(d.luckyNumber),
        publish: Boolean(publish),
      },
    })
  );
}

/* ---------------- Blogs ---------------- */
/** Full article with its `body` (rich-text HTML, or Markdown for older articles) — the list only has metadata. */
export async function getBlog(id) {
  return run(() => api(`/blogs/${seg(id)}`), { refresh: false });
}

/** `status`: draft | review | published (publishing needs content:approve). */
export async function saveBlog(id, d = {}, status = "draft") {
  const body = {
    title: str(d.title),
    category: str(d.category),
    body: String(d.body ?? ""),
    bodyFormat: d.bodyFormat === "markdown" ? "markdown" : "html",
    // "" clears the cover image / video
    cover: String(d.cover ?? ""),
    video: String(d.video ?? ""),
    status: ["draft", "review", "published"].includes(status) ? status : "draft",
  };
  return run(() => (id ? api(`/blogs/${seg(id)}`, { method: "PATCH", body }) : api("/blogs", { method: "POST", body })));
}

/** Deletes an article for good (needs content:delete; the backend writes it to the audit log). */
export async function deleteBlog(id) {
  return run(() => api(`/blogs/${seg(id)}`, { method: "DELETE" }));
}

const BLOG_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BLOG_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MB = 1024 * 1024;

/**
 * Uploads an image (JPG/PNG/WebP, 10 MB) or a short video (MP4/WebM, 50 MB) for a blog article → `{ url }`.
 * The backend checks the real file type again.
 */
export async function uploadBlogMedia(formData) {
  return run(
    async () => {
      const file = formData.get("file");
      if (!file || typeof file === "string" || !file.size) throw new ApiError(400, "NO_FILE", "Choose a file.");
      const isImage = BLOG_IMAGE_TYPES.includes(file.type);
      const isVideo = BLOG_VIDEO_TYPES.includes(file.type);
      if (!isImage && !isVideo) throw new ApiError(400, "BAD_FILE", "Use a JPG, PNG or WebP image, or an MP4 / WebM video.");
      if (isImage && file.size > 10 * MB) throw new ApiError(400, "FILE_TOO_LARGE", "Images can be up to 10 MB.");
      if (isVideo && file.size > 50 * MB) throw new ApiError(400, "FILE_TOO_LARGE", "Videos can be up to 50 MB. Use a YouTube link for longer videos.");
      const form = new FormData();
      form.append("file", file, file.name);
      return isImage ? api("/uploads/image", { method: "POST", query: { folder: "blog" }, form }) : api("/uploads/video", { method: "POST", form });
    },
    { refresh: false },
  );
}

/* ---------------- FAQs ---------------- */
/** New FAQs are saved unpublished. */
export async function saveFaq(id, d = {}) {
  const body = { question: str(d.question), answer: str(d.answer), category: str(d.category) };
  return run(() => (id ? api(`/faqs/${seg(id)}`, { method: "PATCH", body }) : api("/faqs", { method: "POST", body })));
}

export async function setFaqPublished(id, published) {
  return run(() => api(`/faqs/${seg(id)}/publish`, { method: "PATCH", body: { published: Boolean(published) } }));
}

/* ---------------- Policies ---------------- */
/** Policy with its current `body` and `versions`. */
export async function getPolicy(slug) {
  return run(() => api(`/policies/${seg(slug)}`), { refresh: false });
}

/** A material change bumps the major version; the apps then ask users to accept again. */
export async function publishPolicy(slug, body, material = false) {
  return run(() => api(`/policies/${seg(slug)}/publish`, { method: "POST", body: { body: String(body ?? ""), material: Boolean(material) } }));
}

/* ---------------- Reports (catalogue) ---------------- */
/** "What's included": one item per line, optionally "Title: one-line detail". New reports are saved hidden. */
export async function saveReport(id, d = {}) {
  const body = {
    title: str(d.title),
    slug: str(d.slug) || undefined,
    shortDescription: str(d.shortDescription) || undefined,
    description: str(d.description) || undefined,
    icon: str(d.icon) || "scroll",
    price: num(d.price),
    originalPrice: num(d.originalPrice) ?? 0,
    pages: num(d.pages),
    deliveryHours: num(d.deliveryHours) ?? 48,
    profilesRequired: num(d.profilesRequired) === 2 ? 2 : 1,
    includes: String(d.includes ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
    rating: num(d.rating),
    sold: num(d.sold),
    sort: num(d.sort),
  };
  return run(() => (id ? api(`/reports/${seg(id)}`, { method: "PATCH", body }) : api("/reports", { method: "POST", body })));
}

/** Show / hide on the website and apps (needs content:approve). */
export async function setReportActive(id, active) {
  return run(() => api(`/reports/${seg(id)}/active`, { method: "PATCH", body: { active: Boolean(active) } }));
}

/** Only reports nobody bought can be deleted; hide the others. */
export async function deleteReport(id) {
  return run(() => api(`/reports/${seg(id)}`, { method: "DELETE" }));
}
