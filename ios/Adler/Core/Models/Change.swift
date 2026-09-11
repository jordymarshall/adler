import Foundation

/// One command from the shared catalog (`server/commands.ts` `changeSchema`).
///
/// `values` is a **JSON string** of only the fields to set — `"{}"` for a deletion. It is not a
/// nested object, and the server rejects anything else. Build these with `ChangeBuilder` rather
/// than hand-rolling the JSON: it enforces the rules that matter (an unknown amount is omitted,
/// never sent as `0`; outcome strings use the typographic apostrophe).
nonisolated struct Change: Codable, Sendable, Equatable, Hashable {
    let entity: ChangeEntity
    let operation: ChangeOperation
    /// `nil` for a create the server should identify.
    let id: String?
    /// The owning goal for nested records.
    let parentId: String?
    /// A brief user-facing reason, shown beside the change. Optional.
    let reason: String?
    let values: String

    init(
        entity: ChangeEntity,
        operation: ChangeOperation,
        id: String?,
        parentId: String?,
        reason: String? = nil,
        values: String
    ) {
        self.entity = entity
        self.operation = operation
        self.id = id
        self.parentId = parentId
        self.reason = reason
        self.values = values
    }

    /// The `values` payload parsed for display (proposal Current → Suggested).
    var decodedValues: JSONValue? { JSONValue.decoding(jsonString: values) }

    private enum CodingKeys: String, CodingKey {
        case entity, operation, id, parentId, reason, values
    }

    /// `id` and `parentId` are *required and nullable* in `changeSchema`, not optional: the keys
    /// must be present as `null`. The synthesized encoder would drop them and the server would
    /// answer `changes.0.parentId: Invalid input: expected string, received undefined`.
    /// `reason` really is optional, so it is the one field that may be missing.
    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(entity, forKey: .entity)
        try container.encode(operation, forKey: .operation)
        if let id { try container.encode(id, forKey: .id) } else {
            try container.encodeNil(forKey: .id)
        }
        if let parentId { try container.encode(parentId, forKey: .parentId) } else {
            try container.encodeNil(forKey: .parentId)
        }
        try container.encodeIfPresent(reason, forKey: .reason)
        try container.encode(values, forKey: .values)
    }
}
