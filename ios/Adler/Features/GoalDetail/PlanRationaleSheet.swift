import SwiftUI

/// "Why this plan?" — the saved rationale for the selected plan version, rendered through the
/// design system's `EvidenceDisclosure` so claims, relations, grades, sources, alternatives and
/// limitations all read the same way they do behind a recommendation.
///
/// Nothing is composed here. When the plan has no saved basis or reasoning, the server's own
/// `note` is shown instead of an empty sheet.
struct PlanRationaleSheet: View {
    let rationale: RationaleView
    let timeZone: TimeZone
    var onClose: () -> Void

    var body: some View {
        if let record = GoalDetailPresentation.evidenceRecord(rationale, timeZone: timeZone) {
            EvidenceDisclosure(record: record, onClose: onClose)
        } else {
            NavigationStack {
                ScrollView {
                    VStack(alignment: .leading, spacing: Space.m) {
                        Text(
                            rationale.note
                                ?? "This plan records your chosen work. No behavioural interpretation is saved for this version."
                        )
                        .adlerText(.body)
                        .foregroundStyle(Color.ink)
                        .fixedSize(horizontal: false, vertical: true)
                        if let question = rationale.assessmentQuestion {
                            Text(question)
                                .adlerText(.footnote)
                                .foregroundStyle(Color.inkMuted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(AdlerLayout.screenMargin)
                }
                .background(Color.canvas)
                .navigationTitle(GoalCopy.whyThisPlan)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) { Button("Close", action: onClose) }
                }
            }
        }
    }
}
