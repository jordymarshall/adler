# Adler V2 design preview

An isolated, interactive design concept: **Big goals. A way forward.**

```sh
npm run dev:v2
```

Open <http://localhost:5200> for the animated landing page or
<http://localhost:5200/app/today> for the sample workspace. The port is fixed so
V2 cannot silently take over another preview's address.

The original application still uses `npm run dev`, its existing entry point,
styles, and API. V2 has a separate Vite configuration and dependency cache.

Explore goal creation, action check-ins, result recording, the example calendar,
and scripted coach suggestions. Sample changes are shared between screens during
a visit and reset on reload. V2 does not connect to live AI, messaging, calendars,
or the original application's data.

`npm run build:v2` type-checks the project and builds the prototype into `dist/v2`.
The normal build remains unchanged; running it clears `dist`, including V2's
previous build output. Run the V2 build afterward if you need both artifacts.
