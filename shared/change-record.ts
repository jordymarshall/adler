import { currentPlan, currentProgram, type Data } from "./workspace.ts";
import type { Change } from "../server/commands.ts";
export function currentRecord(
  change: Change,
  data: Data,
): Record<string, unknown> | undefined {
  const goal = data.goals.find(
    (g) => g.id === (change.entity === "goal" ? change.id : change.parentId),
  );
  const record =
    change.entity === "conversation"
      ? data.conversations.find((c) => c.id === change.id)
      : change.entity === "goal"
        ? goal
        : change.entity === "plan"
          ? goal && currentPlan(goal)
          : change.entity === "milestone"
            ? goal?.milestones.find((m) => m.id === change.id)
            : change.entity === "checkpoint"
              ? goal?.checkpoints?.find((c) => c.id === change.id)
              : change.entity === "result"
                ? goal?.results.find((r) => r.id === change.id)
                : change.entity === "memory"
                  ? data.memories.find((m) => m.id === change.id)
                  : change.entity === "program"
                    ? currentProgram(data)
                    : change.entity === "review"
                      ? data.review
                      : change.entity === "action"
                        ? data.actions.find((a) => a.id === change.id)
                        : change.entity === "workBlock"
                          ? data.workBlocks.find((b) => b.id === change.id)
                          : data;
  return record as Record<string, unknown> | undefined;
}
