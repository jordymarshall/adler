# Atomic Habits and training science: what Adler can borrow, and the progression rules

Research date: 2026-09-01. Companion to `coaching-framework.md` (cited as CF §n), which covers the execution layer (implementation intentions, monitoring, COM-B, MI, Lally, self-compassion, streaks). This adds an audit of *Atomic Habits* as a system and the training-science layer for growing an action over time. Effect sizes are d / g / SMD unless stated.

---

## Part A: Atomic Habits (Clear, 2018) mapped to evidence

Architecture: a four-stage habit loop (cue → craving → response → reward, relabelled from Skinner/Duhigg) gives four laws and four inversions, on an identity layer ("outcomes are about what you get, processes are about what you do, identity is about what you believe"). The tactics map onto BCTTv1 groups (CF §2); the book adds packaging and vocabulary, not mechanisms.

| Element | Clear's claim | Source he cites | What the literature says | Verdict |
|---|---|---|---|---|
| Four Laws: make it obvious / attractive / easy / satisfying; inversions invisible / unattractive / difficult / unsatisfying | Every habit passes through cue, craving, response, reward; each law targets one stage | Skinner, Duhigg, Wood & Neal | Each law names a real mechanism: context cues (CF §1 rank 6); situation modification beats willpower (CF rank 8); immediate rewards predict persistence at long-term goals, delayed rewards do not (Woolley & Fishbach 2017). CF caveat: tangible rewards for already-valued activity undermine motivation (Deci 1999). No trial tests the package. | Well-supported as a scheme; "four" is a mnemonic, not a model |
| Identity-based habits; "every action you take is a vote for the type of person you wish to become"; two steps: decide who you want to be, prove it with small wins | Change identity first | Bryan et al. 2011 (PNAS): "being a voter" vs "voting" raised turnout 11–14 points | Gerber et al. 2016 (PNAS, larger field experiment): noun–verb difference ≈ 0, both weaker than a plain mobilisation message; Gerber 2018 repeated the null; Bryan's reply blames low-salience elections. Zhu et al. 2025 meta-analysis (32 effects, N = 13,340): habit–identity r = .55, correlational and bidirectional; Verplanken & Sui 2019: habits join identity when linked to values. Gollwitzer 2009 (CF §1): announcing identity goals reduces effort. | Plausible. Identity → action rests on a failed replication; action → identity is better supported. "Votes" = evidence from actions, never a declaration. |
| Habit stacking: "After/Before [CURRENT HABIT], I will [NEW HABIT]" | Chain new to existing; explained via synaptic pruning | Fogg's "anchoring"; Abitz et al. 2007 ("41% fewer neurons") | Abitz 2007 counted neurons in one thalamic nucleus (11.2M newborn vs 6.43M adult), not "the brain"; the pruning story is decorative. The formula is an implementation intention with an existing behaviour as cue, so it inherits d = 0.65 (CF §1 rank 1) and Lally's consistent-context requirement. | Well-supported by inheritance; the neuroscience is misattributed |
| Implementation intentions: "I will [BEHAVIOR] at [TIME] in [LOCATION]" | Time and place beat motivation | Milne, Orbell & Sheeran 2002 (91% vs 35–38% exercised weekly); Nickerson & Rogers 2010 | CF §1 rank 1. Clear's template omits the obstacle clause; WOOP adds it (CF rank 4). | Well-supported |
| Environment design; "one space, one use" | Environment is "the invisible hand that shapes behavior" | Thorndike 2012 cafeteria choice architecture | CF rank 8 (Duckworth 2016; Milyavskaya & Inzlicht 2017); Thorndike's cafeteria study is real. | Well-supported |
| 2-Minute Rule: "When you start a new habit, it should take less than two minutes to do"; "standardize before you optimize"; "master the art of showing up" | Scale the entry point down until it cannot be refused | David Allen; a reader anecdote | Fogg (CF rank 9); Lally: simpler behaviours plateau faster; Part B shows the biological floor is far lower than people assume. No trial of two minutes specifically. | Plausible; the number is a heuristic |
| Goldilocks Rule: "peak motivation when working on tasks right on the edge of their current abilities"; the book adds a "50/50" success–failure sweet spot and Yerkes–Dodson | Just-manageable difficulty sustains motivation | Csikszentmihalyi *Finding Flow*, Brim 2000, Hobbs 1959 | The "4% beyond ability" figure is Kotler's (*Rise of Superman*), not Clear's, and Kotler calls it a "back-of-the-envelope" "guess". Fong et al. 2015 (28 studies): challenge–skill balance → flow moderate. Wilson et al. 2019's "85% rule" is a model result, not a human trial. Kyllo & Landers 1995: moderate goals ES 0.53 vs difficult 0.09. | Plausible in direction; the numbers (4%, 50/50, 85%) are heuristics or model artefacts |
| Habit tracking; "don't break the chain" | Tracking is obvious, attractive and satisfying at once | Hollis et al. 2008 (1,685 adults; daily food records doubled weight loss); Lally 66 days | Harkin 2016 d = 0.40 (CF rank 2). Streak framing is contradicted: a broken streak drives abandonment (Silverman & Barasch 2023, CF §1). | Well-supported for recording; contradicted for streak-as-motivator |
| "Never miss twice": "Missing once is an accident. Missing twice is the start of a new habit." | Second miss is the danger point | None | CF §1: Lally shows one miss is harmless; no study on two. | Unsupported as a finding; reasonable rule |
| Plateau of Latent Potential / Valley of Disappointment (ice cube at 25→31°F, melts at 32) | Results lag effort, then break through | None | The automaticity curve is the opposite shape: habit strength rises fastest early, then asymptotes (Lally). What lags is the *outcome*, not the habit. | Unsupported as a law; fine as expectation management for outcomes |
| 1% better: 1.01^365 = 37.78; 0.99^365 ≈ 0.03; "habits are the compound interest of self-improvement"; Brailsford's marginal gains | Small daily gains compound multiplicatively | Brailsford / British Cycling | The arithmetic is right, the model is not: multiplicative daily gains on an unnamed metric with no decay or ceiling. Additive gains give 4.65×; skill curves show diminishing returns. British Cycling's rise followed 1999 lottery funding; Wiggins and Ross Tucker called marginal gains "a load of rubbish". The direction is supported: frequent small doses beat rare large ones (Part B). | Unsupported as a quantitative claim; supported as "small and frequent beats large and rare" |
| Habits Scorecard: list daily habits, mark +, –, =; Pointing-and-Calling ("reduces errors by up to 85 percent and cuts accidents by 30 percent") | Awareness precedes change | Japan Times citing a 1994 Railway Technical Research Institute study | Self-monitoring is BCT 2.3 (Harkin). The 85% traces to an unpublished 1994 RTRI study with no accessible design. Saying the action aloud is a light implementation intention. | Plausible; the statistic is unverifiable |
| Temptation bundling: "After [CURRENT HABIT], I will [HABIT I NEED]. After [HABIT I NEED], I will [HABIT I WANT]" | Pair a want with a need | Premack's principle; Milkman 2014 | CF rank 10: single field RCT, ~50% gym-visit rise, decays after a break. | Well-supported, modest, decays |
| Accountability partner / habit contract (Bryan Harris: $200 per missed food log) | A signed contract with a penalty makes cost immediate | Anecdote | CF rank 12–13: opt-in deposit contracts work (Coupe 2019; Volpp 2008); reporting actions strengthens monitoring (Harkin). | Well-supported when user-initiated; never coach-imposed |
| "Systems over goals": "You do not rise to the level of your goals. You fall to the level of your systems"; four problems with goals | Goals set direction; systems make progress | None empirical | Specific challenging goals with feedback beat "do your best" in ~90% of studies (Locke & Latham, CF rank 3); in sport, goal setting ES 0.34 and combined outcome + performance + process goals beat any single type (Kyllo & Landers 1995; Filby 1999). Supported as "daily unit = process goal, outcome goal in the background" (Seijts & Latham; CF §4). | Contradicted as slogan; supported as division of labour |

