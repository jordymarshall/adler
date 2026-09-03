# Adaptive interventions: JITAIs, micro-randomised trials, bandits, n-of-1, engagement and attrition

Research date: 2026-09-01. Companion to `coaching-framework.md` (cited as CF §n) and `agent-engineering.md` (AE). Question: how can one coach adapt to one person over months without overfitting to noise and without nagging. Evidence grade: **MA** (meta-analysis or systematic review), **RCT**, **MRT** (micro-randomised trial), **OBS** (observational or panel data), **TH** (framework or theory).

---

## 1. The JITAI framework (Nahum-Shani et al. 2018) — TH

Nahum-Shani et al. 2018 (*Annals of Behavioral Medicine* 52:446) is the reference vocabulary. A JITAI has four parts: **decision points** (when the system decides), **intervention options** (including, explicitly, *provide nothing*), **tailoring variables** (self-reported or passive data) and **decision rules** linking them. Two concepts matter most for a coach:

- **States of vulnerability or opportunity** versus **receptivity**: "the individual's transient ability and/or willingness to receive, process, and utilize just-in-time support." Support when the person is not receptive "may even have negative implications on engagement."
- **Habituation**: "objective decline in physiological and/or behavioral response to an intervention over repeated exposures." Remedy: a *bank* of varied content, and fewer decision points when tailoring depends on active self-report (assessment burden).

This is a design framework, not evidence that JITAIs work. Klasnja et al. 2015 (*Health Psychology* 34:1220) supply the matching experiment, the **micro-randomised trial**: randomise at each decision point within each person, hundreds of times, so a component's *proximal* effect and its moderation by time and context are estimated causally.

### Do JITAIs work? Two meta-analyses disagree

- Wang & Miller 2020 (**MA**, *Health Communication* 35:1531; 33 studies): g = 1.65 vs waitlist (k = 9), g = 0.89 vs non-JITAI treatments (k = 21), g = 0.79 within-group (k = 13). Implausibly large for behaviour change: mixed outcomes, small early studies, waitlist comparators, no risk-of-bias assessment.
- von Lützow, Neuendorf & Scherr 2025 (**MA**, *BMJ Mental Health*; K = 23, N = 2,563, 2018 to May 2025, PRISMA and RoB): between-group **g = 0.15 (95% CI 0.05–0.26)** for depression, anxiety and well-being; follow-up effects significant at 1 and 3–6 months in nine studies; risk of bias moderate to high for adherence and missing data.

The evidence favours the 2025 estimate: small, real, and no larger than tailoring in general (§4). "Adaptive" is a delivery property, not a mechanism.

---

## 2. What micro-randomised trials actually found — MRT

**HeartSteps V1** (Klasnja et al. 2019, *Ann Behav Med* 53:573; n = 37 analysed, 42 days, five decision points a day, 60% send probability). Averaged over the study, a contextually tailored suggestion raised the following 30-minute step count by 14% (35 steps on a 253-step base, p = .06). On day one the effect was 66% (167 steps, p < .01); it decayed at about 2% per day and was indistinguishable from zero by roughly day 28. Walking suggestions worked (24% average, 107% at the start); anti-sedentary suggestions had no detectable effect. A good, context-aware prompt has a half-life of weeks, and half the message bank did nothing.

**Bidargaddi et al. 2018** (*JMIR mHealth* 6:e10123; n = 1,255 users of a commercial workplace well-being app, 89 days, six candidate send times). A tailored push raised the probability of opening the app in the next 24 hours by 3.9% (RR 1.039, 95% CI 1.01–1.08); largest at 12:30 (+8.8%) and on weekends (+8.7% vs +2.5% weekdays); attenuation over time present but not significant.

**Drink Less** (Bell et al. 2023, *JMIR mHealth* 11:e38342; MRT n = 350 plus parallel arms n = 98 no-notification and n = 121 fixed notification; one 20:00 decision point a day for 30 days). A notification raised the odds of opening the app in the next hour **3.5-fold (95% CI 2.91–4.25)**; new wordings were no better than the standard one; no decay over 30 days. But **time to disengagement did not differ** across arms. Notifications buy the next hour, not the next month.

