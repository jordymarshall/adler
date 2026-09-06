// Google Calendar artwork: https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png
// Apple Calendar artwork: https://apps.apple.com/us/app/calendar/id1108185179
export function CalendarLogo({ provider }: { provider: "google" | "apple" }) {
  return provider === "google" ? (
    <img
      className="calendar-logo"
      src="/brands/google-calendar.png"
      alt=""
      width="28"
      height="28"
    />
  ) : (
    <img
      className="calendar-logo"
      src="/brands/apple-calendar.png"
      alt=""
      width="28"
      height="28"
    />
  );
}
