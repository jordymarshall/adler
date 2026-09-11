# Adler for iOS — copy

Every UI string, grouped by screen. Referenced by [`DESIGN.md`](DESIGN.md). Keys are the `Localizable.strings` keys.

## Conventions

- **App-owned** strings are listed below and live in `Resources/Localizable.strings`.
- **Server-supplied** strings (workflow states, evidence standing, delta labels, projection status and assumptions, rationale prose, `projectionUnavailableReason`, proposal reasons, error bodies) are printed **verbatim**. The app must not re-word, shorten, capitalise or translate them. §14 lists them for reference only — do not copy them into `Localizable.strings`.
- Apostrophes are typographic (`’`). `Didn’t happen` must match `Outcome` in `shared/workspace.ts` exactly or reports will fail validation.
- Dates render through one formatter: `d MMM` (`13 Oct`), or `d MMM yyyy` when the year differs from today's.
- No exclamation marks. No praise. No emoji.

---

## 1. Global

| Key | String |
| --- | --- |
| `app.name` | Adler |
| `tab.today` | Today |
| `tab.goals` | Goals |
| `tab.coach` | Coach |
| `tab.calendar` | Calendar |
| `action.cancel` | Cancel |
| `action.done` | Done |
| `action.save` | Save |
| `action.close` | Close |
| `action.retry` | Retry |
| `action.refresh` | Refresh |
| `action.back` | Back |
| `action.next` | Next |
| `action.edit` | Edit |
| `action.delete` | Delete |
| `action.confirm` | Confirm |
| `action.settings` | Settings |
| `a11y.closeSheet` | Close |
| `a11y.settings` | Open settings |
| `label.goal` | GOAL |
| `label.plan` | PLAN |
| `label.milestone` | MILESTONE |
| `label.action` | ACTION |
| `label.outcome` | OUTCOME |
| `label.observation` | OBSERVATION |
| `label.science` | BEHAVIOURAL SCIENCE |
| `label.testing` | WHAT WE’RE TESTING |
| `disclosure.whyThis` | Why this? |
| `disclosure.whyThisPlan` | Why this plan? |
| `disclosure.whyThisTest` | Why this test? |
| `disclosure.assumptions` | Assumptions |
| `disclosure.history` | History & settings |

---

## 2. Welcome

| Key | String |
| --- | --- |
| `welcome.headline` | Following through is the hard part. |
| `welcome.body` | Adler is an AI goal coach. It turns your goal into work you can do today and learns what helps you. |
| `welcome.primary` | Start with a goal |
| `welcome.signIn` | I already have an account |
| `welcome.server` | Server |
| `welcome.serverField` | Server address |
| `welcome.serverTest` | Test connection |
| `welcome.serverOk` | Reached the server. |

---

## 3. Goal-first onboarding

| Key | String |
| --- | --- |
| `onboarding.eyebrow` | ONE PLACE TO START |
| `onboarding.title` | What would you like to achieve? |
| `onboarding.body` | Describe it in your own words. We’ll work out the next step together. |
| `onboarding.placeholder` | Something you keep meaning to do… |
| `onboarding.continue` | Continue |
| `onboarding.a11yField` | What do you want to achieve? |
| `onboarding.draftKept` | Your goal is saved: “%@” |

---

## 4. Sign in / Create account

| Key | String |
| --- | --- |
| `auth.eyebrow` | YOUR ADLER ACCOUNT |
| `auth.titleRegister` | Create an account to save your goal. |
| `auth.titleLogin` | Welcome back. |
| `auth.body` | Save your goal, plan and conversations in one place. |
| `auth.tabRegister` | Create account |
| `auth.tabLogin` | Sign in |
| `auth.username` | Username |
| `auth.password` | Password |
| `auth.hint` | Use at least 10 characters. Keep your password somewhere safe; email recovery is not configured. |
| `auth.busy` | Opening… |
| `auth.failed` | Could not sign in. |

---

## 5. Today — shell

