import { EVENT_END_MS, EVENT_START_MS } from "./countdown";

/**
 * Client-side .ics generator for "add to calendar".
 *
 * No third-party calendar API, no subscription endpoint: the file is built
 * from the same two timestamps the countdown uses and handed to the OS as a
 * Blob download. Google/Apple/Outlook all accept it, and if the organiser
 * moves a date, the countdown and the calendar entry move together because
 * they read one constant.
 */
function stamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function fold(line: string): string {
  // RFC 5545 wants lines wrapped at 75 octets with a leading space on
  // continuations; long titles would otherwise break strict parsers.
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    parts.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
}

function escapeText(value: string): string {
  return value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export interface IcsOptions {
  title: string;
  description: string;
  location: string;
}

export function buildIcs({ title, description, location }: IcsOptions): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FOODERA EXPO 2026//fooderabot//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:foodera-expo-2026@fooderabot`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(EVENT_START_MS)}`,
    `DTEND:${stamp(EVENT_END_MS)}`,
    fold(`SUMMARY:${escapeText(title)}`),
    fold(`DESCRIPTION:${escapeText(description)}`),
    fold(`LOCATION:${escapeText(location)}`),
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    fold(`DESCRIPTION:${escapeText(title)}`),
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    fold(`DESCRIPTION:${escapeText(title)}`),
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

/** Triggers a download of the generated file. Returns false when the browser
 *  refuses Blob URLs (very old Safari), so the caller can fall back to a link. */
export function downloadIcs(filename: string, ics: string): boolean {
  if (typeof window === "undefined" || typeof URL.createObjectURL !== "function") return false;
  try {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4_000);
    return true;
  } catch {
    return false;
  }
}
