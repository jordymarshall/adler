# Real-time voice for the Talk screen

Researched 2026-09-01 against official docs and pricing pages fetched that day. Extends `agent-engineering.md` §4 (Gemini Live via ADK `run_live`); that section's numbers still hold and are not repeated except where they changed.

Constraints this doc is written against: text chat and speech-to-speech on one screen (onboarding ~10 min, weekly review ~5 min, ad hoc); the coaching brain (ADK agents, rules, Postgres memory) stays in one place and the voice provider is a thin audio layer; every voice session yields a text transcript for evals; the safety guard runs on voice too.

Cost basis used throughout: 5-minute session, 2.5 min user speech, 2.5 min assistant speech, ~15 turns; 10k users × 1 review/week = ~43k sessions/month.

---

## 1. OpenAI Realtime API (Sept 2026)

**Model family.** Changelog to 2026-08-26: `gpt-realtime` (GA Aug 2025) → `gpt-realtime-1.5` (fast non-reasoning) → `gpt-realtime-2` (2026-05-07, "GPT-5-class reasoning", `reasoning.effort` minimal→xhigh) → `gpt-realtime-2.1` and `gpt-realtime-2.1-mini` (2026-07-06; distilled reasoning mini; better alphanumerics, noise and interruption handling; improved caching cut p95 latency ≥25% across the family). Side models: `gpt-realtime-translate` ($0.034/min), `gpt-realtime-whisper` ($0.017/min), `gpt-live-transcribe` (2026-07-28, streaming STT, $0.017/min), `gpt-transcribe` ($0.0045/min, committed-turn STT). `whisper-1` and the `gpt-4o-*-transcribe` family shut down 2027-02-26. The docs and Agents SDK both say "start with `gpt-realtime-2.1`". Nothing newer than 2.1 as of today.

**Pricing (per 1M tokens).** 2.1 / 2: text $4 in ($0.40 cached) / $24 out; audio $32 in ($0.40 cached) / $64 out; image $5. 2.1-mini: text $0.60 ($0.06 cached) / $2.40; audio $10 ($0.30 cached) / $20. Audio tokenises at 1 token/100 ms for user audio (600 tok/min) and 1 token/50 ms for assistant audio (1,200 tok/min), so full-size is ≈ $0.019/min heard and $0.077/min spoken; mini ≈ $0.006 and $0.024. The whole conversation is re-sent each turn; with prompt caching working the re-billed context is at the $0.40 (or $0.30) cached rate, which is what keeps sessions affordable. Context 128k, max output 32k, **60-minute session cap**.

**Transport.** WebRTC "for browser and mobile clients that capture or play audio directly": backend `POST /v1/realtime/client_secrets` → short-lived `ek_…` key → client POSTs SDP to `/v1/realtime/calls` with the ephemeral key → data channel `oai-events` carries JSON events, audio on media tracks. The SDP response's `Location` header holds a `call_id`; the server can attach a **sideband WebSocket** (`wss://api.openai.com/v1/realtime?call_id=…`, standard API key) to the same session to update instructions, inject items, and answer tool calls. This is the documented way to keep tools and business logic server-side while the phone owns the audio path. WebSocket is for servers that already have the audio. SIP: `sip:proj_…@sip.api.openai.com;transport=tls` (EU variant), `realtime.call.incoming` webhook, accept/reject/refer/hangup endpoints; irrelevant for an app but free to add later for a phone check-in. Send `OpenAI-Safety-Identifier` per user.

**Tools.** Declare `tools` in `session.update`; model emits a `function_call` item; you return `conversation.item.create{function_call_output}` and `response.create`. Remote MCP servers can be attached directly (`type: "mcp"`, `server_url`, `require_approval`). Async/non-blocking calls are supported since GA, with tuned placeholder speech while a tool runs. The prompting guide defines per-tool behaviour rules (PROACTIVE / CONFIRMATION FIRST / PREAMBLES, e.g. "I'm checking that now" then call immediately) and recommends `reasoning.effort: "low"` for production agents.

**Turn-taking.** `server_vad` (threshold, `prefix_padding_ms` 300, `silence_duration_ms` 500, `idle_timeout_ms` to auto-prompt) or `semantic_vad` (eagerness low/medium/high/auto, classifier on the words spoken, fewer false interruptions). `interrupt_response` cancels in-flight audio on barge-in; `create_response` auto-responds on speech end. Pending tool calls are cancelled by an interruption.

