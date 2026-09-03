# Adler — product decisions (grilling log)

Decisions made with Jordan. Date format ISO. Newest at bottom.

## 2026-09-01

**D1. Flexibility with informed defaults.** Users can hold as many goals and daily actions as they want (HabitKit-style freedom). The coach recommends the literature's best practice (start with one action, add the next once the first is automatic) and explains why in one sentence in the UI. User can override anything. Principle: *advise, never gate.*

**D2. Quick add exists; coach is the upgrade path, not the gate.** User can add a habit/action directly (name, days, optional cue) without any conversation. Coach reacts afterwards with a low-pressure offer to help make it stick. Onboarding conversation is offered on first launch and skippable. Data model must accept coach-less actions (no goal, no cue, no baseline); coach must work with sparse data.

## Literature corrections to apply to landing copy and product (from docs/research/coaching-framework.md)

- Barrier set is six, not five: No time / No energy / Forgot / Didn't feel like it / Too hard / Something came up.
- Confidence threshold is < 7 shrink (not 8). Ask "what would make it an 8?"
- "Never miss twice" is a heuristic, not a finding. Do not present as a rule. One miss is harmless (Lally 2010).
- Re-engage after 3+ days silent, not 2. Never "I missed you" (companion framing, Don't #10). Script: "No pressure. The 2-minute version is still here. Or tell me what got in the way and we'll change it." Max two messages per lapse, timed to a fresh-start landmark.
- Shrink rule: ≤ 4 of last 7 done AND barrier in {too hard, no energy, no time}; or confidence < 7. Halve size OR move time, never both.
- Re-cue rule: "forgot" twice in a week. Change anchor or add a physical object. Do NOT add push notifications by default (Wood & Neal: notifications are not a cue; routines are).
- Revisit goal: "didn't feel like it" 3+ times in 14 days.
- Grow: ≥ 80% over 14 days AND automaticity ≥ 4/7 AND confidence ≥ 8 AND user asks. Max ~25% bigger.
- Add second action: ≥ 80% for 4 weeks AND automaticity ≥ 5/7. Most users reach this week 6–10, not week 4.
- No streak counts anywhere. Show "4 of 6 this week."
- WOOP obstacle step in goal formation: "What inside you usually gets in the way? Not your schedule, you."
- Outcome question one sentence only (positive fantasising backfires).
- Affirm effort and strategy, never grade or praise the person. No exclamation marks, no emoji.
- Coach is not a companion: no feelings, does not miss the user.
- Disclose at intake: AI coach, not a therapist, will always point to people who can help.

**D3. One notification per day, at the user's check-in time.** All actions answered on one screen: Yes / Partly / No, and No opens one barrier tap (six options). No cue-time reminders by default; the literature says routines are cues, notifications are not. Occasional one-tap follow-ups (feeling before a skip; weekly automaticity 1–7) keep the daily signal richer than yes/no without becoming a form.

**How the coach learns (agreed framing).** Taps give the *what* (adherence, barriers, patterns, and the outcome of each adjustment over the next seven days). The weekly five-minute review gives the *why* (exceptions, confidence, autonomy). Intake and Talk give context. Every coach adjustment is logged as a hypothesis and checked against the following week; confirmed ones become the user's playbook. Cross-user learning is offline, human-reviewed, never live prompt mutation.

**D4. Audience is 16–40 optimizers who set goals; "grandma test" is a simplicity bar, not a demographic.** Copy, examples and tone target people who already want to improve and usually have too many goals, not too few. Simplicity constraints stay: three screens, one tap a day, no manual.

**D5. Adler opens the weekly review.** User picks day and time at onboarding (default Sunday evening). One notification, five minutes, voice or text. If skipped, Adler posts the week summary and its one proposed change as a card on Today with one tap to accept or "talk about it." The review always happens; the conversation is optional.

**D6. Methodology first; app derived from it.** Everything Adler does traces to a written methodology (`docs/method/adler-method.md`) that synthesises the research: psychology of goal pursuit and habit formation, coaching practice, Atomic Habits and other popular frameworks where they hold up, training and skill-acquisition science for progression, life-design frameworks for goal discovery, and safety. The method is the source of truth; screens, prompts, rules and schema are derived from it, not the other way round.

**D7. Habit goals and project goals are both first-class.** An action is either repeating (days of week) or one-off (a dated next step). Today shows both. Every goal still has a why, a milestone, and at least one action. Project goals decompose into next steps plus, where the literature says it helps, a repeating "work on it" action.

**D8. Methodology created by an internal expert panel of agents, no outside review.** Anchor the Adler Method to published professional standards (ICF Core Competencies and PCC markers, EMCC, NBHWC, UCL Behaviour Change Wheel and BCTTv1, NICE PH49, UCL CBT competences, MINT and the MITI fidelity instrument, AASP CMPC, ACSM progression, NICE digital-health evidence standards, APA App Advisor). A lead methodologist agent drafts from all research; a panel of expert-persona agents (ICF coach, NBHWC coach, health psychologist/behaviour scientist, clinical psychologist for safety, MI trainer, sports and performance scientist, research skeptic) reviews against their standards in parallel; the lead synthesises; the panel signs off; output is `docs/method/adler-method.md` plus an eval rubric pack built from the fidelity instruments. Each phase cites the competency it satisfies and the evidence it rests on. Jordan decided against paid accredited human review before launch; revisit if regulation or app-store policy demands it.

**D9. One coach voice.** Direct, plain, warm, short. No exclamation marks, no cheerleading, no personas, no "tough love" toggle. Users can ask for fewer words or more explanation; that changes verbosity, not stance. Rationale: confrontational style predicts worse outcomes; personas drift into companion framing.

**D10. Talk is multimodal: text and live voice, both in v1.** Live voice is a real-time speech-to-speech session (OpenAI Realtime, Gemini Live, or similar), not dictation-to-text. Provider to be decided by a spike and eval; constraint is that the coaching brain (method, rules, memory) stays in one place and the voice provider is a thin audio layer, and that every voice session yields a text transcript for evals. Jordan overrode the text-first recommendation.

**D11. Life domains use Sahil Bloom's five types of wealth: Time, Social, Mental, Physical, Financial.** Chosen over the research recommendation (four Bullseye-derived tags) because it resonates with the audience. Used as user-facing vocabulary for tagging goals, showing balance, and detecting cross-domain conflict. Not cited as evidence; the "Wealth Score" quiz is not used; no scores or wheel charts.

**D12. Flat subscription, no free tier.** One price (roughly ten a month or sixty a year, founding price for early access), free trial, price printed on the landing page before launch, cancel in one tap. No freemium tracker, no one-time purchase (model costs), no per-goal paywall.

**Research mandate (2026-09-01).** Keep going deep on behavioural science and coaching: every relevant perspective and meta-analysis, so the method is the best available and wise, and so the coach can robustly improve and guide the user over time. Deep-dive files live in `docs/research/deep/`.

**D13. Voice architecture v1: brain in the loop.** On-device speech recognition (iOS 26 SpeechAnalyzer), every turn routed through the same ADK coach as text, streamed TTS starting on the first sentence, barge-in supported. One brain, a transcript for every session, safety guard on voice by construction. One-week spike per docs/research/voice-realtime.md §6 compares against an OpenAI Realtime rig; switch only if (b) fails P95 ≤ 2.5s or naturalness ≥ 3/5 and the Realtime rig keeps brain-tool coverage ≥ 95%. Gemini Live in ADK deferred until a newer Live model with text modality and verified callbacks is supported.

**D14. One database: Neon Postgres for everything.** ADK sessions via `DatabaseSessionService` (asyncpg), our relational schema (users, goals, actions, checkins, barriers, interventions, memories, coach_sessions, device_tokens), and a `memories` table filled by a small extraction agent after each session. No mem0, no Vertex Memory Bank, no vector retrieval in v1 (embedding column nullable for later). Rationale: structured state is most of what the coach reasons over; one store means one delete, one eval surface, one rule engine. Memory Bank remains a one-line swap behind ADK's MemoryService interface if extraction quality becomes a problem.

**D15. Sign-in: lowest friction, any provider.** Firebase Auth with Sign in with Apple, Google, and email (magic link) enabled. Apple sign-in is mandatory on iOS once Google is offered. Verified ID tokens at the API edge; `firebase_uid` on the users table; account linking so one person with Apple and Google ends up as one user. Onboarding conversation can start before sign-in is forced only if we accept losing that data; default is sign in first, one tap.

**D16. Monorepo.** `docs/` (method, research, decisions), `landing/` (Astro site), `ios/` (SwiftUI app), `backend/` (Python: ADK agents, FastAPI, migrations, `backend/evals/` rubric pack and transcript evals). Method, prompts, schema and screens change in one PR.

**D17. Age floor: 21 and over.** Overrides D4's 16–40. No minor mode in v1; accounts under 21 are refused at first contact with no data kept. Rationale: minor safeguards (SB 243, NICE ESF Standard 9) were unfirable without age capture and a defined minor mode; Jordan chose 21 outright.

**D18. Relationship (dyadic) goals are off in v1.** They return only when an intimate-partner-violence and abuse research file exists, the abuse route in the method has been built on it, and both pass the crisis screen.

**D19. Minimum iOS version: 26.** Native Liquid Glass, SpeechAnalyzer for on-device speech, single code path. No fallback visual language.
