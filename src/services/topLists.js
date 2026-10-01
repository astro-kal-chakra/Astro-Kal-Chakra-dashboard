/** Ranked lists for the analytics "Top lists" view. Server-only. */
import * as db from "@/data/db";
import { delay } from "./query";

const ASTRO_SORT = {
  sessions: (a, b) => b.sessions - a.sessions,
  earnings: (a, b) => b.earnings - a.earnings,
  rating: (a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount,
};

export async function getTopAstrologers({ by = "earnings", limit = 10 } = {}) {
  await delay();
  const sort = ASTRO_SORT[by] ?? ASTRO_SORT.earnings;
  return db.astrologers
    .filter((a) => a.status === "approved")
    .sort(sort)
    .slice(0, limit)
    .map(({ id, name, city, sessions, earnings, rating, reviewsCount, complaints }) => ({ id, name, city, sessions, earnings, rating, reviewsCount, complaints }));
}

export async function getQualityByAstrologer({ limit = 8 } = {}) {
  await delay();
  return db.astrologers
    .filter((a) => a.status === "approved" && a.sessions > 0)
    .map((a) => ({ id: a.id, name: a.name, complaints: a.complaints, perThousand: +((a.complaints / a.sessions) * 1000).toFixed(1), rating: a.rating }))
    .sort((a, b) => b.perThousand - a.perThousand)
    .slice(0, limit);
}