**Transcripts.** Assistant side is free: `response.output_audio_transcript.delta/done`. User side is off by default; set `audio.input.transcription.model` to one of `gpt-live-transcribe`, `gpt-transcribe`, `gpt-realtime-whisper`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `whisper-1`; delivered as `conversation.item.input_audio_transcription.completed`, billed at that model's rate (≈ $0.04 per 2.5 min on `gpt-live-transcribe`). Both arrive on the sideband, so the server never needs the raw audio.

**Voices.** alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar (marin/cedar recommended); locked once the first audio is produced.

**Latency (Artificial Analysis, mid-2026, time to first audio).** gpt-realtime-2.1 minimal 0.97 s / high 1.21 s; gpt-realtime-2 1.12–1.14 s; gpt-realtime-1.5 0.81 s. Conversational-dynamics score 93–96%.

**Agents SDK.** Python: `RealtimeAgent` + `RealtimeRunner` → `RealtimeSession`; transports are WebSocket and SIP only (no WebRTC); tools, `realtime_handoff`, tool approval, and **output guardrails** that run debounced on accumulated transcript deltas and, on trip, interrupt playback and cancel the response (`guardrail_tripped`). JS: adds browser WebRTC, `RealtimeOutputGuardrail`, and `ToolExecutionConfig` for client- vs server-executed tools. **No official Swift SDK.** Options: community `m1guelpf/swift-realtime-openai` (MIT, WebRTC + WebSocket, ephemeral-key connect, ~435 stars), the WebRTC.framework directly (the data-channel protocol is small), or the Pipecat iOS client, which ships an "OpenAI WebRTC" transport.

---

## 2. Google Gemini Live (Sept 2026)

**Models.** Gemini API: `gemini-3.1-flash-live-preview` (2026-03-26; audio-to-audio; 131k in / 65k out; `thinkingLevel` minimal–high; **synchronous tools only; no affective dialog, no proactive audio**; the model page says it "replaces" the 2.5 preview) and `gemini-2.5-flash-native-audio-preview-12-2025` (affective dialog, proactive audio, `NON_BLOCKING` async tools). The half-cascade models (`gemini-live-2.5-flash-preview`, `gemini-2.0-flash-live-001`) were shut down 2025-12-09 on the Gemini API; native audio is the only dialogue path now. Vertex/Agent Platform: `gemini-live-2.5-flash-native-audio` is **Stable** (2025-12-12, retirement no earlier than 2026-12-12, production SLA, not available in the `global` location); 3.1 Flash Live is on Vertex as preview with no GA date (developer-forum thread, 2026-08-28, unanswered). Adjacent: `gemini-3.5-live-translate-preview` (translation only), `gemini-3.5-transcribe-live` (stable STT, $0.005/min audio + $0.004/min text).

**ADK `run_live`.** The supported-models page lists exactly one live model: 2.5 Flash Live (`gemini-2.5-flash-native-audio-preview-12-2025` / `gemini-live-2.5-flash-native-audio`). Live models are audio-only; the `TEXT` response modality is not supported. RunConfig: `response_modalities`, `input_audio_transcription` / `output_audio_transcription`, `speech_config`, `session_resumption`, `context_window_compression`, `realtime_input_config` (VAD), `proactivity`, `enable_affective_dialog`. Tools run automatically inside the loop; `response_scheduling` (WHEN_IDLE / INTERRUPT / SILENT) and streaming tools (async generators) work on 2.5. Events: `event.input_transcription` / `event.output_transcription` (`.text`, `.finished`), `interrupted`, `turn_complete`, `usage_metadata`. Unverified today: whether model-level callbacks and plugins fire per turn in live mode. The docs are silent; issue google/adk-python#4704 (ADK 1.26.0, March 2026, now closed) showed plugin `before/after_tool_callback` were skipped on the live tool path while agent-level callbacks ran. Treat "safety guard as ADK plugin" as something to verify in the spike, not assume.

**Pricing (Gemini API).** 3.1 Live: text $0.75 / $4.50; audio $3 in (≈ $0.005/min) / $12 out (≈ $0.018/min). 2.5 native audio: text $0.50 / $2; audio $3 / $12. Vertex list prices for the live rows could not be extracted from the pricing page today; assume parity and confirm in the console before committing.

