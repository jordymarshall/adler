import SwiftUI

/// Chat stays conversational (DESIGN.md §4.15) — no cards inside bubbles.
/// Recommendation and Proposal cards are full-width inset cards **between**
/// bubbles, never bubbles themselves.
///
/// Provenance is explicit: a message that arrived by text, MCP or a
/// scheduled job carries a channel chip, so the person always knows where a
/// reply came from.
struct ConversationBubble: View {
    let message: ConversationMessage

    var body: some View {
        VStack(alignment: message.role == .user ? .trailing : .leading, spacing: Space.xs) {
            if let timestamp = message.timestamp {
                Text(AdlerDate.time(timestamp))
                    .adlerText(.caption, numeric: true)
                    .foregroundStyle(Color.inkMuted)
            }
            bubble
            if !message.links.isEmpty {
                VStack(alignment: .leading, spacing: Space.xs) {
                    ForEach(message.links) { link in
                        Button {
                            link.action?()
                        } label: {
                            HStack(spacing: Space.xs) {
                                Text(link.title).adlerText(.footnote)
                                Image(systemName: "chevron.right").font(.caption2)
                            }
                            .foregroundStyle(Color.accentInk)
                            .frame(minHeight: AdlerLayout.minimumHitTarget, alignment: .leading)
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: message.role == .user ? .trailing : .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(message.accessibilityLabel)
    }

    @ViewBuilder
    private var bubble: some View {
        VStack(alignment: .leading, spacing: Space.xs) {
            if let channel = message.channelLabel {
                AdlerChip(label: channel)
            }
            if message.inProgress {
                ThinkingIndicator()
            } else {
                Text(message.text)
                    .adlerText(.body)
                    .foregroundStyle(message.role == .user ? Color.onAccent : Color.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.horizontal, Space.m)
        .padding(.vertical, Space.s + 2)
        .background {
            if message.role == .user {
                BubbleShape(isUser: true).fill(Color.accentGreen)
            } else {
                ZStack {
                    BubbleShape(isUser: false).fill(Color.surface)
                    BubbleShape(isUser: false).stroke(Color.separator, lineWidth: 1)
                }
            }
        }
        .frame(maxWidth: message.role == .user ? 300 : 340, alignment: .leading)
    }
}

private struct BubbleShape: Shape {
    let isUser: Bool

    func path(in rect: CGRect) -> Path {
        Path(
            roundedRect: rect,
            cornerRadii: RectangleCornerRadii(
                topLeading: 18,
                bottomLeading: isUser ? 18 : 4,
                bottomTrailing: isUser ? 4 : 18,
                topTrailing: 18
            )
        )
    }
}

/// The response-in-progress bubble. Its label is spoken, so waiting is never
/// conveyed by animation alone.
struct ThinkingIndicator: View {
    @Environment(\.adlerMotion) private var motion
    @State private var active = false

    var body: some View {
        HStack(spacing: Space.xs) {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(Color.inkMuted)
                    .frame(width: 6, height: 6)
                    .opacity(active ? 0.35 : 1)
                    .animation(
                        motion.reduceMotion
                            ? nil
                            : .easeInOut(duration: 0.6).repeatForever().delay(Double(index) * 0.15),
                        value: active
                    )
            }
        }
        .frame(height: 18)
        .onAppear { active = true }
        .accessibilityElement()
        .accessibilityLabel("Thinking with you…")
    }
}

// MARK: - Value types

nonisolated struct ConversationMessage: Identifiable, Equatable, Sendable {
    nonisolated enum Role: String, Equatable, Sendable {
        case user
        case coach
    }

    let id: String
    let role: Role
    var text: String = ""
    var timestamp: Date?
    /// `sms` · `imessage` · `mcp` · `job`. `nil` (or `web`) shows no chip.
    var channel: String?
    var links: [MessageLink] = []
    /// The coach is still composing. The field stays editable meanwhile.
    var inProgress: Bool = false

    var channelLabel: String? {
        switch channel {
        case "sms", "imessage": "Connected update"
        case "job": "Scheduled check-in"
        case "mcp": "Connected update"
        default: nil
        }
    }

    var accessibilityLabel: String {
        var parts = [role == .user ? "You" : "Adler"]
        if let channelLabel { parts.append(channelLabel) }
        parts.append(inProgress ? "Thinking with you…" : text)
        if let timestamp { parts.append(AdlerDate.time(timestamp)) }
        return parts.joined(separator: ". ")
    }

    static func == (lhs: ConversationMessage, rhs: ConversationMessage) -> Bool {
        lhs.id == rhs.id
            && lhs.role == rhs.role
            && lhs.text == rhs.text
            && lhs.timestamp == rhs.timestamp
            && lhs.channel == rhs.channel
            && lhs.inProgress == rhs.inProgress
            && lhs.links.map(\.id) == rhs.links.map(\.id)
    }
}

nonisolated struct MessageLink: Identifiable, Sendable {
    let id: String
    /// `Open Portfolio · Progress`.
    let title: String
    var action: (@Sendable () -> Void)?
}

/// Fictional design data.
#Preview("Conversation bubbles") {
    ScrollView {
        VStack(spacing: Space.m) {
            ConversationBubble(
                message: ConversationMessage(
                    id: "1",
                    role: .user,
                    text: "I had time to write but spent it scrolling on my phone.",
                    timestamp: .now
                )
            )
            ConversationBubble(
                message: ConversationMessage(
                    id: "2",
                    role: .coach,
                    text: "That is useful. The time existed, so the plan does not need more time — it needs the phone out of reach. Shall we test that for two sessions?",
                    timestamp: .now,
                    links: [MessageLink(id: "l1", title: "Open Portfolio · Progress", action: {})]
                )
            )
            ConversationBubble(
                message: ConversationMessage(
                    id: "3",
                    role: .user,
                    text: "Wrote for 25 minutes today.",
                    channel: "sms"
                )
            )
            ConversationBubble(
                message: ConversationMessage(id: "4", role: .coach, inProgress: true)
            )
        }
        .padding(AdlerLayout.screenMargin)
    }
    .background(Color.canvas)
}
