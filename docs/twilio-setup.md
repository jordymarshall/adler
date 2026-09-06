# Connect Adler to Twilio SMS

For native blue-bubble iMessage with SMS fallback, follow [Linq setup](imessage-setup.md). This guide is the optional SMS-only configuration. Set `MESSAGING_PROVIDER=twilio` on the backend when using it.

You set up one Twilio account and sender number for Adler. Your users do not need Twilio accounts: they link their own phone in Adler. Twilio bills the app owner's account for the number and messaging; AI requests use each user's selected API account unless you explicitly enable server-funded AI.

## 1. Create the account and sender

1. Create an account at [Twilio](https://www.twilio.com/try-twilio), verify your contact details, and upgrade/add payment details for real conversational messaging. The current trial restricts recipients and custom message content, so a working trial demo does not establish that Adler can send its AI replies. [Twilio trial guide](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account)
2. In Console, find **Numbers & senders → Phone Numbers** (legacy Console: **Phone Numbers → Manage → Buy a number**). Select a number with **SMS** capability that can send and receive in the countries you need.
3. Complete the registration for that sender. Toll-free numbers require approval before messaging US/Canadian recipients. US or Canadian local numbers used to message US recipients require A2P 10DLC registration. Follow Twilio's flow for your business/sole proprietor and actual use case. [Toll-free setup](https://www.twilio.com/docs/messaging/compliance/toll-free/console-onboarding), [A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc)

Adler's use case is user-requested goal coaching, progress updates, and optional scheduled check-ins. Users pair by texting a one-time code; scheduled messages have a separate opt-in. Use your real business details, website, privacy/terms URLs, and an accurate description of this flow when registering. Registration approval is handled by Twilio and carriers.

## 2. Configure the Adler backend

In Twilio Console, get the **Account SID** and **Auth Token** for the account that owns your sender. Use the live credentials, not the test credentials. Add these to the persistent backend host's environment settings:

```dotenv
TWILIO_ACCOUNT_SID=AC...your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_NUMBER=+14165550123
PUBLIC_URL=https://your-adler-backend.example.com
```

`TWILIO_NUMBER` is the Twilio sender, not your personal phone. Use international format, including `+` and the country code. `PUBLIC_URL` is the exact HTTPS backend origin, with no path or trailing slash. Restart/redeploy the backend after saving.

Keep the Auth Token in backend environment settings. Do not put it in a `VITE_` variable, frontend code, Git, or chat. A Vercel frontend does not need any Twilio secrets.

## 3. Tell Twilio where incoming texts go

Open your purchased phone number's configuration. Under **Messaging → A message comes in**, select **Webhook**, choose **HTTP POST**, and enter:

```text
https://your-adler-backend.example.com/api/webhooks/twilio/inbound
```

Save. If the number belongs to a Messaging Service, set its inbound handling to defer to the sender's webhook, or configure that same URL on the service. [Twilio webhook setup](https://www.twilio.com/docs/messaging/tutorials/how-to-receive-and-reply/node-js), [Messaging Services setup](https://help.twilio.com/articles/223181308)

Point Twilio directly at the backend, even when the app is on Vercel. Adler verifies the signature against `PUBLIC_URL` and the exact path/query. The backend must be publicly reachable by Twilio and its reverse proxy must preserve the public Host. [Twilio webhook security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

Adler supplies the delivery-status callback on every outbound message automatically:

```text
https://your-adler-backend.example.com/api/webhooks/twilio/status?delivery=...
```

There is no need to create a Twilio Studio flow or add a second cron service. The running Adler worker processes inbound messages and saved schedules.

## 4. Link your phone and connect an AI provider

1. Sign in to Adler. In **Settings → AI provider**, select Gemini, OpenAI, or Anthropic, add an API key with available credits, click **Save & test connection**, and connect your AI provider.
2. Open **Settings → Connections**. Enter your personal mobile number, including the country code, and generate a pairing code.
3. From that exact mobile number, text **LINK followed by the displayed code** to Adler's Twilio number. The code expires after ten minutes and can be used once.
4. For scheduled messages, separately enable the check-in/review checkbox and save your timezone, quiet hours, and review time. The backend must stay running for these jobs to execute.

## 5. Verify the complete flow

Text: “Help me set a goal to publish two essays by December 31. I have 90 minutes a week.” Adler should ask for missing details or propose a goal. Reply `CONFIRM` followed by its proposal code only when the proposal is correct. The goal and SMS conversation should appear in the web app. You can also approve the proposal in the app.

Text `STOP` to stop messages, `START` to resume, and `HELP` for instructions. Check **Connections** for jobs and delivery states, and Twilio's Messaging Logs for the corresponding message SID. A real outbound test sends a text and uses your Twilio/API account balances.

If it does not work:

| What you see | What to check |
| --- | --- |
| Adler says SMS isn't configured | All four backend variables are present and the server was restarted. |
| Twilio webhook gets 403 | Exact `PUBLIC_URL`, webhook URL, Account SID/Auth Token, sender number, and proxy Host preservation. |
| Webhook succeeds but no reply arrives | Sender registration, account balance, trial restrictions, destination permissions, running worker, and delivery errors in Connections/Twilio. |
| Phone links but coaching fails | Saved provider API key, model access, and API credits. |
| Pairing fails | Send from the number entered in Adler, using a fresh code. |
| A scheduled check-in doesn't arrive | Separate schedule opt-in, timezone/quiet hours, goal/action status, and job status. |
| Delivery is “unknown” | Inspect the Twilio message log/callback before retrying; Adler avoids automatically sending a possible duplicate. |

Implementation tests cover signed webhooks, pairing, sync, approval, opt-out, scheduling, and delivery reconciliation. Live SMS has not been tested yet because no Twilio account/sender is configured in this workspace.