**Ally** (Kramer et al. 2020, *Ann Behav Med* 54:518; n = 274 Swiss insurees, 8 weeks). Daily cash incentives raised step-goal achievement by 8.1% (95% CI 2.1–14.1); action planning by 5.8% (1.2–10.4), only without incentives; **daily self-monitoring prompts and coping planning had no effect**; 30% stopped using the app. The sample was healthier than average.

**Receptivity.** Künzler et al. 2019 (*IMWUT* 3:140): receptivity varied with age, personality, device, time of day, battery, recent phone use, activity and location. Mishra et al. 2021 (*IMWUT* 5:74) deployed receptivity models in the field: machine-timed delivery improved *responding to the message* by up to 40% over random timing; no behavioural outcome is reported. Morrison et al. 2017 (**RCT**, *PLoS ONE* 12:e0169162; n = 77): sensor-driven notifications were actioned no more than fixed daily ones; both beat occasional ones. Smart timing has not been shown to beat a good fixed time.

---

## 3. Bandits and reinforcement learning for personalisation

**Design.** Tewari & Murphy 2017 frame mHealth as a contextual bandit with three problems: heterogeneity between people, very little data per person, non-stationarity. Liao, Greenewald, Klasnja & Murphy 2020 (*IMWUT* 4:18) built a Thompson-sampling bandit for HeartSteps V2 with a **dosage variable** X(t+1) = 0.95·X(t) + treatment(t+1): "contexts with a larger recent dosage appears to result in the smaller immediate effect of treatment and lower future rewards." It learned per user (pilot: 8 participants, 90 days, 450 decisions each); on V1 replays it beat a plain bandit by about 6.8% in 30-minute steps. Ghosh et al. 2024 (*Machine Learning* 113; HeartSteps V2, 91 users, 90 days) tested by resampling whether "personalisation" exceeded the algorithm's own randomness: it did for time-in-study and location (39 of 60 users) and **did not** for the engagement feature. Tomkins et al. 2021 (*Machine Learning* 110:2685; IntelligentPooling) learn the degree of personalisation from the population via random effects: 26% lower regret than fully pooled or fully individual policies. Trella et al. 2022 (*Algorithms* 15:255) give pre-implementation guidelines; the Oralytics deployment (Trella et al. 2024, arXiv 2409.02069; n = 79, 70 days, two decision points a day) chose **full pooling** because simulation showed it beat per-user models, and pre-specified fallbacks fired at least seven times. Effectiveness results are pending.

**Trials with outcomes.**

- Yom-Tov et al. 2017 (**RCT**, *JMIR* 19:e338; n = 27 sedentary type 2 diabetics, 26 weeks). The learned policy beat the initial static policy on change in activity (ANOVA p = .004), with gains in walking pace and HbA1c. Negative feedback lowered activity on average, and "positive-social feedback repeated day after day is correlated with a lower change in activity." Variety carried the effect; n is tiny.
- DIAMANTE (Aguilera et al. 2024, **RCT**, *JMIR* 26:e60834; n = 168 analysed of 195, 24 weeks, diabetes plus depressive symptoms). Adaptive messaging: +3.6 steps/day slope (95% CI 2.45–4.78; 19% cumulative, +606 steps). Random daily messaging: +0.35 steps/day (1.6%). Weekly mood-only control: +0.81 (3.9%). The cleanest evidence that *selection* rather than *contact* helps; random messages did worse than the near-silent control. Sample short of the planned 276; reading not logged.
- REINFORCE (Lauffenburger et al. 2024, **RCT**, *npj Digital Medicine* 7:39; n = 60). RL-personalised texts raised adjusted adherence by 13.6 points (95% CI 1.7–27.1) versus no messages; cannot separate personalisation from messaging.
- AI-CBT-CP (Piette et al. 2022, **RCT**, *JAMA Internal Medicine* 182:975; n = 278). An RL engine chose weekly between a 45-minute call, a 15-minute call or an automated message: non-inferior to ten 45-minute sessions, more responders at 6 months (37% vs 19%, p = .01), under half the therapist time. Adapting *dose* is the best-evidenced use of RL so far.

Bandit personalisation has a few small positive RCTs, one negative signal (random extra messages) and consistent design lessons: pool across users, treat recent dosage as a cost, expect decay, pre-specify fallbacks.

