import Cocoa
import SwiftUI

// MARK: - SnapOverlayWindow
// A borderless, transparent NSWindow that renders the snap preview overlay.
// Placed on top of all windows using NSWindow.Level.floating.

class SnapOverlayWindow: NSWindow {

    private var hostingView: NSHostingView<SnapOverlayView>?
    private var hideTimer: Timer?

    init() {
        super.init(
            contentRect: .zero,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        isOpaque             = false
        backgroundColor      = .clear
        level                = .floating
        ignoresMouseEvents   = true
        collectionBehavior   = [.canJoinAllSpaces, .fullScreenAuxiliary]
        hasShadow            = false
    }

    // MARK: - Show / Hide

    func show(for position: SnapPosition, on screen: NSScreen) {
        let appState = AppState.shared
        guard appState.showSnapPreview else { return }

        hideTimer?.invalidate()

        let screenFrame  = screen.visibleFrame
        let targetFrame  = position.targetFrame(in: screenFrame)

        // Convert from AppKit screen coords (bottom-left origin) to window frame
        setFrame(targetFrame, display: false)

        let view = SnapOverlayView(
            opacity:        appState.previewOpacity,
            roundedCorners: appState.useRoundedCorners
        )
        let hosting = NSHostingView(rootView: view)
        hosting.frame = NSRect(origin: .zero, size: targetFrame.size)
        contentView = hosting
        self.hostingView = hosting

        if !isVisible {
            alphaValue = 0
            orderFront(nil)
            NSAnimationContext.runAnimationGroup { ctx in
                ctx.duration = 0.15
                ctx.timingFunction = CAMediaTimingFunction(name: .easeOut)
                animator().alphaValue = 1.0
            }
        }
    }

    func hide(animated: Bool = true) {
        hideTimer?.invalidate()
        guard isVisible else { return }

        if animated {
            NSAnimationContext.runAnimationGroup({ ctx in
                ctx.duration = 0.2
                ctx.timingFunction = CAMediaTimingFunction(name: .easeIn)
                animator().alphaValue = 0
            }, completionHandler: {
                self.orderOut(nil)
            })
        } else {
            orderOut(nil)
            alphaValue = 1
        }
    }
}

// MARK: - SnapOverlayView

struct SnapOverlayView: View {
    let opacity: Double
    let roundedCorners: Bool

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: roundedCorners ? 14 : 4, style: .continuous)
                .fill(.white.opacity(opacity))

            RoundedRectangle(cornerRadius: roundedCorners ? 14 : 4, style: .continuous)
                .strokeBorder(.white.opacity(0.6), lineWidth: 1.5)
        }
        .padding(4)
    }
}
