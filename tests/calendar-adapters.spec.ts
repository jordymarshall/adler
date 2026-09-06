import { expect, test } from "@playwright/test";
import {
  availability,
  finishBooking,
  newBooking,
  parseAppleBusy,
  type CalendarSession,
} from "../server/calendars";
import { findSlots } from "../src/scheduling";
import type { ProgramVersion } from "../src/program-types";
const google: CalendarSession = {
  google: {
    access_token: "fixture-not-a-secret",
    expires_at: Date.now() + 3600000,
  },
};
const originalFetch = globalThis.fetch;
test.afterEach(() => {
  globalThis.fetch = originalFetch;
});
const response = (json: unknown, status = 200) =>
  new Response(JSON.stringify(json), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const input = () =>
  newBooking({
    id: "fixture",
    sessionId: "fixture",
    provider: "google",
    calendarId: "primary",
    conflictIds: ["primary"],
    title: "Fictional work session",
    start: "2026-10-20T13:00:00Z",
    end: "2026-10-20T13:25:00Z",
    checkIn: true,
  });

test("free-slot search respects workdays, busy time, check-ins, and local hours", () => {
  const program = {
    workDays: [1],
    workStart: "09:00",
    workEnd: "10:00",
    sessionMinutes: 25,
  } as ProgramVersion;
  const now = new Date(2026, 9, 19, 8, 0);
  const busy = [
    {
      start: new Date(2026, 9, 19, 9, 0).toISOString(),
      end: new Date(2026, 9, 19, 9, 30).toISOString(),
    },
  ];
  const slots = findSlots(program, busy, now, true);
  expect(slots).toHaveLength(1);
  expect(new Date(slots[0].start).getHours()).toBe(9);
  expect(new Date(slots[0].start).getMinutes()).toBe(30);
  expect(new Date(slots[0].end).getMinutes()).toBe(55);
});

test("Google per-calendar errors are unknown availability", async () => {
  globalThis.fetch = async () =>
    response({ calendars: { primary: { errors: [{ reason: "notFound" }] } } });
  await expect(
    availability(
      google,
      "google",
      ["primary"],
      "2026-10-20T09:00:00Z",
      "2026-10-20T17:00:00Z",
    ),
  ).rejects.toThrow("could not check every");
});

test("partial booking retries only the missing event and rechecks its availability", async () => {
  const booking = input();
  let inserts: string[] = [];
  let failCheckIn = true;
  const checked: string[] = [];
  globalThis.fetch = async (url, options) => {
    const path = String(url);
    const body = options?.body ? JSON.parse(String(options.body)) : undefined;
    if (path.endsWith("/freeBusy")) {
      checked.push(body.timeMin);
      return response({ calendars: { primary: { busy: [] } } });
    }
    if (options?.method === "GET") return response({}, 404);
    inserts.push(body.id);
    return body.id === booking.checkInId && failCheckIn
      ? response({}, 503)
      : response({ id: body.id });
  };
  await finishBooking(google, booking, async () => {});
  expect(booking.workDone).toBe(true);
  expect(booking.checkInDone).toBe(false);
  expect(booking.error).toContain("503");
  failCheckIn = false;
  checked.length = 0;
  inserts = [];
  await finishBooking(google, booking, async () => {});
  expect(inserts).toEqual([booking.checkInId]);
  expect(checked).toEqual([booking.end]);
  expect(booking.checkInDone).toBe(true);
  expect(booking.error).toBeUndefined();
});

test("an uncertain successful write is recovered by its stable ID without duplication", async () => {
  const booking = input();
  booking.error = "Response lost";
  let writes = 0;
  globalThis.fetch = async (url, options) => {
    if (options?.method === "POST") {
      writes++;
      throw new Error("No writes expected");
    }
    const checkIn = String(url).endsWith(booking.checkInId);
    return response({
      status: "confirmed",
      extendedProperties: { private: { adlerBookingId: booking.id } },
      start: { dateTime: checkIn ? booking.end : booking.start },
      end: { dateTime: checkIn ? "2026-10-20T13:30:00Z" : booking.end },
    });
  };
  await finishBooking(google, booking, async () => {});
  expect(writes).toBe(0);
  expect(booking.workDone).toBe(true);
  expect(booking.checkInDone).toBe(true);
});

test("retry after a conflict cannot bypass the fresh conflict check", async () => {
  const booking = input();
  booking.error = "This slot overlaps";
  let writes = 0;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith("/freeBusy"))
      return response({
        calendars: {
          primary: { busy: [{ start: booking.start, end: booking.end }] },
        },
      });
    if (options?.method === "GET") return response({}, 404);
    writes++;
    return response({});
  };
  await finishBooking(google, booking, async () => {});
  expect(writes).toBe(0);
  expect(booking.workDone).toBe(false);
  expect(booking.error).toContain("overlaps");
});

const ics = (lines: string[]) =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    "UID:fixture",
    ...lines,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
test("iCloud parsing respects UTC, transparent and cancelled events, and blocks uncertain recurrence", () => {
  const range = ["2026-10-20T00:00:00Z", "2026-10-21T00:00:00Z"] as const;
  const timing = ["DTSTART:20261020T130000Z", "DTEND:20261020T140000Z"];
  expect(parseAppleBusy(ics(timing), ...range)).toHaveLength(1);
  expect(
    parseAppleBusy(ics([...timing, "TRANSP:TRANSPARENT"]), ...range),
  ).toHaveLength(0);
  expect(
    parseAppleBusy(ics([...timing, "STATUS:CANCELLED"]), ...range),
  ).toHaveLength(0);
  expect(() =>
    parseAppleBusy(ics([...timing, "RRULE:FREQ=WEEKLY"]), ...range),
  ).toThrow("could not be expanded");
  const allDay = parseAppleBusy(
    ics(["DTSTART;VALUE=DATE:20261020", "DTEND;VALUE=DATE:20261021"]),
    ...range,
  );
  expect(Date.parse(allDay[0].start)).toBeLessThan(Date.parse(range[0]));
  expect(Date.parse(allDay[0].end)).toBeGreaterThan(Date.parse(range[1]));
});

test("failed iCloud PUT is not treated as a successful booking", async () => {
  const booking = {
    ...input(),
    provider: "apple" as const,
    calendarId: "https://fixture.invalid/calendar/",
    conflictIds: ["https://fixture.invalid/calendar/"],
  };
  const session = {
    appleCalendars: [{ url: booking.calendarId }],
    apple: {
      fetchCalendarObjects: async () => [],
      createCalendarObject: async () => new Response("", { status: 403 }),
    },
  } as unknown as CalendarSession;
  await finishBooking(session, booking, async () => {});
  expect(booking.workDone).toBe(false);
  expect(booking.error).toContain("403");
});

test("local API refuses foreign origins and does not expose private files", async ({
  request,
}) => {
  const badOrigin = await request.post("/api/coach", {
    headers: { Origin: "https://unrelated.example" },
    data: { consent: true, context: {} },
  });
  expect(badOrigin.status()).toBe(403);
  const privateFile = await request.get("/.context/calendar-bookings.json");
  expect(privateFile.status()).toBe(403);
});