**Session limits.** 15 min audio-only without compression (2 min with video); ~10-minute connection lifetime; `GoAway` with `timeLeft` before disconnect; `SessionResumptionUpdate` handles valid for 2 hours. Onboarding (10 min) therefore needs resumption + compression on day one.

**Turn-taking, transcripts, tools.** Automatic VAD with start/end sensitivity, `prefix_padding_ms`, `silence_duration_ms` (Google recommends ≥ 500 ms end-of-speech silence); manual `activityStart/End` also possible. Interruption discards generation and cancels pending function calls. Both-side transcription is a config flag. Function calling on both models; async only on 2.5.

**Latency.** Artificial Analysis: 2.5 Flash Native Audio 0.63 s to first audio; 3.1 Flash Live 0.96 s (minimal) / 2.99 s (high thinking). Conversational-dynamics score for 3.1 is 72–74%, well below OpenAI's 93–96%, which matches the "sluggish turn-taking" complaints in third-party writeups.

**iOS client options.** (a) Via our server: iOS ↔ WebSocket on Cloud Run ↔ ADK `run_live` ↔ Live API (§4 of the earlier doc). (b) Device-direct: Firebase AI Logic's Swift SDK supports the Live API on both backends (App Check enforcement mandatory from 2026-11-02; its tools docs are "coming soon"), or a raw WebSocket with an ephemeral token (v1beta, `expireTime` 30 min, `newSessionExpireTime` 1 min, `uses: 1`, `liveConnectConstraints` to pin model/modality). Device-direct means function calls land on the phone, and there is no OpenAI-style sideband for the server to answer them; that is the reason (b) is incompatible with "brain on the server" unless the app proxies every tool call.

---

## 3. Anthropic

Claude has **no speech-to-speech, STT or TTS API**. Voice mode is a consumer beta in the Claude apps (iOS/Android/desktop/web); on 2026-07-23 it gained Opus/Sonnet/Haiku selection and app integrations, and Anthropic has not disclosed the voice stack. Claude Code's `/voice` (March 2026) is dictation only, streams audio to Anthropic's servers for transcription, and only works with Claude.ai auth, not API keys. Coverage of that launch quoted Anthropic saying it is not launching an STT product.

Recommended cascade if the brain is Claude: STT (on-device Apple SpeechAnalyzer, or `gpt-live-transcribe` / Deepgram Nova-3 / `gemini-3.5-transcribe-live` server-side) → Claude Sonnet 5 via streaming Messages with effort low and no extended thinking → streaming TTS. Measured Sonnet 5 (low) TTFT is 1.68 s on a 10k-token prompt (Artificial Analysis); a coaching system prompt plus memory will be in that range, so budget ≈ 2.3–3 s mic-to-first-audio versus ≈ 1–1.5 s with a Flash-class model in the same pipeline.

---

## 4. Cascade alternatives and orchestration

**On-device STT: Apple SpeechAnalyzer (iOS 26+).** `SpeechTranscriber` is fully on-device, model assets live in system storage (no app-size or memory hit), volatile results arrive "almost as soon as they're spoken" then finalise; `DictationTranscriber` fallback; `SpeechDetector` for VAD. Argmax measured WER 14.0% on earnings22 and 70× real-time on an M4 Mac mini (between Whisper base.en and small.en). Ten languages at launch. Known sharp edge: locale identifier mismatch (`en_US` vs `en-US`) breaks `installed(locale:)`; call `downloadIfNeeded()` directly and use `SpeechTranscriber.supportedLocale(equivalentTo:)`. $0 per minute, and audio never leaves the phone.

**TTS (first-audio latency, price).** OpenAI `gpt-4o-mini-tts` $0.60/1M text in, $12/1M audio out (≈ $0.015/min). ElevenLabs Flash v2.5 ~75 ms model latency, $0.05/1k chars at the Business tier (v3 Conversational ~280 ms; ElevenLabs Agents $0.08/min). Cartesia Sonic 3.6 sub-90 ms vendor claim (third-party measured 166–190 ms end-to-end), sold as credits (Scale $299 ≈ 10,667 min ≈ $0.028/min), voice-agent platform $0.06/min. Deepgram Aura-2 $0.030/1k chars on the pricing page; its TTS product page now leads with "Flux TTS" at "as low as 80 ms" and $0.045/1k chars. Gemini 2.5 Flash TTS $0.50/1M text in, $10/1M audio out. Apple `AVSpeechSynthesizer` is free and on-device but audibly synthetic. 2.5 min of speech ≈ 2,100 characters, so TTS is $0.04–0.11 per session on any cloud option.