### Critiques of the book

1. **Method and evidence.** Anecdote → principle → decorative citation: the voter/identity study did not replicate (Gerber 2016, 2018); Abitz 2007 is about one thalamic nucleus; marginal gains is contested by its own protagonists; the 85% pointing-and-calling figure is untraceable. The Behavioural Architects' 2023 review finds "not much new news" versus the standard toolkit and asks whether Clear "oversimplified the science".
2. **The 1% math** is a metaphor presented as arithmetic; it creates "37×" expectations the Valley of Disappointment then has to excuse.
3. **Everything is a habit.** Binge eating, language learning and flossing get the same cue-response treatment. Gardner 2024 and Gardner & Rebar 2019 separate habitual *initiation* from *execution* (a skill); most coached goals are execution problems with a habitual start.
4. **Identity direction.** Action → identity is at least as strong as the reverse; "become the person first" invites the public-declaration trap (Gollwitzer 2009).

### What a coach can borrow verbatim

- "Who is the type of person that could get the outcome I want?"
- "Does this behavior help me become the type of person I wish to be?"
- "After [CURRENT HABIT], I will [NEW HABIT]."
- "I will [BEHAVIOR] at [TIME] in [LOCATION]."
- "After [CURRENT HABIT], I will [HABIT I NEED]. After [HABIT I NEED], I will [HABIT I WANT]."
- "When you start a new habit, it should take less than two minutes to do."
- "Standardize before you optimize."
- "Never miss twice." (present as a rule of thumb)
- "Make it obvious. Make it attractive. Make it easy. Make it satisfying."