---

## 4. Tailoring in general: small, real, decays without contact

- Noar, Benac & Harris 2007 (**MA**, *Psychological Bulletin* 133:673; 57 studies, N = 58,454): tailored print, **r = .074**.
- Krebs, Prochaska & Rossi 2010 (**MA**, *Preventive Medicine* 51:214; 88 studies, N = 106,243): computer-tailored, **g = 0.17 (0.14–0.19)**. Dynamic tailoring (reassessed over time) g = 0.19 vs static g = 0.14 (p = .01); only dynamic tailoring stayed significant beyond 12 months; the effect fell by g = 0.07 per year of follow-up.
- Lustria et al. 2013 (**MA**, *J Health Communication* 18:1039; 40 studies, N = 20,180): web-tailored, **d = .139 (.111–.166)**.
- Milkman et al. 2021 (**RCT megastudy**, *Nature* 600:478; 61,293 gym members, 54 four-week programmes): 45% raised weekly visits by 9–27% during the programme; **8% had a measurable effect after it ended**; the winner gave micro-rewards for returning after a missed workout; experts could not predict the ranking.
- Message fatigue: So, Kim & Cohen 2017 define it as exhaustion from repeated similar messages; Keating & Skurka 2024 (**MA**, *Communication Research*) link it to reactance, inattention and weaker intentions, with an inverted-U for repetition (pooled r not retrieved; direction established, magnitude unknown).

Tailoring is worth about g = 0.15 while contact continues; the CF §1 nudges fade once contact stops.

---

## 5. Engagement and attrition

**Eysenbach 2005** (**TH**, *JMIR* 7:e11) separates *dropout attrition* (leaving) from *nonusage attrition* (staying but stopping use), sketches logarithmic, sigmoid (curiosity → rejection → hardcore) and L-shaped curves, names push factors, personal contact, positive feedback, perceived usefulness and workload as drivers, and asks for **usage half-life (t50)** and survival curves. The data since confirm the L-shape:

- Baumel, Muench, Edan & Kane 2019 (**OBS**, *JMIR* 21:e14567; 93 mental-health apps): median **15-day retention 3.9%, 30-day 3.3%**; trackers 6.1%, mindfulness 4.7%, peer support 8.9%.
- Pratap et al. 2020 (**OBS**, *npj Digital Medicine* 3:21; eight remote studies, >100,000 participants): **median retention 5.5 days** (2–26 across studies); clinician referral added 40 days, compensation 22, having the condition 7, older age 4.
- Fleming et al. 2018 (**SR**, *JMIR* 20:e199; seven public interventions): 21–88% minimal use, **7–42% moderate use**.
- Torous, Lipschitz, Ng & Firth 2020 (**MA**, *J Affective Disorders* 263:413; 18 RCTs, n = 3,336): dropout 26.2%, **47.8% after trim-and-fill**; lower with human feedback and in-app mood monitoring. Linardon & Fuller-Tyszkiewicz 2020 (**MA**, 70 RCTs): 24.1% short-term, 35.5% longer-term.
- Kelders et al. 2012 (**SR**, *JMIR* 14:e152; 83 web interventions): about 50% adhere; counsellor interaction, frequent intended use, frequent updates and dialogue support explain 55% of the variance.
- Wrzus & Neubauer 2023 (**MA**, *Assessment* 30:825; 477 articles, N = 677,536): EMA studies average six prompts a day for seven days at 79% compliance; prompts per day did not predict compliance or dropout, but heavier schedules were shorter.

**Effective engagement.** Yardley et al. 2016 (**TH**, *Am J Prev Med* 51:833): promote "effective engagement," defined empirically as "sufficient engagement with the intervention to achieve intended outcomes," not more engagement. Perski, Blandford, West & Michie 2017 (**SR**, *Transl Behav Med* 7:254): engagement is experience plus behaviour, micro-level (with the app) versus macro-level (with the target behaviour); Nahum-Shani et al. 2022 (**TH**, *American Psychologist* 77:836) add the in-the-moment mechanics. Linardon et al. 2026 (**MA**, *Psychiatry Research*; 28 studies, 13 pooled): engagement to outcome **r = 0.16 (0.09–0.21)**, I² = 0%; activity completions r = .19, sessions r = .12, days of use r = .11 (n.s.). Doing the task predicts; opening the app barely does.