**Turn detection.** Pipecat's Smart Turn v3 (open weights, Whisper-tiny-based, ~8M params int8, 12 ms CPU inference) detects end-of-turn from the waveform, not the transcript, and beats fixed silence timers; it is ONNX, so it can run server-side or, with onnxruntime, on the phone.

**Orchestration frameworks.** Pipecat (Python, BSD-2; Daily/SmallWebRTC/WebSocket transports; iOS SDK `PipecatClientIOS`; speech-to-speech services incl. OpenAI Realtime and Gemini Live; Pipecat Cloud hosting). LiveKit Agents (Python/Node; realtime plugins for OpenAI Realtime, Gemini Live, Nova Sonic, Grok, others; custom turn detector; Swift client SDK; Cloud $0.01/agent-minute after included minutes plus WebRTC participant minutes ≈ $0.0005/min). LiveKit's own docs note that with speech-to-speech models "user input transcriptions can be considerably delayed and often arrive after the agent's response." Vapi ($0.05/min platform + pass-through model costs, iOS SDK, custom LLM via an OpenAI-compatible `/chat/completions` endpoint on your server; third-party reports of $0.20–0.33/min all-in). **Value for us:** these frameworks earn their keep when you need telephony, multi-provider swapping, or a media server. We have one iOS client and one brain. Pipecat or LiveKit would add a second long-lived process and a second place where prompts live; Vapi would put our agent behind someone else's turn-taking. None removes the hard part (getting ADK output into audio with low latency). Skip for v1; revisit LiveKit if we add phone or web clients.

**Measured latency budgets (mic to first audio, third-party mid-2026 figures plus Artificial Analysis).**

| Path | Components | Typical |
|---|---|---|
| Native S2S, OpenAI 2.1 | model TTFA 0.97–1.21 s | ~1.0–1.3 s |
| Native S2S, Gemini 2.5 native audio / 3.1 minimal | 0.63 s / 0.96 s | ~0.7–1.0 s |
| Cascade, Flash-class LLM | STT final 150–300 ms + end-of-turn 200 ms + LLM TTFT 200–300 ms + TTS 75–200 ms + network 50–200 ms | ~0.8–1.2 s |
| Cascade, Sonnet 5 low | same but LLM TTFT ~1.7 s on a 10k prompt | ~2.3–3 s |
| Brain-as-tool (S2S + ADK tool) | S2S TTFA + preamble, then ADK turn 1–3 s inside the tool | 1 s to first words, 2–4 s to substantive answer |

Human baseline is ~200 ms; industry rule of thumb is < 500 ms feels human, > 1.5 s feels broken for support calls. Coaching is more forgiving: a reflective pause of 1–2 s with a visible "thinking" state reads as attentive, not broken.

---

## 5. Architecture patterns: voice as thin layer, brain in ADK

### (a) Brain-as-tool: native S2S model calls our backend

iOS opens WebRTC to OpenAI with an ephemeral key; the backend attaches the sideband WebSocket and owns `session.update`, tool answers, and transcripts. The session prompt is a thin persona plus one PROACTIVE tool, `coach(user_turn)`, which runs the ADK agent (text mode, same tools/memory/rules as chat) and returns the next utterance; the voice model reads it with its own prosody. Rules and memory live in ADK. Safety: the guard runs inside `coach` on every substantive turn, plus a transcript-level output guardrail on the sideband (Agents SDK pattern: debounced, cancels the response on trip). Transcripts: assistant transcript is free; user transcript via `gpt-live-transcribe` (+$0.04/session). Failure modes: the voice model answers without calling the tool (small talk, "just one quick tip"), so the method drifts unless the prompt and per-tool rules are tight and evals check tool-call coverage; two system prompts to keep in sync; tool latency mid-speech is mitigated by preambles and async calls but a 3 s ADK turn will produce audible filler; barge-in cancels the pending tool and the ADK call must be idempotent. Cost per 5-min session: ≈ $0.30 on 2.1 (audio $0.24 + cached context ~$0.03 + transcription $0.04) or ≈ $0.10–0.12 on 2.1-mini, plus the ADK text turns (~$0.03–0.05 on Gemini 3.7 Flash with caching, more on Sonnet 5). Monthly at 43k sessions: ≈ $15k (2.1) / ≈ $6.5k (mini). Latency: ~1 s to first words.

