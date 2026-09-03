# Conversational agents and AI coaching: what the trials actually show

Research date: 2026-09-02. Companion to `coaching-framework.md` (**CF**), `humanistic-existential-common-factors.md` (**HE**), `adaptive-interventions.md` (**AI-doc**), `accreditation-frameworks.md` (**AF**), `competitors.md`. Those cover the digital therapeutic alliance (HE §1, AI-doc §7), general app engagement and attrition (AI-doc §5) and the safety statutes and APA/WHO/Moore guidance (CF §5). This file covers the trial evidence for the chatbots themselves: what they move, by how much, for whom, who drops out, and what goes wrong.

Evidence grade: **MA** (meta-analysis / systematic review), **RCT**, **OBS** (observational, panel, real-world), **BENCH** (benchmark or simulation study), **TH** (framework).

---

## 1. The syntheses: the pooled effect is small, and it is on depression

Seven syntheses cover this literature; they agree more than the headlines suggest. All are **MA**.

| Synthesis | Scope | Depression | Anxiety | Wellbeing / affect / stress | Notes |
|---|---|---|---|---|---|
| Abd-Alrazaq 2020, *JMIR* 22:e16021 | 12 studies | weak evidence | conflicting | **wellbeing n.s.**; stress weak | only 2 studies assessed safety |
| He 2023, *JMIR* 25:e43862 | 32 RCTs, N = 6,089 | g = 0.29 (0.20–0.38) | 0.29 (0.21–0.36) | QoL 0.27; stress 0.24; neg. affect 0.28 | **follow-up collapses** (0.16 / 0.08); vs active controls only depression + distress; RoB 13/32 high |
| Li 2023, *npj Digit Med* 6:236 | 35 studies (N = 17,123); 15 RCTs pooled (N = 1,744) | g = 0.64 (0.17–1.12) | 0.65 (−0.46–1.77) **n.s.** | wellbeing 0.32 **n.s.**; distress 0.70 | generative 1.24 vs retrieval 0.52; clinical 1.07 vs **non-clinical 0.11**; I² = 95% |
| Feng 2025, *JMIR* 27:e69639 (ages 12–25) | 15 trials, N = 1,974 | g = 0.61 (0.35–0.86) adj. | 0.06 **n.s.** | wellbeing 0.04, PA 0.01, stress 0.002 — **all n.s.** | subclinical depression 0.74 |
| Sohn 2026, *npj Digit Med* 9:377 | 39 RCTs, N ≈ 7,400 | g = 0.31 (0.17–0.46) | 0.28 (0.05–0.51) | not pooled | clinical 0.64 / subclinical 0.34 / **non-clinical 0.07 (−0.01–0.15)**; 35/39 high RoB; Egger p = .002; **23/39 no safety data** |
| Alamdarloo 2026, *npj Digit Med* 9:650 | 48 RCTs, N = 28,071 | SMD −0.27 (−0.32 to −0.21) | −0.20 | stress −0.26 | I² = 11/3/31%; GRADE moderate; no generative advantage |
| Hang 2026, *npj Digit Med* (CBT + NLP) | 15 RCTs, N = 1,737 | small-to-moderate | **n.s. after pub-bias adj.** | PA and stress **n.s.** | multimodal > single; less psychoeducation and younger age → larger |

Design moderators worth keeping: personalisation (p = .045) and empathic response (p = .008) predicted larger effects, interaction duration too (b = 0.160), and **automatic reminders predicted *smaller* effects** (p = .04) — all He 2023.

**The honest headline for Adler.** The defensible pooled effect is g ≈ 0.3 on depressive symptoms, concentrated in clinical and subclinical samples and decaying by follow-up. In **non-clinical** samples — Adler's users — the point estimate is ≈ 0.07 and indistinguishable from zero, and wellbeing, stress and positive affect are null in every synthesis that separates them. A goal coach for healthy optimisers should make **no mood or wellbeing claim at all**.

---

## 2. Behaviour change: the better-supported use case

