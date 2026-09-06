import { createDAVClient, type DAVCalendar } from "tsdav";
import ICAL from "ical.js";
import { randomUUID } from "node:crypto";
import type { BusyInterval } from "../src/program-types.ts";

export type AppleClient = Awaited<ReturnType<typeof createDAVClient>>;
export interface CalendarSession {
  state?: { value: string; expires: number };
  google?: { access_token: string; refresh_token?: string; expires_at: number };
  apple?: AppleClient;
  appleCalendars?: DAVCalendar[];
}
const googleRoot = "https://www.googleapis.com/calendar/v3";
export async function googleToken(session: CalendarSession) {
  if (!session.google) throw new Error("Connect Google Calendar first.");
  if (session.google.expires_at > Date.now() + 60000)
    return session.google.access_token;
  if (!session.google.refresh_token)
    throw new Error("Google access expired. Please reconnect.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: session.google.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const tokens = await response.json();
  if (!response.ok) {
    session.google = undefined;
    throw new Error("Google access expired or was revoked. Please reconnect.");
  }
  session.google = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || session.google.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
  };
  return session.google.access_token;
}
export async function googleRequest(
  session: CalendarSession,
  path: string,
  body?: unknown,
) {
  const response = await fetch(googleRoot + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${await googleToken(session)}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(
        `Google Calendar request failed (${response.status}). ${response.status === 403 ? "Check calendar permissions and enable the Calendar API." : "Reconnect or try again."}`,
      ),
      { status: response.status },
    );
  return result;
}
export async function listCalendars(session: CalendarSession) {
  const google: { id: string; name: string; writable: boolean }[] = [];
  if (session.google) {
    let token = "";
    do {
      const page = await googleRequest(
        session,
        `/users/me/calendarList?maxResults=250${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`,
      );
      google.push(
        ...(page.items ?? []).map(
          (c: { id: string; summary: string; accessRole: string }) => ({
            id: c.id,
            name: c.summary,
            writable: c.accessRole === "owner",
          }),
        ),
      );
      token = page.nextPageToken ?? "";
    } while (token);
  }
  if (session.apple)
    session.appleCalendars = await session.apple.fetchCalendars();
  return {
    google,
    apple: (session.appleCalendars ?? []).map((c) => ({
      id: c.url,
      name: String(c.displayName || "iCloud calendar"),
      writable: true,
    })),
  };
}
export function parseAppleBusy(
  ics: string,
  start: string,
  end: string,
): BusyInterval[] {
  const root = new ICAL.Component(ICAL.parse(ics));
  for (const zone of root.getAllSubcomponents("vtimezone")) {
    const id = String(zone.getFirstPropertyValue("tzid"));
    ICAL.TimezoneService.register(
      new ICAL.Timezone({ component: zone, tzid: id }),
      id,
    );
  }
  const busy: BusyInterval[] = [];
  for (const component of root.getAllSubcomponents("vevent")) {
    if (
      component.getFirstPropertyValue("status") === "CANCELLED" ||
      component.getFirstPropertyValue("transp") === "TRANSPARENT"
    )
      continue;
    if (component.hasProperty("rrule") || component.hasProperty("rdate"))
      throw new Error(
        "iCloud returned a recurring event that could not be expanded. Availability is unknown for this calendar.",
      );
    const event = new ICAL.Event(component);
    const property = component.getFirstProperty("dtstart");
    const zone = property?.getParameter("tzid");
    if (zone && !ICAL.TimezoneService.has(String(zone)))
      throw new Error(
        "A calendar time zone could not be resolved. Availability is unknown.",
      );
    if (!event.startDate.isDate && event.startDate.zone.tzid === "floating")
      throw new Error(
        "A calendar event has no time zone. Availability is unknown.",
      );
    // All-day dates have no timezone. Block the full possible local-day span conservatively.
    const from =
      event.startDate.toJSDate().getTime() -
      (event.startDate.isDate ? 14 * 3600000 : 0);
    const to =
      event.endDate.toJSDate().getTime() +
      (event.endDate.isDate ? 14 * 3600000 : 0);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from)
      throw new Error(
        "A calendar event could not be read. Availability is unknown.",
      );
    if (from < Date.parse(end) && to > Date.parse(start))
      busy.push({
        start: new Date(from).toISOString(),
        end: new Date(to).toISOString(),
        provider: "apple",
      });
  }
  return busy;
}
export async function availability(
  session: CalendarSession,
  provider: "google" | "apple",
  calendarIds: string[],
  start: string,
  end: string,
) {
  if (!calendarIds.length)
    throw new Error("Choose at least one calendar to check.");
  if (provider === "google") {
    const result = await googleRequest(session, "/freeBusy", {
      timeMin: start,
      timeMax: end,
      items: calendarIds.map((id) => ({ id })),
    });
    return calendarIds.flatMap((id) => {
      const calendar = result.calendars?.[id];
      if (!calendar || calendar.errors?.length)
        throw new Error(
          "Google could not check every selected calendar. No slots have been marked free.",
        );
      return (calendar.busy ?? []).map((b: BusyInterval) => ({
        ...b,
        provider,
      }));
    }) as BusyInterval[];
  }
  if (!session.apple) throw new Error("Connect iCloud Calendar first.");
  const all: BusyInterval[] = [];
  for (const id of calendarIds) {
    const calendar = session.appleCalendars?.find((c) => c.url === id);
    if (!calendar)
      throw new Error(
        "This iCloud calendar is unavailable. Refresh the calendar list.",
      );
    const objects = await session.apple.fetchCalendarObjects({
      calendar,
      timeRange: { start, end },
      expand: true,
    });
    for (const object of objects) {
      if (!object.data)
        throw new Error(
          "iCloud did not return complete event data. Availability is unknown.",
        );
      all.push(...parseAppleBusy(object.data, start, end));
    }
  }
  return all;
}
export const overlaps = (a: BusyInterval, b: BusyInterval) =>
  Date.parse(a.start) < Date.parse(b.end) &&
  Date.parse(b.start) < Date.parse(a.end);