**Human support.** Mohr, Cuijpers & Lehman 2011 (**TH**, *JMIR* 13:e30, supportive accountability): adherence rises when the user feels accountable to someone trustworthy, benevolent and expert, against process expectations the user helped set. Torous 2020 and Kelders 2012 supply the correlational support.

---

## 6. n-of-1 trials — the personal experiment

Shaffer et al. 2018 (**SR**, *Ann Behav Med* 52:731; 54 articles, 1,193 participants): 41 pharmacological, four behavioural; 15% reported power; under half described washout; almost none handled autocorrelation; in nine trials reporting clinical use, 67% of subsequent decisions matched the result. Kravitz et al. 2018 (**RCT**, *JAMA Internal Medicine* 178:1368; PREEMPT, n = 215): app-supported n-of-1 trials for chronic pain versus usual care: **no difference** in pain interference at six months (−1.36, 95% CI −2.91 to 0.19), higher shared decision-making (+11.9), 88% found the app helpful. Davidson et al. 2021 (*JAMA Pediatrics*) set the design minimum: randomised or counterbalanced periods, repeated crossovers, a pre-specified repeatable outcome, washout, autocorrelation-aware analysis. Verdict: a decision aid with engagement value and weak outcome evidence; a single A-then-B comparison over two weeks is an anecdote.

---

## 7. Digital therapeutic alliance (extends humanistic-existential-common-factors.md §2)

Tong et al. 2022 (**SR**, *Frontiers in Psychiatry* 13:819623): the alliance with a fully automated app must be conceptualised differently; the role of bond is unclear, empathy is hard to achieve, and some users value apps for being non-judgemental. Darcy 2021, Beatty 2022, Terblanche 2024 and the 2025 JMIR Mental Health review are covered in the humanistic doc: bond ratings inflate without buying outcome. Linardon's r = .16 is the realistic ceiling for any relationship-to-outcome claim in apps.

---

## Evidence table

| Finding | Source | Design, n | Effect | Status |
|---|---|---|---|---|
| JITAIs vs control, mental health/well-being | von Lützow 2025 | MA, K = 23, N = 2,563 | g = 0.15 (0.05–0.26) | Robust to sensitivity; RoB moderate–high |
| JITAIs vs waitlist / non-JITAI | Wang & Miller 2020 | MA, 33 studies | g = 1.65 / 0.89 | Inflated; superseded |
| Activity suggestion → 30-min steps | Klasnja 2019 | MRT, n = 37, 42 d | +14% avg; +66% day 1, −2%/day, ≈0 by day 28 | Single trial; V2 pending |
| Push → open app in 24 h | Bidargaddi 2018 | MRT, n = 1,255, 89 d | RR 1.039 (1.01–1.08); midday, weekends best | Single trial |
| Push → open app in 1 h; retention | Bell 2023 | MRT, n = 350 + 219 | OR 3.5 (2.91–4.25); no decay over 30 d; no retention difference | Single trial |
| Self-monitoring prompts, coping planning | Kramer 2020 | MRT, n = 274, 8 w | null; cash +8.1%, action planning +5.8% | Single trial |
| ML-timed vs random delivery | Mishra 2021 | field, Ally | receptivity up to +40% | Behaviour not reported |
| Intelligent vs fixed daily notifications | Morrison 2017 | RCT, n = 77 | no difference | Exploratory |
| RL message selection vs random vs control | Aguilera 2024 | RCT, n = 168, 24 w | +3.6 vs +0.35 vs +0.81 steps/day slope | Underpowered vs plan |
| RL dose selection (CBT) | Piette 2022 | RCT, n = 278 | non-inferior; responders 37% vs 19%; < half therapist time | Single trial |
| RL texts vs none | Lauffenburger 2024 | RCT, n = 60 | +13.6 pp adherence (1.7–27.1) | Cannot isolate personalisation |
| Recent dosage lowers effect | Liao 2020 | bandit design + pilot n = 8 | qualitative; λ = 0.95 | Design paper |
| RL personalisation real vs noise | Ghosh 2024 | resampling, n = 91 | real for time/location; not for engagement | Method paper |
| Pooling vs per-user | Tomkins 2021; Trella 2024 | simulation + deployment | 26% lower regret; full pooling chosen | Effectiveness pending |
| Tailoring (print / computer / web) | Noar 2007; Krebs 2010; Lustria 2013 | MA, N = 58k / 106k / 20k | r = .074; g = 0.17; d = .139 | Consistent |
| Dynamic vs static tailoring; decay | Krebs 2010 | MA | 0.19 vs 0.14; −0.07/yr | |
| Post-programme persistence of nudges | Milkman 2021 | 54-arm RCT, n = 61,293 | 8% of arms persist | |
| 30-day retention, consumer apps | Baumel 2019 | panel, 93 apps | median 3.3% | |
| Median retention, research apps | Pratap 2020 | 8 studies, >100k | 5.5 days; clinician referral +40 d | |
| RCT dropout, depression apps | Torous 2020 | MA, 18 RCTs | 26.2% → 47.8% adjusted; human feedback lowers | |
| Engagement → outcome | Linardon 2026 | MA, 13 studies | r = .16; task completion r = .19; days used n.s. | I² = 0 |
| EMA compliance vs prompts/day | Wrzus 2023 | MA, 496 samples | 79%; prompts/day not predictive | Short studies |
| n-of-1 vs usual care | Kravitz 2018 | RCT, n = 215 | pain −1.36 (−2.91 to 0.19), n.s. | Only trial of its kind |

