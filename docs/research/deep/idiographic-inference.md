# Idiographic inference: ergodicity, single-case standards, and error control for the hypothesis log

Research date: 2026-09-02. Companion to `deep/adaptive-interventions.md` (**AI** §n), `coaching-framework.md` (**CF** §n), `deep/feedback-and-progress.md` (**FP**), `deep/maintenance-long-term.md` (**ML**). Evidence grade: **MA** (meta-analysis / systematic review), **RCT**, **EMP** (empirical multi-dataset), **SIM** (simulation / power study), **STD** (consensus reporting or design standard), **TH** (theory), **CALC** (arithmetic done here from the repo's own numbers).

The question this file answers: **D3 says "log every adjustment as a hypothesis, check it against the next 7 days, promote confirmed ones to the playbook." That is a within-person causal claim. Every effect size in the other 27 docs is a between-person, group-aggregated estimate. What can one person's ~90 sparse binary observations per quarter actually support?**

---

## 1. Group estimates are not descriptions of individuals

**Fisher, Medaglia & Jeronimus 2018** (**EMP**, *PNAS* 115:E6106; six repeated-measures datasets, N = 78/69/83/64/64/535, 30–925 observations per person). Verbatim: "the variance around the expected value was two to four times larger within individuals than within groups." Two ratios are reported and they differ, so the widely quoted "two to four times" needs splitting. For **univariate** distributions (means and SDs of single variables) the intraindividual SDs were "at least 3.79 times larger than the latter across all 15 variables (min ratio, 3.79:1; max ratio, 13.20:1; mean ratio, 7.85:1)." For **bivariate** associations — the relevant case for "does X change Y for me" — the spread "ranged from 2.09 to 4 times larger... (mean ratio, 2.84:1)." Conclusion: "group-derived estimates should not be considered accurate proxies of individual processes"; at best they are "expected values... accompanied by substantially greater variability than the group SD."

The theory is **Molenaar 2004** (**TH**, *Measurement* 2:201, the idiographic manifesto; 1,835 citations) and **Molenaar 2008** (**TH**, *Developmental Psychobiology* 50:60): the classical ergodic theorems permit inter- to intra-individual generalisation only when the process is *homogeneous* across people and *stationary* in time; standard inter-individual techniques "appear to be insensitive to the presence of arbitrary large degrees of inter-individual heterogeneity." A coaching process is neither homogeneous (that is the premise of personalisation) nor stationary (that is the premise of progression, `atomic-habits-and-training-science.md`). **Hamaker 2012** (in Mehl & Conner, *Handbook of Research Methods for Studying Daily Life*, 43–61) supplies the standard sign-reversal example: across people, faster typists make fewer errors; within a person, typing faster produces more errors. **Bos & Wanders 2016** (*JAMA Psychiatry* 73:411) make the same point for symptom networks — note it is a short letter, **not** the personalised-ESM-feedback paper it is sometimes cited as; that line is van der Krieke et al. 2016 (§5). Replications continue: **Andreev et al. 2025** (*J Clin Transl Sci*; 234 participants, 25 days) found "distributions of intra-individual measures were 10-fold wider than those of inter-individual correlations."

**The counterweight.** **Adolf & Fried 2019** (**TH**, *PNAS* 116:6540) reply that "ergodicity is sufficient, but not necessary, to draw inferences across levels," that the field has "shifted away from a binary conceptualization to the idea of a continuum," and that "randomization is a powerful way to condition on unobserved heterogeneity between individuals." Non-ergodicity is not a licence to ignore the population; it is a reason to *randomise* and to *pool partially* (§4).

**The defensible sentence for the Adler Method.** A meta-analytic effect size is a statement about a population average, not a prediction about a user. For the kinds of association Adler acts on, the spread of true individual values is roughly two to four times the between-person spread the meta-analysis reports (Fisher 2018). So a published *d* is admissible as a **prior with wide uncertainty and a defensible sign**, never as a claim about this person, and never as a sentence the coach says out loud ("monitoring works, so it will work for you").

---

## 2. What one person's data can actually estimate

### 2.1 The measurement, priced honestly (**CALC**)

Adler's primary within-person outcome is a 7-day done-rate: 7 binary taps. At a 70% base rate the standard error of a single week's rate is **17.3 pp**, and the standard error of the *difference between two adjacent weeks* — exactly the D3 verdict — is **24.5 pp** (18.9 / 26.7 pp at 50%; 15.1 / 21.4 pp at 80%). Daily adherence is positively autocorrelated; an AR(1) with ρ = 0.3 inflates variance 1.68× at n = 7 and 1.81× at n = 28, so the real SE on a weekly delta is nearer **30 pp**.

Treating a k-day done-rate as a *person-level score*, and assuming a between-person SD of 0.20 (to be replaced by Adler's own data), reliability R = τ²/(τ² + SE²) is:

| Window | SE of the rate | Reliability as a person score | Shrinkage toward prior |
|---|---|---|---|
| 7 days | 17.3 pp | 0.57 | 43% |
| 14 days | 12.2 pp | 0.73 | 27% |
| 28 days | 8.7 pp | 0.84 | 16% |
| 56 days | 6.1 pp | 0.91 | 9% |
| 90 days | 4.8 pp | 0.94 | 6% |

A one-week done-rate has about the reliability of a two-item questionnaire — and that is *before* item error. **Schuurman, Houtveen & Hamaker 2015** (**EMP/SIM**, *Frontiers in Psychology* 6:1038; eight women, 90–107 daily observations each) estimated that "between one third to half of the observed variance is... due to measurement error" (λ = 0.34–0.50) in daily mood diaries, and showed that ignoring it attenuates the autoregressive parameter by exactly (1 − λ): a true φ of 0.4 is recovered as 0.2. **Schuurman & Hamaker 2019** (*Psychological Methods* 24:70) generalise this to person-specific within-person reliabilities. Adler's 0–10 confidence ruler and 1–7 automaticity item are single indicators and inherit the problem.

### 2.2 Observations needed to detect a within-person effect on a 7-day done-rate (**CALC**)

Two-sided α = .05, 80% power, two-proportion test, baseline 70% done; repo effect sizes converted to percentage points via the probit link. "Weeks/arm" assumes alternating whole weeks (ABAB), so total study length is double.

| Effect the coach hopes for | pp on done-rate | Days/arm (independent) | Days/arm (ρ = 0.3) | Weeks/arm alternating | Calendar time |
|---|---|---|---|---|---|
| JITAI g = 0.15 (AI §1) | +5.0 | 1,251 | 2,267 | 324 | ~12 years |
| Tailoring g = 0.17 (AI §4) | +5.6 | ~1,000 | ~1,800 | 257 | ~10 years |
| BCT d = 0.31 (`bct-effectiveness.md`) | +9.8 | 307 | 555 | 79 | ~3 years |
| Self-monitoring d = 0.40 (CF §1) | +12.2 | 190 | 343 | 49 | ~1.9 years |
| +15 pp (large for a coaching tweak) | +15 | 121 | 219 | 31 | ~1.2 years |
| d = 0.80 (implausible for one tweak) | +20.7 | 57 | 103 | 15 | ~0.6 years |

Read the other way — **what a window can detect at 80% power** (baseline 70%): 7 or 14 days/arm → +29 pp (i.e. 70% → 99%); 28 → +27 pp; 56 → +21 pp; 90 → +17 pp.

**Verdict: the weekly one-change n-of-1 (AI implication 6) is dead as a hypothesis *test* and alive as a hypothesis *log*.** One week each side detects only effects roughly three times larger than the largest meta-analytic effect in the repo. A "help / hurt / nothing" verdict from a single 7-vs-7 comparison is a coin flip dressed as a finding.

### 2.3 The independent literature agrees, at sample sizes Adler will never have

- **Michiels, Heyvaert & Onghena 2018** (**SIM**, *Behav Res Methods* 50:557): randomization tests with randomized treatment order need **at least 20 measurement occasions** at α = .05, and that is the floor for *large* effects.
- **Michiels & Onghena 2019** (**SIM**, *Behav Res Methods* 51:2454) on randomized AB phase designs, which is structurally what D3 does: "the power of these designs is sufficient only for large treatment effects and large sample sizes"; for small effects, "researchers should turn to more complex phase designs." Type I error was controlled under unexpected linear trends.
- **Vroegindeweij et al. 2023** (**SIM**, *Behav Res Methods*, an autocorrelation-robust permutation test): "With 30 observations... sufficient power (≥ 80%) to detect medium treatment effects up to autocorrelation ≤ .45. Using 60 observations... regardless of autocorrelation. With ≥ 90 observations... small treatment effects up to autocorrelation ≤ .30." **Small within-person effects need ~90 observations even with a purpose-built test.**
- **Hedges, Shadish & Natesan Batley 2023** (**SIM**, *Behav Res Methods* 55:3494) for (AB)^k designs: high power required "an effect size of 0.75 or higher, at least one set of phase reversals (k > 1), and at least three subjects."
- Person-specific *multivariate* models are worse. **Mansueto, Wiers, van Weert, Schouten & Epskamp 2023** (**SIM**, *Psychological Methods* 28:1052): "sensitivity is low with sample sizes feasible for clinical practice (75 and 100 time points)"; they advise cutting to ~6 variables, and **Siepe, Kloft & Heck 2024** agree from a Bayesian direction. Adler must not ship a per-user "network of what drives your adherence."

### 2.4 The deeper statistical objection

**Senn 2004** (*BMJ* 329:966), **2016** (*Statistics in Medicine* 35:966) and **2019** (*Stat Methods Med Res*): "the common belief that there is a strong personal element in response to treatment is not based on sound statistical evidence." Patient-by-treatment interaction (real personalisation) is **confounded with within-patient variability** unless each condition is repeated within the person; a single crossover cannot separate "this works for me" from "that was a good week." **Hecksteden et al. 2015** (*J Appl Physiol* 118:1450) give the applied version for training: a low signal-to-noise ratio in a single case cannot be fixed by adding participants. Repeated crossover is not a refinement of the n-of-1; it is what makes it an experiment.

---

## 3. The design standards the hypothesis log fails

**WWC Single-Case Design Standards** (**STD**, Kratochwill, Hitchcock, Horner, Levin, Odom, Rindskopf & Shadish 2010, pilot technical documentation; published as Kratochwill et al. 2013, *Remedial and Special Education* 34:26). Quoted from the source document:

1. "The independent variable... must be systematically manipulated, with the researcher determining when and how the independent variable conditions change. If this standard is not met, the study Does Not Meet Evidence Standards." — Adler *does* control the change, but the user can decline or drift. Partially satisfiable.
2. "Each outcome variable must be measured systematically over time by more than one assessor... inter-assessor agreement on at least twenty percent of the data points in each condition" (≥ 0.80–0.90 percentage agreement, or κ ≥ 0.60). — **Unsatisfiable.** Adler has one self-report assessor who is also the participant and the beneficiary.
3. "The study must include at least three attempts to demonstrate an intervention effect at three different points in time or with three different phase repetitions... Examples of designs not meeting this standard include AB, ABA, and BAB designs." — Adler's weekly change is an **AB**. It does not meet the standard by construction.
4. "To Meet Standards a reversal/withdrawal (e.g., ABAB) design must have a minimum of four phases per case with at least 5 data points per phase" (3 points for "with Reservations"); alternating-treatment designs need "five repetitions of the alternating sequence."
5. Evidence of a causal relation requires "at least three demonstrations of the intervention effect along with no non-effects," verified by two certified reviewers.

**SCRIBE 2016** (**STD**, Tate, Perdices, Rosenkoetter et al., *Physical Therapy* 96:e1 plus five parallel journals; 26 items, two Delphi rounds and a consensus meeting) and **CENT 2015** (**STD**, Vohra, Shamseer, Sampson et al., *BMJ* 350:h1738; 25 items, two-round Delphi; E&E in Shamseer et al. 2016) are the reporting counterparts; both require the randomisation scheme, washout, carryover and the handling of dependency to be stated. **Onghena & Edgington 1994** (*Behav Res Ther* 32:783) and **2005** (*Clin J Pain* 21:56) supply the one idea that transfers wholesale: if the *timing or order* of the change is randomised by the system, a randomization test has an exact Type I error rate with no distributional or independence assumption.

**What survives inside a consumer product**

| Standard | Survives? | How |
|---|---|---|
| Randomisation / counterbalancing | **Yes** | Randomise *which week* a change starts within a 2-week window, or which of two eligible moves is tried first. Costs the user nothing; buys an exact randomization test. Extends AI implication 8. |
| Repeated crossover (ABAB) | **Partly** | Only for reversible, low-stakes moves (cue time, wording, review day). Never for shrink/grow, which are ratchets. |
| Washout | **Rarely** | Carryover is the *point* of habit formation. Substitute: void the first 2 days after a change and state that carryover is unhandled. |
| Autocorrelation handling | **Yes, cheaply** | Never test a weekly delta assuming independence; apply the ρ = 0.3 variance inflation by default, or permute the daily series. |
| Multiple assessors / IOA | **No** | Self-report is the design. This alone caps every Adler finding below WWC "Meets Standards with Reservations". |
| Three demonstrations at three time points | **Yes, slowly** | The same move re-tried three times: 6+ weeks minimum, repeatable moves only. |

**The honest label.** A rule promoted after one or two 7-day AB comparisons, self-assessed, without randomisation, washout or autocorrelation handling, is in WWC terms a design that **Does Not Meet Evidence Standards** and in SCRIBE/CENT terms an uncontrolled case observation. The correct user-facing words are **"a pattern in your data"** or **"worth trying again"** — never "works for you", "we've learned that", "your data shows", or "this is your rule". The schema field is `status: observed | replicated | randomised`, not `confirmed: true`.

---

## 4. Error control: 52 verdicts a year, and what pooling buys

### 4.1 The multiplicity arithmetic (**CALC**)

Under the exact null (no true effect; both weeks Binomial(7, 0.7)), P(week 2 rate > week 1 rate) = **0.385** and P(tie) = 0.230. Therefore:

| Current promotion rule (AI implications 5–6) | Chance per opportunity | Opportunities per user-year | Expected **false** playbook entries per user-year |
|---|---|---|---|
| Single direction-only verdict | 0.385 | 52 | **20.0** |
| "Two consistent verdicts" | 0.148 | 26 | **3.9** |
| "Same move tried ≥ 3 times, same direction" | 0.057 | 17 | **1.0** |

The ≥ 3 rule is roughly ten times safer than the ≥ 2 rule and is the only one that keeps expected false discoveries near one per year — before counting the "confirmations" that will be real-but-tiny effects the coach then over-generalises. Neither rule has any false-discovery-rate control in the sense of Benjamini & Hochberg 1995 (*JRSS-B* 57:289), and BH applied to 52 correlated, ill-powered weekly tests would reject essentially nothing.

### 4.2 The Bayesian route is right, and the repo already uses it

**Gelman, Hill & Yajima 2012** (*J Research on Educational Effectiveness* 5:189; see also Lindquist & Gelman 2009): a multilevel model with a population prior shrinks each unit's estimate toward the group, controlling Type S (sign) errors without a separate correction, because the extreme estimates that drive false discoveries are exactly the ones shrinkage pulls in. Applied precedent is already in the repo — **Tomkins et al. 2021** (IntelligentPooling, 26% lower regret than fully pooled or fully individual policies) and **Trella et al. 2024** (Oralytics chose full pooling because simulation beat per-user models), AI §3. The n-of-1 literature got there first: **Zucker et al. 1997** (*J Clin Epidemiol* 50:401) and **Zucker, Ruthazer & Schmid 2010** (63:1312) combine series of n-of-1 trials in hierarchical Bayesian models where "treatment effect estimates adjust between population estimate and individual results based on within- and between-patient heterogeneity"; precision improves but is "highly sensitive to within-patient variance priors."

**How much of one week's delta should survive (CALC).** With a between-person SD of a coaching move's *true effect* of 8 pp (an assumption, to be re-estimated from Adler's data), the weight on the user's own observed delta is:

| Exposure | SE of the delta | Weight on the user's own data |
|---|---|---|
| 1 week/arm | 24.5 pp | **0.10** |
| 2 weeks/arm | 17.3 pp | 0.18 |
| 4 weeks/arm | 12.2 pp | 0.30 |
| 8 weeks/arm | 8.7 pp | 0.46 |

Ninety per cent of a single week's apparent result is noise that should be discarded before it touches the playbook. The contrast with a flat prior is stark: with Beta(1,1) priors and *zero* true effect, an ordinary run of luck (7/7 after 5/7) yields P(the change helped) = **0.90**, which a binary rule reads as a confirmed personal rule. The same data under a shrinkage prior moves the playbook by 2 pp.

---

## 5. The instrument is also the intervention, and its meaning drifts

**Reactivity.** **French & Sutton 2010** (**narrative review**, *BJHP* 15:453) is the canonical statement that measurement procedures alter "subsequent cognition, emotion, and behaviour," with "effects obtained... of up to medium size," and that moderators are unquantified. Three meta-analyses bracket the quantified version, the question-behaviour effect:

- **Rodrigues, O'Brien, French, Glidewell & Sniehotta 2015** (**MA**, *Health Psychology* 34:61; k = 41, 33 in the primary analysis): SMD = **0.09** (95% CI 0.04–0.13), with "moderate heterogeneity, variable risk of bias, and evidence of publication bias."
- **Wilding, Conner, Sandberg, Prestwich, Lawton, Wood, Miles, Godin & Sheeran 2016** (**MA**, *European Review of Social Psychology* 27:196; k = 66, 94 tests): g = **0.14** (0.11–0.18), and effects were "smaller in more carefully controlled studies that exhibit less risk of bias."
- **Wood, Conner, Miles, Sandberg, Taylor, Godin & Sheeran 2016** (**MA**, *Personality and Social Psychology Review* 20:245; 116 tests): d+ = **0.24**, larger for easy and socially desirable behaviours.

The range across the three is 0.09–0.24, and the ordering is informative: the better-controlled the synthesis, the smaller the effect. **Asking is a real but small intervention (g ≈ 0.09–0.14)**, which is good news twice — the daily tap makes a genuine if modest contribution of its own (consistent with Harkin's d = 0.40 for monitoring, CF §1), and it is too small to invalidate the record. Direct EMA reactivity tests are mostly null: Hatwan et al. 2026 (*Psychology of Addictive Behaviors*; 240 comparisons over 6 months, one significant — "a pattern consistent with chance variation") and Franzen & Lenferink 2025 (null), against Maher et al. 2024 (early-study inflation of movement and intentions) and König et al. 2026 (preprint: "dietary EMA is not a neutral observational process"). The residual risk is **front-loaded**: weeks 1–2 of any new tap are inflated and must not serve as a baseline.

**Response shift.** **Sprangers & Schwartz 1999** (**TH**, *Soc Sci Med* 48:1507) define response shift as change in "internal standards, values and the conceptualization" of the construct — recalibration, reprioritisation, reconceptualisation; **Vanier et al. 2021** (*Quality of Life Research* 30:3309) restate it as present "whenever observed change... is not fully explained by target change." **Schwartz, Bode, Repucci, Becker, Sprangers & Fayers 2006** (**MA**, *Quality of Life Research* 15:1533; 26 studies, 19 usable) put mean absolute effect sizes at 0.32 (fatigue), 0.30 (global QoL), 0.24 (physical role), 0.12 (psychological well-being), 0.08 (pain), with directions that "cancel out when aggregated" — person-specific in sign, the idiographic problem again. **Schwartz et al. 2022** supply the reframe to adopt: "if it's information, it's not 'bias'." **Ortega-Gómez et al. 2022** (**SR**, *HQLO* 20:20) find the **then-test** the most-used detection method (41 studies), ahead of Oort's SEM (35).

Consequence for CF §6: a 0–10 confidence ruler read at week 1 and week 12 is not two readings of one scale. A user whose standard of "confident" rises with competence can improve and report a lower number. The absolute cut-points — **< 7 shrink, ≥ 8 grow** — are not comparable across months for one person.

**Goodhart.** The tap is simultaneously the intervention, the outcome and the thing the coach optimises. Campbell 1979 (*Evaluation and Program Planning* 2:67) and Strathern 1997 (*European Review* 5:305, source of the modern "when a measure becomes a target" phrasing) are the theory; there is no trial. Concrete risks: shrinking an action until "done" is trivially true (a legitimate coaching move *and* a gaming move, indistinguishable in the data), tapping yes for a part-done action, and abandoning goals whose actions are hard to tap. The only defence is a second, non-tap outcome — the Goal Attainment Scaling delta (CF §6).

**The null that keeps everyone honest.** **Bastiaansen, Ornée, Meurs & Oldehinkel 2022** (**RCT**, *Psychological Medicine*; ZELF-i, N = 161 outpatients, 28 days of 5×/day self-monitoring, two personalised-feedback modules vs control): "The experimental groups did not show significantly more or faster changes over time than the control group in terms of depressive symptoms, social functioning, and empowerment." Positive counterexamples are smaller (Suen et al. 2022, N = 124, greater DASS-21 decline; van Knippenberg et al. 2018, N = 76, momentary negative affect only). Honest reading: **personalised feedback from a person's own data is a plausible, unproven adjunct — its value is engagement and insight, not a demonstrated outcome gain.**

---

## Evidence table

| Finding | Source | Design, n | Effect | Status |
|---|---|---|---|---|
| Within- vs between-person variance | Fisher 2018 | EMP, 6 datasets, N = 78–535 | bivariate 2.09–4× (mean 2.84×); univariate 3.79–13.2× (mean 7.85×) | Replicated (Andreev 2025, 10×); qualified by Adolf & Fried 2019 |
| Ergodicity needs homogeneity + stationarity | Molenaar 2004, 2008 | TH | — | Foundational; 1,835 citations |
| Ergodicity sufficient, not necessary | Adolf & Fried 2019 | TH (PNAS comment) | randomisation conditions on heterogeneity | Accepted qualification |
| Measurement error in daily single items | Schuurman 2015 | EMP/SIM, 8 people × 90–107 obs | λ = 0.34–0.50; AR attenuated by (1 − λ) | Extended by Schuurman & Hamaker 2019 |
| Idiographic network sensitivity | Mansueto 2023 | SIM, T = 75/100 | "sensitivity is low"; cut to ~6 variables | Concordant (Siepe 2024) |
| Randomized AB phase design power | Michiels & Onghena 2019; Michiels 2018 | SIM | large effects only; ≥ 20 measurement occasions | Directly applicable to D3 |
| Autocorrelation-robust SCD power | Vroegindeweij 2023 | SIM | 30 obs → medium (ρ ≤ .45); 60 → medium always; ≥ 90 → small (ρ ≤ .30) | Best available benchmark |
| (AB)^k power | Hedges 2023 | SIM | needs ES ≥ 0.75, k > 1, ≥ 3 subjects | |
| Individual response confounded with noise | Senn 2004, 2016, 2019 | TH/stat | personal response "not based on sound statistical evidence" | Contested but unrefuted |
| WWC SCD design standards | Kratochwill 2010/2013 | STD | AB "Does Not Meet"; ABAB ≥ 4 phases × ≥ 5 points; IOA on ≥ 20% | Field standard |
| SCRIBE / CENT reporting | Tate 2016; Vohra 2015 | STD | 26 items / 25 items, Delphi | Field standards |
| Randomization tests, exact Type I error | Onghena & Edgington 1994, 2005 | TH/stat | assumption-free if timing randomised | Implementable |
| Hierarchical pooling of n-of-1 series | Zucker 1997, 2010, 2006 | Method + 58 patients | precision gain; sensitive to within-patient variance prior | Matches AI §3 pooling result |
| Shrinkage in place of multiplicity correction | Gelman, Hill & Yajima 2012 | TH/stat | controls Type S errors | Widely adopted |
| SE of a 7-day done-rate delta | CALC | p = 0.7, 7+7 days | 24.5 pp (30 pp at ρ = 0.3) | Arithmetic |
| Days for a d = 0.31 within-person effect | CALC | 70% → 80% | 307 days/arm; 555 at ρ = 0.3 (~3 years) | Arithmetic |
| False playbook entries under current rules | CALC | null, Binomial(7, 0.7) | 2 verdicts → 3.9/yr; 3 same-direction → 1.0/yr | Arithmetic |
| Question-behaviour effect | Rodrigues 2015; Wilding 2016; Wood 2016 | MA, k = 41 / 66 / 116 tests | SMD 0.09 (.04–.13); g 0.14 (.11–.18); d+ 0.24 | Smaller in lower-RoB syntheses |
| Measurement reactivity, general | French & Sutton 2010 | Narrative review | "up to medium size" | Not quantified |
| EMA reactivity, direct tests | Hatwan 2026; Franzen 2025; Maher 2024 | EMP | mostly null; early-study inflation where present | Favours "small and front-loaded" |
| Response shift effect sizes | Schwartz 2006 | MA, 26 studies (19 usable) | 0.32 fatigue, 0.30 global QoL, 0.24 role, 0.12 well-being, 0.08 pain; signs cancel | "No definitive conclusion" |
| Response shift definition; then-test | Sprangers & Schwartz 1999; Vanier 2021; Ortega-Gómez 2022 | TH / SR | change not explained by target change; then-test most used (41 studies) | Consensus; implementable |
| Personalised ESM feedback → outcomes | Bastiaansen 2022 (ZELF-i) | RCT, n = 161 | null on symptoms, functioning, empowerment | Countered by smaller positive trials |

---

## Implications for Adler

**A. Replace binary promotion rules with a posterior and a visible "not enough data yet" state.** A playbook entry becomes `{move, context, P(helps me), posterior median effect in pp, exposures, status}`; the default status is **"not enough data yet"** and it must be shown, not hidden. Promote to "worth keeping" only at **P ≥ 0.90 AND posterior median ≥ 5 pp AND ≥ 4 exposures on each side**. Keep "≥ 3 same-direction" as the minimum gate and **retire "two consistent verdicts"** — on its own it manufactures ~3.9 spurious personal rules per user-year against ~1.0 for the ≥ 3 rule.

**B. Run an explicit Bayesian false-discovery budget.** Expected false entries = Σ(1 − Pᵢ) over promoted entries; hold that sum **below 1 per rolling 12 months** per user. That caps the playbook at roughly five to eight entries a year, which is also the right number for a person to hold. Entries expire after 6 months without re-confirmation.

**C. Partial pooling is the estimator, not per-user significance testing.** Every playbook parameter is a population prior plus a user-level random effect (Gelman 2012; Zucker 2010; the Tomkins/Oralytics precedent, AI §3). One week of a user's own data should move an estimate by ~10% of the observed delta, four weeks by ~30%, eight weeks by ~46%. This formalises ML's "after two logged slides, the user's own signature outranks the prior" — and shows two slides is too few.

**D. Randomise what is free to randomise.** Where two options are both acceptable (two wordings, two cue times, review Sunday vs Monday, send vs hold a mid-week nudge), let the system pick at random and record the seed. This is the one WWC/CENT criterion Adler can fully satisfy, it costs the user nothing, it buys an exact randomization test, and it is the only route to a defensible causal claim about Adler's own coaching. Extends AI implication 8 from messages to *moves*.

**E. Never state a personal rule as fact in the weekly review.** Permitted: "Both times you moved this to the morning, the week after was better — want to try it a third time?" Prohibited: "Mornings work for you", "your data shows", "we've learned you're a morning person". Every playbook statement carries its exposure count in plain words ("twice so far"). This is FP §8A's schema (record → process → one how-to) with an uncertainty slot added.

**F. Make the confidence gate within-person relative.** Because the ruler recalibrates, CF Phase 6's absolute cut-points are not comparable across months. Replace with: **shrink when confidence is ≥ 2 points below that user's own trailing 8-week median, or below 5 absolute; grow when it is at or above their own median AND ≥ 8 absolute AND the user asks.** Absolute numbers become floors; the personal median carries the signal.

**G. Ship an anchoring test for scale drift.** Two one-tap instruments:
1. **Fixed anchor, monthly, invariant referent:** "0–10, how confident are you that you could do a two-minute version of this every day next week?" The referent never changes, so movement is capability change or recalibration.
2. **Then-test, quarterly:** "Thinking back to three months ago — what would you say your confidence was *then*?", compared with the stored contemporaneous value (Ortega-Gómez 2022: the field's most-used method).
   Rule: if the retrospective and recorded ratings differ by **≥ 2 points** in the same direction on two consecutive quarters, flag recalibration, re-baseline the ruler, and refuse to draw a trend line across that boundary. Then coach it as information (Schwartz 2022): "Three months ago you'd have called this an 8. You call it a 6 now, and you're doing more. What changed about what confident means to you?"

**H. Protect the outcome from Goodhart.** Never let the tap alone decide a change that alters the action's size — a shrink that raises the done-rate is uninformative by construction. Pair every done-rate verdict with the GAS delta and the automaticity item, and add one integrity question after any shrink: "Is the smaller version still worth doing?"

**I. Treat weeks 1–2 of any new tap as inflated, never as a baseline.** Reactivity is small (g ≈ 0.09–0.14) but front-loaded (Maher 2024). Baselines start at day 15, or use the pre-existing behaviour reported at intake (FP §8E already counts it as progress).

**J. No per-user network, bandit or trend line before ~90 observations.** Mansueto 2023 and Vroegindeweij 2023 converge on ~90 as the point where a *small* within-person effect becomes detectable at all — one quarter of daily taps for one action. Before that the coach reasons from the population prior plus the user's stated context, and says so.

**K. Questions to add.** Weekly, after any change: "Compared with a normal week for you, was this week unusual?" (a cheap void flag; AI implication 6 already voids illness and travel). Quarterly: the then-test above. Monthly: "Which of the things we've kept doing actually matters?" — the user's own attribution is the only cheap source of the *sign* of an effect too small to detect.

**L. What to avoid.** "Your data shows" attached to fewer than four exposures. A 12-week trend line through a self-anchored 0–10 item with no drift check. Any per-user model with more than about six parameters. Applying a published *d* to a specific user in copy or in the coach's voice. Confusing the hypothesis log's *usefulness* (it structures the coach's memory and the user's reflection) with its *evidential status* (near zero for any single entry).

---

## Conflicts and open questions

1. **How fatal is non-ergodicity?** Fisher 2018 ("group-derived estimates should not be considered accurate proxies") vs Adolf & Fried 2019 ("sufficient, but not necessary... a continuum"). The evidence favours the middle: group estimates are legitimate *priors* with much wider uncertainty than published, and randomisation restores cross-level inference. Follow Adolf & Fried (randomise, pool partially), not the strong reading (discard the priors).
2. **Is per-person response even real?** Senn 2016 argues most apparent personal response is within-person noise plus regression to the mean; Fisher 2018 argues heterogeneity is enormous. These are compatible — noise is exactly what produces heterogeneity in *observed* individual estimates — and the disagreement is a variance decomposition only repeated crossovers can settle. Adler will not settle it. Practical consequence: assume the true between-person SD of a move's effect is *small* (8 pp in §4.2 may be generous), which makes shrinkage stronger, not weaker.
3. **Does personalised feedback help at all?** ZELF-i (n = 161, null) vs Suen 2022 (n = 124, positive) vs van Knippenberg 2018 (n = 76, momentary affect only). Favour the null-leaning reading: the value is engagement and reflection, which FP §8C already justifies through the after-action-review literature (d = 0.67–0.79), not the personalisation itself.
4. **Reactivity size.** French & Sutton 2010 ("up to medium") vs Rodrigues 2015 (0.09) vs Wood 2016 (0.24). Favour the better-controlled syntheses (0.09–0.14); the ordering — smaller effects at lower risk of bias — is itself the evidence.
5. **Response shift in a non-clinical population is unmeasured.** Every effect size in Schwartz 2006 comes from patients facing a health catalyst. A 22-year-old improving at a habit is a different catalyst; the direction (rising internal standards) should be the same, the magnitude is unknown. Adler's own then-test data would be the first evidence.
6. **τ = 0.20 (done-rate) and 0.08 (move effect) are assumptions, not findings.** Both are estimable from the first few hundred users and both change every threshold in §4. Re-run §2.1 and §4.2 with real τ before the promotion thresholds ship as final; this is the highest-value analysis in release one.
7. **Does the tap's own value (Harkin d = 0.40, QBE g ≈ 0.14) exceed the coach's adaptive value (JITAI g = 0.15)?** If so, the instrument is the intervention and personalisation is decoration. No study separates them. Randomising a subset to tap-only for four weeks, weekly review held constant, would be the most informative experiment in the product.
8. **Is "not enough data yet" tolerable to an optimizer audience?** D4's users want answers; "twice so far, too early to call" may read as weak rather than honest. A copy and product test, not a research question, but it decides whether the statistics survive contact with the UI.

---

## Sources

- Fisher, Medaglia & Jeronimus 2018, *PNAS* 115:E6106, lack of group-to-individual generalizability: https://pmc.ncbi.nlm.nih.gov/articles/PMC6142277/ (DOI 10.1073/pnas.1711978115)
- Adolf & Fried 2019, *PNAS* 116:6540, ergodicity sufficient but not necessary: https://pmc.ncbi.nlm.nih.gov/articles/PMC6452692/
- Molenaar 2004, *Measurement* 2:201, A Manifesto on Psychology as Idiographic Science: https://doi.org/10.1207/s15366359mea0204_1 (abstract not retrievable; title, venue and 1,835 citations verified via Semantic Scholar)
- Molenaar 2008, *Developmental Psychobiology* 50:60, implications of the classical ergodic theorems: https://pubmed.ncbi.nlm.nih.gov/18085558/
- Hamaker 2012, "Why researchers should think within-person", in Mehl & Conner (eds), *Handbook of Research Methods for Studying Daily Life*, 43–61 (book chapter; not open access, cited for the paradigm argument and the typing-speed example)
- Bos & Wanders 2016, *JAMA Psychiatry* 73:411, Group-Level Symptom Networks in Depression: https://pubmed.ncbi.nlm.nih.gov/26914967/
- Andreev et al. 2025, *J Clin Transl Sci*, lack of group-to-individual generalizability in LUTS: https://pmc.ncbi.nlm.nih.gov/articles/PMC12444718/
- Mattoni et al. 2025, *Neurosci Biobehav Rev*, group-to-individual generalizability in cognitive neuroscience: https://pmc.ncbi.nlm.nih.gov/articles/PMC11835466/
- Schuurman, Houtveen & Hamaker 2015, *Frontiers in Psychology* 6:1038, measurement error in n = 1 autoregressive modeling: https://pmc.ncbi.nlm.nih.gov/articles/PMC4516825/
- Schuurman & Hamaker 2019, *Psychological Methods* 24:70, measurement error and person-specific reliability: https://pubmed.ncbi.nlm.nih.gov/30188157/
- Mansueto, Wiers, van Weert, Schouten & Epskamp 2023, *Psychological Methods* 28:1052, feasibility of idiographic network models: https://pubmed.ncbi.nlm.nih.gov/34990189/
- Siepe, Kloft & Heck 2024, *Psychological Methods*, Bayesian estimation of idiographic network models: https://pubmed.ncbi.nlm.nih.gov/39347772/
- Epskamp, Waldorp, Mõttus & Borsboom 2018, *Multivariate Behavioral Research* 53:453, Gaussian graphical model in cross-sectional and time-series data: https://pubmed.ncbi.nlm.nih.gov/29658809/
- Constantin, Schuurman & Vermunt 2026, *Psychological Methods*, Monte Carlo sample size for network models (`powerly`): https://pubmed.ncbi.nlm.nih.gov/37428726/
- Michiels, Heyvaert & Onghena 2018, *Behav Res Methods* 50:557, conditional power of randomization tests: https://pubmed.ncbi.nlm.nih.gov/28389851/
- Michiels & Onghena 2019, *Behav Res Methods* 51:2454, randomized single-case AB phase designs: https://pubmed.ncbi.nlm.nih.gov/30022457/
- Vroegindeweij et al. 2023, *Behav Res Methods*, Permutation Distancing Test for dependent AB data: https://pubmed.ncbi.nlm.nih.gov/37528291/
- Hedges, Shadish & Natesan Batley 2023, *Behav Res Methods* 55:3494, power analysis for (AB)^k designs: https://pubmed.ncbi.nlm.nih.gov/36223007/
- Bouwmeester & Jongerling 2020, *PLoS ONE* 15:e0228355, power of a randomization test in multiple-baseline AB: https://pubmed.ncbi.nlm.nih.gov/32027683/
- Lafit, Artner & Ceulemans 2024, *Behav Res Methods*, analytical power for multilevel models with autocorrelated errors: https://pubmed.ncbi.nlm.nih.gov/39009823/
- Revol, Lafit & Ceulemans 2024, *Behav Res Methods*, sample-size planning for person-specific VAR(1): https://pubmed.ncbi.nlm.nih.gov/38717682/
- Senn 2004, *BMJ* 329:966, individual response to treatment — is it a valid assumption?: https://pubmed.ncbi.nlm.nih.gov/15499115/
- Senn 2016, *Statistics in Medicine* 35:966, Mastering variation: variance components and personalised medicine: https://pubmed.ncbi.nlm.nih.gov/26415869/
- Senn 2019, *Stat Methods Med Res*, sample size considerations for n-of-1 trials: https://pubmed.ncbi.nlm.nih.gov/28882093/
- Araujo, Julious & Senn 2016, *PLoS ONE* 11:e0167167, understanding variation in sets of N-of-1 trials: https://pubmed.ncbi.nlm.nih.gov/27907056/
- Hecksteden et al. 2015, *J Appl Physiol* 118:1450, individual response to exercise training — a statistical perspective: https://pubmed.ncbi.nlm.nih.gov/25663672/
- Kratochwill, Hitchcock, Horner, Levin, Odom, Rindskopf & Shadish 2010, WWC Single-Case Design Technical Documentation v1.0 (pilot): https://ies.ed.gov/ncee/wwc/Docs/ReferenceResources/wwc_scd.pdf ; published as Kratochwill et al. 2013, *Remedial and Special Education* 34:26 (DOI 10.1177/0741932512452794)
- Tate, Perdices, Rosenkoetter et al. 2016, SCRIBE 2016 statement, *Physical Therapy* 96:e1 (and parallel journals): https://pubmed.ncbi.nlm.nih.gov/27371692/
- Vohra, Shamseer, Sampson et al. 2015, CENT 2015 statement, *BMJ* 350:h1738: https://pubmed.ncbi.nlm.nih.gov/25976398/
- Shamseer, Sampson, Bukutu et al. 2016, CENT 2015 explanation and elaboration, *J Clin Epidemiol* 76:18: https://pubmed.ncbi.nlm.nih.gov/26272791/
- Onghena & Edgington 1994, *Behaviour Research and Therapy* 32:783, randomization tests for restricted alternating treatments designs: https://pubmed.ncbi.nlm.nih.gov/7980365/
- Onghena & Edgington 2005, *Clinical Journal of Pain* 21:56, customization of pain treatments — single-case design and analysis: https://pubmed.ncbi.nlm.nih.gov/15599132/
- Zucker, Schmid, McIntosh, D'Agostino, Selker & Lau 1997, *J Clin Epidemiol* 50:401, combining single-patient trials: https://pubmed.ncbi.nlm.nih.gov/9179098/
- Zucker, Ruthazer & Schmid 2010, *J Clin Epidemiol* 63:1312, combining individual (N-of-1) trials: https://pubmed.ncbi.nlm.nih.gov/20863658/
- Zucker, Ruthazer, Schmid et al. 2006, *J Rheumatology*, lessons learned combining N-of-1 trials in fibromyalgia: https://pubmed.ncbi.nlm.nih.gov/17014022/
- Gelman, Hill & Yajima 2012, *J Research on Educational Effectiveness* 5:189, why we (usually) don't have to worry about multiple comparisons: https://doi.org/10.1080/19345747.2011.618213
- Lindquist & Gelman 2009, *Perspectives on Psychological Science* 4:310, correlations and multiple comparisons: https://pubmed.ncbi.nlm.nih.gov/26158969/
- Benjamini & Hochberg 1995, *JRSS Series B* 57:289, controlling the false discovery rate: https://doi.org/10.1111/j.2517-6161.1995.tb02031.x
- French & Sutton 2010, *British Journal of Health Psychology* 15:453, reactivity of measurement in health psychology: https://pubmed.ncbi.nlm.nih.gov/20205982/
- Rodrigues, O'Brien, French, Glidewell & Sniehotta 2015, *Health Psychology* 34:61, the question-behavior effect — genuine or spurious?: https://pubmed.ncbi.nlm.nih.gov/25133835/
- Wilding, Conner, Sandberg et al. 2016, *European Review of Social Psychology* 27:196, QBE theoretical and methodological review and meta-analysis: https://doi.org/10.1080/10463283.2016.1245940
- Wood, Conner, Miles, Sandberg, Taylor, Godin & Sheeran 2016, *Personality and Social Psychology Review* 20:245, impact of asking intention or self-prediction questions: https://pmc.ncbi.nlm.nih.gov/articles/PMC4931712/
- Hatwan et al. 2026, *Psychology of Addictive Behaviors*, assessment reactivity over six months of EMA: https://pubmed.ncbi.nlm.nih.gov/42606857/
- Maher et al. 2024, *J for the Measurement of Physical Behaviour* 7, measurement reactivity in movement behaviours: https://doi.org/10.1123/jmpb.2023-0035
- Sprangers & Schwartz 1999, *Social Science & Medicine* 48:1507, integrating response shift into HRQoL research: https://pubmed.ncbi.nlm.nih.gov/10400253/
- Schwartz, Bode, Repucci, Becker, Sprangers & Fayers 2006, *Quality of Life Research* 15:1533, meta-analysis of response shift: https://pubmed.ncbi.nlm.nih.gov/17031503/
- Vanier, Oort, McClimans et al. 2021, *Quality of Life Research* 30:3309, response shift — definition, theory, revised model: https://pmc.ncbi.nlm.nih.gov/articles/PMC8602159/
- Schwartz, Rohde, Biletch et al. 2022, *Quality of Life Research* 31:2247, "if it's information, it's not 'bias'": https://pubmed.ncbi.nlm.nih.gov/34705159/
- Ortega-Gómez, Vicente-Galindo, Martín-Rodero & Galindo-Villardón 2022, *Health and Quality of Life Outcomes* 20:20, detection of response shift — systematic review: https://pmc.ncbi.nlm.nih.gov/articles/PMC8818219/
- Bastiaansen, Ornée, Meurs & Oldehinkel 2022, *Psychological Medicine* 52:2331, ZELF-i RCT of ecological momentary intervention modules: https://pubmed.ncbi.nlm.nih.gov/33315003/
- Suen et al. 2022, *Psychiatry Research*, brief personalized feedback from momentary data, RCT: https://pubmed.ncbi.nlm.nih.gov/37732870/
- van Knippenberg, de Vugt, Ponds, Myin-Germeys & Verhey 2018, *Am J Geriatric Psychiatry*, ESM intervention RCT: https://pubmed.ncbi.nlm.nih.gov/30126766/
- van der Krieke et al. 2016, *Int J Methods in Psychiatric Research*, HowNutsAreTheDutch crowdsourced ESM with personalised feedback: https://pmc.ncbi.nlm.nih.gov/articles/PMC6877205/
- Campbell 1979, *Evaluation and Program Planning* 2:67, assessing the impact of planned social change (Campbell's law): https://doi.org/10.1016/0149-7189(79)90048-X
- Strathern 1997, *European Review* 5:305, "Improving ratings": audit in the British University system (source of the modern Goodhart phrasing): https://doi.org/10.1002/(SICI)1234-981X(199707)5:3<305::AID-EURO184>3.0.CO;2-4
