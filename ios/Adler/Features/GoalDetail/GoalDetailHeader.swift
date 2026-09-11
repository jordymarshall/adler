import SwiftUI

/// `GOAL` — the outcome, its measure, its deadline flexibility and its status.
/// A Draft carries `Start plan`; when the plan has no chosen work the server refuses it and
/// its sentence is shown verbatim by the screen above.
struct GoalDetailHeader: View {
    let detail: GoalDetailView
    let timeZone: TimeZone
    var onStartPlan: () -> Void
    var onPlanFirstAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            Text("GOAL")
                .adlerText(.eyebrow)
                .foregroundStyle(Color.inkMuted)
                .accessibilityAddTraits(.isHeader)

            HStack(alignment: .top, spacing: Space.s) {
                GoalRule(color: GoalColor.parse(detail.goal.color)).frame(height: 30)
                Text(detail.goal.title)
                    .adlerText(.title1)
                    .foregroundStyle(Color.inkHeading)
                    .fixedSize(horizontal: false, vertical: true)
            }

            FlowLayout(spacing: Space.xs, lineSpacing: Space.xs) {
                if detail.priority == .focus {
                    AdlerChip(label: GoalPriority.focus.rawValue, emphasis: .filled)
                }
                AdlerChip(label: detail.goal.status.rawValue)
                if !detail.area.isEmpty && detail.area != GoalArea.unassigned.rawValue {
                    AdlerChip(label: detail.area)
                }
            }

            if !detail.success.isEmpty {
                Text(detail.success)
                    .adlerText(.callout)
                    .foregroundStyle(Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let target = GoalDetailPresentation.targetLine(detail, timeZone: timeZone) {
                Text(target)
                    .adlerText(.subhead, numeric: true)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Text(GoalDetailPresentation.resultLine(detail, timeZone: timeZone))
                .adlerText(.subhead, numeric: true)
                .foregroundStyle(Color.ink)
                .fixedSize(horizontal: false, vertical: true)

            if !detail.why.isEmpty {
                Text(detail.why)
                    .adlerText(.footnote)
                    .foregroundStyle(Color.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if detail.goal.status == .draft {
                VStack(alignment: .leading, spacing: Space.s) {
                    AdlerPrimaryButton(title: GoalCopy.startPlan, action: onStartPlan)
                    AdlerQuietButton(title: "Plan first action", action: onPlanFirstAction)
                }
                .padding(.top, Space.xs)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AdlerLayout.cardPadding)
        .adlerCard()
    }
}
