import SwiftUI
import AppKit

@main
struct WindowSnapProApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var delegate

    var body: some Scene {
        // Minimal placeholder — real settings window is in MenuBarController.
        // Having no scene at all is not allowed by SwiftUI, so we use an empty one.
        Settings { EmptyView() }
    }
}

// MARK: - AppDelegate

class AppDelegate: NSObject, NSApplicationDelegate {

    private var onboardingWindowController: NSWindowController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        NSApp.appearance = NSAppearance(named: .darkAqua)   // force light mode globally

        // Close any windows that SwiftUI's Settings scene auto-restored.
        NSApp.windows.forEach { $0.close() }

        MenuBarController.shared.setup()

        if AppState.shared.hasAccessibilityPermission {
            ShortcutManager.shared.registerAll()
            DragMonitor.shared.start()
        } else {
            showOnboarding()
        }

        // Auto-dismiss onboarding when the polling timer detects permission was granted.
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onPermissionGranted),
            name: .accessibilityPermissionGranted,
            object: nil
        )

        // Clipboard History — starts independently of Accessibility permission
        // (NSPasteboard monitoring requires no special entitlement).
        ClipboardManager.shared.startMonitoring()
        ClipboardShortcut.shared.register()
    }

    @objc private func onPermissionGranted() {
        guard let window = onboardingWindowController?.window else { return }
        window.close()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    // MARK: - Onboarding

    func showOnboarding() {
        guard onboardingWindowController == nil else {
            onboardingWindowController?.window?.makeKeyAndOrderFront(nil)
            return
        }

        let view    = OnboardingView().environmentObject(AppState.shared)
        let hosting = NSHostingController(rootView: view)
        let window  = NSWindow(contentViewController: hosting)
        window.title    = ""
        window.styleMask = [.titled, .closable, .fullSizeContentView]
        window.titlebarAppearsTransparent = true
        window.isMovableByWindowBackground = true
        window.isRestorable = false
        window.setContentSize(NSSize(width: 420, height: 540))
        window.appearance = NSAppearance(named: .darkAqua)
        window.isReleasedWhenClosed = false
        window.center()

        NotificationCenter.default.addObserver(
            forName: NSWindow.willCloseNotification,
            object: window,
            queue: .main
        ) { [weak self] _ in
            self?.onboardingWindowController = nil
            NSApp.setActivationPolicy(.accessory)
        }

        onboardingWindowController = NSWindowController(window: window)

        NSApp.setActivationPolicy(.regular)
        DispatchQueue.main.async {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
    }
}
