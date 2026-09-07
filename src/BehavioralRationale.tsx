import type { BehavioralReasoning } from "../shared/behavioral-reasoning";
import type { ResearchSource } from "../shared/planning";
import { METHODS } from "./methods";

export function BehavioralRationale({ reasoning, sources = [] }: { reasoning: BehavioralReasoning; sources?: ResearchSource[] }) {
  const method = METHODS.find(method => method.id === reasoning.methodId);
  return <details className="behavioral-rationale">
    <summary>{method?.evidence ?? "Behavioural rationale"} <span>+</span></summary>
    <p><b>Reported barrier or working explanation:</b> {reasoning.barrier.explanation} ({reasoning.barrier.status})</p>
    <p><b>Mechanism:</b> {reasoning.mechanism}</p>
    <p><b>Why it fits:</b> {reasoning.fit}</p>
    <p><b>What we expect to observe:</b> {reasoning.prediction}</p>
    <p><b>Keep or change:</b> {reasoning.reviewRule}</p>
    <p><b>Limits:</b> {reasoning.limitation}</p>
    {reasoning.ruleExceptions?.map(exception => <p key={exception}><b>Adapted to this goal:</b> {exception}</p>)}
    <div className="rationale-sources">{sources.filter(source => reasoning.researchSourceIds.includes(source.id)).map(source => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div>
  </details>;
}
