import Foundation
import XCTest

@testable import Adler

/// Error mapping, request shaping and SSE parsing, against a `URLProtocol` stub.
nonisolated final class CoreAPIClientTests: XCTestCase {

    override func setUp() {
        super.setUp()
        StubURLProtocol.reset()
    }

    override func tearDown() {
        StubURLProtocol.reset()
        super.tearDown()
    }

    // MARK: - Error mapping

    func test401IsUnauthenticated() async {
        StubURLProtocol.enqueue(status: 401, json: #"{"error":"Sign in to your workspace."}"#)
        do {
            _ = try await StubURLProtocol.client().send(Endpoints.session())
            XCTFail("expected unauthenticated")
        } catch {
            XCTAssertEqual(error, .unauthenticated)
        }
    }

    func test409CarriesTheCurrentRevision() async {
        StubURLProtocol.enqueue(
            status: 409,
            json: #"{"error":"This workspace changed in another channel.","revision":4}"#)
        do {
            _ = try await StubURLProtocol.client().send(
                Endpoints.changes(
                    ChangesRequest(changes: [], revision: 2, requestId: "r-1", goalId: nil)))
            XCTFail("expected staleRevision")
        } catch {
            XCTAssertEqual(error, .staleRevision(current: 4))
            XCTAssertFalse(error.isRetryableWithSameRequestID)
        }
    }

    func test500ShowsTheServerMessageVerbatim() async {
        StubURLProtocol.enqueue(status: 500, json: #"{"error":"The request could not complete."}"#)
        do {
            _ = try await StubURLProtocol.client().send(Endpoints.today())
            XCTFail("expected server error")
        } catch {
            XCTAssertEqual(
                error, .server(message: "The request could not complete.", status: 500))
            XCTAssertEqual(error.serverMessage, "The request could not complete.")
        }
    }

    func test400RefusalKeepsTheServerWording() async {
        let message = "Choose a first action before starting this goal’s plan."
        StubURLProtocol.enqueue(status: 400, json: #"{"error":"\#(message)"}"#)
        do {
            _ = try await StubURLProtocol.client().send(Endpoints.startGoal(id: "running"))
            XCTFail("expected server error")
        } catch {
            XCTAssertEqual(error.serverMessage, message)
        }
    }

    func test404IsFlaggedForRecordGone() async {
        StubURLProtocol.enqueue(status: 404, json: #"{"error":"This goal isn’t here."}"#)
        do {
            _ = try await StubURLProtocol.client().send(Endpoints.goal(id: "not-a-goal"))
            XCTFail("expected 404")
        } catch {
            XCTAssertTrue(error.isNotFound)
        }
    }

    func test429IsFlagged() {
        let body = Data(#"{"error":"Too many requests. Please try again later."}"#.utf8)
        XCTAssertTrue(APIClient.failure(status: 429, body: body).isRateLimited)
    }

    func testNonJSONErrorBodyStillSurfaces() {
        let failure = APIClient.failure(status: 502, body: Data("Bad gateway".utf8))
        XCTAssertEqual(failure, .server(message: "Bad gateway", status: 502))
    }

    func testTimeoutIsRetryableWithTheSameRequestID() async {
        StubURLProtocol.enqueue(error: URLError(.timedOut))
        do {
            _ = try await StubURLProtocol.client().send(
                Endpoints.coachMessage(
                    CoachRequest(
                        message: "hello", goalId: nil, conversationId: nil, focusGoalId: nil,
                        requestId: "r-1")))
            XCTFail("expected transport error")
        } catch {
            // The literal, not `error.errorDescription` — taking the expected message from the
            // error under test asserts only `kind`.
            XCTAssertEqual(
                error,
                .transport(
                    message: "The server took too long to answer. You can retry the same request.",
                    kind: .timeout))
            XCTAssertTrue(error.isRetryableWithSameRequestID)
        }
    }

    func testOfflineIsReportedAsOffline() async {
        StubURLProtocol.enqueue(error: URLError(.notConnectedToInternet))
        do {
            _ = try await StubURLProtocol.client().send(Endpoints.today())
            XCTFail("expected transport error")
        } catch {
            XCTAssertTrue(error.isOffline)
        }
    }

    func testMalformedSuccessBodyIsADecodingError() async {
        StubURLProtocol.enqueue(status: 200, json: #"{"unexpected":true}"#)
        do {
            _ = try await StubURLProtocol.client().send(Endpoints.session())
            XCTFail("expected decoding error")
        } catch {
            guard case .decoding = error else {
                return XCTFail("expected .decoding, got \(error)")
            }
        }
    }

    // MARK: - Successful decode through the client

    func testSuccessfulReadDecodesTheTypedView() async throws {
        let json = try String(
            data: try XCTUnwrap(
                JSONSerialization.data(
                    withJSONObject: try XCTUnwrap(
                        (JSONSerialization.jsonObject(with: try Fixtures.data("session"))
                            as? [String: Any])?["response"]))), encoding: .utf8)
        StubURLProtocol.enqueue(status: 200, json: try XCTUnwrap(json))
        let session = try await StubURLProtocol.client().send(Endpoints.session())
        XCTAssertEqual(session.user.username, "casey-example")
        XCTAssertGreaterThan(session.revision, 0)
    }

    // MARK: - Request shaping

    func testRequestShape() async throws {
        StubURLProtocol.enqueue(status: 200, json: "{}")
        _ = try? await StubURLProtocol.client().send(
            Endpoints.changes(
                ChangesRequest(
                    changes: [
                        ChangeBuilder.reportAction(id: "a", goalId: "g", outcome: .done)
                    ], revision: 7, requestId: "req-12345678", goalId: "g")))
        let request = try XCTUnwrap(StubURLProtocol.seenRequests.first)
        XCTAssertEqual(request.method, "POST")
        XCTAssertEqual(request.path, "/api/app/changes")
        XCTAssertEqual(request.headers["Content-Type"], "application/json")
        // Native requests must send no Origin, which is what passes the server's CSRF check.
        XCTAssertNil(request.headers["Origin"])
        let body = try XCTUnwrap(request.json)
        XCTAssertEqual(body["revision"] as? Int, 7)
        XCTAssertEqual(body["requestId"] as? String, "req-12345678")
        XCTAssertEqual(body["goalId"] as? String, "g")
    }

    func testCoachRequestGetsTheLongTimeout() async throws {
        StubURLProtocol.enqueue(status: 200, json: "{}")
        _ = try? await StubURLProtocol.client().send(
            Endpoints.coachMessage(
                CoachRequest(
                    message: "hello", goalId: "general", conversationId: nil, focusGoalId: nil,
                    requestId: "req-12345678")))
        XCTAssertEqual(
            Endpoints.coachMessage(
                CoachRequest(
                    message: "hello", goalId: nil, conversationId: nil, focusGoalId: nil,
                    requestId: "req")
            ).timeout, 240)
        XCTAssertGreaterThanOrEqual(Endpoints.coachTimeout, 180)
        XCTAssertEqual(Endpoints.today().timeout, 30)
        XCTAssertEqual(StubURLProtocol.seenRequests.count, 1)
    }

    func testQueryParametersAreEncoded() {
        let goals = Endpoints.goals(weeks: 12)
        XCTAssertEqual(goals.query.map(\.name), ["weeks"])
        XCTAssertEqual(goals.query.first?.value, "12")

        let goal = Endpoints.goal(id: "case study/1", plan: 2, step: "draft-section")
        XCTAssertEqual(goal.path, "/api/app/goals/case%20study%2F1")
        XCTAssertEqual(goal.query.map(\.name), ["plan", "step"])

        let calendar = Endpoints.calendar(start: YMD("2026-09-11"))
        XCTAssertEqual(calendar.query.first?.value, "2026-09-11")

        // Absent parameters produce no query item at all.
        XCTAssertTrue(Endpoints.goals().query.isEmpty)
        XCTAssertTrue(Endpoints.insights().query.isEmpty)
    }

    func testEveryAppReadIsAGet() {
        XCTAssertEqual(Endpoints.session().method, .get)
        XCTAssertEqual(Endpoints.today().method, .get)
        XCTAssertEqual(Endpoints.goals().method, .get)
        XCTAssertEqual(Endpoints.coach().method, .get)
        XCTAssertEqual(Endpoints.insights().method, .get)
        XCTAssertEqual(Endpoints.calendar().method, .get)
        XCTAssertEqual(Endpoints.settings().method, .get)
        XCTAssertEqual(Endpoints.startGoal(id: "g").method, .post)
        XCTAssertEqual(Endpoints.startAction(id: "a", goalId: "g").method, .post)
        XCTAssertEqual(Endpoints.startGoal(id: "g").path, "/api/app/goals/g/start")
        XCTAssertEqual(Endpoints.startAction(id: "a", goalId: nil).path, "/api/app/actions/a/start")
    }

    // MARK: - Server configuration

    func testServerConfigurationParsing() {
        XCTAssertEqual(
            ServerConfiguration(text: "localhost:8080")?.baseURL.absoluteString,
            "http://localhost:8080")
        XCTAssertEqual(
            ServerConfiguration(text: " http://192.168.1.24:8080/ ")?.baseURL.absoluteString,
            "http://192.168.1.24:8080")
        XCTAssertEqual(
            ServerConfiguration(text: "https://adler.example.com")?.baseURL.absoluteString,
            "https://adler.example.com")
        XCTAssertNil(ServerConfiguration(text: ""))
        XCTAssertNil(ServerConfiguration(text: "ftp://nope"))
        XCTAssertEqual(ServerConfiguration.default.baseURL.absoluteString, "http://localhost:8080")
    }

    func testLocalNetworkDetectionMatchesTheServersHostRule() {
        XCTAssertTrue(ServerConfiguration(text: "http://localhost:8080")!.isLocalNetwork)
        XCTAssertTrue(ServerConfiguration(text: "http://127.0.0.1:8080")!.isLocalNetwork)
        XCTAssertTrue(ServerConfiguration(text: "http://10.0.0.24:8080")!.isLocalNetwork)
        XCTAssertTrue(ServerConfiguration(text: "http://192.168.1.24:8080")!.isLocalNetwork)
        XCTAssertTrue(ServerConfiguration(text: "http://172.16.5.1:8080")!.isLocalNetwork)
        XCTAssertFalse(ServerConfiguration(text: "http://172.32.5.1:8080")!.isLocalNetwork)
        XCTAssertFalse(ServerConfiguration(text: "https://adler.example.com")!.isLocalNetwork)
    }

    func testServerConfigurationPersistence() throws {
        let defaults = try XCTUnwrap(UserDefaults(suiteName: "adler.tests.server"))
        defaults.removePersistentDomain(forName: "adler.tests.server")
        XCTAssertEqual(ServerConfiguration.load(from: defaults), .default)
        let configuration = try XCTUnwrap(ServerConfiguration(text: "http://10.0.0.24:8080"))
        configuration.save(to: defaults)
        XCTAssertEqual(ServerConfiguration.load(from: defaults), configuration)
        defaults.removePersistentDomain(forName: "adler.tests.server")
    }

    // MARK: - SSE

    func testSSELineParsing() {
        XCTAssertEqual(SSEClient.revision(fromLine: #"data: {"revision":7}"#), 7)
        XCTAssertEqual(SSEClient.revision(fromLine: #"data:{"revision":0}"#), 0)
        XCTAssertEqual(SSEClient.revision(fromLine: #"data:   {"revision":123}   "#), 123)
        XCTAssertNil(SSEClient.revision(fromLine: ""))
        XCTAssertNil(SSEClient.revision(fromLine: ": keep-alive"))
        XCTAssertNil(SSEClient.revision(fromLine: "event: ping"))
        XCTAssertNil(SSEClient.revision(fromLine: #"data: {"other":1}"#))
        XCTAssertNil(SSEClient.revision(fromLine: "data: not json"))
    }

    // MARK: - Legacy endpoint decoding

    func testCoachReplyDecodesAndIgnoresTheWorkspaceBlob() throws {
        let json = #"""
            {"conversationId":"chat-1","reply":"Saved.","proposal":null,"revision":9,
             "data":{"schema":1,"goals":[]},"provider":"gemini","model":"gemini-3.8-flash"}
            """#
        let reply = try JSONDecoder().decode(CoachReply.self, from: Data(json.utf8))
        XCTAssertEqual(reply.conversationId, "chat-1")
        XCTAssertEqual(reply.revision, 9)
        XCTAssertNil(reply.proposal)
        XCTAssertEqual(reply.model, "gemini-3.8-flash")
    }

    func testAuthResponseDecodesSignedOut() throws {
        let signedOut = try JSONDecoder().decode(
            AuthResponse.self, from: Data(#"{"user":null}"#.utf8))
        XCTAssertNil(signedOut.user)
        let signedIn = try JSONDecoder().decode(
            AuthResponse.self,
            from: Data(#"{"user":{"id":"u1","username":"casey"},"revision":3}"#.utf8))
        XCTAssertEqual(signedIn.user?.username, "casey")
        XCTAssertEqual(signedIn.revision, 3)
    }

    func testConnectionsDecodeSnakeCaseColumns() throws {
        let json = #"""
            {"configured":true,"provider":"linq","number":"+15550000000","publicUrl":null,
             "link":{"address":"+15551234567","opted_out":0,"last_inbound":1789106034561},
             "jobs":[],"deliveries":[{"id":"d1","message_id":"m1","status":"sent","sid":null,
             "at":1789106034561,"error":null}],"tokens":[]}
            """#
        let response = try JSONDecoder().decode(ConnectionsResponse.self, from: Data(json.utf8))
        XCTAssertEqual(response.link?.address, "+15551234567")
        XCTAssertFalse(response.link?.isOptedOut ?? true)
        XCTAssertEqual(response.deliveries.first?.messageId, "m1")
    }

    func testBookingResponseKnowsWhenItIsIncomplete() throws {
        let partial = try JSONDecoder().decode(
            BookingResponse.self,
            from: Data(
                #"{"id":"a1","workDone":true,"checkInDone":false,"workId":"e1","checkInId":null,"error":"Calendar refused the check-in."}"#
                    .utf8))
        XCTAssertFalse(partial.isComplete)
        XCTAssertEqual(partial.error, "Calendar refused the check-in.")

        let done = try JSONDecoder().decode(
            BookingResponse.self,
            from: Data(
                #"{"id":"a1","workDone":true,"checkInDone":true,"workId":"e1","checkInId":"e2"}"#
                    .utf8))
        XCTAssertTrue(done.isComplete)
    }
}

nonisolated extension URLRequest {
    /// `URLProtocol` moves a body into `httpBodyStream` when the request is canonicalised.
    fileprivate func httpBodyData() -> Data? {
        if let httpBody { return httpBody }
        guard let stream = httpBodyStream else { return nil }
        stream.open()
        defer { stream.close() }
        var data = Data()
        let size = 4096
        let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: size)
        defer { buffer.deallocate() }
        while stream.hasBytesAvailable {
            let read = stream.read(buffer, maxLength: size)
            if read <= 0 { break }
            data.append(buffer, count: read)
        }
        return data
    }
}