| Key | String |
| --- | --- |
| `today.title` | Your daily story |
| `today.card1` | Do |
| `today.card2` | Progress |
| `today.card3` | Learn |
| `today.card1Title` | What you need to do today |
| `today.card2Title` | Your progress |
| `today.card3Title` | What we’re learning |
| `today.position` | %1$@ / 03 |
| `a11y.today.card1` | 1 of 3: What you need to do today |
| `a11y.today.card2` | 2 of 3: Your progress |
| `a11y.today.card3` | 3 of 3: What we’re learning |
| `a11y.today.previous` | Previous card |
| `a11y.today.next` | Next card |

## 5a. Today — 01 Do

| Key | String |
| --- | --- |
| `do.start` | Start |
| `do.report` | Report |
| `do.correct` | Correct this report |
| `do.schedule` | Schedule |
| `do.started` | Started %@ · not yet reported |
| `do.lineup` | TODAY’S LINEUP |
| `do.lineupCount` | %lld action(s) |
| `do.showAll` | Show all %lld actions |
| `do.showLess` | Show less |
| `do.chooseOther` | Choose something else |
| `do.planProgress` | Plan & progress |
| `do.discussAction` | Discuss this action |
| `do.openGoal` | Open goal |
| `do.chooseWork` | Choose the work |
| `do.planFirstAction` | Plan first action |
| `do.earlier` | Earlier work · %@ |
| `do.upcoming` | Coming up · %@ |
| `do.waiting` | Waiting on earlier work |
| `do.upNext` | Up next |
| `do.ringCaption` | reported done today |
| `do.ringEmpty` | nothing scheduled |
| `a11y.do.ring` | %1$lld of %2$lld actions reported done today |

## 5b. Today — 02 Progress

| Key | String |
| --- | --- |
| `progress.title` | The whole picture. |
| `progress.body` | Where each goal stands. Next to the plan you chose. |
| `progress.legendReported` | Recorded results |
| `progress.legendPlan` | Plan checkpoints |
| `progress.legendProjection` | Conditional projection |
| `progress.noMeasure` | No outcome measure saved |
| `progress.baseline` | Saved starting point |
| `progress.reported` | Reported %@ |
| `progress.notStarted` | Goal saved · plan not started |
| `progress.planned` | %1$@ %2$@ planned by %3$@ |
| `progress.stillOpen` | Still open: %@ |
| `progress.matches` | Matches the saved checkpoint |
| `progress.vsCheckpoint` | %@ vs checkpoint |
| `progress.needNewer` | A newer report will make the comparison useful. |
| `progress.needResult` | Update the result to compare it with the plan. |
| `progress.next` | Next: %1$@ %2$@ · %3$@ |
| `progress.nextOnly` | Next checkpoint · %@ |
| `progress.addCheckpoint` | Add a dated checkpoint to compare your result with the plan. |
| `progress.actionsSeparate` | Your actions stay separate from an outcome comparison. |
| `progress.note` | Checkpoints are commitments, not forecasts. Lines join saved reports; changes between reports are unknown. |
| `progress.update` | Update progress |
| `progress.shape` | Shape the plan |
| `progress.review` | Review plan |
| `progress.addResult` | Add a result |
| `progress.stale` | Last report %@ |
| `chart.today` | Today |
| `chart.target` | Target · %1$@ %2$@ |
| `chart.noReport` | No report |

## 5c. Today — 03 Learn

| Key | String |
| --- | --- |
| `learn.hypothesis` | Working hypothesis |
| `learn.reported` | WHAT YOU REPORTED |
| `learn.watching` | WHAT WE’RE WATCHING |
| `learn.feedback` | LATEST FEEDBACK |
| `learn.reviewSuggestion` | Review suggestion |
| `learn.explore` | Explore the experiment |
| `learn.shareUpdate` | Share an update |
| `learn.reviewWith` | Review with Adler |
| `learn.discuss` | Discuss with Adler |
| `learn.revision` | A revised suggestion |
| `learn.revisionNote` | Your agreed test below remains current until you accept this suggestion. |
| `learn.tryThis` | Try this |
| `learn.noThanks` | No thanks |
| `learn.pause` | Pause |
| `learn.resume` | Resume |
| `learn.finish` | Finish trying this |
| `learn.reviewDate` | Review %@ · Your experience will inform what comes next. |
| `learn.reviewWhenUseful` | Review when there’s useful feedback. |
| `learn.plannedFrom` | Planned from %@ |
| `learn.reconsider` | The evidence changed. Review this explanation before using it. |
| `learn.paused` | Paused. Resume when this fits your life again. |
| `learn.pendingDecision` | A revision is awaiting your choice. The agreed test is shown. |
| `learn.suggestionOnly` | A suggestion to consider. Nothing has started yet. |
| `learn.saved` | A saved finding to revisit. Its evidence and limits stay attached. |
| `learn.notAResult` | A review date is not a result. |
| `a11y.learn.previous` | Previous learning question |
| `a11y.learn.next` | Next learning question |

