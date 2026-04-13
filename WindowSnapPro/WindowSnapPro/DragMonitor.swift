import Cocoa
import CoreGraphics

// MARK: - DragMonitor
// Uses a CGEvent tap at the session level to observe mouse events from ALL apps.
// This is the same low-level approach used by Rectangle, Magnet, and Moom —
// NSEvent.addGlobalMonitorForEvents misses dragged events that originate in
// another application on modern macOS.

class DragMonitor {
    static let shared = DragMonitor()

    fileprivate var eventTap:  CFMachPort?
    private var runLoopSource: CFRunLoopSource?

    private let overlayWindow = SnapOverlayWindow()

    // State across the three event phases.
    private var mouseDownAppKit: CGPoint?   // cursor position at button-down (AppKit coords)
    private var isDragging      = false
    private var isWindowDrag    = false     // true only when the click landed on a window title bar
    private var currentSnap:    SnapPosition?

    private var dragThreshold:  CGFloat { CGFloat(DragZoneManager.shared.dragThreshold)  }
    private var edgeThreshold:  CGFloat { CGFloat(DragZoneManager.shared.edgeSensitivity) }
    private var cornerThreshold: CGFloat { CGFloat(DragZoneManager.shared.cornerSensitivity) }

    private init() {}

    // MARK: - Start / Stop

    func start() {
        guard eventTap == nil else { return }

        let mask: CGEventMask =
            (1 << CGEventType.leftMouseDown.rawValue)    |
            (1 << CGEventType.leftMouseDragged.rawValue) |
            (1 << CGEventType.leftMouseUp.rawValue)

        // Pass `self` via userInfo — the C callback cannot capture Swift context.
        let refcon = Unmanaged.passUnretained(self).toOpaque()

        guard let tap = CGEvent.tapCreate(
            tap:              .cgSessionEventTap,
            place:            .headInsertEventTap,
            options:          .listenOnly,          // observe only, never modify
            eventsOfInterest: mask,
            callback:         dragTapCallback,
            userInfo:         refcon
        ) else {
            print("[DragMonitor] CGEvent tap creation failed — retrying in 1s.")
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [weak self] in
                guard AXIsProcessTrusted() else { return }
                self?.start()
            }
            return
        }

        let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
        CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
        CGEvent.tapEnable(tap: tap, enable: true)

