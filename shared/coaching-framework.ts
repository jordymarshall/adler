// The product's behavioral decision gates. Evidence and limits live in METHODS;
// this is Adler's application of those principles, not a validated intervention.
export const COACHING_FRAMEWORK = {
  version: "besci-coaching-v1",
  researchCommit: "472e979",
  researchPath: "docs/research/behavioural-science-synthesis.md",
  stages: [
    { id: "define", principleIds: ["P9", "P10", "P11", "P12", "P29"], methods: ["goal-definition"], question: "What matters to this person, and what can they control?", rule: "Keep the desired result separate from the user's chosen behavior. Clarify unfamiliar work or use a learning objective; do not invent domain strategy." },
    { id: "observe", principleIds: ["P1", "P3", "P4", "P5", "P25"], methods: ["monitoring"], question: "What do their reports and constraints actually establish?", rule: "Use dated observations, competing goals and available capacity. Missing reports remain unknown; calendar context is not proof of work. Record explicit reports without forcing a new experiment." },
    { id: "understand", principleIds: ["P7", "P16", "P24", "P27", "P28"], methods: ["barriers"], question: "Which barrier is reported, and what remains uncertain?", rule: "Use COM-B capability, opportunity and motivation as questions, not diagnoses. Attendance alone cannot identify a cause. If the framework is disabled or evidence cannot distinguish barriers, keep the domain uncertain." },
    { id: "select", principleIds: ["P2", "P8", "P20", "P29"], methods: ["goal-definition", "implementation", "monitoring", "barriers", "retrieval", "spacing", "review"], question: "Which supported mechanism fits this behavior and person?", rule: "Choose one primary enabled method with a source, mechanism, personal fit and limitation. Cues require a viable opportunity. Retrieval and spacing require a relevant learning task. Research cannot choose business channels or establish personal outcome returns." },
    { id: "design", principleIds: ["P2", "P8", "P10", "P24", "P29"], methods: ["implementation", "goal-definition", "monitoring", "review"], question: "What is the smallest useful change, and how will we know whether it helps?", rule: "Translate the mechanism into feasible work, a cue or support, fallback, observable prediction, comparison and review rule. Match cycle, measurement and feedback timing to the person and signal. Respect capacity across goals and keep consequential changes reviewable." },
    { id: "learn", principleIds: ["P3", "P6", "P14", "P18", "P24"], methods: ["monitoring", "review"], question: "What does the feedback support, and what should change next?", rule: "Compare reported feedback with the saved prediction and decision rule. Separate execution improvement from outcome response; retain alternative explanations and feedback lag. Keep, adjust, clarify or pause; preserve earlier evidence and hypotheses. No feedback means no conclusion." },
  ],
  scope: "All coaching channels and goal horizons. Apply relevant gates proportionately: a factual check-in does not need a new plan, and a scheduling preference does not need a personality inference.",
} as const;