---

## 6. Goals

| Key | String |
| --- | --- |
| `goals.title` | Goals |
| `goals.new` | New goal |
| `budget.title` | This week |
| `budget.planned` | %1$@ planned of %2$@ budget |
| `budget.over` | Over your saved budget. Adjust the plan or your available hours. |
| `budget.unplaced` | Unplaced |
| `group.focus` | Focus |
| `group.active` | Active |
| `group.draft` | Draft |
| `group.paused` | Paused |
| `group.completed` | Completed |
| `goals.noPlan` | Goal saved · plan not started |
| `activity.caption` | %1$@ completed · %2$lld reported · %3$@ – %4$@ |
| `activity.none` | No check-ins yet |
| `state.done` | Done |
| `state.partly` | Partly |
| `state.missed` | Didn’t happen |
| `state.unknown` | Awaiting check-in |
| `state.upcoming` | Upcoming |
| `state.restDay` | Planned day off |
| `state.short` | Below the planned work |
| `state.onPlan` | On plan |
| `state.futureDay` | Future day |
| `state.retired` | Retired |
| `a11y.activityWeek` | Week of %1$@: %2$lld done, %3$lld partly, %4$lld didn’t happen, %5$lld no report |

---

## 7. Goal detail

| Key | String |
| --- | --- |
| `goal.targetDate` | Target · %@ |
| `goal.flexible` | Flexible timeline |
| `goal.deadlineFirm` | Firm deadline |
| `goal.reportedOutcome` | Reported outcome · %@ |
| `goal.milestoneStatus` | Milestone status |
| `goal.planVersion` | PLAN · v%lld |
| `goal.allActions` | All actions |
| `goal.showingFor` | Showing work for %@ |
| `goal.resultToReach` | Result to reach |
| `goal.markVerified` | Mark this milestone verified |
| `goal.verifiedNote` | A milestone result is verified separately from the actions contributing to it. |
| `goal.startPlan` | Start plan |
| `goal.editPlan` | Edit plan |
| `goal.editGoal` | Edit goal |
| `goal.editAction` | Edit action |
| `goal.editMilestone` | Edit milestone |
| `goal.pause` | Pause goal |
| `goal.resume` | Resume goal |
| `goal.setAside` | Set goal aside |
| `goal.complete` | Complete goal |
| `goal.delete` | Delete goal |
| `goal.deleteConfirm` | Delete this goal? Its plan, actions, reports and learning records are removed. |
| `goal.completeConfirm` | Confirm you’ve met your success criterion: %@ |
| `goal.pauseConfirm` | This goal leaves your active list. Its actions, results and history stay here. |
| `goal.learningHistory` | Learning history |
| `goal.learningEmpty` | Learning begins with your first actions. |
| `goal.startingPlan` | Starting plan |
| `goal.planUpdated` | Plan updated |
| `goal.reviewSaved` | Review saved |
| `goal.nextReview` | Next review · %@ |
| `goal.allInsights` | All insights for this goal |
| `goal.earlierPlan` | EARLIER PLAN |
| `goal.currentCycle` | Current cycle · %1$@ – %2$@ |
| `goal.criterionLabel` | What counts as done |
| `goal.dailyReports` | Daily reports |
| `goal.oneTimeWork` | One-time work |
| `streak.days` | %lld days on plan |
| `streak.completed` | %lld actions completed |
| `streak.explain` | Planned rest continues the count. It does not add completed work, minutes or outcome progress. |
| `projection.ifLabel` | If your reported pace continues |
| `projection.conditional` | Conditional goal outlook |
| `projection.range` | Scenario range · %1$@ – %2$@ |
| `projection.notProbability` | A scenario range, not a probability or a promised date. |
| `projection.whatWouldHelp` | What would make this possible? |
| `projection.reviewWithCoach` | Review with Adler |
| `measure.recorded` | %1$@ %2$@ recorded |
| `measure.none` | No amount recorded yet |
| `measure.fromActions` | From this plan’s actions. Missing amounts are unknown. |

