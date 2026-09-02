import { prisma } from "../db";

/**
 * Lightweight analytics ingest for the front-end.
 *
 * The shape of the payload is intentionally tiny: a stable `name` (the
 * event id the client and the dashboard both agree on), a free-form
 * `props` JSON for everything else, plus first-touch UTM fields that
 * are copied off the User row so the funnel is queryable by channel
 * even after the user has long since registered.
 *
 * All writes are best-effort and never throw back to the client.
 * That's deliberate: losing an event must not break the form submit.
 */

const MAX_PROPS_BYTES = 4_000;

export interface TrackInput {
  /** A short stable identifier, e.g. "app_open", "screen_view", "cta_click". */
  name: string;
  /** Logical screen name, e.g. "landing", "form.stand.step1". */
  screen?: string;
  /** Free-form JSON. We do not enforce a schema — keep it small. */
  props?: unknown;
  /** Required when no user is identified. */
  anonymousId?: string;
  /** Set when the request carries a valid Telegram initData header. */
  userId?: number;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

const NAME_RE = /^[a-z][a-z0-9_]{1,63}$/;

export function isValidEventName(name: unknown): name is string {
  return typeof name === "string" && NAME_RE.test(name);
}

function safePropsSize(value: unknown): number {
  try {
    return JSON.stringify(value ?? null).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export async function recordEvent(input: TrackInput): Promise<{ recorded: boolean; reason?: string }> {
  if (!isValidEventName(input.name)) {
    return { recorded: false, reason: "invalid_name" };
  }
  if (!input.userId && !input.anonymousId) {
    return { recorded: false, reason: "missing_id" };
  }
  if (safePropsSize(input.props) > MAX_PROPS_BYTES) {
    return { recorded: false, reason: "props_too_large" };
  }

  await prisma.event.create({
    data: {
      name: input.name,
      screen: input.screen,
      props: input.props as never,
      anonymousId: input.userId ? null : input.anonymousId,
      userId: input.userId ?? null,
      utmSource: input.utm?.source,
      utmMedium: input.utm?.medium,
      utmCampaign: input.utm?.campaign,
      utmContent: input.utm?.content,
      utmTerm: input.utm?.term,
    },
  });
  return { recorded: true };
}
