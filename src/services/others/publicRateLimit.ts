import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { publicRequestLimits } from "@/db/schema";
import { RequestError } from "./requestValidation";

/**
 * The client's IP address as reported by the hosting proxy (first entry of X-Forwarded-For, or X-Real-IP).
 * Only a hash is stored. Without a proxy header every request shares one bucket, which errs on the strict side.
 */
export function clientAddressKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(address).digest("hex").slice(0, 32);
}

/** Counts one request against `key` in a fixed one-hour window; throws 429 once `limit` is passed. */
export async function limitPerHour(key: string, limit: number) {
  const [row] = await db.insert(publicRequestLimits).values({ key, windowStart: new Date(), requests: 1 })
    .onConflictDoUpdate({ target: publicRequestLimits.key, set: {
      windowStart: sql`case when ${publicRequestLimits.windowStart} <= now() - interval '1 hour' then now() else ${publicRequestLimits.windowStart} end`,
      requests: sql`case when ${publicRequestLimits.windowStart} <= now() - interval '1 hour' then 1 else least(${publicRequestLimits.requests} + 1, 1000000) end`,
    } }).returning({ requests: publicRequestLimits.requests });
  if (row.requests > limit) throw new RequestError("Too many attempts. Please wait an hour and try again.", 429, 3600);
}
