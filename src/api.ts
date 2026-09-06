export async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(
    `/api/${path}`,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? "The request could not be completed.");
  return result as T;
}
export interface CalendarOption {
  id: string;
  name: string;
  writable: boolean;
}
export interface ServiceStatus {
  coach: { configured: boolean; model: string };
  google: { configured: boolean; connected: boolean };
  apple: { connected: boolean };
  calendars: { google: CalendarOption[]; apple: CalendarOption[] };
}