export function calendarFile(
  id: string,
  title: string,
  start: string,
  end: string,
  description: string,
) {
  const calendar = new ICAL.Component(["vcalendar", [], []]);
  calendar.updatePropertyWithValue("version", "2.0");
  calendar.updatePropertyWithValue("prodid", "-//Adler//Goal work//EN");
  const component = new ICAL.Component("vevent");
  const event = new ICAL.Event(component);
  event.uid = `${id}@adler.local`;
  event.summary = title;
  event.description = description;
  event.startDate = ICAL.Time.fromJSDate(new Date(start), true);
  event.endDate = ICAL.Time.fromJSDate(new Date(end), true);
  component.updatePropertyWithValue(
    "dtstamp",
    ICAL.Time.fromJSDate(new Date(), true),
  );
  calendar.addSubcomponent(component);
  return calendar.toString();
}
export interface Booking {
  id: string;
  sessionId: string;
  provider: "google" | "apple";
  calendarId: string;
  conflictIds: string[];
  title: string;
  start: string;
  end: string;
  checkIn: boolean;
  workId: string;
  checkInId: string;
  workDone: boolean;
  checkInDone: boolean;
  error?: string;
}
export function newBooking(
  input: Omit<Booking, "workId" | "checkInId" | "workDone" | "checkInDone">,
): Booking {
  return {
    ...input,
    workId: randomUUID().replaceAll("-", ""),
    checkInId: randomUUID().replaceAll("-", ""),
    workDone: false,
    checkInDone: false,
  };
}
export async function existingEvent(
  session: CalendarSession,
  booking: Booking,
  checkIn: boolean,
) {
  const id = checkIn ? booking.checkInId : booking.workId;
  const start = checkIn ? booking.end : booking.start;
  const end = checkIn
    ? new Date(Date.parse(booking.end) + 5 * 60000).toISOString()
    : booking.end;
  if (booking.provider === "google") {
    let event;
    try {
      event = await googleRequest(
        session,
        `/calendars/${encodeURIComponent(booking.calendarId)}/events/${id}`,
      );
    } catch (error) {
      if ((error as { status?: number }).status === 404) return false;
      throw error;
    }
    if (
      event.status === "cancelled" ||
      event.extendedProperties?.private?.adlerBookingId !== booking.id ||
      Date.parse(event.start?.dateTime) !== Date.parse(start) ||
      Date.parse(event.end?.dateTime) !== Date.parse(end)
    )
      throw new Error(
        "The existing calendar event changed. Review it in your calendar before making another booking.",
      );
    return true;
  }
  if (!session.apple) throw new Error("Reconnect iCloud before retrying.");
  const calendar = session.appleCalendars?.find(
    (c) => c.url === booking.calendarId,
  );
  if (!calendar)
    throw new Error("Refresh the connected iCloud calendars before retrying.");
  const objects = await session.apple.fetchCalendarObjects({
    calendar,
    objectUrls: [`${calendar.url.replace(/\/$/, "")}/${id}.ics`],
  });
  const object = objects.find((o) => o.data);
  if (!object) return false;
  const component = new ICAL.Component(
    ICAL.parse(object.data),
  ).getFirstSubcomponent("vevent");
  if (!component)
    throw new Error("An existing iCloud booking could not be read.");
  const event = new ICAL.Event(component);
  if (
    event.uid !== `${id}@adler.local` ||
    event.startDate.toJSDate().getTime() !== Date.parse(start) ||
    event.endDate.toJSDate().getTime() !== Date.parse(end) ||
    component.getFirstPropertyValue("status") === "CANCELLED"
  )
    throw new Error(
      "The existing iCloud event changed. Review it before making another booking.",
    );
  return true;
}
export async function createEvent(
  session: CalendarSession,
  booking: Booking,
  checkIn: boolean,
) {
  const id = checkIn ? booking.checkInId : booking.workId;
  const start = checkIn ? booking.end : booking.start;
  const end = checkIn
    ? new Date(Date.parse(booking.end) + 5 * 60000).toISOString()
    : booking.end;
  const title = checkIn
    ? `Adler check-in: ${booking.title}`
    : `Adler: ${booking.title}`;
  const description = checkIn
    ? "Open Adler and record: done, partly, or did not happen. Add the result or obstacle."
    : "Work on the planned action. Record what happened in Adler afterward.";
  if (booking.provider === "google") {
    const path = `/calendars/${encodeURIComponent(booking.calendarId)}/events`;
    try {
      await googleRequest(session, path, {
        id,
        summary: title,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
        extendedProperties: { private: { adlerBookingId: booking.id } },
        reminders: { useDefault: true },
      });
    } catch (error) {
      if ((error as { status?: number }).status !== 409) throw error;
      const existing = await googleRequest(session, `${path}/${id}`);
      if (
        existing.extendedProperties?.private?.adlerBookingId !== booking.id ||
        Date.parse(existing.start?.dateTime) !== Date.parse(start) ||
        Date.parse(existing.end?.dateTime) !== Date.parse(end) ||
        existing.status === "cancelled"
      )
        throw new Error(
          "An existing calendar event differs from this booking. Review it in your calendar.",
        );
    }
  } else {
    if (!session.apple)
      throw new Error("Reconnect iCloud before retrying the booking.");
    const calendar = session.appleCalendars?.find(
      (c) => c.url === booking.calendarId,
    );
    if (!calendar) throw new Error("Choose an available iCloud calendar.");
    const response = await session.apple.createCalendarObject({
      calendar,
      filename: `${id}.ics`,
      iCalString: calendarFile(id, title, start, end, description),
      headers: { "If-None-Match": "*" },
    });
    if (response.status === 412) {
      const objects = await session.apple.fetchCalendarObjects({
        calendar,
        objectUrls: [`${calendar.url.replace(/\/$/, "")}/${id}.ics`],
      });
      const existing = objects[0]?.data
        ? new ICAL.Event(
            new ICAL.Component(
              ICAL.parse(objects[0].data),
            ).getFirstSubcomponent("vevent")!,
          )
        : undefined;
      if (
        !existing ||
        existing.uid !== `${id}@adler.local` ||
        existing.startDate.toJSDate().getTime() !== Date.parse(start) ||
        existing.endDate.toJSDate().getTime() !== Date.parse(end)
      )
        throw new Error(
          "An existing iCloud event differs from this booking. Review it in your calendar.",
        );
    } else if (!response.ok)
      throw new Error(`iCloud could not save the event (${response.status}).`);
  }
}