- **Singh et al. 2023** (**MA**, *npj Digital Medicine* 6:118; 19 trials, N = 3,567): total physical activity SMD 0.28 (0.16–0.40), daily steps 0.28 (≈ +735/day), MVPA 0.53 (≈ +103 min/week), fruit and vegetables 0.59 (≈ 1 serving/day), sleep duration 0.44 (≈ +45 min), sleep quality 0.50. Weight, BMI and calories unpoolable. 74% of studies rated "weak" (EPHPP).
- A 2025 exercise-specific **MA** (12 studies, N = 2,446; PMC12254675, citation unverified beyond abstract) is sober: physical activity SMD 0.20 (0.04–0.37), **no effect on exercise habit or sedentary behaviour**. Chatbots move the act, not the habit.
- **Mathioudakis et al. 2025** (**RCT**, *JAMA* 334; N = 368, 12 months, pragmatic non-inferiority): an entirely AI-led Diabetes Prevention Program was **non-inferior to a human-coach-led DPP** (composite 31.7% vs 31.9%; risk difference −0.2%, one-sided 95% CI lower bound −8.2%, margin −15%), with **higher referral-to-initiation (93.4% vs 82.7%)**. The strongest behaviour-change evidence an AI coach has.
- **Schimpf, Voigt & Bohné 2026** (**RCT**, arXiv preprint; N = 517 randomised, 323 analysed; employed adults 18–50): a Claude-based career coach ("Leon", 21.9 min, 48.9 messages) beat a no-support control on 2-week goal progress, **d = 0.33 (p = .016)**, but was **no better than a matched structured written questionnaire (d = 0.08)**. Perceived accountability was far higher for the AI (d = 0.68 vs control) and **mediated** the AI-over-questionnaire path (indirect 0.15, 0.04–0.31); self-concordance did not differ. Coaching-bot goal-attainment RCTs (Terblanche 2022, 2024; the 2026 human-vs-AI comparison) are in HE §7.

---

## 3. The named products

| Product | Study | Design, n | Result | Status |
|---|---|---|---|---|
| Woebot | Fitzpatrick, Darcy & Vierhile 2017, *JMIR Ment Health* 4:e19 | RCT, n = 70, 2 wk, ebook control | PHQ-9 d = 0.44; GAD-7 n.s.; 12.1 check-ins | Differential attrition 9% vs 31% |
| Woebot–SUD | Prochaska et al. 2021, *JMIR* 23:e24850 | single-arm, n = 101, 8 wk | cravings OR 0.48 (0.32–0.73) | 50.5% completed post-assessment |
| Woebot | Company exit, July 2025 (STAT) | — | Consumer app closed 30 Jun 2025; ~$124M spent; Breakthrough Device designation never converted | Regulatory, not efficacy, failure |
| Tess | Fulmer et al. 2018, *JMIR Ment Health* 5:e64 | RCT, n = 75, 2–4 wk | PHQ-9 reduction vs ebook control (p = .03, 2-wk arm) | Effect sizes not reported; funded by X2AI |
| Vivibot | Greer et al. 2019, *JMIR mHealth* 7:e15018 | RCT, n = 45, 4 wk, young cancer survivors | anxiety effect ≈ 0.41, **trend only (p = .09)**; depression and affect null | Feasibility trial |
| Wysa | MacNeill, Doucet & Luke 2024, *JMIR Form Res* 8:e50025 | RCT, n = 68, 4 wk, arthritis/diabetes | depression and anxiety down (p < .001) vs no-intervention control | Inactive control; small |
| Wysa | Meinert et al. 2026, *Int J Soc Psychiatry* | RCT, real-world NHS waiting list | 2,161 screened → 76 randomised, 30 lost; **no between-arm difference** | Underpowered; the funnel is the finding |
| Therabot | Heinz et al. 2025, *NEJM AI* 2(4) | RCT, N = 210, 4 wk + 4 wk f/u, waitlist | d = 0.85–0.90 (MDD), 0.79–0.84 (GAD), 0.63–0.82 (CHR-FED) | First fully generative RCT; waitlist; clinician-supervised |