## 7a. Report sheet

| Key | String |
| --- | --- |
| `report.title` | Report |
| `report.titleCorrect` | Correct your report |
| `report.what` | What happened? |
| `report.done` | Done |
| `report.partly` | Partly |
| `report.missed` | Didn’t happen |
| `report.date` | Date reported |
| `report.amount` | %1$@ (%2$@) |
| `report.amountHint` | Leave blank if you don’t know the amount. |
| `report.partlyHint` | Record what you did. A partial report is not a failure. |
| `report.minutes` | Actual time (minutes, optional) |
| `report.note` | Anything to remember? (optional) |
| `report.save` | Save report |
| `report.unknownHint` | What you don’t report stays unknown. It is not recorded as zero. |
| `receipt.saved` | Saved %1$@ · %2$@ |
| `receipt.amountUnknown` | amount not reported |
| `receipt.correctedFrom` | Corrected from %@ |
| `report.conflict` | This report changed. Close and reopen it to use the latest version. |

## 7b. Plan rationale sheet

| Key | String |
| --- | --- |
| `basis.title` | Why this plan? |
| `basis.tag` | A testable approach |
| `basis.approach` | THE APPROACH |
| `basis.measurement` | WHY THIS MEASUREMENT |
| `basis.record` | What to record during each action: %@ |
| `basis.noTarget` | No numeric target proposed |
| `basis.target` | Suggested target: %1$@ %2$@ per %3$@ |
| `basis.alternatives` | Alternatives Adler considered |
| `basis.research` | Research & applicability · %lld sources |
| `basis.noSource` | No directly applicable source was cited. Read the uncertainty below before deciding whether to try this approach. |
| `basis.finding` | Finding: |
| `basis.applies` | Why it may apply: |
| `basis.limits` | Limits: |
| `basis.retrieved` | Retrieved %@ |
| `basis.uncertain` | What remains uncertain |
| `basis.checkApproach` | CHECK THE APPROACH · %@ |
| `basis.noReasoning` | This plan records your chosen work. No behavioural interpretation is saved for this version. |

---

## 8. Recommendation, proposal, evidence

| Key | String |
| --- | --- |
| `rec.tryThis` | Try this |
| `rec.noThanks` | No thanks |
| `rec.discuss` | Discuss |
| `rec.edit` | Edit |
| `rec.correctThis` | Correct this |
| `rec.editPrefill` | I’d like to edit “%@”. Change this: |
| `rec.discussPrefill` | Let’s discuss “%@” before I decide. |
| `rec.agreedNote` | Agreeing to a change is not evidence that it happened or worked. |
| `proposal.eyebrow` | A CHANGE TO CONSIDER |
| `proposal.reviewChanges` | Review changes |
| `proposal.approve` | Approve |
| `proposal.dismiss` | Dismiss |
| `proposal.approved` | Approved %@ |
| `proposal.viewPlan` | View the plan |
| `proposal.affects` | Affects %1$lld actions · %2$lld plan version(s) |
| `proposal.consequence` | Accepting this saves the plan. It does not book anything. |
| `proposal.consequenceBooking` | Accepting this also books %1$@ in %2$@. |
| `proposal.expires` | Expires %@. If your workspace has changed, Adler will need to make an updated proposal. |
| `proposal.noReason` | No reason was saved with this proposal. |
| `compare.current` | Current |
| `compare.suggested` | Suggested |
| `compare.noChange` | (no change) |
| `compare.notAdded` | Not added yet |
| `compare.removed` | Removed from your workspace |
| `compare.notSet` | Not set |
| `compare.why` | Why this change |
| `evidence.title` | Why this? |
| `evidence.explanation` | WORKING EXPLANATION |
| `evidence.inputsReports` | YOUR REPORTS |
| `evidence.inputsResearch` | RESEARCH |
| `evidence.laterFeedback` | LATER FEEDBACK |
| `evidence.prediction` | What we predicted |
| `evidence.reviewRule` | How we’ll review it |
| `evidence.claims` | Claims |
| `evidence.sources` | Sources |
| `evidence.alternatives` | Alternatives |
| `evidence.limitation` | What remains uncertain |
| `evidence.versions` | Versions and history |
| `evidence.grade` | Grade |
| `evidence.checked` | Checked %1$@ · %2$@ %3$@ |
| `evidence.corrected` | Corrected %@ |
| `evidence.claimMissing` | This earlier claim version is unavailable here. The saved explanation remains historical. |
| `evidence.noClaims` | This earlier explanation has no specific claim links. Its original sources are below. |
| `evidence.readSource` | Read source |
| `a11y.reasoningDiagram` | Inputs, then working explanation, then the action, then later feedback. |