### (b) Brain-in-the-loop: voice as pure STT/TTS

Every turn is the ADK agent, identical to the chat path. iOS runs SpeechAnalyzer, sends the finalised turn over HTTPS/SSE, streams the reply to a TTS, and plays it; `SpeechDetector` stops playback on barge-in and the app sends a "user interrupted at token N" marker so the transcript reflects what was heard. Rules, memory, safety guard, and transcript are enforced by construction because there is only one path. OpenAI/Gemini models are not involved in audio at all unless used for TTS. Failure modes: turn-taking is ours to build (silence timer vs Smart Turn), and the model cannot hear tone; latency is the highest of the three when Sonnet 5 is the brain. Cost: STT $0; LLM $0.05–0.14; TTS $0.04–0.11; ≈ $0.10–0.25 per session, ≈ $4–11k/month. Latency 0.8–1.2 s (Flash) or 2.3–3 s (Sonnet 5), with first sentence streamed to TTS as soon as it completes.

### (c) Gemini Live inside ADK: brain and voice in one

The §4 design from the earlier doc. One agent, `run_live`, audio relayed through Cloud Run. Rules come from the live agent's instructions and state; memory via ADK session and tools; transcripts from `input_transcription`/`output_transcription` events. Safety: tool-level callbacks run; per-turn model callbacks and plugins are unverified in live mode (#4704), so the reliable guard is a server-side transcript watcher on the relay that can drop outbound audio frames and inject a redirect. Failure modes: the brain is Flash-class 2.5 Live, not the model that passes the text rubric, so voice and chat will coach differently; no TEXT modality, so chat and voice cannot share a single runner call; 10-minute connection and 15-minute session ceilings sit exactly on the onboarding length; 3.1 Live is not in ADK and lacks async tools and affective dialog; conversational-dynamics scores are the weakest of the options. Cost ≈ $0.06/session, ≈ $2.7k/month. Latency ~0.7–1 s.

---

## 6. Recommendation

**v1: pattern (b), brain-in-the-loop, with on-device STT.** It is the only pattern where "brain in one place", "transcript for every session", and "safety guard on voice" are properties of the architecture rather than of prompt discipline. It needs no long-lived audio socket on Cloud Run, lets the rubric eval pick the brain model independently of voice, and its worst case (Sonnet 5, ~2.5 s) is acceptable for reflective coaching if the UI shows a listening/thinking state and TTS starts on the first sentence. This revises the §4 pick: since that was written, ADK still supports only 2.5 Flash Live, the callback/plugin gap surfaced, and independent measurements put Gemini Live's turn-taking well behind OpenAI's. Gemini-in-ADK stays the cheapest option and the fallback if (b) fails the feel test.

**Spike (one week).**
1. Day 1–2: iOS cascade: SpeechAnalyzer volatile+final results, 600 ms silence end-of-turn, SSE to the existing ADK text endpoint, `gpt-4o-mini-tts` streamed into `AVAudioPlayerNode`, barge-in via `SpeechDetector`. Verify: 5-minute review completes end to end with a stored transcript.
2. Day 3: instrument mic-to-first-audio P50/P95 on device for Gemini 3.7 Flash vs Sonnet 5 low, 20 turns each. Verify: numbers logged, not felt.
3. Day 4: pattern (a) comparison rig: `gpt-realtime-2.1-mini` via WebRTC (community Swift SDK), sideband WS on the backend, `coach` tool → same ADK agent, `gpt-live-transcribe` on. Verify: transcript stored; count turns where the model spoke substantively without calling `coach`.
4. Day 5: five testers, one review each on both rigs; rubric-score the transcripts with the existing eval; rate naturalness 1–5.
5. Decide: ship (b) if P95 ≤ 2.5 s and naturalness ≥ 3/5; switch to (a) on mini only if (b) fails and (a) keeps `coach` coverage ≥ 95% of substantive turns; otherwise fall back to (c).

