# Adler for iOS

The iOS app is a native presentation adapter for the existing coaching system. It contains no second
coach: interpretation and planning go through `POST /api/coach`, deterministic edits go through the
shared command catalog, and every screen reads a server-computed view so web, iOS, SMS and MCP never
diverge. The project lives in `ios/` (`ios/README.md`, `ios/DESIGN.md`, `ios/COPY.md`,
`ios/FLOWS.md`).

**API contract: [docs/ios-api-contract.md](ios-api-contract.md)**, with real example payloads in
`docs/ios-api-examples/*.json`.

## Server

### Run the dev server the app talks to

```sh
npm install
npm run dev -- --port 8080
```

Vite serves the web app and mounts the same API middleware the production server uses, with SQLite
in `.data/`. `npm run dev` binds `0.0.0.0`, so both the simulator and a physical device can reach it.
Changing anything under `server/` or `shared/` restarts the API automatically — the Vite config
imports `server/api.ts`, so a save invalidates the config graph and the runtime reloads.

Sanity check:

```sh
curl -s http://localhost:8080/api/health          # {"ok":true}
curl -s -c jar -H 'Content-Type: application/json' \
  -d '{"username":"example-user","password":"a-long-test-password","timeZone":"America/Toronto"}' \
  http://localhost:8080/api/auth/register
curl -s -b jar http://localhost:8080/api/app/session
```

For a production-shaped run, `npm run build && npm start` serves the built SPA and the same API on
port 8080. See [Adler runtime](adler-runtime.md).

### Simulator

The simulator shares the Mac's network stack, so `http://localhost:8080` works with no extra
configuration: the host check accepts `localhost`, `127.0.0.1` and `[::1]` whenever `PUBLIC_URL` is
unset. The session is the existing HttpOnly cookie `adler_session`; `URLSession` stores and replays
it automatically, and native requests send no `Origin`, so the CSRF check passes.

### A physical device on the same Wi-Fi

Point the app's server field at the Mac's private address, for example `http://10.0.0.24:8080`
(`ipconfig getifaddr en0`). When `PUBLIC_URL` is unset and `NODE_ENV !== "production"`, the server
also accepts RFC1918 private IPv4 hosts — `10/8`, `172.16/12`, `192.168/16`. Any other `Host` is
still refused with 403 `{"error":"Unrecognized host."}`, and setting `PUBLIC_URL` (or
`NODE_ENV=production`) restores the single-host rule, so this is a development-only allowance.

Plain HTTP over the LAN needs App Transport Security to permit it: `NSAllowsLocalNetworking` in the
app's `Info.plist` (DEBUG only). iOS also asks for local-network permission the first time; accept
it. If a request fails, check that the Mac's firewall allows incoming connections for `node` and
that both devices are on the same subnet.

### Server keys vs BYOK

Coaching needs a model. Two supported arrangements, both reported by
`GET /api/app/session` → `status.coach` and `status.serverKeysAllowed`:

- **This server's key.** The account selects `useServer: true` (the default) and the server uses its
  own `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`. Allowed only on a private dev server
  (no `PUBLIC_URL`, `NODE_ENV !== "production"`) or when the operator sets
  `ADLER_ALLOW_SERVER_KEYS=true`. `serverKeysAllowed` tells the app whether to offer the option.
- **BYOK.** The person saves their own key per provider through `POST /api/provider`, then verifies
  it with `POST /api/provider/test`. Keys are encrypted at rest and never returned by any endpoint,
  including the app views.

Show provider setup only when `status.coach.configured` is false. Never print or log a key, and do
not copy one into fixtures or screenshots.

### Fictional data only

`docs/ios-api-examples/*.json`, `scripts/app-api-examples.ts` and `scripts/demo-fixture.ts` describe
an invented account. Do not present example content as customer proof, and do not seed a demo
workspace into a real account. See "Demo account" below for the one supported way to put this fixture
into a real dev data directory: a separate, clearly-fictional account, never merged into someone
else's workspace.

### Demo account

`npm run seed:demo` (`scripts/seed-demo-account.ts`) seeds a rich fictional account, `casey-example`,
into the real dev data directory (`ADLER_DATA_DIR`, default `.data/`) so iOS feature agents and user
testers can sign in without waiting on live coaching. It shares its fixture with
`scripts/app-api-examples.ts` through `scripts/demo-fixture.ts`, so the two cannot drift. Dates are
relative to the day it runs, so Today/Progress/Learn always show live states: an action due today,
one learning record mid-trial ("Live experiment") and one already "Ready to review", a pending
proposal in Coach, an unplanned Draft goal, a completed milestone, a measured goal with results and
checkpoints, and a paused goal.

Per [Adler runtime](adler-runtime.md), run **one process per data directory** — stop the dev server,
seed, then restart it:

```sh
lsof -ti:8080 | xargs kill
npm run seed:demo
(PORT=8080 nohup npm run dev -- --port 8080 > .context/dev-server.log 2>&1 &)
curl -s --retry 20 --retry-delay 1 --retry-connrefused http://localhost:8080/api/health
```

The script refuses to run against a data directory a server currently has open — checked with `lsof`
on the SQLite file and the presence of its journal file — and prints these same instructions unless
you pass `--force`. It is idempotent: re-running it while `casey-example` already exists is a no-op;
pass `--reset` to delete and reseed only that account's own rows (its user, workspace state, secrets,
proposals, requests, jobs and sessions — nothing belonging to any other account).

Sign in at `http://localhost:8080` (or `POST /api/auth/login`) with:

- Username: `casey-example`
- Password: `fictional-example-password`

This account is fictional test data invented for development and demos, in the same spirit as
`docs/ios-api-examples/*.json` above. Never present it, or its goals, reports and coaching history,
as customer proof.
