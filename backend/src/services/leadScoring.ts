import type { SubmitRegistrationBody } from "../types";

/**
 * Rule-based lead scoring engine (Stage 2, MVP).
 *
 * The score is a 0..100 number that combines a few deterministic signals
 * from the submission. It's intentionally simple: the marketing team can
 * tune the weights by editing this file (or, in a later stage, override
 * the score from the admin panel). The tier (HOT/WARM/COLD) is a
 * categorisation on top of the score for fast filtering.
 *
 * Thresholds (kept in code because they are derived from the weights
 * below — bumping any weight will move a few leads across tiers, which
 * is desirable so the thresholds stay in sync):
 *   HOT  : score >= 70
 *   WARM : 40 <= score < 70
 *   COLD : score < 40
 *
 * GUEST registrations get a flat low score: they are valuable for the
 * visitor funnel but the primary revenue target is STAND.
 */

export type LeadTier = "HOT" | "WARM" | "COLD";

const HOT_THRESHOLD = 70;
const WARM_THRESHOLD = 40;

const TIER_EMOJI: Record<LeadTier, string> = {
  HOT: "🔥",
  WARM: "🟡",
  COLD: "🔵",
};

export function tierFromScore(score: number): LeadTier {
  if (score >= HOT_THRESHOLD) return "HOT";
  if (score >= WARM_THRESHOLD) return "WARM";
  return "COLD";
}

export function tierEmoji(tier: LeadTier): string {
  return TIER_EMOJI[tier];
}

/** Internal helper — match a booth label to a tier (premium > standard > area > unsure). */
function boothBucket(spaceNeeded: string | undefined): "premium" | "standard" | "area" | "unsure" {
  const v = (spaceNeeded ?? "").toLowerCase();
  // Labels we use in the UI: "Premium stend · 18 m²", "Standart stend · 9 m²",
  // "Faqat maydon · 36 m²+", "Hali aniq emas — maslahat kerak".
  if (v.includes("premium")) return "premium";
  if (v.includes("standart") || v.includes("standard")) return "standard";
  if (v.includes("maydon") || v.includes("area") || v.includes("36")) return "area";
  return "unsure";
}

/** Internal helper — match a free-text years label to a bucket. */
function yearsBucket(companyYears: string | undefined): "lt1" | "1to3" | "3to10" | "10plus" {
  const v = (companyYears ?? "").toLowerCase();
  // Order matters: "3-10 yil" and "3–10 yil" both contain "10", so we
  // must check the combined "3" ranges BEFORE the bare "10+" range, or
  // every "3-10" submission would be mis-bucketed as 10+.
  if (/(^|[^\d])3(\s*[–-]\s*|–|-)10/.test(v) || /\b3\s*to\s*10\b/.test(v)) return "3to10";
  if (v.includes("10")) return "10plus";
  if (v.includes("3")) return "3to10";
  if (v.includes("1")) return "1to3";
  return "lt1";
}

/** Internal helper — the cities we consider "home market" for the expo (Tashkent, Samarkand). */
function isHomeCity(city: string | undefined): boolean {
  if (!city) return false;
  const norm = city.trim().toLowerCase();
  return norm === "toshkent" || norm === "samarqand" || norm === "ташкент" || norm === "самарканд" || norm === "tashkent" || norm === "samarkand";
}

export interface LeadScore {
  score: number;
  tier: LeadTier;
  /** Short, human-readable breakdown so the admin can see *why* a lead scored what it did. */
  reasons: string[];
}

export function computeLeadScore(body: SubmitRegistrationBody): LeadScore {
  const reasons: string[] = [];
  let score = 0;

  if (body.type === "STAND") {
    // Primary revenue target — biggest single boost.
    score += 30;
    reasons.push("+30 stend arizasi");

    if (body.phone && body.phone.trim()) {
      score += 20;
      reasons.push("+20 telefon kiritilgan");
    }

    const years = yearsBucket(body.companyYears);
    if (years === "10plus") {
      score += 15;
      reasons.push("+15 10+ yil tajriba");
    } else if (years === "3to10") {
      score += 10;
      reasons.push("+10 3-10 yil tajriba");
    }

    const booth = boothBucket(body.spaceNeeded);
    if (booth === "premium") {
      score += 15;
      reasons.push("+15 premium stend");
    } else if (booth === "standard") {
      score += 10;
      reasons.push("+10 standart stend");
    } else if (booth === "area") {
      score += 5;
      reasons.push("+5 faqat maydon");
    }

    if (isHomeCity(body.city)) {
      score += 5;
      reasons.push("+5 uy shahar (Toshkent/Samarqand)");
    }
  } else {
    // GUEST: flat small score, but committed attendees matter.
    if (body.willAttend === true) {
      score += 15;
      reasons.push("+15 mehmon, kelasiz deb tasdiqladi");
    } else if (body.willAttend === false) {
      score += 5;
      reasons.push("+5 mehmon, hozircha aniq emas");
    }
    if (body.phone && body.phone.trim()) {
      score += 5;
      reasons.push("+5 telefon kiritilgan");
    }
  }

  // Clamp to 0..100 so a misconfigured weight never escapes the bucket math.
  score = Math.max(0, Math.min(100, score));
  return { score, tier: tierFromScore(score), reasons };
}