export async function finishBooking(
  session: CalendarSession,
  current: Booking,
  save: () => Promise<void>,
) {
  try {
    if (current.error) {
      if (!current.workDone)
        current.workDone = await existingEvent(session, current, false);
      if (current.checkIn && !current.checkInDone)
        current.checkInDone = await existingEvent(session, current, true);
      await save();
    }
    const missing = [
      ...(!current.workDone
        ? [{ start: current.start, end: current.end }]
        : []),
      ...(current.checkIn && !current.checkInDone
        ? [
            {
              start: current.end,
              end: new Date(Date.parse(current.end) + 5 * 60000).toISOString(),
            },
          ]
        : []),
    ];
    for (const range of missing) {
      const busy = await availability(
        session,
        current.provider,
        [...new Set([...current.conflictIds, current.calendarId])],
        range.start,
        range.end,
      );
      if (busy.some((b) => overlaps(b, range)))
        throw new Error(
          "This slot now overlaps a calendar event. Refresh availability and choose another time.",
        );
    }
    if (!current.workDone) {
      await createEvent(session, current, false);
      current.workDone = true;
      await save();
    }
    if (current.checkIn && !current.checkInDone) {
      await createEvent(session, current, true);
      current.checkInDone = true;
      await save();
    }
    current.error = undefined;
  } catch (error) {
    current.error =
      error instanceof Error ? error.message : "Calendar booking failed.";
  }
  await save();
}
