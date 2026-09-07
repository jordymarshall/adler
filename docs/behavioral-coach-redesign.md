# Behavioral coach and product redesign

Base: 7de6c57. The coach helps people execute their own goals. It does not substitute generic research for domain expertise.

- One shared Coach interface accepts goal updates, action outcomes, blockers and periodic reviews. A focused goal is additional context, never a boundary on available goals or memory. Existing conversations remain accessible.
- Mentioned workspace records link inline to actual, account-owned records. Confirmed context and its implications appear together in About you; hypotheses remain labeled. Time budgets, availability and review settings live under Settings.
- Goal rows span available width and include outcome timelines. The overview shows equal-weight average completion across goals with reported actions in the last 28 days, individual rolling seven-day goal trends, and reporting coverage. Missing check-ins are unknown, not failures.
- Timelines always explain the distinction between a required trajectory and a conditional forecast. A deadline is not an estimated finish. User-supplied pace assumptions can support an initial scenario; sufficient fresh cumulative outcomes support observed-rate projections. No invented probability.
- Planning establishes the user's intended approach and behavioral constraints. It selects the smallest useful execution experiment, cue, fallback, observation and review cycle for that goal's horizon. Business/technical mechanisms, workload and personal explanations cannot be invented.
- Landing headline: Reach your goals with a plan that adapts to you. Five viewport-focused chapters cover goals, plan management, progress/chat, behavioral adaptation, and connections. The demo is publishing a portfolio with three case studies. Remove the previous clear-next-step hero scene. Apple Health and shared goals/stakes are labeled Coming soon; existing connections retain accurate scope.

Research basis: the repository's seven-method catalog (src/methods.ts), including goal definition, implementation intentions, progress monitoring, COM-B and structured review. This is retrieved evidence and coaching instruction, not a claim of model fine-tuning. Research explains behavioral interventions, not assumed domain strategy. Personal causal explanations remain tests until supported.

Validation: server regression tests for cross-goal context, record references, completion arithmetic, forecasts and behavioral instructions; browser coverage of canonical reporting, full-width rows, unified memory/settings and all five accessible landing chapters; production build; final standards/spec review.

## Live model checks

Synthetic Gemini evaluations exposed an older instruction to choose the domain strategy. The planning and review instructions now agree on the behavioral boundary, including examples of unsupported prospect quotas and channel choices. On rerun, the revenue case asks which acquisition work the person wants help executing; the reported scheduling-conflict case preserves the user's 60-minute budget and uses their stated morning windows. These checks sample behavior rather than guarantee every response. The deterministic regression suite also checks command persistence, cross-goal context, source ownership and forecast arithmetic.