---

## 9. Coach — Conversation

| Key | String |
| --- | --- |
| `coach.title` | Coach |
| `coach.segConversation` | Conversation |
| `coach.segInsights` | Insights |
| `coach.conversations` | Conversations |
| `coach.general` | General |
| `coach.welcomeGoals` | What would you like to work through? |
| `coach.welcomeNew` | What would you like to achieve? |
| `coach.welcomeBody` | Share what happened, check in on your week, or work through a blocker. Your goals and what you’ve shared are already here. |
| `coach.welcomeGoal` | We’re working toward: %@. Tell me what happened or what needs to change. |
| `composer.placeholder` | A goal, an update, or something to work through… |
| `composer.send` | Send message |
| `composer.stop` | Stop |
| `composer.about` | About: %@ |
| `coach.thinking` | Thinking with you… |
| `coach.you` | You |
| `coach.adler` | Adler |
| `coach.connected` | Connected update |
| `coach.scheduled` | Scheduled check-in |
| `coach.savedToWorkspace` | Saved to your workspace |
| `coach.openPlan` | Open plan |
| `coach.viewProgress` | View progress |
| `coach.longError` | Adler couldn’t finish this request. Try again or adjust the request. |
| `coach.whatHappened` | What happened |
| `a11y.coach.thread` | Conversation with Adler |
| `quick.barrier` | Something got in the way |
| `quick.today` | What should I do today? |
| `quick.review` | Review what happened this week |
| `quick.newGoal` | I want to start a goal |

---

## 10. Coach — Insights

| Key | String |
| --- | --- |
| `insights.tryingNow` | Trying now |
| `insights.learned` | What we’ve learned |
| `insights.history` | Earlier attempts & history |
| `insights.memories` | Saved context & preferences |
| `insights.filterAll` | All goals |
| `insights.attempts` | %lld attempts reported |
| `insights.noAttempts` | No attempts reported yet |
| `insights.nextReview` | Review %@ |
| `insights.reviewWhenUseful` | Review after useful feedback |
| `insights.plannedStart` | Planned start %@ |
| `insights.explore` | Explore |
| `insights.told` | What you told Adler |
| `insights.shapes` | How this shapes your plan |
| `insights.noChange` | Keep this in view at the next review. No changes were attached to this observation. |
| `insights.saved` | Saved |
| `insights.proposed` | Proposed |
| `insights.staleChange` | Needs a fresh review |
| `insights.notApplied` | Not applied |
| `record.observation` | Observation |
| `record.interpretation` | Behavioural interpretation |
| `record.change` | Hypothesis and change |
| `record.reports` | Dated reports |
| `record.review` | Review |
| `record.understanding` | Updated understanding |
| `record.expectedEffect` | Expected effect |
| `record.whatToNotice` | What to notice |
| `record.comparison` | A fair comparison |
| `record.wasUsed` | Was the change used? |
| `record.exposureUnknown` | Not established |
| `record.exposureUsed` | Reported as used |
| `record.exposureNotUsed` | Reported as not used |
| `record.forPlan` | For your plan: |
| `record.nextQuestion` | Next question: |
| `record.otherExplanations` | What else could explain this? |
| `record.originalPrediction` | Original prediction: |
| `record.agreementNote` | Agreeing to try a change does not establish that you used it or that it caused a result. |

