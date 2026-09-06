# Connect native iMessage and SMS through Linq

Adler uses Linq as a messaging transport. The same server-owned coach, model selection, memory, program, commands, and approval rules serve web chat, MCP, iMessage, and SMS. Linq does not run a separate Adler agent.

For the requested blue-bubble experience, use **Linq**, with **RCS/SMS fallback** for recipients without iMessage. Omit `preferred_service` when sending; forcing `iMessage` would disable fallback. Adler's adapter already leaves this unset. SMS has no native tapbacks or delivery/read receipts. [Linq protocol selection](https://docs.linqapp.com/channel/imessage/guides/messaging/protocol-selection/)

## 1. Get a sandbox account and number

Start at [Linq's free sandbox signup](https://dashboard.linqapp.com/sandbox-signup), verify your email, and provision/use its test number. Linq advertises a sandbox without a credit card; production access uses a commercial agreement and pricing quote. Confirm number availability and the recipient/country limits in your account before inviting users. [Linq pricing and sandbox](https://linqapp.com/s/pricing)

In the Linq dashboard, generate a V3 API token and find your provisioned phone number. Use the **iMessage / V3** API, not the separate Apple Messages for Business product. The server needs a number that can receive the user's initial pairing text. [Linq authentication](https://docs.linqapp.com/channel/imessage/getting-started/authentication/), [quickstart](https://docs.linqapp.com/channel/imessage/getting-started/quickstart/)

## 2. Configure the persistent Adler backend

```dotenv
MESSAGING_PROVIDER=linq
LINQ_API_KEY=your-v3-api-token
LINQ_NUMBER=+14165550123
PUBLIC_URL=https://your-backend.example.com
```

Use the Linq number for `LINQ_NUMBER`, not your personal phone. Keep credentials in backend environment settings or the local gitignored `.env`. The Vercel frontend needs none of these secrets. A persistent running backend is required; see [deployment instructions](deployment.md).

## 3. Register the webhook

Create a webhook subscription in Linq using `POST https://api.linqapp.com/api/partner/v3/webhook-subscriptions`, authenticated with the V3 bearer token, and this JSON body:

```json
{
  "target_url": "https://your-backend.example.com/api/webhooks/linq?version=2026-02-03",
  "phone_numbers": ["+14165550123"],
  "subscribed_events": [
    "message.received", "message.sent", "message.delivered",
    "message.read", "message.failed", "reaction.added", "reaction.removed"
  ]
}
```

Replace the URL and number with the configured backend and Linq number. Save the response's **signing_secret** as `LINQ_WEBHOOK_SECRET` in the backend environment, then restart/redeploy the backend. Linq returns this secret only once. The adapter requires the pinned `2026-02-03` payload and Standard Webhooks headers; it verifies the raw body signature and rejects timestamps outside five minutes. [Subscription API](https://docs.linqapp.com/channel/imessage/api/resources/webhook_subscriptions/methods/create/), [webhook security](https://docs.linqapp.com/channel/imessage/guides/webhooks/)

Use the backend's direct URL for this webhook even if the app is hosted on Vercel. It must be reachable publicly; the app verifies the webhook instead of requiring a browser sign-in.

## 4. Connect your phone to Adler

1. Sign in to Adler. In **Settings → AI provider**, save/test an API key with available credits, and connect your AI provider.
2. In **Settings → Connections**, enter your personal phone number and generate a pairing code.
3. From that phone, text `LINK` followed by the displayed code to the Linq number. Pairing starts a provider conversation; Adler replies in that same conversation and from that configured line.
4. Enable scheduled check-ins separately, and choose your timezone/quiet hours.

Your users need an Adler account and their ordinary messaging app; they do not need Linq accounts. Changing the configured messaging provider or sender requires pairing again. Twilio can still be used for an SMS-only deployment by setting `MESSAGING_PROVIDER=twilio`; see [Twilio setup](twilio-setup.md).

## 5. Verify the native flow

Send a goal or progress update from an iPhone, check that it actually uses blue-bubble iMessage, and verify the conversation appears in Adler. React to an Adler message with a standard tapback and remove it; the web conversation should reflect both. Adler can also react to a user's iMessage through the shared coaching response or the MCP `react_to_message` tool. Six standard reactions are supported; custom emoji/stickers, attachments, groups, and reaction delivery on RCS are outside this adapter's current scope. [Linq reaction API](https://docs.linqapp.com/channel/imessage/api/resources/messages/methods/add_reaction/)

A reaction is feedback. It never marks work complete, approves a proposal, or reverses a calendar booking. Use `CONFIRM <proposal code>` to approve changes in any text transport. Reactions made in the web app are saved as app feedback; the server cannot send a tapback as the user's personal Apple account.

Test a recipient without iMessage as well. Linq chooses RCS when supported and SMS otherwise. Check the actual provider route; missing iMessage receipts must not trigger an extra Twilio SMS. Adler sends once through Linq with a stable idempotency key, and does not issue its own second fallback message. [Send API](https://docs.linqapp.com/channel/imessage/api/resources/chats/subresources/messages/methods/send/)

The queue persists incoming events before acknowledgement, deduplicates event/message IDs, ignores groups and unpaired senders, and runs model calls afterward. It saves delivery states and reaction updates in Adler. Unknown send outcomes are not automatically retried; inspect the provider before retrying. Linq's message retention is short, so Adler's database and backups remain the conversation record. [Linq FAQ](https://docs.linqapp.com/channel/imessage/guides/resources/faq/)

The implementation is covered by signed webhook, pairing, duplicate delivery, shared-coach, reaction, and SMS approval tests. **No Linq account is connected here yet, and live blue-bubble/reaction/fallback delivery has not been verified.**