---

## Part B: Training and skill-acquisition science, applied to growing an action

**Progressive overload and the minimum effective dose.** Adaptation needs a stimulus above the accustomed one; the floor is very low. Androulakis-Korakakis et al. 2020 (meta-analysis): in trained men, one set of 6–12 reps at 70–85% 1RM, 2–3 times a week for 8–12 weeks, produces "suboptimal, yet statistically significant" strength gains. Yoshida et al. 2022: six 3-second eccentric contractions a day, five days a week, raised elbow-flexor strength > 10% in four weeks. A tiny entry dose still produces change; growth is a choice about outcome, not a requirement of the habit.

**Consistency versus intensity.** Yoshida 2022 is the cleanest test: 30 contractions as 6 × 5 days gained > 10% strength; the same 30 in one weekly session gained none (5.8% thickness only); 6 once a week did nothing. Yoshida 2024: one contraction a day works at 5 or 3 days a week, not 2. (Schoenfeld 2019: at normal, volume-equated doses frequency stops mattering; the effect lives at low doses.) For learning, Cepeda et al. 2006 (317 experiments, 839 assessments): spaced beats massed and the optimal gap grows with the retention interval; Cepeda 2008: about 20% of the retention interval at weeks, 5–10% at a year. For habits, Singh et al. 2024 (20 studies, N = 2,601): median 59–66 days to automaticity, up to 335; frequency and morning timing predicted formation. The lever is days per week, not minutes per session.

**Periodisation.** Williams et al. 2017 (18 studies, 81 effects): periodised beats non-periodised on 1RM, ES = 0.43; undulating > linear; larger in untrained; most studies < 16 weeks. Afonso et al. 2019: the trials are too heterogeneous for the meta-analyses to mean much; Kiely 2018: periodisation rests on Selye's General Adaptation Syndrome, abandoned by stress research. No trial of "periodised habits" exists, and the habit literature wants *sameness* of cue and context (Lally, Wood). Periodise the dose (grow / hold / deload), never the cue.

**Autoregulation (RPE / RIR).** Larsen et al. 2021 (systematic review): repetitions-in-reserve-based RPE beat fixed percentage loading for strength; Greig et al. 2020 (meta-analysis): autoregulated load/volume at least as good as fixed. The model: one readiness question adjusts tomorrow's dose. The RIR question ("how many more could you have done?") translates to "how much more could you have done today without it costing you tomorrow?"

**Deloads and maintenance.** Bell et al. 2023 (Delphi consensus): a deload is "a period of reduced training stress designed to mitigate physiological and psychological fatigue"; pre-planned every 4–8 weeks for 5–7 days. The only RCT, Coleman et al. 2024 (N = 50): a full rest week at week 5 of 9 gave no hypertrophy difference and slightly *less* strength. Deloads cost little, build nothing, and their morale value is unproven. Maintenance numbers are striking. Bickel, Cross & Bamman 2011 (N = 70): after 16 weeks at 3×/week, young adults kept all strength and muscle for 32 weeks on **one-ninth** of the volume (one session, three sets a week); older adults kept strength on one-third but lost size. Spiering et al. 2021: endurance holds 15 weeks with volume cut 33–66% or frequency cut to 2/week; strength holds 32 weeks on one session and one set per exercise, *if intensity is kept*. Cut volume and frequency in maintenance; never the quality of each rep.