---

## Implications for Adler

Adler already has the four JITAI parts: decision points (daily check-in, weekly review, D3/D5), tailoring variables (CF §6), intervention options (CF §2) and decision rules (CF §7 Phase 6). The literature changes how they run over time.

**Rules and thresholds**

1. **"Provide nothing" is a first-class option and the default under high dosage.** Keep a per-user dosage score of coach-initiated messages, decayed daily (λ = 0.95, Liao 2020). Beyond the daily check-in and weekly review, cap coach-initiated messages at two a week; above the user's own median dosage, choose silence.
2. **Assume every message family has a half-life of three to four weeks** (Klasnja 2019). Keep at least ten wordings per intervention type; never repeat a rationale within fourteen days; retire a template whose 7-day proximal effect is zero for two consecutive fortnights.
3. **Notifications buy the next hour, not the next month** (Bell 2023, Bidargaddi 2018). D3 stands: one notification a day at the user's chosen time, midday by default. Never add notifications to fix retention.
4. **Do not personalise on engagement signals** (Ghosh 2024). Personalise on variables with signal: barrier type, confidence, time of day, day of week, recent dosage.
5. **Pool first, personalise slowly.** One decision a day gives about 90 decisions a quarter; HeartSteps had 450 per user and still pooled. The rule table stays population-level (AE: counts, not bandits). A per-user playbook entry overrides a population rule only after the same move has been tried at least three times for that user with the same direction of 7-day outcome; one confirmation is provisional.
6. **Make the hypothesis log a valid n-of-1**: one change a week (CF Phase 6), a pre-declared metric (7-day done / scheduled), full seven-day periods on each side so weekday effects cancel, an explicit "help, hurt, nothing" verdict at the next review. Two consistent verdicts before it enters the playbook; a period confounded by illness, travel or a pause is void.
7. **Measure effective engagement, not opens.** Primary: weekly done / scheduled (task completion, r = .19). Secondary: usage half-life t50, day-7 and day-30 check-in survival, weekly-review completion. A t50 of five to ten days is the baseline, not a failure.
8. **Randomise the coach's own moves at eligible decision points** (50/50 send vs hold for re-engagement and mid-week nudges; 50/50 between two wordings). A cheap in-house MRT, and the only way to know a message's proximal effect; extend AE's `variant` hashing to send/hold.
9. **The re-engagement script (CF Phase 9) matches the evidence**: two messages per lapse, timed to a landmark, no guilt. DIAMANTE's random-message arm doing worse than a near-silent control is the reason not to "keep in touch."
10. **Retention levers with evidence**: accountability the user helped define (Mohr 2011), one-tap self-monitoring (Torous 2020), a human route when stuck (Torous, Kelders). Adler has the first two; the third is the safety hand-off (CF §5).

**Questions to ask**

