import type { Data } from "./workspace.ts";

export function resolveRecord(
  data: Data,
  id: string,
): { href: string; goalId?: string } | undefined {
  const anchor = `#record-${encodeURIComponent(id)}`;
  const learning = data.learning?.find(record => record.id === id);
  if (learning) return { href: `/app/insights${anchor}`, goalId: learning.goalIds.length === 1 ? learning.goalIds[0] : undefined };
  const decision = data.decisions.find(record => record.id === id);
  if (decision) return { href: `/app/insights${anchor}`, goalId: decision.goalId };
  if (data.memories.some((m) => m.id === id))
    return { href: `/app/insights${anchor}` };
  const message = data.messages.find((m) => m.id === id);
  if (message)
    return {
      href: `/app/check-in?${message.conversationId ? `chat=${encodeURIComponent(message.conversationId)}` : `goal=${encodeURIComponent(message.goalId)}`}${anchor}`,
      goalId: message.goalId,
    };
  const action = data.actions.find((a) => a.id === id);
  if (action)
    return {
      href: `/app/goals/${encodeURIComponent(action.goalId)}/progress${anchor}`,
      goalId: action.goalId,
    };
  const block = data.workBlocks.find((b) => b.id === id);
  if (block)
    return {
      href: `/app/calendar?goal=${encodeURIComponent(block.goalId)}`,
      goalId: block.goalId,
    };
  for (const goal of data.goals) {
    if (goal.id === id)
      return { href: `/app/goals/${encodeURIComponent(id)}`, goalId: goal.id };
    if (
      goal.results.some((r) => r.id === id) ||
      goal.milestones.some((m) => m.id === id) ||
      goal.checkpoints?.some((c) => c.id === id)
    )
      return {
        href: `/app/goals/${encodeURIComponent(goal.id)}/progress${anchor}`,
        goalId: goal.id,
      };
  }
  if (data.programs.some((p) => `program-v${p.version}` === id))
    return { href: "/app/settings/coaching" };
}

export function recordLink(data: Data, id: string) {
  return resolveRecord(data, id)?.href;
}

export function referencedText(
  data: Data,
  text: string,
  references: { text: string; recordId: string }[] = [],
) {
  const candidates = [
    ...references,
    ...data.goals.map((g) => ({ text: g.title, recordId: g.id })),
  ]
    .map((r) => ({ ...r, href: recordLink(data, r.recordId) }))
    .filter((r) => r.href && r.text.trim())
    .sort((a, b) => b.text.length - a.text.length);
  const parts: { text: string; href?: string }[] = [];
  let position = 0;
  while (position < text.length) {
    const next = candidates
      .map((r) => ({ ...r, at: text.indexOf(r.text, position) }))
      .filter((r) => r.at >= position)
      .sort((a, b) => a.at - b.at || b.text.length - a.text.length)[0];
    if (!next) {
      parts.push({ text: text.slice(position) });
      break;
    }
    if (next.at > position) parts.push({ text: text.slice(position, next.at) });
    parts.push({ text: next.text, href: next.href });
    position = next.at + next.text.length;
  }
  return parts;
}