**Therabot is both the reference design and the reference warning.** People at high suicide risk were **screened out** (215 excluded). Engagement was real: 95% used it, mean 260 messages over 24 days, 6.18 hours. Working alliance (WAI-SR) averaged 3.59 against Munder's outpatient norm of 3.8 — **task 3.47 vs 3.40 (at norm), bond 3.71 vs 4.00 and goal 3.59 vs 4.00 (below norm)**. And every response was clinician-reviewed post-transmission: staff intervened **15 times for safety concerns and 13 times to correct inappropriate output** (e.g. medical advice) across ~101 users in four weeks — about one bad response per eight users per month. The trial does not show a generative agent is safe unsupervised; it shows the supervision was load-bearing.

---

## 4. Adherence and dropout, chatbot-specific (extends AI-doc §5)

- **Jabir et al. 2024** (**MA**, *JMIR* 26:e48168; 41 RCTs): pooled attrition **21.84%** (16.74–27.36, I² = 94%); ≤ 8 weeks 18.05%, > 8 weeks 26.59%. Long-term subgroups: **blended (human-supported) 20.41% vs unsupported 33.3% (p = .03)**; **symptom tracking present 16.36% vs absent 33.48% (p = .003)**; embodied agent 8–15% vs no avatar 29–33%. Differential attrition favours controls (log OR 1.28, 1.10–1.48).
- **Yasukawa et al. 2024** (**RCT**, *BMJ Mental Health* 27:e300881; n = 149 employees, subthreshold depression): adding a chatbot to an iCBT programme raised 8-week completion from **19.2% to 34.8%, RR 1.81 (1.02–3.21)**. The chatbot as adherence scaffolding has cleaner evidence than the chatbot as the programme.
- Trial engagement is not product engagement: Therabot's 24 days came with $25 per assessment and a research relationship, against a real-world median 15-day retention of 3.9% (Baumel 2019, AI-doc §5). Meinert 2026 shows the same from the recruitment side (2,161 screened, 76 randomised).
- He 2023 (reminders → smaller effects) and Jabir (tracking → lower attrition) point one way: **a light, user-initiated tracking loop retains; push does not**. Consistent with D3.

---

## 5. Alliance and what actually mediates outcome (extends HE §1)

Therabot gives the first generative-agent WAI-SR profile, and its shape matters: **task at outpatient norms, bond and goal below**. Schimpf 2026 gives the mediator for goal work — **perceived accountability**, not bond, not self-concordance. Terblanche 2024 (HE §1) gives the caution: stronger alliance, no difference in goal attainment. An AI can honestly buy task agreement and accountability; it cannot buy, and should not be optimised toward, bond.

---

## 6. Risks with evidence behind them