- Intake: "When in the day is a message from me useful, and when is it noise?" and "How many messages a week from a coach is too many?" Store both as receptivity settings.
- Weekly: "Was there a message this week you would rather not have had?" and, after any change, "Help, hurt, or nothing?"
- Monthly: "Is the daily check-in still worth thirty seconds?" If not, halve the days and keep the weekly review (Krebs: continued contact keeps the effect alive).

**What to avoid**

- Sensor- or calendar-based "smart timing" as a feature (Morrison 2017 null; Mishra 2021 improved responses, not behaviour).
- Negative feedback, and the same positive message day after day (Yom-Tov 2017).
- Extra messages "to stay top of mind" (DIAMANTE random arm); micro-prompts through the day (Klasnja 2019 anti-sedentary null).
- Treating alliance or bond ratings as a target (humanistic doc §2; r ≤ .16).

---

## Conflicts and open questions

- **JITAI effect size**: g = 1.65 (Wang & Miller 2020) vs g = 0.15 (von Lützow 2025). Favour the stricter, later review.
- **Do notification effects decay?** Klasnja 2019 (behaviour: gone by day 28) vs Bell 2023 (app opening: stable over 30 days). Not a contradiction: the behavioural response decays faster than the attentional one. Design for the behavioural curve.
- **Notifications are not cues (Wood & Neal, CF §7) vs notifications work (MRTs)**: both true. A notification triggers a one-off act (OR 3.5); it builds no automaticity and changes no retention. D3 holds.
- **Smart timing**: Morrison 2017 (null) vs Mishra 2021 (+40% receptivity). Different outcomes; neither shows a behaviour gain. Open.
- **Tailoring persists (Krebs: only dynamic survives 12 months) vs nudges fade (Milkman: 8%)**: reconcilable, since dynamic tailoring means continued contact. Adler's value is the weekly loop; Phase 8 (close) should expect decay and plan maintenance check-ins.
- **Per-user vs pooled learning**: Liao 2020 learned per user; Oralytics and IntelligentPooling pool. With one decision a day, pooling wins; the override threshold in rule 5 is a heuristic, not a finding.
- **Prompt burden**: Wrzus 2023 finds prompts per day irrelevant to compliance, but EMA studies average seven days. No study prompts daily for twelve weeks in healthy optimisers; Adler's own t50 will be the first data point.
- **Engagement as cause or marker**: r = .16 with I² = 0 is small and stable; whether raising engagement moves outcomes is untested (Linardon 2026).
- **Population gap**: MRT and RL evidence comes from physical activity, alcohol, diabetes and depression samples. No MRT exists in coaching or goal pursuit with healthy 16–40-year-olds; Kramer 2020's healthier-than-average sample is closest, and it found prompts null.
- **LLM-generated variety vs habituation**: no trial. Nahum-Shani's content-bank advice is the only guidance.

---

## Sources

