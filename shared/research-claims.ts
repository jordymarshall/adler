import { z } from "zod";
import { researchSourceSchema } from "./planning.ts";

export const researchClaimSchema = z
  .object({
    id: z.string().min(1).max(150),
    version: z.string().min(1).max(80),
    statement: z.string().min(1).max(1800),
    role: z.enum(["theory", "technique", "empirical", "heuristic"]),
    construct: z.string().min(1).max(300),
    label: z.string().min(1).max(100).optional(),
    methodIds: z.array(z.string()).min(1).max(7),
    principleIds: z
      .array(z.string().regex(/^P\d+$/))
      .min(1)
      .max(6),
    source: researchSourceSchema,
    locator: z.string().min(1).max(500),
    scope: z.string().min(1).max(1800),
    grade: z.string().min(1).max(300),
    limitations: z.array(z.string().min(1).max(1800)).min(1).max(8),
    review: z
      .object({
        status: z.enum([
          "source-checked",
          "candidate",
          "withdrawn",
          "superseded",
        ]),
        by: z.string().min(1).max(300),
        at: z.iso.date(),
      })
      .strict(),
  })
  .strict();
export type ResearchClaim = z.infer<typeof researchClaimSchema>;

// Source-specific records are populated from docs/research/claim-curation.md.
export const RESEARCH_CLAIMS: ResearchClaim[] = [
  {
    id: "claim:goal-specific-challenging",
    label: "Clear goals and a suitable challenge",
    version: "2026-09-07.1",
    statement:
      "The reviewed studies generally found better task performance with specific, difficult goals than with instructions to do one's best; specificity alone was insufficient.",
    role: "empirical",
    construct:
      "Goal specificity and difficulty, conditional on ability and commitment",
    methodIds: ["goal-definition"],
    principleIds: ["P29"],
    source: {
      id: "curated:goal-specific-challenging",
      title:
        "Building a Practically Useful Theory of Goal Setting and Task Motivation: A 35-Year Odyssey",
      authors: "Edwin A. Locke; Gary P. Latham",
      year: "2002",
      doi: "10.1037/0003-066X.57.9.705",
      url: "https://med.stanford.edu/content/dam/sm/s-spire/documents/PD.locke-and-latham-retrospective_Paper.pdf",
      summary:
        "Scoped paraphrase of Core Findings: specific, difficult goals generally improved performance over do-your-best instructions, subject to ability and commitment; specificity alone was insufficient.",
      kind: "Empirical and theoretical research review; not a new trial",
      access: "full text excerpt",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "p. 706, Core Findings, paragraphs comparing specific difficult goals with do-your-best instructions and discussing specificity, ability and commitment.",
    scope:
      "Consider clear performance criteria and appropriate challenge when the person has relevant capacity and commitment.",
    grade:
      "Source not separately graded in the repository. P29 supplies a broader task-fit and transfer boundary, not this source's efficacy grade.",
    limitations: [
      "Does not establish that every goal needs a numeric outcome or any particular milestone cadence.",
      "Difficulty must fit ability, resources and commitment; a specific target alone does not establish feasibility or personal benefit.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of relevant full text; scoped paraphrase, no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:goal-feedback-progress",
    label: "Feedback on your progress",
    version: "2026-09-07.1",
    statement:
      "In the reviewed comparisons, goals accompanied by feedback about progress were more effective than goals alone.",
    role: "empirical",
    construct: "Feedback about progress relative to a goal",
    methodIds: ["goal-definition", "monitoring"],
    principleIds: ["P4"],
    source: {
      id: "curated:goal-feedback-progress",
      title:
        "Building a Practically Useful Theory of Goal Setting and Task Motivation: A 35-Year Odyssey",
      authors: "Edwin A. Locke; Gary P. Latham",
      year: "2002",
      doi: "10.1037/0003-066X.57.9.705",
      url: "https://med.stanford.edu/content/dam/sm/s-spire/documents/PD.locke-and-latham-retrospective_Paper.pdf",
      summary:
        "Scoped paraphrase of Feedback: the reviewed comparisons support feedback showing progress relative to goals, with goals plus feedback more effective than goals alone.",
      kind: "Empirical and theoretical research review; not a new trial",
      access: "full text excerpt",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "p. 708, Feedback, first paragraph and its comparison of goals plus feedback with goals alone.",
    scope:
      "Use meaningful observations to help the person compare progress with their goal and consider an adjustment.",
    grade:
      "Source not separately graded. P4's A / high concerns the wider feedback corpus, not this review alone.",
    limitations: [
      "Feedback must meaningfully relate to the goal; action adherence and the ultimate outcome can be different measures.",
      "Does not validate Adler's chart or outcome estimator, or establish that every form of feedback helps.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of relevant full text; scoped paraphrase, no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:goal-learning-before-performance",
    label: "Learn a useful approach first",
    version: "2026-09-07.1",
    statement:
      "For unfamiliar complex tasks, the reviewed evidence supports considering strategy-learning goals when difficult performance targets interfere with acquiring an effective strategy.",
    role: "empirical",
    construct:
      "Learning goals when task-relevant strategies are not yet available",
    methodIds: ["goal-definition"],
    principleIds: ["P29"],
    source: {
      id: "curated:goal-learning-before-performance",
      title:
        "Building a Practically Useful Theory of Goal Setting and Task Motivation: A 35-Year Odyssey",
      authors: "Edwin A. Locke; Gary P. Latham",
      year: "2002",
      doi: "10.1037/0003-066X.57.9.705",
      url: "https://med.stanford.edu/content/dam/sm/s-spire/documents/PD.locke-and-latham-retrospective_Paper.pdf",
      summary:
        "Scoped paraphrase: the reviewed complex-task studies distinguish learning appropriate strategies from pursuing a difficult performance target before those strategies are available.",
      kind: "Empirical and theoretical research review; not a new trial",
      access: "full text excerpt",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "pp. 707–709, Goal Mechanisms items 5–6, and Task Complexity, including the learning-goal versus performance-goal discussion.",
    scope:
      "Consider a relevant learning milestone when the person reports an unfamiliar task or a missing strategy needed for effective performance.",
    grade:
      "Source not separately graded in the repository; P29 supplies the task-fit and transfer caution.",
    limitations: [
      "Requires evidence of a relevant learning need; learning-first is not established as universally best.",
      "Does not supply domain expertise, identify the correct business strategy, or establish quotas for an unfamiliar domain.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of relevant full text; scoped paraphrase, no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:implementation-if-then",
    label: "Link a familiar moment to an action",
    version: "2026-09-07.1",
    statement:
      "An implementation intention links a specified situation or cue to a concrete goal-directed response, spelling out when, where or how action will occur.",
    role: "technique",
    construct: "Situation-to-response implementation intention",
    methodIds: ["implementation"],
    principleIds: ["P2"],
    source: {
      id: "curated:implementation-if-then",
      title:
        "Implementation Intentions and Goal Achievement: A Meta-analysis of Effects and Processes",
      authors: "Peter M. Gollwitzer; Paschal Sheeran",
      year: "2006",
      doi: "10.1016/S0065-2601(06)38002-1",
      url: "https://doi.org/10.1016/S0065-2601%2806%2938002-1",
      summary:
        "Scoped paraphrase of the abstract's definition: implementation intentions specify a situation and a corresponding goal-directed action, including when, where or how it will be performed.",
      kind: "Technique definition within a meta-analysis; definition alone is not efficacy evidence",
      access: "abstract",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "Abstract, opening definition of implementation intentions; publisher abstract/preview, with attribution checked against the authors' institutional publication record.",
    scope:
      "Design a cue-linked action when an identifiable cue and an executable, user-endorsed response are available.",
    grade:
      "Technique definition is not efficacy-graded. P2's A direction / moderate magnitude belongs to the empirical corpus, not the definition alone.",
    limitations: [
      "The person's actual availability and endorsement require personal evidence; writing or scheduling a plan does not create either.",
      "This definition does not establish a benefit, the best cue for this user, or that the planned action happened.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of publisher abstract/preview and author attribution; no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:implementation-attainment",
    label: "Cue-based action planning",
    version: "2026-09-07.1",
    statement:
      "Across 94 independent tests in this meta-analysis, implementation intentions improved goal attainment on average relative to comparison conditions.",
    role: "empirical",
    construct: "Average goal-attainment effect of implementation intentions",
    methodIds: ["implementation"],
    principleIds: ["P2"],
    source: {
      id: "curated:implementation-attainment",
      title:
        "Implementation Intentions and Goal Achievement: A Meta-analysis of Effects and Processes",
      authors: "Peter M. Gollwitzer; Paschal Sheeran",
      year: "2006",
      doi: "10.1016/S0065-2601(06)38002-1",
      url: "https://doi.org/10.1016/S0065-2601%2806%2938002-1",
      summary:
        "Scoped paraphrase of the abstract's synthesis: 94 independent tests showed an average goal-attainment benefit from implementation intentions compared with their respective comparison conditions.",
      kind: "Meta-analysis",
      access: "abstract",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "Abstract, quantitative synthesis of 94 independent tests and overall goal-attainment finding; publisher abstract/preview.",
    scope:
      "Supports considering cue-linked action planning when it fits the person's goal, actual opportunities and reported difficulty.",
    grade:
      "Preserve repository P2: A direction / moderate magnitude, a broader corpus assessment rather than confidence in an individual effect.",
    limitations: [
      "Does not establish a personal effect magnitude, probability of success, or superiority to every other technique.",
      "The best cue for the person and transfer to Adler's digital coaching delivery require separate justification.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of publisher abstract/preview; scoped paraphrase, no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:monitoring-attainment",
    label: "Keep track of meaningful progress",
    version: "2026-09-07.1",
    statement:
      "Across 138 studies involving 19,951 participants, interventions that increased progress monitoring improved goal attainment on average compared with controls.",
    role: "empirical",
    construct: "Performed progress monitoring and goal attainment",
    methodIds: ["monitoring"],
    principleIds: ["P1"],
    source: {
      id: "curated:monitoring-attainment",
      title:
        "Does monitoring goal progress promote goal attainment? A meta-analysis of the experimental evidence",
      authors:
        "Benjamin Harkin; Thomas L. Webb; Betty P. I. Chang; Andrew Prestwich; Mark Conner; Ian Kellar; Yael Benn; Paschal Sheeran",
      year: "2016",
      doi: "10.1037/bul0000025",
      url: "https://pubmed.ncbi.nlm.nih.gov/26479070/",
      summary:
        "Scoped paraphrase of the abstract: 138 studies randomized participants to monitoring interventions or controls; increased progress monitoring was accompanied by an average goal-attainment benefit.",
      kind: "Meta-analysis of randomized comparisons",
      access: "abstract",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "PubMed abstract, study inclusion criteria, total sample, and effects on monitoring and goal attainment.",
    scope:
      "Supports recording a relevant quantity and using the record to review progress; the monitoring needs to be performed rather than merely offered.",
    grade:
      "Preserve repository P1: A / high for the wider monitoring corpus. Personal benefit and Adler-specific delivery remain separate questions.",
    limitations: [
      "Missing reports are not failed actions; task completion and the ultimate outcome are not interchangeable measures.",
      "Study-level reporting and recording moderators do not establish that an AI recipient has the same effect as a human recipient.",
      "Does not establish that daily logging is optimal or that a pooled effect predicts this person's improvement.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of original publication abstract; scoped paraphrase, no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:com-b-opportunity",
    label: "Time and space to act · COM-B",
    version: "2026-09-07.1",
    statement:
      "COM-B treats opportunity as external conditions that make a behaviour possible or prompt it, distinct from capability and motivation.",
    role: "theory",
    construct: "Physical and social opportunity within COM-B",
    methodIds: ["barriers", "implementation"],
    principleIds: ["P24", "P7"],
    source: {
      id: "curated:com-b-opportunity",
      title:
        "The behaviour change wheel: A new method for characterising and designing behaviour change interventions",
      authors: "Susan Michie; Maartje M. van Stralen; Robert West",
      year: "2011",
      doi: "10.1186/1748-5908-6-42",
      url: "https://link.springer.com/article/10.1186/1748-5908-6-42",
      summary:
        "Scoped paraphrase: COM-B distinguishes external physical and social opportunity from capability and motivation. The framework organizes intervention design; the paper calls for further research on whether its use improves effectiveness.",
      kind: "Behaviour framework development and classification; not a technique-efficacy trial",
      access: "full text excerpt",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "Background, COM-B definitions and physical/social opportunity discussion; conclusion concerning further effectiveness research.",
    scope:
      "Organizes questions about an obstacle the person reports, including whether external conditions prevent or prompt the intended behaviour.",
    grade:
      "D (theory) under the synthesis rubric. P24/P7 empirical findings are separate evidence and must not be attributed to this framework paper.",
    limitations: [
      "Does not prove COM-B-guided interventions outperform alternatives or that a proposed calendar adjustment will improve behaviour.",
      "A missed action cannot diagnose motivation; a framework classification is not a verified personal mechanism.",
      "Adler's policy to inspect external constraints first is not an intrinsic priority ordering established by COM-B.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of relevant full text and conclusion; scoped paraphrase, no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:situational-modification-student-trials",
    label: "Change the setup before distraction",
    version: "2026-09-10.1",
    statement:
      "In two field experiments, students assigned to modify their surroundings reported better attainment of their study goals over the following week than comparison groups assigned response modulation or no particular strategy.",
    role: "empirical",
    construct: "Situation modification for self-chosen academic goals",
    methodIds: ["barriers"],
    principleIds: ["P7"],
    source: {
      id: "curated:situational-modification-student-trials",
      title: "A Stitch in Time: Strategic Self-Control in High School and College Students",
      authors: "Angela L. Duckworth; Rachel E. White; Alyssa J. Matteucci; Anne Shearer; James J. Gross",
      year: "2016",
      doi: "10.1037/edu0000062",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4856169/",
      summary: "Two randomized student field experiments compared situation modification with response modulation and no assigned strategy using one-week self-reports.",
      kind: "Two field experiments within a three-study paper",
      access: "full text excerpt",
      retrievedAt: "2026-09-10T20:00:00Z",
    },
    locator: "Abstract; Study 2 Method; Study 3 Method and Discussion; General Discussion limitations.",
    scope: "Consider a feasible change to surroundings when the person identifies a relevant distraction and can change that setup.",
    grade: "B / moderate for these short student experiments; P7's broader A grade is not a grade for this paper alone.",
    limitations: [
      "One-week self-reports in student samples, with substantial attrition in Study 2; not evidence of sustained effects in adult portfolio work or Adler.",
      "The intervention allowed different environmental changes. It did not isolate putting a phone in another room or establish a personal effect.",
      "The comparisons do not establish superiority to every cognitive strategy; the proposed mechanism and situation fit remain uncertain.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted check of indexed PMC full-text excerpts and PubMed abstract; no expert certification",
      at: "2026-09-10",
    },
  },
  {
    id: "claim:retrieval-delayed-retention",
    label: "Practise recalling what you learn",
    version: "2026-09-07.1",
    statement:
      "In students learning prose passages, prior free-recall testing without feedback improved retention after two days or one week compared with restudy; restudy performed better after five minutes.",
    role: "empirical",
    construct: "Retrieval practice and delayed retention of learned material",
    methodIds: ["retrieval"],
    principleIds: ["P29"],
    source: {
      id: "curated:retrieval-delayed-retention",
      title:
        "Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention",
      authors: "Henry L. Roediger III; Jeffrey D. Karpicke",
      year: "2006",
      doi: "10.1111/j.1467-9280.2006.01693.x",
      url: "https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x",
      summary:
        "Scoped paraphrase of two experiments: students' free recall without feedback produced better delayed retention than restudy at two days and one week, while restudy was better at five minutes.",
      kind: "Two experiments with students learning prose passages",
      access: "abstract",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "Abstract, two prose-learning experiments, free-recall testing without feedback, and delayed versus five-minute retention findings.",
    scope:
      "Most directly supports retrieval attempts when the aim is delayed retention of comparable learned material and the assessment fits that material.",
    grade:
      "Source not separately graded. Preserve P29: A within domains / C transfer for the broader learning corpus; this paper itself reports two experiments.",
    limitations: [
      "This citation does not establish the benefit of corrective feedback: the reported practice tests were without feedback.",
      "Does not establish broad transfer to arbitrary skills or business performance, or validate generated tests and worked solutions.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of publisher abstract; scoped paraphrase, no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:spacing-retention-horizon",
    label: "Space your learning over time",
    version: "2026-09-07.1",
    statement:
      "In factual learning with delayed tests, the spacing gap associated with the best retention depended on how long the material needed to be retained.",
    role: "empirical",
    construct: "Spacing interval relative to retention horizon",
    methodIds: ["spacing"],
    principleIds: ["P29"],
    source: {
      id: "curated:spacing-retention-horizon",
      title:
        "Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention",
      authors:
        "Nicholas J. Cepeda; Edward Vul; Doug Rohrer; John T. Wixted; Harold Pashler",
      year: "2008",
      doi: "10.1111/j.1467-9280.2008.02209.x",
      url: "https://labs.biology.ucsd.edu/rifkin/courses/bieb100/f14/Cepeda_et_al_2008_Psychological_Science_Spacing_Effects_in_Learning_A_Temporal_Ridgeline_of_Optimal_Retention.pdf",
      summary:
        "Scoped paraphrase: an experiment varying the gap between factual-learning sessions and the later retention delay found that the gap associated with best retention varied with the retention horizon.",
      kind: "Factual-learning experiment varying spacing and retention delays",
      access: "full text excerpt",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "pp. 1096–1100, The Current Study, Procedure, Results, Table 1 and Figures 1–2; institutional full-text copy.",
    scope:
      "Supports considering separate learning opportunities and the intended retention horizon when scheduling practice of comparable learned material.",
    grade:
      "Source not separately graded. Preserve P29: A within domains / C transfer for the broader learning corpus; this source is one experiment.",
    limitations: [
      "Does not establish a universal spacing interval or an optimal adaptive scheduling algorithm for Adler.",
      "Studied factual learning and repeated testing do not establish benefit from spacing arbitrary business tasks or a universal weekly work frequency.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of relevant full text, methods and results; scoped paraphrase, no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:review-debrief-performance",
    label: "Learn from a structured review",
    version: "2026-09-07.1",
    statement:
      "Across 46 samples involving 2,136 participants, individual and team debriefs improved subsequent performance on average relative to controls.",
    role: "empirical",
    construct: "Task-relevant structured debriefing and subsequent performance",
    methodIds: ["review"],
    principleIds: ["P3"],
    source: {
      id: "curated:review-debrief-performance",
      title:
        "Do Team and Individual Debriefs Enhance Performance? A Meta-Analysis",
      authors: "Scott I. Tannenbaum; Christopher P. Cerasoli",
      year: "2013",
      doi: "10.1177/0018720812448394",
      url: "https://pubmed.ncbi.nlm.nih.gov/23516804/",
      summary:
        "Scoped paraphrase of the abstract: 46 samples involving 2,136 participants showed an average performance benefit of individual and team debriefs relative to controls.",
      kind: "Meta-analysis of individual and team debriefs",
      access: "abstract",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "Indexed original publication abstract, Method and Results, sample totals and performance comparison.",
    scope:
      "Supports considering a structured review of relevant work and results to inform a subsequent attempt.",
    grade:
      "Preserve repository P3: A / moderate (transfer untested), a corpus assessment with a material transfer caveat.",
    limitations: [
      "Does not establish an AI-led review effect or equivalence to unstructured journaling.",
      "A five-minute weekly dose, changing one thing, and a two-session trial are not proven optimal rules from this source.",
      "Does not establish superiority to every other intervention or predict a particular user's improvement; full methods were not independently reviewed in this curation.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of indexed original publication abstract; no expert certification or independent full-method review",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:individual-inference-transfer",
    label: "Research averages and your experience",
    version: "2026-09-07.1",
    statement:
      "In the analyzed datasets, group-level estimates did not reliably describe individuals' within-person distributions and relationships.",
    role: "empirical",
    construct:
      "Group-to-individual generalizability of distributions and associations",
    methodIds: [
      "goal-definition",
      "implementation",
      "monitoring",
      "barriers",
      "retrieval",
      "spacing",
      "review",
    ],
    principleIds: ["P29"],
    source: {
      id: "curated:individual-inference-transfer",
      title:
        "Lack of group-to-individual generalizability is a threat to human subjects research",
      authors: "Aaron J. Fisher; John D. Medaglia; Bertus F. Jeronimus",
      year: "2018",
      doi: "10.1073/pnas.1711978115",
      url: "https://pure.rug.nl/ws/portalfiles/portal/63406911/E6106.full.pdf",
      summary:
        "Scoped paraphrase: analyses of six repeated-measures datasets found that group-level estimates were not reliable proxies for individual within-person distributions and relationships.",
      kind: "Empirical methodological analysis of six repeated-measures datasets",
      access: "full text excerpt",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "p. E6106 abstract and pp. E6113–E6114 Discussion; institutional full-text copy. Framework home: synthesis sections 2–3 and idiographic-inference section 1.",
    scope:
      "Constrains application of aggregate research to a person: distinguish population support from this person's observed response and the uncertainty of that application.",
    grade:
      "EMP, preserved from the idiographic deep dive's design labels. Not an A/B technique-efficacy grade; P29 is a related transfer-routing link.",
    limitations: [
      "Does not mean population research is useless or establish that every user responds differently.",
      "Does not authorize a universal uncertainty multiplier, individual success probability or personal causal claim without its own adequate design and evidence.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted source check of relevant full text, abstract and discussion; scoped paraphrase, no expert certification",
      at: "2026-09-07",
    },
  },
  {
    id: "claim:review-proportionate-design",
    label: "Choose a useful review point",
    version: "2026-09-07.1",
    statement:
      "Choose the least burdensome learning approach adequate for the pending decision, and revisit a change when relevant opportunities and interpretable feedback can inform that decision.",
    role: "heuristic",
    construct:
      "Proportionate learning design and decision-relevant review timing",
    methodIds: ["review"],
    principleIds: ["P3"],
    source: {
      id: "curated:review-proportionate-design",
      title: "Engineering the Adler Method",
      authors: "Adler repository product and methodology documentation",
      year: "2026",
      url: "https://github.com/jordymarshall/adler/blob/fbc804e1a2a92d11895d56c88a3a802064dc0a79/docs/method/coaching-engineering.md",
      summary:
        "Scoped paraphrase of local policy: select a learning design adequate for the decision without unnecessary burden, and review whether a change was used and whether relevant, comparable feedback is available. This is engineering guidance, not external efficacy evidence.",
      kind: "Adler engineering heuristic; local policy, not an empirical research finding",
      access: "method summary",
      retrievedAt: "2026-09-07T22:54:41.000Z",
    },
    locator:
      "docs/method/coaching-engineering.md, section 4.3 Select the least burdensome adequate learning design, and section 6 Review with a disciplined method; checked in the local repository.",
    scope:
      "Supports an explained practical review condition, clarification, or reversible change followed by feedback, with timing and information needs recorded for the particular case.",
    grade:
      "Heuristic, not efficacy-graded. P3's empirical corpus grade must not be transferred to this policy or its chosen timing.",
    limitations: [
      "Does not justify a fixed optimal dose, causal confirmation after two successes, or an efficacy claim for Adler.",
      "Does not justify randomization or experimental attribution without an appropriate understood and implemented design.",
      "Source was checked locally; the pinned repository URL identifies provenance and does not imply public access or external scientific review.",
    ],
    review: {
      status: "source-checked",
      by: "AI-assisted check of local engineering policy; not external empirical evidence or expert certification",
      at: "2026-09-07",
    },
  },
];