---

## 11. Calendar

| Key | String |
| --- | --- |
| `calendar.title` | Calendar |
| `calendar.today` | Today |
| `calendar.addTime` | Add time |
| `calendar.placeHere` | Place here |
| `calendar.tentative` | Tentative |
| `calendar.adlerPlan` | Adler plan |
| `calendar.otherCommitment` | Other commitment |
| `calendar.checkIn` | Check-in |
| `calendar.legendTentative` | Dashed · Tentative |
| `calendar.tentativeNote` | Tentative blocks are only in Adler. |
| `calendar.placementHint` | Dashed blocks make room for your planned actions. Select one to adjust or confirm its time. |
| `calendar.unplaced` | %lld action(s) need room or a prerequisite |
| `calendar.adjustWithCoach` | Adjust with Adler |
| `calendar.reasonPrerequisite` | Waiting for a prerequisite |
| `calendar.reasonBudget` | Weekly time budget is full |
| `calendar.reasonHours` | No room in the saved working hours |
| `calendar.checkAvailability` | Check availability |
| `calendar.refreshAvailability` | Refresh availability |
| `calendar.saveTime` | Save time |
| `calendar.confirmBooking` | Confirm booking |
| `calendar.confirming` | Confirming… |
| `calendar.bookInto` | Books into %@ |
| `calendar.withCheckIn` | Includes a 5-minute check-in event |
| `calendar.localOnly` | Saves in Adler only. |
| `calendar.notChecked` | External calendars haven’t been checked. |
| `calendar.recheck` | Availability is checked again when you book. |
| `calendar.notConnected` | Connect or refresh your calendars to see external busy time. |
| `calendar.connected` | Connected calendars checked for this view. External events show busy time. |
| `calendar.unknownAvailability` | Availability is unknown. |
| `calendar.overBudget` | That week is over your available time budget. Choose another week or adjust your available hours. |
| `calendar.conflict` | That time conflicts with a commitment. Choose another time. |
| `calendar.past` | Choose a valid future time in your timezone. |
| `calendar.pendingTitle` | Finish confirming your time |
| `calendar.retryBooking` | Retry confirmation |
| `calendar.retryNote` | Retry checks the existing booking to avoid duplicates. |
| `calendar.closeBooking` | I checked my calendar · close this booking |
| `calendar.manage` | Manage calendars |

---

## 12. Settings