**Detraining.** Mujika & Padilla 2000: < 4 weeks off costs 4–14% of VO2max, longer 6–20%. Bosquet et al. 2013 (103 studies): stopping resistance training cuts maximal force SMD −0.46, submaximal strength −0.62, power −0.20; losses scale with duration and are larger in older and inactive people. Strength decays far slower than aerobic capacity; nothing returns to zero. In habit terms, what decays after a lapse is the *cue*, not the capability: Wood, Tam & Guerrero Witt 2005: students' habits survived a university transfer only when the context stayed the same; Verplanken & Roy 2016 (N = 800): a ~3-month window after relocation in which habits are malleable. Lally 2010: one miss does nothing (CF §1).

**Tapering.** Bosquet et al. 2007: cut volume 41–60% over ~2 weeks, keep intensity and frequency, gain ~2–3%; cuts > 60% did worse; a 2023 endurance meta-analysis agrees on 8–14 days. Before a hard week: shrink each session, keep every day.

**The 10% rule.** Buist et al. 2008 RCT (N = 532 novices): a 13-week 10%-rule programme had the same injury rate (21%) as a standard 8-week one (20%). Nielsen et al. 2014 (N = 874, prospective): > 30% progression over two weeks went with more distance-related injuries than < 10%, but the overall model was not significant. Defensible statement: jumps above ~30% look risky; no small number is proven protective.

**Overtraining and burnout.** Meeusen et al. 2013 (ECSS/ACSM consensus): functional overreaching (days, then supercompensation) → non-functional overreaching (weeks to months) → overtraining syndrome ("prolonged maladaptation", diagnosed by exclusion); prevention is monitoring and recovery. Foster 1998: session-RPE × duration = daily load; *monotony* (mean/SD) and *strain* (load × monotony) predicted illness in 25 athletes at individual thresholds. Kellmann et al. 2018: what matters is stress (training *plus other life demands*) against recovery. Parallel: total change carried, life included, at an individual threshold. CF §2 routes two weeks of "no energy" to a wellbeing check.

**Deliberate practice.** Ericsson, Krampe & Tesch-Römer 1993 claimed accumulated deliberate practice explains expertise. Macnamara, Hambrick & Oswald 2014 (88 effects): it explains about 12% of variance overall (11–14% by model): games 26%, music 21%, sports 18%, education 4%, professions < 1%. Macnamara, Moreau & Hambrick 2016 (sports): 18%, and 1% among elites. Ericsson's reply: most studies counted any practice. For a coach: do not sell hours; keep what makes practice deliberate (specific sub-goal, immediate feedback, repetition at the edge), which is Locke & Latham plus Goldilocks.

**Skill-acquisition stages.** Fitts & Posner 1967: cognitive (instruction, erratic, attention-heavy) → associative (errors fall, consistency rises) → autonomous (fast, low attention). Lally & Gardner 2013 give matching habit phases (initiate, repeat in a consistent context, reach automaticity); Gardner & Rebar 2019: initiation moves from conscious motivation to context-cued impulse. For Adler: cognitive = instruction, reminders, floor dose (weeks 1–2); associative = same cue daily, misses falling (weeks 2–8); autonomous = SRBAI ≥ 5/7 (CF §6). No growth in the cognitive phase; "standardize before you optimize".

**Flow and challenge–skill balance.** Fong 2015 (28 studies): balance → flow moderate, weaker under experience sampling and at work. Harris et al. 2021 (22 studies): flow ↔ performance r ≈ .31, correlational self-report, reverse causality unexcluded. Flow is worth asking about; it cannot be dialled to a percentage.

**Sport goal setting.** Kyllo & Landers 1995 (36 studies): ES 0.34; moderate goals 0.53 vs difficult 0.09 and easy 0.07; absolute 0.93 vs "do your best" 0.38; combined short- and long-term, public and participant-set goals did best. Filby, Maynard & Graydon 1999 (N = 40): outcome + performance + process goal groups beat single-goal groups in training and competition. Weinberg: successful athletes use outcome goals alongside process goals. Net: moderate, specific, multi-level.

