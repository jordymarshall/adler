export const METHODS = [
  {
    id: "goal-definition",
    name: "Define the result",
    question: "Is the outcome measurable, and is the target date useful?",
    action:
      "Specify the result, completion criteria, and dated milestones. For unfamiliar work, set a learning milestone first.",
    example:
      "Publish 3 case studies by October 31; each includes the problem, your contribution, and the result.",
    evidence: "Specific goals with feedback",
    source: "Locke & Latham, 2002",
    url: "https://www.wku.edu/cebs/doctorate/documents/readings/locke_latham_2002_building_useful_theory.pdf",
    limit:
      "Difficulty must fit the skill, resources, and commitment available. A SMART checklist does not guarantee success.",
  },
  {
    id: "implementation",
    name: "Choose when and where",
    question: "Is there a realistic opportunity to do the next action?",
    action:
      "Attach one concrete action to a time or cue. Check available time before adding more work.",
    example:
      "After lunch on Tuesday, draft five bullets for case study two for 25 minutes.",
    evidence: "Implementation intentions",
    source: "Gollwitzer & Sheeran, 2006",
    url: "https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes",
    limit:
      "Booking time creates an opportunity; it is not evidence that the work happened.",
  },
  {
    id: "monitoring",
    name: "Compare results with the plan",
    question: "What has changed against the milestone due by now?",
    action:
      "Record actual results and compare them with dated checkpoints using the same units. Show missing evidence explicitly.",
    example:
      "1 case study published; 2 were planned by this date. The next step is to inspect the unfinished case study.",
    evidence: "Progress monitoring",
    source: "Harkin et al., 2016",
    url: "https://pubmed.ncbi.nlm.nih.gov/26479070/",
    limit:
      "A missed update is unknown. Task completion is not interchangeable with an outcome.",
  },
  {
    id: "barriers",
    name: "Identify the blocker",
    question:
      "Is the problem capability, opportunity, motivation, or the task itself?",
    action:
      "Use the actual obstacle reported to choose a smaller task, a resource, a better time, or a different priority.",
    example:
      "If meetings displaced two sessions, find a protected slot before increasing the weekly target.",
    evidence: "COM-B behaviour framework",
    source: "Michie et al., 2011",
    url: "https://link.springer.com/article/10.1186/1748-5908-6-42",
    limit:
      "This framework organizes questions; it does not diagnose a person from a missed action.",
  },
  {
    id: "retrieval",
    name: "Practice retrieving, then check",
    question: "Is practice testing the skill the goal requires?",
    action:
      "Attempt the task without the answer, then compare your reasoning with an appropriate course source.",
    example:
      "Solve three statistics problems before opening the worked solutions, then record where the reasoning differed.",
    evidence: "Retrieval practice",
    source: "Roediger & Karpicke, 2006",
    url: "https://pubmed.ncbi.nlm.nih.gov/16507066/",
    limit:
      "The material and assessment need to match. Adler does not validate arbitrary generated tests.",
  },
  {
    id: "spacing",
    name: "Spread learning across sessions",
    question:
      "Would another spaced attempt be more useful than more rereading today?",
    action:
      "Plan separate practice opportunities, then use later performance to adjust the interval.",
    example:
      "Practice on Tuesday and Friday, then attempt a comparable set the following week.",
    evidence: "Distributed practice",
    source: "Cepeda et al., 2008",
    url: "https://pubmed.ncbi.nlm.nih.gov/19076480/",
    limit:
      "There is no universal interval that is best for every topic and retention horizon.",
  },
  {
    id: "review",
    name: "Review and change one thing",
    question: "What should be kept, changed, paused, or finished?",
    action:
      "Review results, action records, and current constraints. Approve a specific adjustment and decide when to revisit it.",
    example:
      "Try rough bullets before editing for two sessions; then decide whether to keep that approach.",
    evidence: "Structured debriefing",
    source: "Tannenbaum & Cerasoli, 2013",
    url: "https://pubmed.ncbi.nlm.nih.gov/23516804/",
    limit:
      "Weekly reviews and two-session trials are Adler design choices, not proven optimal intervals.",
  },
] as const;
export const DEFAULT_METHODS = METHODS.map((method) => method.id);