| Key | String |
| --- | --- |
| `settings.title` | Settings |
| `settings.preferences` | Preferences |
| `settings.timeZone` | Time zone |
| `settings.appearance` | Appearance |
| `settings.appearanceSystem` | System |
| `settings.appearanceLight` | Light |
| `settings.appearanceDark` | Dark |
| `settings.coaching` | Coaching |
| `settings.program` | Coaching program |
| `settings.checkIns` | Check-ins |
| `settings.connections` | Connections |
| `settings.provider` | AI provider |
| `settings.advanced` | Advanced |
| `settings.server` | Server |
| `settings.about` | About & method |
| `settings.signOut` | Sign out |
| `settings.signOutConfirm` | Sign out? Your goals and history stay on the server. |
| `settings.serverChange` | Changing the server signs you out of this session. |
| `provider.title` | Choose the model behind Adler. |
| `provider.body` | Goal setup and ongoing coaching use your selected provider. Your program, records and proposed changes work the same way. |
| `provider.provider` | Provider |
| `provider.model` | Model |
| `provider.useServer` | Use this server’s configured API account |
| `provider.key` | API key |
| `provider.keyPlaceholder` | Paste your provider API key |
| `provider.keySaved` | Saved securely — enter a replacement to change it |
| `provider.keyHint` | Keys are encrypted on the server and never returned to the app. API billing is separate from a ChatGPT, Gemini or Claude subscription. |
| `provider.save` | Save provider |
| `provider.saveTest` | Save & test connection |
| `provider.remove` | Remove key |
| `provider.testHint` | The connection test makes one small paid API request, without your workspace data. |
| `provider.saved` | Provider settings saved. Test the connection to check this account’s API access. |
| `provider.tested` | Connected to %1$@. A small test request succeeded at %2$@. |
| `provider.removed` | Saved key removed. |
| `checkins.enable` | Send me scheduled check-ins and a weekly review invitation |
| `checkins.when` | When to check in |
| `checkins.afterSession` | After scheduled work |
| `checkins.endOfDay` | At the end of my day |
| `checkins.dailyTime` | Daily check-in time |
| `checkins.reviewTime` | %@ review time |
| `checkins.quietStart` | Quiet hours start |
| `checkins.quietEnd` | Quiet hours end |
| `checkins.hint` | Requires a linked phone. Scheduled messages wait during quiet hours. Daily check-ins ask about your day while you have active goals; they do not assume unreported work was missed. |
| `checkins.status` | Scheduled work and delivery status |
| `checkins.noJobs` | No jobs scheduled yet. |
| `connections.title` | The same Adler, wherever you reply. |
| `connections.textTitle` | Text Adler from your phone |
| `connections.phone` | Your phone number |
| `connections.getCode` | Get pairing code |
| `connections.codeInstruction` | From %1$@, text this to %2$@ within 10 minutes: |
| `connections.linked` | Linked: %@ |
| `connections.ready` | Ready for replies |
| `connections.optedOut` | Texts stopped. Send START to resume. |
| `connections.unlink` | Unlink phone |
| `connections.notConfigured` | Phone messaging has not been connected on this server yet. |
| `connections.tokens` | MCP & incoming webhooks |
| `connections.tokenType` | Access token type |
| `connections.tokenMcp` | MCP access |
| `connections.tokenWebhook` | Incoming webhook access |
| `connections.createToken` | Create 30-day token |
| `connections.copyOnce` | Copy this now. The token is shown only once. |
| `connections.copy` | Copy connection details |
| `connections.copied` | Connection details copied. |
| `connections.hide` | Hide token |
| `connections.revoke` | Revoke |
| `connections.calendarConnected` | Connected |
| `connections.calendarOptional` | Optional |
| `connections.connect` | Connect |
| `connections.disconnect` | Disconnect |
| `program.title` | Time & coaching |
| `program.body` | Set when you have time and how often you want to look back. Each goal’s planning cycle adapts to your input. |
| `program.weeklyMinutes` | Minutes per week |
| `program.sessionMinutes` | Session length |
| `program.workStart` | Work window starts |
| `program.workEnd` | Work window ends |
| `program.workDays` | Days available |
| `program.reviewDay` | Weekly review day |
| `program.focusGoal` | Focus goal |
| `program.approach` | Current approach |
| `program.methods` | Methods Adler may use |
| `program.reason` | Reason for this revision |
| `program.save` | Save preferences |
| `program.hint` | These are planning preferences. Adler still checks your capacity and asks before booking time. |
| `program.defaultReason` | You updated your coaching preferences. |

---

## 13. Empty, loading, error