**Defer.** Gemini Live in ADK until 3.1 Live (or newer) is in ADK's supported list with a TEXT modality and verified callbacks; ElevenLabs/Cartesia voices until voice quality is a measured complaint; SIP/phone; affective dialog and proactive audio; Pipecat/LiveKit unless a second client platform appears; any device-direct Gemini path (no server sideband).

---

## Sources

OpenAI
- https://developers.openai.com/api/docs/guides/realtime
- https://developers.openai.com/api/docs/pricing
- https://developers.openai.com/api/docs/models/gpt-realtime-2.1
- https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini
- https://developers.openai.com/api/docs/models/gpt-realtime-2
- https://developers.openai.com/api/docs/guides/realtime-webrtc
- https://developers.openai.com/api/docs/guides/realtime-server-controls
- https://developers.openai.com/api/docs/guides/realtime-sip
- https://developers.openai.com/api/docs/guides/realtime-vad
- https://developers.openai.com/api/docs/guides/realtime-conversations
- https://developers.openai.com/api/docs/guides/realtime-transcription
- https://developers.openai.com/api/docs/guides/realtime-mcp
- https://developers.openai.com/api/docs/guides/realtime-models-prompting
- https://developers.openai.com/api/docs/api-reference/realtime-client-events/session/update
- https://developers.openai.com/api/docs/changelog
- https://developers.openai.com/blog/realtime-api
- https://openai.github.io/openai-agents-python/realtime/guide/
- https://openai.github.io/openai-agents-js/guides/voice-agents/
- https://community.openai.com/t/new-realtime-models-on-the-api-gpt-realtime-2-1-and-gpt-realtime-2-1-mini/1385896
- https://community.openai.com/t/new-realtime-voice-models-in-the-api/1380471
- https://github.com/m1guelpf/swift-realtime-openai (community SDK)

Google
- https://ai.google.dev/gemini-api/docs/live
- https://ai.google.dev/gemini-api/docs/live-api/capabilities
- https://ai.google.dev/gemini-api/docs/live-session
- https://ai.google.dev/gemini-api/docs/ephemeral-tokens
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-live-preview
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/changelog
- https://ai.google.dev/gemini-api/docs/deprecations
- https://firebase.google.com/docs/ai-logic/live-api
- https://firebase.google.com/docs/ai-logic/models
- https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-flash-live/
- https://adk.dev/live/
- https://adk.dev/live/models/
- https://adk.dev/live/events/
- https://adk.dev/live/tools/
- https://github.com/google/adk-python/issues/4704
- https://discuss.ai.google.dev/t/ga-production-release-timeline-for-gemini-3-1-flash-live-preview-on-vertex-ai/179897

Anthropic
- https://support.claude.com/en/articles/11101966-use-voice-mode
- https://code.claude.com/docs/en/voice-dictation
- https://techcrunch.com/2026/07/23/anthropic-updates-claude-voice-mode-with-more-capable-models/
- https://artificialanalysis.ai/models/claude-sonnet-5-low/providers

Cascade components and frameworks
- https://developer.apple.com/videos/play/wwdc2025/277/
- https://developer.apple.com/forums/thread/790108
- https://www.argmaxinc.com/blog/apple-and-argmax
- https://elevenlabs.io/pricing/api
- https://elevenlabs.io/docs/overview/models
- https://cartesia.ai/pricing
- https://docs.cartesia.ai/build-with-cartesia/models/tts
- https://deepgram.com/pricing
- https://deepgram.com/product/text-to-speech
- https://docs.pipecat.ai/getting-started/introduction
- https://docs.pipecat.ai/client/ios/introduction
- https://www.daily.co/blog/announcing-smart-turn-v3-with-cpu-inference-in-just-12ms/
- https://docs.livekit.io/agents/
- https://docs.livekit.io/agents/models/realtime/
- https://livekit.com/pricing
- https://github.com/livekit/client-sdk-swift
- https://vapi.ai/pricing
- https://docs.vapi.ai/customization/custom-llm/using-your-server
- https://docs.vapi.ai/sdks

Latency measurements (third party)
- https://artificialanalysis.ai/speech-to-speech
- https://softcery.com/lab/ai-voice-agents-real-time-vs-turn-based-tts-stt-architecture
- https://www.reactify-solutions.com/articles/voice-ai-agents-production-2026
