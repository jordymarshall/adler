# Scientific disclosure in Adler's product experience

Research notes, 7 September 2026. Proposals for product review and later grilling; no implementation or claim of user validation. The [current Adler Method](../method/adler-method.md) and [input–outcome contract](../input-outcome-coaching.md) remain authoritative for coaching behavior.

## Recommendation

Make the scientific basis useful at the moment someone decides what to do: a suggested action, a changed plan, a projection or an emerging insight. The primary screen should answer **what is happening, why it matters to me, what is uncertain, and what I can do**. Deeper explanations should help someone verify that answer. An isolated methodology page can support this experience, but cannot supply the missing context for an individual recommendation.

This is our product inference from the sources below. The objective is better understanding and appropriate reliance, rather than a stronger impression of scientific authority.

## Evidence and guidance that matter

- **Explanation can persuade without improving decisions.** Bansal et al.'s CHI 2021 studies used sentiment classification and question-answering tasks. Explanations increased acceptance of AI recommendations regardless of correctness and did not improve complementary team performance over the study's confidence baseline. This does not show that all explanations are harmful, nor that the result transfers directly to coaching. It does show why explanation usefulness must be tested separately from trust ratings. [Original paper](https://www.microsoft.com/en-us/research/uploads/prod/2021/02/does_the_whole_exceed_its_parts-chi21.pdf)
- **Support understanding, correction and cautious adaptation throughout use.** Microsoft's HAI guidelines cover capabilities and limits, relevant information, easy correction/dismissal, narrowing service when uncertain, access to explanations, feedback consequences and global controls. Their scope spans first use and later adaptation. [Microsoft Research: HAI guidelines](https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction-design/)
- **Make verification easier.** Microsoft's 2025 framework separates realistic mental models, signals about when to verify, and practical verification support. It warns that explanations and the mere presence of citations can increase trust even when outputs are wrong. It is research-informed design guidance for grounded generative systems, not proof of Adler's reliability. [Overreliance framework](https://learn.microsoft.com/en-us/ai/playbook/technology-guidance/overreliance-on-ai/overreliance-on-ai)
- **Explain the decision in context.** Google PAIR distinguishes general system explanations from explanations of a particular output, supports partial/progressive explanations, and cautions that numerical confidence may distract or mislead. It recommends testing whether confidence information helps the user's decision. [Explainability + Trust](https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/)
- **Explain what feedback changes.** PAIR advises making data use and feedback impact understandable, including when changes take effect, and supporting editing and control. For Adler, saving personal context or revising a plan must not be described as instantly retraining the underlying model. [Feedback + Control](https://pair.withgoogle.com/guidebook-v2/chapter/feedback-controls/)
- **Readable reasons and correct reasons are separate requirements.** NIST distinguishes explanation, meaningfulness, explanation accuracy and knowledge limits. Its AI RMF also states that transparency does not itself establish accuracy, privacy, security or fairness. These are guidance frameworks, not efficacy certification. [NISTIR 8312](https://nvlpubs.nist.gov/nistpubs/ir/2021/NIST.IR.8312.pdf), [AI RMF trustworthiness characteristics](https://airc.nist.gov/airmf-resources/airmf/3-sec-characteristics/)
- **Keep essential meaning visible.** NN/g recommends disclosing important information first, with obvious access to secondary detail. GOV.UK explicitly advises against hiding information most users need. These guidelines support a readable summary with optional evidence detail, rather than hiding every qualification behind a generic “Learn more.” [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [GOV.UK Details](https://design-system.service.gov.uk/components/details/)

## Keep six different questions separate

The following is a proposed Adler information model for the review, not a new numerical scoring system.

| Dimension | What it answers | Suitable representation | Must not imply |
| --- | --- | --- | --- |
| Personal evidence | What did this person actually report or verify? | Dated reports, quantities, context and links; distinguish repeated reports from independent occasions | That a reported association establishes a cause or permanent trait |
| Literature strength and fit | What supports this technique, and for whom? | Existing research grade, studied population, mechanism, relevant limitation and original source | That a strong population study proves this user's response or validates the whole app |
| Working explanation | Why might this be happening here? | Tentative explanation, competing possibility, observable prediction and review question | That fluent reasoning is a fact or a faithful trace of the model's internal computation |
| Data completeness | What is measured, missing or stale? | Last report date, covered period, missing quantity or conflicting record | That no report means no action, or that calendar presence proves completion |
| Projection assumptions | What future follows if these inputs and relationships hold? | Observed versus projected marks, forward range, input/conversion assumptions and missing-model state | A calibrated success probability, causal return or automatic deadline change |
| System reliability and authority | What can the product do reliably, and what may it act on? | Honest capability/limitation information; proposed/saved/booked state; connected-data and automation controls | That citations imply correctness, or that permission to read data authorizes every write |

Do not collapse these dimensions into “87% confidence,” “scientifically verified,” a global reliability badge, or a red/amber/green personal score. A single number would obscure which question is unresolved. Adler currently has no calibrated personal success-probability model.

## Proposed disclosure depth

| Location | Visible before opening anything | One deliberate expansion | Direct source/history access |
| --- | --- | --- | --- |
| Goal setup and initial plan | User's outcome, controllable action, chosen cycle/review point, important unresolved assumption | Why this action size/cycle fits the stated circumstances; applicable method and fallback | Referenced user context and research |
| Check-in | What Adler understood; source/date when connected context is used; resulting saved/proposed change or clarification | Records being updated and why; correction of an extracted quantity or explanation | Original report and its subsequent corrections |
| Plan adaptation | Concrete before/after, triggering evidence, short mechanism, tentative status where needed, next review | Why this method fits; alternate explanation; prediction and criterion for keeping/changing it | Research excerpt with grade/transfer limits; prior decision and reports |
| Goal progress | Actual outcome/date, input quantity, target versus conditional projection, range meaning and consequential data gap | Pace/conversion arithmetic, included measurements and sensitivity assumptions | Underlying reports and measurement/model revisions |
| Insights | Multiple working findings, evidence status and practical planning implication; saved versus proposed | Evidence → method-informed hypothesis → test → actual feedback → tentative inference → next question | Full sources and linked earlier cycles |
| Calendar/connections | Which calendar/data source is involved; suggested versus booked state; relevant automation scope | Why this slot/change was chosen; conflicts and applicable preference | Connected-data settings and change history |

These depth choices are design hypotheses. “One expansion” is a navigation target, not a scientific threshold. Put any limitation that could change the immediate choice in the visible summary. Let source links open directly from the relevant explanation; avoid a ladder of nested disclosures. Preserve keyboard/screen-reader access and meaningful labels.

For projection styling, ONS recommends a shaded range when uncertainty changes interpretation, with clear explanation. Use that visual pattern while retaining Adler's conditional-scenario meaning. Where the relation is unknown, state the missing relation instead of drawing an authoritative-looking future line. [ONS uncertainty guidance](https://service-manual.ons.gov.uk/data-visualisation/guidance/showing-uncertainty-in-charts)

For methodology, show the saved supported rationale, not an invented retrospective story about the model's hidden thinking. A useful explanation can identify the actual reports, chosen technique, intended mechanism and observed plan change without claiming complete access to the model's internal process.

## Product priorities to validate

This is a proposed order of investigation. It is not an assertion that each capability is missing from the current app.

1. **Understand and correct the coaching decision.** Start with a representative check-in → interpretation → proposed/saved change → review flow. Test whether people know what changed, why, and how to correct a mistaken report. This connects the scientific promise to daily utility.
2. **Understand personal progress without false certainty.** Test direct-conversion goals, uncertain outcome relationships, stale reports and conflicting evidence. The next useful action and the reason a forecast is unavailable should remain clear.
3. **Recognize accumulating learning across goals.** Test whether an insights overview explains how reported circumstances affect planning, while readers can distinguish a possibility from a supported personal finding.
4. **Inspect methods in context.** Improve source/mechanism depth where the preceding tasks show a need. A larger science library or more visible framework acronyms is not a substitute for those tasks working.

Prioritize by the consequence and frequency of misunderstanding, the weakness of present evidence, and the cost of testing the assumption. SVPG's original discovery framework separates value, usability, feasibility and business viability; Product Talk recommends specific assumption tests and success criteria defined beforehand. Neither supplies a universal numerical priority formula for Adler. [SVPG: Four Big Risks](https://www.svpg.com/four-big-risks/), [Product Talk: Assumption Testing](https://www.producttalk.org/assumption-testing/)

## Proposed discovery checks

- Compare a minimal summary, a summary with one evidence expansion, and a dense explanation using the same fictional decision. Ask what Adler knows, what it suspects, what changes, and what remains the user's choice. Measure comprehension, task completion, correction success and burden; preference alone does not establish usability.
- Include valid suggestions alongside deliberately mistaken or unsupported ones in a prototype. Check whether participants can accept useful help and catch the planted errors. Do not put false records into live accounts. Trust ratings and source-click counts are secondary; both can rise while judgment gets worse.
- Test repeated use, not only first impressions: contradictory follow-up, corrected source, method change, missing check-in and goal pause. Verify that readers notice the changed evidence without having to reread the full methodology.
- Audit explanations separately from interface comprehension: do source IDs exist, do excerpts support the mechanism, do reported facts match the records, and does displayed state match the actual saved change? Do not make the user the sole defense against unsupported coaching.
- Keep three evaluation questions distinct: can people use the interface, does the agent follow the specified method, and does using Adler improve meaningful outcomes over time? A usability study, prompt evaluation or research citation cannot answer all three. Any claim of coaching effectiveness needs its own appropriate evaluation.

Open questions for grilling: which decision needs the strongest immediate explanation; how much routine adaptation users want to authorize; which evidence gaps should trigger a question versus a provisional plan; and what readers must understand before a projected date or personal insight is shown. Those choices should come from the product's use cases and user evidence rather than a universal disclosure checklist.