| Key | String |
| --- | --- |
| `empty.noGoals` | Start with a goal. |
| `empty.noGoalsBody` | Tell Adler what you want to achieve. It will work out the first useful step with you. |
| `empty.draftNoPlan` | Goal saved |
| `empty.draftNoPlanBody` | Your outcome and target are saved. Choose the first useful work with your coach. |
| `empty.noActionsToday` | Nothing scheduled for today. Your next step is here when you need it. |
| `empty.restDay` | A little space for what’s next. |
| `empty.restDayBody` | Your goals are complete or on hold. |
| `empty.restDayAction` | Choose a goal |
| `empty.noActionsForMilestone` | No actions are linked to this milestone yet. |
| `empty.noActionsForMilestoneAction` | Plan its actions |
| `empty.noOutcomeMeasure` | No outcome measure saved. |
| `empty.noOutcomeMeasureBody` | Adler compares reported results with your plan once you choose what to measure. |
| `empty.noProjection` | No finish estimate yet. |
| `empty.noLearning` | The next clue comes from you. |
| `empty.noLearningBody` | A useful detail from your day helps Adler understand what fits. No experiment is needed to check in. |
| `empty.noLearningAction` | Share how it went |
| `empty.noInsights` | Start with what happened. |
| `empty.noInsightsBody` | Tell Adler about a session, result or obstacle. Useful observations appear here with their sources and any changes to your plan. |
| `empty.noConversations` | No conversations yet. |
| `empty.calendarNotConnected` | No calendar connected. |
| `empty.calendarNotConnectedBody` | Adler can still plan tentative blocks. External busy time stays unknown until you connect a calendar. |
| `empty.noUnplaced` | All planned work has a place this week. |
| `error.offline` | You’re offline. Showing the last saved view. |
| `error.server` | The request could not be completed. |
| `error.staleRevision` | Your workspace changed somewhere else. Review the update, then try again. |
| `error.staleDiff` | Changed since you opened this: %@ |
| `error.recordGone` | This record is no longer here. |
| `error.signedOut` | Your session ended. Sign in to continue. |
| `error.noProvider` | No AI provider is configured on this server. |
| `error.noProviderAction` | Set up |
| `error.deepLinkMissing` | That link no longer points to anything saved. |
| `error.timeout` | This is taking longer than expected. |
| `loading.default` | Loading |

---

## 14. Server-supplied strings (reference — do not localise)

Rendered verbatim from the API. Listed so implementers recognise them and never re-word them.

- **Learning workflow** (`learningStatus`): `Suggested` · `Declined` · `Finished` · `Paused` · `Needs another look` · `Reviewed` · `Ready to review` · `Starting soon` · `Live experiment`
- **Evidence standing** (`learningStanding`): `Waiting to learn` · `More context needed` · `Consistent so far` · `Mixed observations` · `Not supported in this context` · `Evidence has changed`
- **Progress delta label** (`goalPlanProgress.label`): `No outcome measure` · `Add a result` · `First checkpoint ahead` · `No dated checkpoint` · `Update needed` · `Verify the milestone` · `Milestone still open` · `Below checkpoint` · `Above checkpoint` · `At checkpoint` · or the goal status
- **Goal status**: `Draft` · `Active` · `Paused` · `Completed` · `Set aside`; priority `Focus` · `Maintain` · `Later`
- **Outcome**: `Done` · `Partly` · `Didn’t happen`
- **Projection status** (`goalProjection.status`): `Tracking results · finish not yet estimated` · `Tracking milestones` · `Tracking your reported experience` · `Review what you’re measuring` · `Record a starting outcome` · `Review the outcome changes` · `Learning the input–outcome link` · `No outcome response observed yet` · `Input-based projection` · `Early observed association` · `Observed association`
- **Pace source**: `Observed input pace` · `Provisional input pace`
- **Projection assumption labels**: `How this estimate works` · `Starting from your last report` · `Future work` · `Gaps in the record` · `How work relates to the result` · `Feedback delay` · `What the range means`
- **Excluded-period reasons** and **`projectionUnavailableReason`**: full sentences from `shared/goal-projection.ts`
- **Claim relation**: `supports` · `defines` · `motivates` · `limits` · `contradicts`
- **Claim role**: `theory` · `technique` · `empirical` · `heuristic` (display as `Framework idea` · `Technique definition` · `Research finding` · `Practical rule`)
- **Source access**: `abstract` · `method summary` · `full text excerpt`
- **Evidence grade**: free-form prose, never a badge or a number
- **Change record labels** (`ProposalChanges`): `Goal` · `Plan` · `Milestone` · `Progress check` · `Action` · `Recorded result` · `Saved information` · `Weekly plan` · `Review` · `Preferences` · `Calendar` · `Chat`
- **Recommendation prose**: `action`, `observation`, `interpretation`, `expectedEffect`, and every field of `reasoning` — always verbatim
