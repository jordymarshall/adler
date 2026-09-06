# Deploy Adler with a Vercel frontend

The prepared setup is Vercel for the landing page/app assets, plus one persistent Node server for the API, SQLite, and scheduled coach. Vercel proxies the app's `/api/*` requests to that server. A frontend deploy alone does not provide working accounts, storage, AI, or texting.

Local SQLite files cannot be the persistent database of Vercel Functions. Vercel supports external API rewrites, so the current backend can stay intact on a host with a persistent disk. [SQLite on Vercel](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel), [external rewrites](https://vercel.com/docs/routing/rewrites)

## 1. Host the persistent server

Use a Node/Docker host with an always-running instance and a persistent disk. For example, Render supports persistent disks on paid services. Its free/ephemeral filesystem is insufficient for this app. Keep one instance; the API and queue worker run in the same process. [Render disks](https://render.com/docs/disks)

Deploy the version of this repository containing `server/main.ts` and `vercel.ts`. The repository includes a Dockerfile and Docker Compose configuration; a native Node service can also use:

| Setting | Value |
| --- | --- |
| Node | 24 |
| Build | `npm ci && npm run build` |
| Start | `npm start` |
| Persistent disk mount | `/data` (Docker) or another host-supported absolute path |
| Health check | `/api/health` |
| Instances | 1 |

Supply these backend environment variables:

```dotenv
NODE_ENV=production
PORT=8080
ADLER_DATA_DIR=/data
PUBLIC_URL=https://your-backend.example.com
FRONTEND_ORIGIN=https://your-adler-app.vercel.app
ADLER_REGISTRATION=open
ADLER_ALLOW_SERVER_KEYS=false
```

Use the actual mount path for `ADLER_DATA_DIR`. Ensure the process can write to it. `PUBLIC_URL` must match the backend's public HTTPS domain exactly; the server checks Host and uses this URL to verify Twilio callbacks. Reverse proxies must preserve that Host. `FRONTEND_ORIGIN` is the exact stable Vercel/custom-domain origin used by the browser; add it once the frontend domain is known, then restart the backend.

Leave server-funded AI disabled for a public deployment. Users can add their own keys in Settings. For a private deployment where you intend to pay for every permitted user's AI calls, add a provider key and explicitly set `ADLER_ALLOW_SERVER_KEYS=true`.

Confirm `https://your-backend.example.com/api/health` returns `{"ok":true}`. Create a test account, save a goal, restart the backend, and verify the account and goal remain. A process that starts successfully without a durable disk is not a successful storage deployment.

## 2. Connect and deploy Vercel

The root `vercel.ts` uses the Vite preset, builds `dist`, proxies `/api/*` and `/mcp`, and supports direct app URLs with an SPA fallback. It refuses to deploy without an explicit HTTPS backend origin. It does not upload or run the SQLite server as a Vercel Function.

1. Sign in with `npx vercel login`, or authenticate the CLI with your existing Vercel account setup.
2. Make the backend URL available to the local configuration compiler:

   ```sh
   export ADLER_BACKEND_URL='https://your-backend.example.com'
   npx vercel link
   ```

3. Add **ADLER_BACKEND_URL** with that same value in Vercel project settings for **Production**, or run `npx vercel env add ADLER_BACKEND_URL production`. Changing this build-time value requires a redeploy. [Vercel programmatic configuration](https://vercel.com/docs/project-configuration/vercel-ts)
4. Set the project to Node 24 in Vercel settings and deploy:

   ```sh
   npx vercel deploy --prod
   ```

5. Set the backend's `FRONTEND_ORIGIN` to the resulting stable production domain, restart it, then verify signup/sign-in and saving from that domain.

No Linq, Twilio, model, calendar, or database secret belongs in the Vercel frontend environment. `.vercelignore` excludes local credentials, data, and workspace attachments from CLI uploads. The `.vercel` project-link directory is also Git-ignored.

Preview environments need an explicitly allowed frontend origin and preferably a separate backend/data environment. This version accepts one configured frontend origin, not arbitrary `*.vercel.app` sites. Use one canonical production hostname.

## 3. Connect external services

- Follow [Linq setup](imessage-setup.md) for native iMessage with RCS/SMS fallback. [Twilio setup](twilio-setup.md) remains available for SMS-only deployments. Messaging webhooks go directly to the backend’s `PUBLIC_URL`.
- In the app, **Settings → AI provider → Save & test connection** verifies the selected API account and model. Coaching is available automatically with a configured provider.
- Google sign-in is deferred. If you later connect **Google Calendar**, register `https://your-adler-app.vercel.app/api/calendar/google/callback` and set the backend's `GOOGLE_REDIRECT_URI` to that exact frontend URL. The callback must pass through the same frontend domain that holds the login cookie.
- MCP clients can use the backend's `/mcp` endpoint with a personal token from Connections. Its `coach_message` tool invokes the same Adler service as app chat and texting.

## 4. Verify the hosted app

Check signup, reload, sign-out, and isolation between two accounts through the actual Vercel domain. Confirm that the backend receives its expected Host and the allowed frontend Origin. API responses must be uncached; the configuration opts out of rewrite caching and the backend returns `private, no-store`. [Vercel rewrite caching](https://vercel.com/changelog/vercels-cdn-now-respects-cache-control-headers-from-external-origins-by-default)

Open two tabs and save a change. The second tab should update without a reload. Verify SSE updates continue beyond two minutes and reconnect after a connection drop. The backend sends an initial event and 25-second heartbeats; Vercel's documented origin limit applies to idle gaps between response bytes. [Vercel origin timeout](https://vercel.com/changelog/cdn-origin-timeout-increased-to-two-minutes)

Test one real AI proposal and approval. After the messaging provider is configured, link your own phone and test a message, approval, opt-out, and scheduled check-in. These external-account checks cannot be replaced by fixture tests.

## Data operations

The persistent directory contains `adler.sqlite` and `encryption.key`. Account-owned database records include goals, conversations, program versions, memory, reviews, phone links, proposals, sessions, calendar bookings, audit events, and queued jobs/deliveries. Passwords use salted scrypt. Personal API keys and calendar credentials use AES-256-GCM encryption; goal and conversation records are ordinary database data protected by account access and the host's disk controls, not individually encrypted by Adler.

Arrange a consistent database backup and a protected copy of the encryption key before inviting people to rely on the app. A simple initial procedure is to stop the server, copy the entire data directory to separate protected storage, restart, and test restoring that copy into a separate instance. Automatic off-host backups and restore scheduling are not configured by this repository.

This version has no email verification/password recovery, managed identity provider, automatic full-account deletion/retention policy, subscription billing, or multi-instance database/worker coordination. Those are remaining operations/product decisions. A managed Postgres and hosted-job deployment would require a database/queue migration; it is not achieved by changing an environment variable.

## Deployment status

The production Node server has been tested locally. Vercel configuration and backend origin/session checks are prepared. A live Vercel + backend deployment still requires account access and a real persistent backend URL; no hosted app URL has been verified yet.
