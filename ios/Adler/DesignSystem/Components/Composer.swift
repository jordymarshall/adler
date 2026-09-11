import SwiftUI

/// The bottom-anchored message field with contextual quick prompts
/// (DESIGN.md §4.16).
///
/// Tapping a quick prompt **inserts** its text so the person can edit it —
/// it never sends on their behalf. While a response is in progress the send
/// button becomes `Stop` and the field stays editable.
struct Composer: View {
    @Binding var text: String
    /// Server-supplied, contextual to the open conversation.
    var quickPrompts: [String] = []
    /// The attached record, e.g. `About: Leave the phone in the kitchen`.
    var attachedContext: String?
    var isResponding: Bool = false
    var onSend: () -> Void
    var onStop: (() -> Void)?
    var onRemoveContext: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s) {
            if let attachedContext {
                HStack(spacing: Space.xs) {
                    Text("About: \(attachedContext)")
                        .adlerText(.caption)
                        .foregroundStyle(Color.inkMuted)
                        .lineLimit(1)
                    if let onRemoveContext {
                        Button(action: onRemoveContext) {
                            Image(systemName: "xmark")
                                .font(.caption2)
                                .foregroundStyle(Color.inkMuted)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Remove attached context")
                    }
                }
                .padding(.horizontal, Space.s)
                .padding(.vertical, Space.xs)
                .background(Color.surfaceSunken, in: .rect(cornerRadius: Radii.chip))
            }

            if !quickPrompts.isEmpty {
                FlowLayout(spacing: Space.s, lineSpacing: Space.s) {
                    ForEach(quickPrompts, id: \.self) { prompt in
                        Button {
                            // Insert, never assign: assigning threw away half a typed
                            // message with no undo (DESIGN.md §4.16 — a quick prompt
                            // inserts text to edit).
                            text = text.isEmpty ? prompt : "\(text) \(prompt)"
                        } label: {
                            Text(prompt)
                                .adlerText(.caption)
                                .foregroundStyle(Color.ink)
                                .padding(.horizontal, Space.m)
                                .padding(.vertical, Space.s)
                                .background(Color.surfaceSunken, in: .capsule)
                        }
                        .buttonStyle(.plain)
                        .accessibilityHint("Inserts this text so you can edit it before sending")
                    }
                }
            }

            HStack(alignment: .bottom, spacing: Space.s) {
                TextField("A goal, an update, or something to work through…", text: $text, axis: .vertical)
                    .lineLimit(1...6)
                    .adlerText(.body)
                    .padding(.horizontal, Space.m)
                    .padding(.vertical, Space.s)
                    .background(Color.surface, in: .rect(cornerRadius: Radii.largeCard))
                    .overlay {
                        RoundedRectangle(cornerRadius: Radii.largeCard)
                            .strokeBorder(Color.separator, lineWidth: 1)
                    }
                    .accessibilityLabel("Message Adler")

                if isResponding {
                    Button {
                        onStop?()
                    } label: {
                        Image(systemName: "stop.circle")
                            .font(.title2)
                            .foregroundStyle(Color.inkMuted)
                    }
                    .buttonStyle(.plain)
                    .frame(width: AdlerLayout.minimumHitTarget, height: AdlerLayout.minimumHitTarget)
                    .accessibilityLabel("Stop")
                } else {
                    Button(action: onSend) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                            .foregroundStyle(text.isEmpty ? Color.inkMuted : Color.accentInk)
                    }
                    .buttonStyle(.plain)
                    .disabled(text.isEmpty)
                    .frame(width: AdlerLayout.minimumHitTarget, height: AdlerLayout.minimumHitTarget)
                    .accessibilityLabel("Send message")
                }
            }
        }
        .padding(Space.m)
        .background(.bar)
        .accessibilityElement(children: .contain)
    }
}

/// Fictional design data.
#Preview("Composer") {
    @Previewable @State var text = ""
    @Previewable @State var responding = false
    return VStack {
        Spacer()
        Composer(
            text: $text,
            quickPrompts: [
                "Something got in the way",
                "What should I do today?",
                "Review what happened this week",
                "I want to start a goal"
            ],
            attachedContext: "Leave the phone in the kitchen",
            isResponding: responding,
            onSend: { responding = true },
            onStop: { responding = false },
            onRemoveContext: {}
        )
    }
    .background(Color.canvas)
}
