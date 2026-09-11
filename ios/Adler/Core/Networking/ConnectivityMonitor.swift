import Foundation
import Network

/// Drives the offline banner and tells the stores when it is worth refetching.
///
/// This is reachability, not a promise: the dev server may be unreachable on a perfectly good
/// Wi-Fi network. A request still has to fail before the app claims the server is unreachable.
@MainActor
@Observable
final class ConnectivityMonitor {
    private(set) var isOnline = true
    private(set) var isExpensive = false
    private(set) var isConstrained = false

    /// `NWPathMonitor.cancel()` is terminal — a cancelled instance never delivers another path
    /// update, even after `start(queue:)` is called again. So the monitor is created per start
    /// and released on stop; a background→foreground cycle gets a live one.
    private var monitor: NWPathMonitor?
    private let queue = DispatchQueue(label: "com.withadler.app.connectivity")

    init() {}

    var isMonitoring: Bool { monitor != nil }

    func start() {
        guard monitor == nil else { return }
        let monitor = NWPathMonitor()
        monitor.pathUpdateHandler = { [weak self] path in
            let online = path.status == .satisfied
            let expensive = path.isExpensive
            let constrained = path.isConstrained
            Task { @MainActor [weak self] in
                self?.apply(online: online, expensive: expensive, constrained: constrained)
            }
        }
        self.monitor = monitor
        monitor.start(queue: queue)
    }

    func stop() {
        monitor?.cancel()
        monitor = nil
    }

    /// Fires when connectivity returns, so the visible views can refetch.
    var onReconnect: (@MainActor () -> Void)?

    private func apply(online: Bool, expensive: Bool, constrained: Bool) {
        let cameBack = online && !isOnline
        isOnline = online
        isExpensive = expensive
        isConstrained = constrained
        if cameBack { onReconnect?() }
    }
}