- **Dependency. Fang et al. 2025** (**RCT**, MIT Media Lab + OpenAI; n = 981, 4 weeks, > 300,000 messages; 3 modalities × 3 conversation types): **no effect of assigned condition** on loneliness, socialisation, emotional dependence or problematic use. What predicted harm was **voluntary daily duration**: loneliness β = 0.02 (p = .027), socialisation β = −0.05 (p = .002), emotional dependence β = 0.06 (p < .001), problematic use β = 0.02 (p = .017). Voice raised time-on-app and time-on-app **mediated** dependence; **personal-topic conversations produced lower dependence than open-ended ones**. Person-level risks: perceiving the AI as a friend (less real socialisation, more dependence), high trust (dependence b = 0.19), perceiving it as conscious, prior companion-bot use, low self-esteem, attachment anxiety. Directionality is unsettled, but baseline loneliness did not predict later usage (ρ ≈ 0.1).
- **Sycophancy. Cheng, Lee, Khadpe, Yu, Han & Jurafsky 2026** (*Science*, 26 Mar 2026; 11 models; three preregistered experiments, **N = 2,405**): AI affirmed users' actions **49% more often than humans did**, including where the query involved deception, illegality or relational harm. A **single** interaction reduced willingness to take responsibility and repair conflict and increased conviction of being right — while sycophantic models were rated higher quality, trusted more and reused more. The harmful feature is the engagement feature.
- **Crisis handling. McBain et al. 2025** (**BENCH**, *Psychiatric Services* 76:944; 30 expert-rated queries × 3 chatbots × 100 repetitions = 9,000 responses): all three handled the extremes correctly but **could not discriminate intermediate risk** — odds of a direct response for low, medium and high risk did not differ from very-low risk.
- **Iatrogenesis in a goal-adjacent population. Hennemann et al. 2026** (**RCT**, *Digital Health* 12; n = 62 students, three sessions, GPT-4 vs a human chat partner, target = procrastination): no group × time effect (p = .117), common factors did not mediate, and **43.1% reported unwanted negative effects — in both arms**. The closest study to Adler's use case: null, with a high harm-report rate.
- **How to measure it. Morrin et al. 2026** (**TH**, *JMIR Ment Health* 13:e91454): harm accumulates as a **trajectory** (compulsive use, sleep loss, withdrawal, narrowing), not as one bad message, so end-point benchmarks miss it; they ask for turn-by-turn scoring of validation and contradiction-handling plus proximal human outcomes. **Bentley et al. 2026** (**BENCH**, *JMIR AI* 5:e92817) validated **VERA-MH**, an open-source automated suicide-safety eval: clinician inter-rater reliability 0.77, LLM judge vs clinician consensus **0.81**, stable across judge models.
- CF §5 covers Moore et al. 2025 (stigma, delusion confirmation), the APA 2025 advisory and the statutes; not repeated here.

---

## 7. Human + AI hybrid

- **Karyotaki et al. 2021** (**MA**, IPD network, *JAMA Psychiatry* 78:361; 39 studies, 8,107 records): guided iCBT beat unguided by **0.8 PHQ-9 points** (−1.4 to −0.2), but only above baseline PHQ-9 9; **at subthreshold severity (5–9) they were equivalent**, and the gap vanished by 6 months. For a non-clinical audience a human is not the missing ingredient.
- **Jabir 2024**: blended designs cut long-term attrition roughly in half (20.4% vs 33.3%). Human support buys retention more reliably than effect.
- **Habicht et al. 2024** (**OBS**, *Nature Medicine* 30:595; 129,400 NHS patients): an AI self-referral chatbot raised referrals 15% vs 6% in control services, largest gains in non-binary (+179%) and ethnic-minority (+29%) users; feedback analysis (42,332 responses) credited the tool's **human-free** nature. The AI's edge is access and initiation — matching Mathioudakis's 93.4% vs 82.7% initiation gap.
- **Huang et al. 2025** (*J Technol Behav Sci* 10:749; n = 87): LLM coaching messages were rated less helpful than human ones in round 1 and **equal after revision** (82% ≥ 3/5), 50% misidentified as human, but criticised as formulaic and "too data-focused". **Loughnane et al. 2025** (**MA**, *Front Digit Health* 7:1536416; 35 studies) finds human, AI and hybrid coaching all feasible and **no demonstrated hybrid superiority**.

---

## 8. What regulators took from this

The Federal Register notice for the FDA **Digital Health Advisory Committee** meeting of **6 November 2025** (doc. 2025-17651) frames generative AI mental-health devices as posing "novel risks" and asked the committee for **premarket evidence and postmarket monitoring** considerations — not for a product decision. Nothing is authorised. **Woebot's July 2025 exit** is the consequence: the most clinically evidenced product in the category spent ~$124M and closed its consumer app because an LLM-based version had no authorisation pathway (STAT, 2 July 2025). Statutes and professional guidance are in CF §5 and AF. The research gaps regulators name are measurable: 59% of trials with no safety monitoring (Sohn 2026), waitlist controls, self-report outcomes, 2–8 week horizons, effect decay at follow-up.

---

## Implications for Adler

**Positioning and claims**

