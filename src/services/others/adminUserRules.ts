import { RequestError, object } from "./requestValidation";
import { PLANS } from "@/config/plans";

export function updateAccessMetadata(metadata: Record<string, unknown>, input: unknown, actorId: string, targetId: string, now = new Date()) {
  const body = object(input);
  const allowed = body.action === "setRole" ? ["action", "role"] : ["action"];
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw new RequestError("Unexpected access field");
  const next = { ...metadata };
  if (body.action === "setRole") {
    if (body.role !== "user" && body.role !== "admin") throw new RequestError("Invalid role");
    if (actorId === targetId && body.role !== "admin") throw new RequestError("You cannot demote your own account", 403);
    next.role = body.role;
  } else if (body.action === "grantPass") {
    const expiry = new Date(now);
    // Preserve the calendar date, clamping 29 February to 28 February next year.
    expiry.setUTCFullYear(expiry.getUTCFullYear() + PLANS.plus.durationYears);
    if (expiry.getUTCMonth() !== now.getUTCMonth()) expiry.setUTCDate(0);
    next.paid_until = expiry.toISOString();
  } else if (body.action === "revokePass") next.paid_until = null;
  else throw new RequestError("Invalid access action");
  return next;
}