- Nahum-Shani et al. 2018, JITAI key components: https://academic.oup.com/abm/article/52/6/446/4733473 ; PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC5364076/
- Klasnja et al. 2015, Microrandomized trials: https://pubmed.ncbi.nlm.nih.gov/26651463/
- Klasnja et al. 2019, HeartSteps MRT: https://academic.oup.com/abm/article/53/6/573/5091257
- Wang & Miller 2020, JITAI meta-analysis: https://pubmed.ncbi.nlm.nih.gov/31488002/
- von Lützow, Neuendorf & Scherr 2025, JITAI/EMI meta-analysis, BMJ Mental Health: https://pubmed.ncbi.nlm.nih.gov/41027677/
- Bidargaddi et al. 2018, push notification MRT: https://mhealth.jmir.org/2018/11/e10123/
- Bell et al. 2023, Drink Less notification MRT: https://mhealth.jmir.org/2023/1/e38342
- Kramer et al. 2020, Ally optimisation trial: https://pubmed.ncbi.nlm.nih.gov/32182353/
- Künzler et al. 2019, state of receptivity: https://dl.acm.org/doi/10.1145/3369805
- Mishra et al. 2021, detecting receptivity in the wild: https://pubmed.ncbi.nlm.nih.gov/34926979/
- Morrison et al. 2017, timing and frequency of notifications: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0169162
- Tewari & Murphy 2017, From ads to interventions (contextual bandits in mHealth): https://link.springer.com/chapter/10.1007/978-3-319-51394-2_25
- Liao et al. 2020, Personalized HeartSteps: https://dl.acm.org/doi/10.1145/3381007 ; PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC8439432/
- Ghosh et al. 2024, Did we personalize?: https://pmc.ncbi.nlm.nih.gov/articles/PMC11364365/
- Tomkins et al. 2021, IntelligentPooling: https://pmc.ncbi.nlm.nih.gov/articles/PMC8494236/
- Trella et al. 2022, RL pre-implementation guidelines: https://pmc.ncbi.nlm.nih.gov/articles/PMC9881427/
- Trella et al. 2024, Oralytics deployed RL: https://arxiv.org/html/2409.02069v1
- Yom-Tov et al. 2017, RL messaging in diabetes: https://www.jmir.org/2017/10/e338/
- Aguilera et al. 2024, DIAMANTE RCT: https://www.jmir.org/2024/1/e60834
- Lauffenburger et al. 2024, REINFORCE trial: https://www.nature.com/articles/s41746-024-01028-5
- Piette et al. 2022, AI-CBT-CP RCT: https://pubmed.ncbi.nlm.nih.gov/35939288/
- Noar, Benac & Harris 2007, tailored print meta-analysis: https://pubmed.ncbi.nlm.nih.gov/17592961/
- Krebs, Prochaska & Rossi 2010, computer-tailored meta-analysis: https://pmc.ncbi.nlm.nih.gov/articles/PMC2939185/
- Lustria et al. 2013, web-tailored meta-analysis: https://pubmed.ncbi.nlm.nih.gov/23750972/
- Milkman et al. 2021, megastudy: https://www.nature.com/articles/s41586-021-04128-4
- So, Kim & Cohen 2017 / Keating & Skurka 2024, message fatigue: https://www.tandfonline.com/doi/full/10.1080/10810730.2017.1414900 ; https://journals.sagepub.com/doi/abs/10.1177/00936502241287875
- Eysenbach 2005, Law of attrition: https://www.jmir.org/2005/1/e11/
- Baumel et al. 2019, objective engagement with mental health apps: https://www.jmir.org/2019/9/e14567/
- Pratap et al. 2020, retention in remote digital studies: https://www.nature.com/articles/s41746-020-0224-8
- Fleming et al. 2018, Beyond the trial: https://www.jmir.org/2018/6/e199/
- Torous et al. 2020, dropout in depression-app RCTs: https://pubmed.ncbi.nlm.nih.gov/31969272/
- Linardon & Fuller-Tyszkiewicz 2020, attrition and adherence: https://pubmed.ncbi.nlm.nih.gov/31697093/
- Kelders et al. 2012, persuasive system design and adherence: https://www.jmir.org/2012/6/e152/
- Wrzus & Neubauer 2023, EMA compliance meta-analysis: https://journals.sagepub.com/doi/10.1177/10731911211067538
- Yardley et al. 2016, effective engagement: https://pubmed.ncbi.nlm.nih.gov/27745683/
- Perski et al. 2017, conceptualising engagement: https://academic.oup.com/tbm/article/7/2/254/4563238
- Nahum-Shani et al. 2022, Engagement in digital interventions: https://pmc.ncbi.nlm.nih.gov/articles/PMC9481750/
- Linardon et al. 2026, engagement–outcome meta-analysis: https://pmc.ncbi.nlm.nih.gov/articles/PMC12747297/
- Mohr, Cuijpers & Lehman 2011, supportive accountability: https://www.jmir.org/2011/1/e30/
- Shaffer et al. 2018, n-of-1 trials in health psychology: https://academic.oup.com/abm/article/52/9/731/4837296
- Kravitz et al. 2018, PREEMPT n-of-1 RCT: https://jamanetwork.com/journals/jamainternalmedicine/article-abstract/2727053
- Davidson et al. 2021, Personalized n-of-1 trials, JAMA Pediatrics: https://pubmed.ncbi.nlm.nih.gov/33587109/
- Tong et al. 2022, digital therapeutic alliance narrative review: https://pubmed.ncbi.nlm.nih.gov/35815030/