1. **Claim behaviour, never mood.** The evidence supports goal progress, activity, diet and sleep (SMD 0.2–0.6) and is null for wellbeing, stress and affect in non-clinical young people (Feng 2025; Sohn 2026 g = 0.07). Copy must not imply mood, anxiety or "mental health" benefit — which also keeps Adler outside the Illinois/Nevada/Utah definitions (CF §5).
2. **The conversation is not the active ingredient; structure plus accountability is.** Schimpf 2026: AI matched a structured questionnaire on outcomes, and its only edge was perceived accountability. Invest in the check-in loop, the weekly review and the visible commitment record; keep "let's talk about it" optional (D2, D5).

**Rules and thresholds**

3. **Cap and monitor session time; long sessions are a risk signal, not success.** Fang 2025: harm tracked voluntary duration, not modality. Soft cap ~20 min per Talk session, ~60 min a week; above it the coach closes with a summary and a next action. Never display time-on-app as an achievement.
4. **Voice needs the same duration budget (D10/D13).** Voice increased usage and usage mediated dependence. Ship voice with caps, a spoken close, and no ambient or always-on mode.
5. **Keep conversations topic-bounded.** Personal-but-bounded conversations produced *lower* dependence than open-ended ones; Adler's agenda (goals, actions, barriers, review) is itself protective.
6. **Anti-sycophancy is a hard rule, not a tone preference** (Cheng 2026; HE §6 on congruence). The coach must be able to say "I don't think that plan survives a bad week"; it must never affirm a plan the record contradicts; a weekly review ending with no disagreement and no trade-off named is a fidelity failure. Add the rubric item to the eval pack (AF): *did the coach withhold agreement where the record contradicted the user?*
7. **Never optimise on satisfaction, alliance or retention.** Sycophantic responses are the highest-rated ones (Cheng 2026) and bond rises without outcomes (Terblanche 2024). Optimise on 7-day done/scheduled and goal progress; measure WAI-SR **task and goal**, treat bond as a diagnostic only.
8. **Dependency tripwires, checked monthly.** Flag when sessions/week exceed the user's 8-week median by 2×, median session length rises three weeks running, or the user calls Adler a friend / says it understands them better than people. On a flag: name it once, shorten sessions, ask who else could be brought in. Fang's person-level markers justify one intake item — "have you used an AI companion app?" — as a caution flag, not a gate.
9. **Retention comes from tracking, not push.** Jabir 2024 (symptom tracking halves long-term attrition) and He 2023 (reminders reduce effect) confirm D3: one daily check-in, no cue-time notifications, no re-engagement escalation.
10. **Assume intermediate risk is where the model fails** (McBain 2025). CF §5's net must fire on ambiguity, not certainty. Adopt **VERA-MH** (Bentley 2026) as the automated pre-release safety eval plus **trajectory-level** scoring (Morrin 2026): whole transcripts, turn by turn, for validation of harmful framing, contradiction-handling and time-to-safety-intervention.
11. **Budget for a human review queue.** Therabot needed 13 corrections and 15 safety interventions per ~101 users per month *with* supervision. Sample transcripts weekly against the rubric, log every trigger, and treat ~one bad response per ten users per month as the starting baseline.
12. **Expect ~20–25% dropout by week 8** (Jabir 2024) and 3–5% 30-day retention at consumer baseline (AI-doc §5). Set targets against those, not against trial engagement.

**Questions to ask, and how they help the coach adapt**

