import Cocoa
import ApplicationServices

// MARK: - WindowManager
// Controls windows via the macOS Accessibility API.
//
// Coordinate systems used here:
//   AppKit  — origin at bottom-left of primary screen, y grows upward.
//             NSScreen.frame / visibleFrame live in this space.
//   Quartz/AX — origin at top-left of primary screen, y grows downward.
//             kAXPositionAttribute lives in this space.
//
// All public helpers that accept NSScreen frames work in AppKit coords.
// Everything sent to / read from AX is in Quartz coords.

class WindowManager {
    static let shared = WindowManager()
    private init() {}

    // MARK: - Public API

    /// Snap the frontmost window to the given position on its current screen.
    func snap(to position: SnapPosition, animated: Bool = true) {
        guard let window = frontmostWindow() else { return }
        guard let screen = screenForWindow(window) else { return }

        // Compute target in AppKit coords, then convert to AX/Quartz for the API.
        let appKitTarget = position.targetFrame(in: screen.visibleFrame)
        let axTarget     = appKitToAX(appKitTarget)

        setFrame(axTarget, for: window, animated: animated)
    }

    /// Return the frontmost window's current frame in AX (Quartz) coords.
    func frontmostWindowAXFrame() -> CGRect? {
        guard let window = frontmostWindow() else { return nil }
        return axFrame(of: window)
    }

    // MARK: - Coordinate conversion

    /// Convert a rect from AppKit screen space to AX/Quartz screen space.
    func appKitToAX(_ rect: CGRect) -> CGRect {
        // The total pixel height of all screens stacked in AppKit space.
        let h = NSScreen.screens.map { $0.frame.maxY }.max() ?? 0
        return CGRect(x: rect.minX,
                      y: h - rect.maxY,
                      width: rect.width,
                      height: rect.height)
    }

    // MARK: - Private helpers

    private func frontmostWindow() -> AXUIElement? {
        guard let app = NSWorkspace.shared.frontmostApplication else { return nil }
        let axApp = AXUIElementCreateApplication(app.processIdentifier)

        var ref: CFTypeRef?
        if AXUIElementCopyAttributeValue(axApp, kAXFocusedWindowAttribute as CFString, &ref) == .success,
           let win = ref { return (win as! AXUIElement) }
        if AXUIElementCopyAttributeValue(axApp, kAXMainWindowAttribute as CFString, &ref) == .success,
           let win = ref { return (win as! AXUIElement) }
        var listRef: CFTypeRef?
        if AXUIElementCopyAttributeValue(axApp, kAXWindowsAttribute as CFString, &listRef) == .success,
           let windows = listRef as? [AXUIElement],
           let first = windows.first { return first }
        return nil
    }

    /// Read a window's frame from the AX API (Quartz coords, top-left origin).
    private func axFrame(of window: AXUIElement) -> CGRect? {
        var posRef: CFTypeRef?
        var sizeRef: CFTypeRef?
        guard AXUIElementCopyAttributeValue(window, kAXPositionAttribute as CFString, &posRef) == .success,
              AXUIElementCopyAttributeValue(window, kAXSizeAttribute as CFString, &sizeRef) == .success,
              let pv = posRef, let sv = sizeRef else { return nil }

        var pos  = CGPoint.zero
        var size = CGSize.zero
        AXValueGetValue(pv as! AXValue, .cgPoint, &pos)
        AXValueGetValue(sv as! AXValue, .cgSize, &size)
        return CGRect(origin: pos, size: size)
    }

    /// Find which NSScreen contains the window. Both window frame (AX) and
    /// screen frames (AppKit) are converted to a common space for comparison.
    private func screenForWindow(_ window: AXUIElement) -> NSScreen? {
        guard let axRect = axFrame(of: window) else { return NSScreen.main }

        // Convert the AX frame back to AppKit so we can compare with NSScreen.frame.
        let h = NSScreen.screens.map { $0.frame.maxY }.max() ?? 0
        let appKitRect = CGRect(x: axRect.minX,
                                y: h - axRect.maxY,
                                width: axRect.width,
                                height: axRect.height)

        return NSScreen.screens.max(by: {
            $0.frame.intersection(appKitRect).area < $1.frame.intersection(appKitRect).area
        }) ?? NSScreen.main
    }

    // MARK: - Frame application

    private func setFrame(_ axFrame: CGRect, for window: AXUIElement, animated: Bool) {
        let duration = AppState.shared.animationSpeed.duration

        if animated {
            guard let current = self.axFrame(of: window) else {
                applyAXFrame(axFrame, to: window)
                return
            }
            let steps = 12
            let step  = duration / Double(steps)
            for i in 1...steps {
                let t = easeInOut(Double(i) / Double(steps))
                let mid = CGRect(
                    x: current.minX + (axFrame.minX - current.minX) * t,
                    y: current.minY + (axFrame.minY - current.minY) * t,
                    width:  current.width  + (axFrame.width  - current.width)  * t,
                    height: current.height + (axFrame.height - current.height) * t
                )
                DispatchQueue.main.asyncAfter(deadline: .now() + step * Double(i)) { [weak self] in
                    self?.applyAXFrame(mid, to: window)
                }
            }
        } else {
            applyAXFrame(axFrame, to: window)
        }
    }

    private func applyAXFrame(_ rect: CGRect, to window: AXUIElement) {
        var pos  = rect.origin
        var size = rect.size
        if let pv = AXValueCreate(.cgPoint, &pos)  { AXUIElementSetAttributeValue(window, kAXPositionAttribute as CFString, pv) }
        if let sv = AXValueCreate(.cgSize,  &size) { AXUIElementSetAttributeValue(window, kAXSizeAttribute as CFString, sv) }
    }

    private func easeInOut(_ t: Double) -> Double {
        t < 0.5 ? 4*t*t*t : 1 - pow(-2*t + 2, 3) / 2
    }
}

private extension CGRect {
    var area: CGFloat { width * height }
}