**Self-talk, imagery, routines.** Self-talk: Hatzigeorgiadis et al. 2011 (32 studies, 62 effects) ES 0.48, larger for fine-motor and novel tasks, instructional beats motivational; coach use is a start cue in the first weeks ("shoes on"), not a mantra. Imagery: Holmes & Collins 2001's PETTLEP (Physical, Environment, Task, Timing, Learning, Emotion, Perspective) makes imagery functionally equivalent to doing; Smith et al. 2007: PETTLEP beat traditional imagery; Simonsmeier et al. 2021 meta-analysis d = 0.43, imagery plus practice beats practice alone; CF's warning stands: image the *process and the obstacle*, never the outcome alone. Pre-performance routines: Rupprecht, Tran & Gröpel 2021 (112 effects) pre-post SMC 0.31, experimental g = 0.64 under low pressure, novices and elites alike; a PPR is a cue chain ending in the action, i.e. a habit stack.

**Load monitoring.** Gabbett 2016: acute:chronic workload ratio, 0.8–1.3 "sweet spot", > 1.5 "danger zone". Impellizzeri et al. 2020: mathematical coupling, no causal interpretation, and random chronic loads predict injury as well as real ones (2021). Keep the *idea* (this week's change relative to what the person is used to) and Foster's monotony; drop the ratio.

---

## Part C: Progression rules for Adler

Defaults are marked **E** (derived from a cited effect) or **H** (heuristic consistent with the evidence). Each rule changes one variable. Grow in this order: frequency (days/week) → volume (minutes or reps) → intensity/quality, because frequency drives skill retention (Cepeda), low-dose strength (Yoshida) and habit formation (Lally, Singh).

| Rule | Default | Derived from | Status |
|---|---|---|---|
| Floor | New action ≤ 2 minutes or ≤ 10% of the target dose, whichever is smaller; on every intended day | Fogg; Androulakis-Korakakis 2020 (one set is enough); Yoshida 2022 (18 s/day is enough); Clear's 2-Minute Rule | H (2 minutes) on E (tiny doses produce real change) |
| Hold (cognitive → associative phase) | No growth for at least 14 days, and not until ≥ 80% of intended days done and SRBAI ≥ 4/7 (CF Phase 6) | Lally 2010, Singh 2024 (median ~2 months); Fitts & Posner; "standardize before you optimize" | E for the gate, H for 14 days |
| Grow | +10–25% of dose per step, at most one step per 14 days, never > 30% within any two weeks, one variable at a time | Nielsen 2014 (> 30% associated with injury); Buist 2008 (10% not proven protective, so the step is a choice); CF Phase 6 (≤ 25%); Kyllo & Landers (moderate beats difficult) | H on E |
| Autoregulate | Daily one-tap: *easier than expected / about right / harder than expected / couldn't*. Two "harder" in a row → hold; "easier" on 5 of 7 with ≥ 80% done → offer a step | Larsen 2021, Greig 2020 (readiness-based beats fixed prescription); RIR logic | E for the principle, H for thresholds |
| Deload | Every 4–8 weeks, or on signal (two "harder" plus a "no energy" barrier): cut session size 40–60% for one week; keep every day and the cue | Bell 2023 Delphi (4–8 weeks, 5–7 days); Bosquet 2007 taper (41–60%, keep frequency); Coleman 2024 (full stop gains nothing and costs a little) | H on E; benefit unproven, cost near zero |
| Lapse ≤ 3 days | Resume at the same dose; do not discuss it | Lally 2010 (one miss is harmless) | E |
| Lapse 4–13 days | Resume at the previous dose minus 25%, or the 2-minute version for 3 days, then back | Bosquet 2013 (losses scale with duration; capability does not vanish); the aim is cue rebuilding, not re-earning | H on E |
| Lapse ≥ 14 days, or any context change (move, new job, illness, travel) | Re-run CF Phase 3 (new cue, floor dose); restart on a landmark; treat the disruption as the 3-month window it is | Wood 2005 (context change breaks the cue, not the person); Verplanken & Roy 2016; Dai 2014 (CF) | E |
| Detraining maths for the user | "You did not go back to zero. Fitness in athletes drops 4–14% after a month off; strength barely moves; what went is the cue. We rebuild the cue, not you." | Mujika & Padilla 2000; Bosquet 2013 | E |
| Concurrent actions | One action in the *build* phase at a time; up to three total including automatic ones; a new build starts only when the previous is at SRBAI ≥ 5 and 4 weeks ≥ 80% (CF Phase 6) | Dalton & Spiller 2012 (planning for many goals lowers commitment and completion); Cowan 2001 (3–5 chunks); Fogg's three tiny habits; Foster: load is the *sum* of change | H on E |
| Weekly load check | "How much change are you carrying this week, everything included, 0–10?" ≥ 7 → hold all actions; no ratios, no formulas | Kellmann 2018 (stress includes life demands); Foster 1998; Impellizzeri 2020 (do not compute ACWR-style ratios) | H |
| Maintenance | After SRBAI ≥ 5/7 and 8 weeks ≥ 80%: the *behaviour* keeps its full frequency (the cue must recur); the *coaching dose* drops to weekly and session size may drop to the floor on busy weeks. Cut length and check-ins, not days or quality | Bickel 2011 (1/3 to 1/9 volume maintains for 32 weeks if intensity kept); Spiering 2021; Lally/Wood (cue must recur) | E for the volume claim; H for the mapping onto check-ins |

**Phrasing for an optimiser audience.** *Atomic Habits* readers will try to optimise the progression itself.

- No compounding projections, "37×", or percentage-beyond-ability figures. Show "days done this week: 5 of 6" (CF §7).
- Say *hold*, *consolidate*, *same version again*, *one notch*, *deload week*. Avoid *optimise*, *maximise*, *level up*, *compounding*.
- Every growth step is an experiment with a stop rule: "Try 15 minutes for two weeks. If two days feel harder than expected, we go back to 10 and that is the plan working."
- Holding is the skilled move: "Athletes at the top spend more weeks holding than growing. The growth is in the repetitions, not the increments."
- Growth is offered only when the gate is met and the user asks (CF Phase 6); otherwise say nothing.

### Atomic Habits vocabulary Adler adopts

- **Identity vote**, meaning evidence accumulated from actions: "That's another vote for being someone who trains."
- **Habit stack / "After I ___, I will ___"** as the action template (it is an implementation intention).
- **2-minute version** as the name of the floor dose.
- **Environment design / make it obvious / make it easy** for the situational-strategy conversation.
- **Standardize before you optimize** as the hold-phase explanation.
- **Just-manageable difficulty** for growth steps.
- **Never miss twice**, presented as a rule of thumb, not a finding.

### Claims Adler must not repeat

- "1% better every day makes you 37× better in a year"; habits "compound like interest".
- "Aim 4% beyond your ability" or any percentage for flow.
- "It takes 21 (or 66) days"; the honest line is "about two months on average, anywhere from three weeks to a year".
- "Change your identity first"; the coach never asks for an identity declaration.
- The plateau of latent potential as a law of habits; habits form fast, outcomes lag.
- "Forget goals, focus on systems"; outcome goals stay, they are just not the daily unit.
- Pointing-and-calling "reduces errors by 85%", synaptic pruning, or any neuroscience in copy (CF §5).
- "Don't break the chain" or any streak language.

---

## Sources

Atomic Habits (Clear's own material)
- Summary and Four Laws: https://jamesclear.com/atomic-habits-summary
- Identity-based habits: https://jamesclear.com/identity-based-habits
- Habit stacking: https://jamesclear.com/habit-stacking
- 2-Minute Rule: https://jamesclear.com/how-to-stop-procrastinating
- Goldilocks Rule: https://jamesclear.com/goldilocks-rule
- Habit tracker and "never miss twice": https://jamesclear.com/habit-tracker
- Habits Scorecard and Pointing-and-Calling: https://jamesclear.com/habits-scorecard
- Temptation bundling: https://jamesclear.com/temptation-bundling
- Marginal gains / 1%: https://jamesclear.com/marginal-gains ; https://jamesclear.com/continuous-improvement
- Goals vs systems: https://jamesclear.com/goals-systems

Evidence and critiques for Part A
- Bryan, Walton, Rogers & Dweck 2011, voter identity: https://www.pnas.org/doi/10.1073/pnas.1103343108
- Gerber, Huber, Biggers & Hendry 2016, failed replication: https://www.pnas.org/doi/10.1073/pnas.1513727113 ; Gerber 2018 second replication: https://onlinelibrary.wiley.com/doi/abs/10.1111/pops.12446 ; Bryan et al. 2016 reply: https://www.pnas.org/content/113/43/E6548
- Zhu et al. 2025, habit–identity meta-analysis: https://doi.org/10.1111/aphw.70017
- Verplanken & Sui 2019, habit and identity: https://pmc.ncbi.nlm.nih.gov/articles/PMC6635880/
- Woolley & Fishbach 2017, immediate rewards: https://journals.sagepub.com/doi/abs/10.1177/0146167216676480
- Abitz et al. 2007, mediodorsal thalamus neuron counts: https://academic.oup.com/cercor/article/17/11/2573/282081
- Milne, Orbell & Sheeran 2002, exercise implementation intentions: https://doi.org/10.1348/135910702169420
- Hollis et al. 2008, food records and weight loss: https://doi.org/10.1016/j.amepre.2008.04.013
- Thorndike et al. 2012, cafeteria choice architecture: https://doi.org/10.2105/AJPH.2011.300391
- Wilson et al. 2019, Eighty Five Percent Rule: https://www.nature.com/articles/s41467-019-12552-4
- Kotler's 4% as a "guess" (interview): https://awesomeatyourjob.com/245-getting-into-flow-repeatedly-with-steven-kotler/
- Pointing and calling, evidence trail: https://en.wikipedia.org/wiki/Pointing_and_calling ; https://www.japantimes.co.jp/news/2008/10/21/reference/jr-gestures/
- Marginal gains critique (funding, Wiggins, Tucker): https://www.anecdote.com/2024/07/the-real-secret-to-british-cyclings-success-more-than-just-marginal-gains/ ; https://www.pressreader.com/uk/the-herald-herald-sport/20170328/281921657880295
- The Behavioural Architects review (2023): https://thebearchitects.com/assets/uploads/ip/atomic-habits-review-oct-2023.pdf
- Gardner 2024, theory–reality gap in habit: https://compass.onlinelibrary.wiley.com/doi/10.1111/spc3.12975
- Gardner & Rebar 2019, Habit formation and behavior change: https://oxfordre.com/psychology/display/10.1093/acrefore/9780190236557.001.0001/acrefore-9780190236557-e-129
- Lally & Gardner 2013, Promoting habit formation: https://www.tandfonline.com/doi/abs/10.1080/17437199.2011.603640
- Singh et al. 2024, time to form a habit: https://www.mdpi.com/2227-9032/12/23/2488

Training and skill science for Part B
- Androulakis-Korakakis, Fisher & Steele 2020, minimum effective dose: https://pubmed.ncbi.nlm.nih.gov/31797219/
- Yoshida et al. 2022, daily few vs weekly many contractions: https://onlinelibrary.wiley.com/doi/abs/10.1111/sms.14220 ; press summary: https://medicalxpress.com/news/2022-08-research-shows-it-how-often.html
- Yoshida et al. 2024, weekly minimum frequency: https://link.springer.com/article/10.1007/s00421-023-05281-6
- Schoenfeld et al. 2019, frequency when volume equated: https://www.jsams.org/article/S1440-2440(18)30862-4/abstract
- Cepeda et al. 2006, distributed practice meta-analysis: https://www.yorku.ca/ncepeda/publications/CPVWR2006.html
- Cepeda et al. 2008, temporal ridgeline: https://journals.sagepub.com/doi/abs/10.1111/j.1467-9280.2008.02209.x
- Williams et al. 2017, periodised vs non-periodised: https://link.springer.com/article/10.1007/s40279-017-0734-y
- Afonso et al. 2019, back to original research: https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2019.01023/full
- Kiely 2018, periodisation's inconvenient truth: https://link.springer.com/article/10.1007/s40279-017-0823-y
- Larsen et al. 2021, autoregulation review: https://peerj.com/articles/10663/
- Greig et al. 2020, autoregulation meta-analysis: https://sportsmedicine-open.springeropen.com/articles/10.1186/s40798-021-00404-9
- Bell et al. 2023, deloading Delphi consensus: https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/ ; practitioner survey: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10948666/
- Coleman et al. 2024, one-week deload RCT: https://peerj.com/articles/16777/
- Bickel, Cross & Bamman 2011, exercise dosing to retain adaptations: https://pubmed.ncbi.nlm.nih.gov/21131862/
- Spiering et al. 2021, minimal dose to maintain: https://doi.org/10.1519/jsc.0000000000003964
- Mujika & Padilla 2000, detraining I and II: https://www.semanticscholar.org/paper/976e67d8710929b988ba84e15d4b1c10e4b09420 ; https://pubmed.ncbi.nlm.nih.gov/10999420/
- Bosquet et al. 2013, training cessation meta-analysis: https://pubmed.ncbi.nlm.nih.gov/23347054/
- Wood, Tam & Guerrero Witt 2005, changing circumstances: https://pubmed.ncbi.nlm.nih.gov/15982113/
- Verplanken & Roy 2016, habit discontinuity: https://www.sciencedirect.com/science/article/pii/S0272494415300487
- Bosquet et al. 2007, tapering meta-analysis: https://www.semanticscholar.org/paper/a41517ab5fa06b92568b861e2b1aa32b3003d214 ; 2023 endurance update: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0282838
- Buist et al. 2008, graded programme RCT: https://pubmed.ncbi.nlm.nih.gov/17940147/
- Nielsen et al. 2014, excessive progression: https://www.jospt.org/doi/10.2519/jospt.2014.5164
- Damsted et al. 2018, training load and running injuries review: https://pmc.ncbi.nlm.nih.gov/articles/PMC6253751/
- Meeusen et al. 2013, overtraining consensus: https://onlinelibrary.wiley.com/doi/10.1080/17461391.2012.730061
- Foster 1998, monotony and strain: https://www.semanticscholar.org/paper/59629df5a87418e5653956d54bf8630a102544ae
- Kellmann et al. 2018, recovery consensus: https://pubmed.ncbi.nlm.nih.gov/29345524/
- Ericsson, Krampe & Tesch-Römer 1993 (revisited 2019): https://royalsocietypublishing.org/doi/full/10.1098/rsos.190327
- Macnamara, Hambrick & Oswald 2014: https://journals.sagepub.com/doi/abs/10.1177/0956797614535810
- Macnamara, Moreau & Hambrick 2016, sports: https://journals.sagepub.com/doi/abs/10.1177/1745691616635591
- Fitts & Posner 1967 stages (summary): https://repository.nie.edu.sg/bitstreams/2d438ec0-9819-4f73-aa10-1998688de0be/download
- Fong, Zaleski & Leach 2015, challenge–skill and flow: https://www.tandfonline.com/doi/abs/10.1080/17439760.2014.967799
- Harris, Allen, Vine & Wilson 2021, flow and performance: https://www.tandfonline.com/doi/full/10.1080/1750984X.2021.1929402
- Kyllo & Landers 1995: https://journals.humankinetics.com/view/journals/jsep/17/2/article-p117.xml
- Filby, Maynard & Graydon 1999: https://www.tandfonline.com/doi/abs/10.1080/10413209908404202
- Weinberg on outcome and process goals (Healy et al. 2018 review): https://selfdeterminationtheory.org/wp-content/uploads/2019/08/2018_HealyTinckell-SmithNtoumanis_OxfordREP.pdf
- Hatzigeorgiadis et al. 2011, self-talk: https://journals.sagepub.com/doi/abs/10.1177/1745691611413136
- Holmes & Collins 2001, PETTLEP: https://www.researchgate.net/publication/27398498_The_PETTLEP_Approach_to_Motor_Imagery_A_Functional_Equivalence_Model_for_Sport_Psychologists
- Smith et al. 2007, PETTLEP vs traditional imagery: https://www.semanticscholar.org/paper/4b088f4be75aba9a3fa9bdc47c706c4967fad2ff
- Simonsmeier et al. 2021, imagery meta-analysis: https://www.tandfonline.com/doi/full/10.1080/1750984X.2020.1780627
- Rupprecht, Tran & Gröpel 2021, pre-performance routines: https://www.tandfonline.com/doi/full/10.1080/1750984X.2021.1944271
- Gabbett 2016, training–injury paradox: https://efsma.org/images/pdf/publications/Br-J-Sports-Med-2016-Gabbett-273-80.pdf
- Impellizzeri et al. 2020, ACWR pitfalls: https://journals.humankinetics.com/view/journals/ijspp/15/6/article-p907.xml ; random chronic loads (2021): https://www.researchgate.net/publication/339667279

Part C
- Dalton & Spiller 2012, implementation intentions and number of goals: https://academic.oup.com/jcr/article-abstract/39/3/600/1822636
- Cowan 2001, the magical number 4: https://www.cambridge.org/core/services/aop-cambridge-core/content/view/44023F1147D4A1D44BDC0AD226838496/S0140525X01003922a.pdf/the-magical-number-4-in-short-term-memory-a-reconsideration-of-mental-storage-capacity.pdf
- Fogg, Tiny Habits (three habits at a time): https://tinyhabits.com/
