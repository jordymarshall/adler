# Compact activity in All Goals only

8 September 2026. Corrects the rejected goal-detail calendar prototype.

The user's reference is `.context/attachments/AZewlk/image.png`: a compact 12-week grid and one short completion/report summary per goal, as used in the landing-page goals table. There is no monthly calendar, key, day inspector or additional panel in the goal workspace.

Preview: http://localhost:8766/all-goals-prototype.html?variant=A

Run: `python3 -m http.server 8766 --bind 127.0.0.1 --directory .context/ux-grilling`

## What changed

- Restored `goal-workspace-v2.js` and `.css` byte-for-byte from integrated archive commit `0392a4cebdfb8c711d4c2a14f55e1c5ea8e3bc83`. The rejected calendar, controls and layout changes are removed from goal detail.
- Added one compact activity column to All Goals A, directly left of the existing input graph. Its 84-cell geometry, colours and one-line summary match `src/GoalActivity.tsx` and `src/goal-progress.css`, the actual component behind the landing reference. No production/landing source was modified.
- The grid counts reported action completions. The title flame retains the existing streak meaning. Different quantities are not summed. Unreported actions retain the landing component's dotted outline and hover/accessible detail. Periods without records are not fabricated successes or misses.
- The grid uses the same local report state as the existing goal workspace. Opening it enters the same goal plan; it has no extra calendar interaction. On mobile, activity and milestone share a row, with the graph retaining its full width below.

No new coach policy, inference or experiment was created. Missing reports and goal outcomes remain distinct from completed inputs. This is temporary prototype data; the sparse early record is real within this fixture, not replaced with decorative history.

## Verification and status

Verified the restored goal source against the prior archive. Browser checks cover the three overview rows, 84 cells each, goal opening with zero added calendars and both original graphs, report-driven summary updates and corrections. Desktop/tablet/mobile layouts are inspected, including long outlook labels. Captures: `activity-overview-corrected-{1440|390}.png`.

The placement restriction and reference treatment are explicit user direction. The user subsequently accepted this corrected rendering (“looks good”) and returned to the original structure grilling. The former Goal C calendar is rejected, and its further proposals are not an approved scope expansion. Production work remains separate.
