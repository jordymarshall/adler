import Foundation
import XCTest

@testable import Adler

/// `values` is a JSON string the server parses with a strict Zod schema, so these assertions are
/// byte-exact. The two rules worth a test each: an unknown amount is omitted (never `0`), and
/// `Didn’t happen` carries the typographic apostrophe.
nonisolated final class CoreChangeBuilderTests: XCTestCase {

    func testReportActionOmitsUnknownAmount() {
        let change = ChangeBuilder.reportAction(
            id: "action-1", goalId: "portfolio", outcome: .done)
        XCTAssertEqual(change.entity, .action)
        XCTAssertEqual(change.operation, .update)
        XCTAssertEqual(change.id, "action-1")
        XCTAssertEqual(change.parentId, "portfolio")
        XCTAssertNil(change.reason)
        XCTAssertEqual(change.values, #"{"outcome":"Done"}"#)
        XCTAssertFalse(change.values.contains("amount"), "unknown amount must not be sent as 0")
        XCTAssertFalse(change.values.contains("actualMinutes"))
        XCTAssertFalse(change.values.contains("note"))
    }

    func testReportActionIncludesWhatWasMeasured() {
        let change = ChangeBuilder.reportAction(
            id: "action-1", goalId: "guide", outcome: .partly, amount: 250, minutes: 20,
            note: "Ran out of time.", reason: "Reported from the app right after the session.")
        XCTAssertEqual(
            change.values,
            #"{"actualMinutes":20,"amount":250,"note":"Ran out of time.","outcome":"Partly"}"#)
        XCTAssertEqual(change.reason, "Reported from the app right after the session.")
    }

    func testDidntHappenUsesTypographicApostrophe() {
        let change = ChangeBuilder.reportAction(
            id: "a", goalId: "g", outcome: .didntHappen, amount: 0, minutes: 0)
        XCTAssertEqual(
            change.values, #"{"actualMinutes":0,"amount":0,"outcome":"Didn’t happen"}"#)
        XCTAssertTrue(change.values.contains("\u{2019}"))
        XCTAssertFalse(change.values.contains("Didn't happen"), "ASCII apostrophe is rejected")
    }

    func testAmountZeroIsSentWhenItIsAMeasurement() {
        // Explicit 0 is a measured zero and must survive; only `nil` is dropped.
        let measured = ChangeBuilder.reportAction(
            id: "a", goalId: "g", outcome: .done, amount: 0)
        XCTAssertEqual(measured.values, #"{"amount":0,"outcome":"Done"}"#)
        let unknown = ChangeBuilder.reportAction(
            id: "a", goalId: "g", outcome: .done, amount: nil)
        XCTAssertEqual(unknown.values, #"{"outcome":"Done"}"#)
    }

    func testEmptyNoteIsOmitted() {
        let change = ChangeBuilder.reportAction(
            id: "a", goalId: "g", outcome: .done, note: "")
        XCTAssertEqual(change.values, #"{"outcome":"Done"}"#)
    }

    func testMilestoneDone() {
        let change = ChangeBuilder.setMilestoneDone(
            goalId: "portfolio", milestoneId: "case-study-1", done: true)
        XCTAssertEqual(change.entity, .milestone)
        XCTAssertEqual(change.id, "case-study-1")
        XCTAssertEqual(change.parentId, "portfolio")
        XCTAssertEqual(change.values, #"{"done":true}"#)
    }

    func testMilestoneDueDateCanBeClearedButNotAccidentally() {
        let cleared = ChangeBuilder.updateMilestone(
            goalId: "g", milestoneId: "m", dueDate: .some(nil))
        XCTAssertEqual(cleared.values, #"{"dueDate":null}"#)

        let untouched = ChangeBuilder.updateMilestone(goalId: "g", milestoneId: "m", title: "New")
        XCTAssertEqual(untouched.values, #"{"title":"New"}"#)

        let set = ChangeBuilder.updateMilestone(
            goalId: "g", milestoneId: "m", dueDate: .some(YMD("2026-09-24")))
        XCTAssertEqual(set.values, #"{"dueDate":"2026-09-24"}"#)
    }

    func testAddResult() {
        let change = ChangeBuilder.addResult(
            goalId: "guide", value: 2330, date: YMD("2026-09-04"),
            source: "Word count from the guide document.")
        XCTAssertEqual(change.entity, .result)
        XCTAssertEqual(change.operation, .create)
        XCTAssertNil(change.id)
        XCTAssertEqual(change.parentId, "guide")
        XCTAssertEqual(
            change.values,
            #"{"date":"2026-09-04","source":"Word count from the guide document.","value":2330}"#)
    }

    func testGoalStatusChanges() {
        for status in [GoalStatus.paused, .completed, .setAside, .active] {
            let change = ChangeBuilder.setGoalStatus(id: "g", status: status)
            XCTAssertEqual(change.entity, .goal)
            XCTAssertEqual(change.operation, .update)
            XCTAssertNil(change.parentId)
            XCTAssertEqual(change.values, "{\"status\":\"\(status.rawValue)\"}")
        }
        XCTAssertEqual(
            ChangeBuilder.setGoalStatus(id: "g", status: .setAside).values,
            #"{"status":"Set aside"}"#)
    }

    func testDeletionSendsAnEmptyObject() {
        XCTAssertEqual(ChangeBuilder.deleteGoal(id: "g").values, "{}")
        XCTAssertEqual(ChangeBuilder.deleteMemory(id: "m").values, "{}")
        XCTAssertEqual(
            ChangeBuilder.deleteWorkBlock(id: "b", goalId: "g").values, "{}")
    }

    func testCreateDraftGoalMatchesTheCreateSchema() throws {
        let change = ChangeBuilder.createDraftGoal(
            id: "ios-core-goal",
            title: "Write every weekday morning",
            kind: .practical,
            why: "Because the writing hour disappears once the workday starts.",
            success: "Twenty drafting sessions finished.")
        XCTAssertEqual(change.entity, .goal)
        XCTAssertEqual(change.operation, .create)
        XCTAssertEqual(change.id, "ios-core-goal")

        let values = try XCTUnwrap(change.decodedValues?.objectValue)
        // A Draft with no chosen work: empty action/criterion/timing creates no first action.
        XCTAssertEqual(values["action"], .string(""))
        XCTAssertEqual(values["criterion"], .string(""))
        XCTAssertEqual(values["timing"], .string(""))
        XCTAssertEqual(values["status"], .string("Draft"))
        XCTAssertEqual(values["area"], .string("Unassigned"))
        XCTAssertEqual(values["tags"], .array([]))
        XCTAssertEqual(values["milestones"], .array([]))
        XCTAssertEqual(values["baseline"], .null)
        XCTAssertEqual(values["assessmentTarget"], .number(8))
        XCTAssertEqual(values["targetDate"], .string(""))
        // Nothing the create schema would reject as unknown.
        let allowed: Set<String> = [
            "title", "kind", "why", "success", "area", "tags", "targetDate", "status",
            "milestones", "assessmentTarget", "baseline", "action", "criterion", "timing",
        ]
        XCTAssertTrue(Set(values.keys).isSubset(of: allowed), "unexpected keys: \(values.keys)")
    }

    func testLocalWorkBlockCarriesNoProvider() throws {
        let change = ChangeBuilder.createLocalWorkBlock(
            goalId: "guide", actionTitle: "Write 400 words of the guide",
            start: Timestamp("2026-09-11T13:00:00.000Z"),
            end: Timestamp("2026-09-11T13:20:00.000Z"))
        let values = try XCTUnwrap(change.decodedValues?.objectValue)
        XCTAssertNil(values["provider"], "a local block must not look like an external booking")
        XCTAssertNil(values["calendarId"])
        XCTAssertEqual(values["action"]?.stringValue, "Write 400 words of the guide")
        XCTAssertEqual(values["start"]?.stringValue, "2026-09-11T13:00:00.000Z")
    }

    func testProgramUpdateAlwaysCarriesAReason() throws {
        let change = ChangeBuilder.updateProgram(
            reason: "Cut the weekly budget to fit the new schedule.", weeklyMinutes: 240,
            workDays: [1, 3, 5], reviewDay: .sunday)
        XCTAssertEqual(change.reason, "Cut the weekly budget to fit the new schedule.")
        let values = try XCTUnwrap(change.decodedValues?.objectValue)
        XCTAssertEqual(values["reason"]?.stringValue, change.reason)
        XCTAssertEqual(values["weeklyMinutes"]?.intValue, 240)
        XCTAssertEqual(values["workDays"], .array([.number(1), .number(3), .number(5)]))
        XCTAssertEqual(values["reviewDay"]?.stringValue, "Sunday")
        XCTAssertNil(values["approach"])
    }

    func testPreferencesUpdate() throws {
        let automation = AutomationView(
            enabled: true, checkInMode: .endOfDay, checkInTime: "19:00", reviewTime: "17:00",
            quietStart: "21:00", quietEnd: "08:00")
        let change = ChangeBuilder.updatePreferences(
            theme: .dark, timeZone: "America/Toronto", automation: automation)
        XCTAssertEqual(change.entity, .preferences)
        XCTAssertEqual(change.operation, .update)
        let values = try XCTUnwrap(change.decodedValues?.objectValue)
        XCTAssertEqual(values["theme"]?.stringValue, "dark")
        XCTAssertEqual(values["timeZone"]?.stringValue, "America/Toronto")
        XCTAssertEqual(values["automation"]?["checkInMode"]?.stringValue, "end-of-day")
        XCTAssertEqual(values["automation"]?["enabled"]?.boolValue, true)
    }

    func testChangeIsEncodedWithValuesAsAString() throws {
        let change = ChangeBuilder.reportAction(
            id: "a", goalId: "g", outcome: .done, minutes: 20)
        let request = ChangesRequest(
            changes: [change], revision: 2, requestId: "3f0c-4a1b-9d2e", goalId: "g")
        let data = try JSONEncoder().encode(request)
        let json = try XCTUnwrap(
            JSONSerialization.jsonObject(with: data) as? [String: Any])
        let changes = try XCTUnwrap(json["changes"] as? [[String: Any]])
        XCTAssertEqual(changes.count, 1)
        // The contract is explicit: `values` is a JSON string, not a nested object.
        XCTAssertTrue(changes[0]["values"] is String)
        XCTAssertEqual(changes[0]["values"] as? String, #"{"actualMinutes":20,"outcome":"Done"}"#)
        XCTAssertEqual(json["revision"] as? Int, 2)
        XCTAssertEqual(json["requestId"] as? String, "3f0c-4a1b-9d2e")
    }

    func testNullIdAndParentIdAreSentAsExplicitNulls() throws {
        // `changeSchema` types both as required-and-nullable. Dropping the keys is a 400:
        // "changes.0.parentId: Invalid input: expected string, received undefined".
        let create = ChangeBuilder.saveMemory(text: "Breakfast is the quiet part of the morning.")
        let data = try JSONEncoder().encode(create)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertTrue(json.keys.contains("id"))
        XCTAssertTrue(json.keys.contains("parentId"))
        XCTAssertTrue(json["id"] is NSNull)
        XCTAssertTrue(json["parentId"] is NSNull)
        // `reason` is genuinely optional, so it is omitted when there is none.
        XCTAssertFalse(json.keys.contains("reason"))
        XCTAssertEqual(Set(json.keys), ["entity", "operation", "id", "parentId", "values"])
    }

    func testChangeRoundTripsThroughCodable() throws {
        let original = ChangeBuilder.reportAction(
            id: "a", goalId: "g", outcome: .didntHappen, amount: 0, minutes: 0,
            note: "Slept through it.", reason: "Reported in the app.")
        let decoded = try JSONDecoder().decode(
            Change.self, from: try JSONEncoder().encode(original))
        XCTAssertEqual(decoded, original)
    }

    func testLearningActionVersionSelection() {
        XCTAssertTrue(LearningActionKind.agree.usesActionVersion)
        XCTAssertTrue(LearningActionKind.decline.usesActionVersion)
        XCTAssertFalse(LearningActionKind.pause.usesActionVersion)
        XCTAssertFalse(LearningActionKind.resume.usesActionVersion)
        XCTAssertFalse(LearningActionKind.close.usesActionVersion)
    }

    func testLearningControlsAvailability() {
        let controls = LearningControls(
            agree: true, decline: true, pause: false, resume: false, close: false)
        XCTAssertEqual(controls.available, [.agree, .decline])
        XCTAssertTrue(controls.allows(.agree))
        XCTAssertFalse(controls.allows(.close))
    }
}