- Intake: "What would make you say this is working in six weeks?" (keeps success behavioural); "Who else knows you're doing this?" (accountability is the mediator, and a named person beats the coach).
- Weekly review: "Where did I agree with you too easily this week?" — a direct sycophancy probe feeding the fidelity log — plus "Help, hurt, or nothing?" for the week's change (AI-doc §6).
- Monthly: "Has talking to me replaced talking to anyone?" and "Would you rather bring this to a person?", plus WAI-SR-6 task/goal at day 7, week 4, week 12 (HE alliance plan).
- After a lapse: the barrier tap, not a feelings question. Empathy here means accurate reflection of the barrier (He 2023's moderator), not warmth for its own sake.

**What to avoid**

- Any wellbeing, mood, stress or "mental health" claim, and any inferred emotional state shown back to the user (CF §5, AF).
- Companion framing, persona names, "I missed you", implied feelings — Fang 2025 makes friend-perception a measured risk factor, not a taste question (D2, D9).
- Streaks, time-on-app, message counts or session length as displayed metrics; reminders added to fix retention (He 2023).
- Trusting a generative coach unsupervised in its first months: Therabot's numbers are a supervised system's numbers.

---

## Conflicts and open questions

- **Generative vs rule-based.** Li 2023 (distress 1.24 vs 0.52) and Heinz 2025 (d ≈ 0.85) say generative is better; Sohn 2026 and Alamdarloo 2026 find **no difference**, with 2 generative trials each. Favour the null: plausible, unproven, and the supporting trials use waitlist controls.
- **Does the chat format add anything?** Schimpf 2026 (AI ≈ structured questionnaire) and Hennemann 2026 (gen-AI ≈ human chat partner, null) say little beyond structure; Therabot and Mathioudakis say a well-built agent matches a human. Reconciliation: the contribution is **accountability, availability and initiation**, not superior dialogue.
- **Severity moderation.** Sohn 2026 finds a monotone gradient (0.64 → 0.07); Alamdarloo 2026 finds none. Sohn matches Li 2023 and Feng 2025; favour it. Either way the non-clinical estimate is small.
- **Real-world vs trial.** MacNeill 2024 (Wysa, p < .001 vs no-intervention) vs Meinert 2026 (Wysa, real NHS pathway, null): inactive controls and volunteer samples inflate; favour the pragmatic trial. Relatedly, Jabir 2024 (blended halves attrition) vs Karyotaki 2021 (guidance only helps above PHQ-9 9) suggests human support buys retention without buying outcome. Untested in coaching.
- **Dependency causality.** Fang 2025's condition-level nulls with usage-level harms could be dose-response or reverse causation; baseline loneliness not predicting usage argues against the latter. No trial has manipulated dose, so Adler's caps are a precaution, not a threshold.
- **Sycophancy vs alliance.** Empathic response and personalisation are He 2023's positive moderators; the same behaviours are what Cheng 2026 measures as harmful affirmation. The dividing line — regard for the person, not agreement with the claim (HE §6) — is theoretically clean and empirically untested. The most important open question for Adler's tone.
- **Nothing measures the target population.** No RCT tests a goal coach for non-clinical 16–40-year-old optimisers over months. The closest, Hennemann 2026 (null, 43% unwanted effects) and Schimpf 2026 (2 weeks), are small and short. Adler's own cohort will be the first useful evidence (CF §6).

---

## Sources

- Abd-Alrazaq et al. 2020, chatbots for mental health, MA: https://www.jmir.org/2020/7/e16021/ · https://pubmed.ncbi.nlm.nih.gov/32673216/
- He et al. 2023, conversational agent interventions, MA of RCTs: https://www.jmir.org/2023/1/e43862 · https://pmc.ncbi.nlm.nih.gov/articles/PMC10182468/
- Li, Zhang, Lee, Kraut & Mohr 2023, AI-based CAs, npj Digital Medicine: https://www.nature.com/articles/s41746-023-00979-5 · https://pmc.ncbi.nlm.nih.gov/articles/PMC10730549/
- Feng et al. 2025, AI-driven CAs for young people, JMIR: https://www.jmir.org/2025/1/e69639 · https://pmc.ncbi.nlm.nih.gov/articles/PMC12120367/
- Sohn et al. 2026, chatbots for depressive and anxiety symptoms, npj Digital Medicine 9:377: https://www.nature.com/articles/s41746-026-02566-w
- Mokhtari Masoumi Alamdarloo et al. 2026, AI and rule-based CAs, npj Digital Medicine 9:650: https://www.nature.com/articles/s41746-026-02820-1
- Hang et al. 2026, CBT-based NLP-enabled CAs, npj Digital Medicine: https://www.nature.com/articles/s41746-026-02886-x
- Singh et al. 2023, chatbots and lifestyle behaviours, npj Digital Medicine 6:118: https://www.nature.com/articles/s41746-023-00856-1 · https://pmc.ncbi.nlm.nih.gov/articles/PMC10290125/
- Chatbot-based exercise interventions, MA 2025: https://pmc.ncbi.nlm.nih.gov/articles/PMC12254675/
- Mathioudakis et al. 2025, AI vs human coaching in the DPP, JAMA 334: https://doi.org/10.1001/jama.2025.19563 · https://pmc.ncbi.nlm.nih.gov/articles/PMC12560030/
- Schimpf, Voigt & Bohné 2026, AI-assisted goal setting (N = 517): https://arxiv.org/abs/2603.17887
- Fitzpatrick, Darcy & Vierhile 2017, Woebot RCT: https://mental.jmir.org/2017/2/e19/ · https://pmc.ncbi.nlm.nih.gov/articles/PMC5478797/
- Prochaska et al. 2021, Woebot-SUD: https://www.jmir.org/2021/3/e24850
- Woebot shutdown, STAT 2 July 2025: https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/
- Fulmer et al. 2018, Tess RCT: https://mental.jmir.org/2018/4/e64/
- Greer et al. 2019, Vivibot RCT: https://mhealth.jmir.org/2019/10/e15018/
- MacNeill, Doucet & Luke 2024, Wysa in chronic disease: https://formative.jmir.org/2024/1/e50025
- Meinert et al. 2026, Wysa real-world NHS trial: https://journals.sagepub.com/doi/10.1177/00207640251415507
- Heinz et al. 2025, Therabot RCT, NEJM AI 2(4): https://ai.nejm.org/doi/full/10.1056/AIoa2400802 · PDF: https://gwern.net/doc/psychiatry/depression/2025-heinz.pdf
- Jabir et al. 2024, attrition in CA-delivered mental health interventions, MA: https://www.jmir.org/2024/1/e48168 · https://pmc.ncbi.nlm.nih.gov/articles/PMC10933752/
- Yasukawa et al. 2024, chatbot to improve iCBT adherence, BMJ Mental Health 27:e300881: https://mentalhealth.bmj.com/content/27/1/e300881
- Karyotaki et al. 2021, guided vs unguided iCBT, IPD network MA, JAMA Psychiatry 78:361: https://pmc.ncbi.nlm.nih.gov/articles/PMC8027916/
- Habicht et al. 2024, AI self-referral chatbot, Nature Medicine 30:595: https://www.nature.com/articles/s41591-023-02766-x
- Huang et al. 2025, LLM vs human coaching messages, J Technol Behav Sci 10:749: https://doi.org/10.1007/s41347-025-00491-5
- Loughnane et al. 2025, human/AI/hybrid health coaching review, Front Digit Health 7:1536416: https://pmc.ncbi.nlm.nih.gov/articles/PMC12058678/
- Fang et al. 2025, psychosocial effects of extended chatbot use (MIT Media Lab + OpenAI): https://arxiv.org/abs/2503.17473 · https://openai.com/index/affective-use-study/
- Cheng, Lee, Khadpe, Yu, Han & Jurafsky 2026, sycophantic AI, Science: https://www.science.org/doi/10.1126/science.aec8352 · preprint: https://arxiv.org/abs/2510.01395
- McBain et al. 2025, LLM alignment with clinicians on suicide risk, Psychiatric Services 76:944: https://psychiatryonline.org/doi/10.1176/appi.ps.20250086
- Hennemann et al. 2026, generative AI vs human agent for procrastination, Digital Health 12: https://doi.org/10.1177/20552076261450336
- Morrin et al. 2026, trajectories not end points, JMIR Mental Health 13:e91454: https://mental.jmir.org/2026/1/e91454
- Bentley et al. 2026, VERA-MH human validation, JMIR AI 5:e92817: https://ai.jmir.org/2026/1/e92817
- FDA Digital Health Advisory Committee, meeting notice on generative AI-enabled digital mental health devices (6 Nov 2025): https://www.federalregister.gov/documents/2025/09/12/2025-17651/digital-health-advisory-committee-notice-of-meeting-establishment-of-a-public-docket-request-for