        self.eventTap      = tap
        self.runLoopSource = source
    }

    func stop() {
        if let tap = eventTap {
            CGEvent.tapEnable(tap: tap, enable: false)
            if let src = runLoopSource {
                CFRunLoopRemoveSource(CFRunLoopGetMain(), src, .commonModes)
            }
        }
        eventTap      = nil
        runLoopSource = nil
        overlayWindow.hide(animated: false)
        reset()
    }

    // MARK: - Event dispatch (called on main thread from C callback)

    fileprivate func dispatch(type: CGEventType, quartzLocation: CGPoint) {
        // CGEvent uses Quartz coords (top-left origin); NSScreen uses AppKit (bottom-left).
        let mouse = toAppKit(quartzLocation)

        switch type {
        case .leftMouseDown:
            reset()
            mouseDownAppKit  = mouse
            isWindowDrag     = isTitleBarClick(at: quartzLocation)

        case .leftMouseDragged:
            guard isWindowDrag,
                  AppState.shared.snappingEnabled,
                  DragZoneManager.shared.dragSnappingEnabled else { return }

            // Confirm the pointer has moved enough to count as a real drag.
            if !isDragging {
                guard let origin = mouseDownAppKit else { return }
                let dx = mouse.x - origin.x, dy = mouse.y - origin.y
                guard sqrt(dx*dx + dy*dy) >= dragThreshold else { return }
                isDragging = true
            }

            guard let screen = screenAt(mouse) else { return }
            let newSnap = snapZone(for: mouse, on: screen)
            guard newSnap != currentSnap else { return }
            currentSnap = newSnap

            if let pos = newSnap { overlayWindow.show(for: pos, on: screen) }
            else                 { overlayWindow.hide() }

        case .leftMouseUp:
            let snapTo = currentSnap
            overlayWindow.hide()
            reset()
            guard let pos = snapTo, AppState.shared.snappingEnabled else { return }
            // Brief pause lets macOS settle the window drop before we resize it.
            DispatchQueue.main.asyncAfter(deadline: .now() + DragZoneManager.shared.snapDelay) {
                WindowManager.shared.snap(to: pos)
            }

        default: break
        }
    }

    // MARK: - Helpers

    private func reset() {
        mouseDownAppKit = nil
        isDragging      = false
        isWindowDrag    = false
        currentSnap     = nil
    }

    // MARK: - Title bar detection

    /// Returns true when the Quartz-coordinates click position lands on a window's title bar.
    private func isTitleBarClick(at quartzPoint: CGPoint) -> Bool {
        let systemEl = AXUIElementCreateSystemWide()
        var element: AXUIElement?
        guard AXUIElementCopyElementAtPosition(
            systemEl, Float(quartzPoint.x), Float(quartzPoint.y), &element
        ) == .success, let el = element else { return false }
        return isElementInTitleBar(el, quartzPoint: quartzPoint, depth: 0)
    }

    private func isElementInTitleBar(_ el: AXUIElement, quartzPoint: CGPoint, depth: Int) -> Bool {
        guard depth < 6 else { return false }

        var roleRef: AnyObject?
        AXUIElementCopyAttributeValue(el, kAXRoleAttribute as CFString, &roleRef)
        let role = roleRef as? String ?? ""

        if role == kAXWindowRole as String {
            return clickIsInTitleBarZone(of: el, quartzPoint: quartzPoint)
        }

        var parentRef: AnyObject?
        guard AXUIElementCopyAttributeValue(el, kAXParentAttribute as CFString, &parentRef) == .success,
              let parent = parentRef,
              CFGetTypeID(parent as CFTypeRef) == AXUIElementGetTypeID() else { return false }
        // swiftlint:disable:next force_cast
        return isElementInTitleBar(parent as! AXUIElement, quartzPoint: quartzPoint, depth: depth + 1)
    }

    /// Checks whether `quartzPoint` falls within the top ~28 pt of the window frame.
    private func clickIsInTitleBarZone(of window: AXUIElement, quartzPoint: CGPoint) -> Bool {
        var posRef: AnyObject?, sizeRef: AnyObject?
        guard AXUIElementCopyAttributeValue(window, kAXPositionAttribute as CFString, &posRef) == .success,
              AXUIElementCopyAttributeValue(window, kAXSizeAttribute as CFString,     &sizeRef) == .success,
              let posAny = posRef, let sizeAny = sizeRef else { return false }

        let pv = posAny  as! AXValue  // swiftlint:disable:this force_cast
        let sv = sizeAny as! AXValue  // swiftlint:disable:this force_cast
        var windowOrigin = CGPoint.zero
        var windowSize   = CGSize.zero
        AXValueGetValue(pv, .cgPoint, &windowOrigin)
        AXValueGetValue(sv, .cgSize,  &windowSize)

        let titleBarHeight: CGFloat = 52   // generous to cover large title bars / toolbars
        return quartzPoint.x >= windowOrigin.x
            && quartzPoint.x <= windowOrigin.x + windowSize.width
            && quartzPoint.y >= windowOrigin.y
            && quartzPoint.y <= windowOrigin.y + titleBarHeight
    }

    /// Convert a Quartz (top-left origin) point to AppKit (bottom-left origin).
    private func toAppKit(_ p: CGPoint) -> CGPoint {
        let h = NSScreen.screens.map { $0.frame.maxY }.max() ?? 0
        return CGPoint(x: p.x, y: h - p.y)
    }

    private func snapZone(for pt: CGPoint, on screen: NSScreen) -> SnapPosition? {
        let f  = screen.frame
        let et = edgeThreshold
        let ct = cornerThreshold
        let dzm = DragZoneManager.shared

        // Corner zones (checked first)
        if dzm.cornerSnappingEnabled {
            let cL = pt.x <= f.minX + ct, cR = pt.x >= f.maxX - ct
            let cT = pt.y >= f.maxY - ct, cB = pt.y <= f.minY + ct
            if cL && cT { return ok(.topLeft) }
            if cR && cT { return ok(.topRight) }
            if cL && cB { return ok(.bottomLeft) }
            if cR && cB { return ok(.bottomRight) }
        }

        // Edge zones
        if dzm.edgeSnappingEnabled {
            let L = pt.x <= f.minX + et, R = pt.x >= f.maxX - et
            let T = pt.y >= f.maxY - et, B = pt.y <= f.minY + et
            if L { return ok(.leftHalf)   }
            if R { return ok(.rightHalf)  }
            if T { return ok(.fullScreen) }
            if B { return ok(.bottomHalf) }
        }

        return nil
    }

    private func ok(_ pos: SnapPosition) -> SnapPosition? {
        AppState.shared.enabledPositions.contains(pos) ? pos : nil
    }

    private func screenAt(_ pt: CGPoint) -> NSScreen? {
        NSScreen.screens.first { NSMouseInRect(pt, $0.frame, false) } ?? NSScreen.main
    }
}

// MARK: - C-compatible event tap callback
// Cannot capture Swift values — receives DragMonitor via userInfo.

private let dragTapCallback: CGEventTapCallBack = { _, type, event, refcon in
    // Re-enable the tap if the system disabled it (e.g. callback was too slow).
    if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
        if let refcon {
            let monitor = Unmanaged<DragMonitor>.fromOpaque(refcon).takeUnretainedValue()
            if let tap = monitor.eventTap { CGEvent.tapEnable(tap: tap, enable: true) }
        }
        return nil
    }
    guard let refcon else { return Unmanaged.passUnretained(event) }
    let monitor = Unmanaged<DragMonitor>.fromOpaque(refcon).takeUnretainedValue()
    monitor.dispatch(type: type, quartzLocation: event.location)
    return Unmanaged.passUnretained(event)
}
