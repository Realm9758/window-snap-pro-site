import Cocoa
import SwiftUI

// MARK: - MenuBarController

class MenuBarController: NSObject {
    static let shared = MenuBarController()

    private var statusItem: NSStatusItem?
    private var settingsWindowController: NSWindowController?
    private var onboardingWindowController: NSWindowController?

    private override init() {
        super.init()
    }

    func setup() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        item.button?.image = NSImage(systemSymbolName: "rectangle.3.group",
                                     accessibilityDescription: "Window Snap Pro")
        item.button?.image?.isTemplate = true
        item.menu = buildMenu()
        self.statusItem = item
    }

    func updateMenu() {
        statusItem?.menu = buildMenu()
    }

    // MARK: - Menu

    private func buildMenu() -> NSMenu {
        let menu = NSMenu()
        let appState = AppState.shared

        let header = NSMenuItem(title: "Window Snap Pro", action: nil, keyEquivalent: "")
        header.isEnabled = false
        menu.addItem(header)
        menu.addItem(.separator())

        // Permission warning — prominent so the user knows what to do.
        if !appState.hasAccessibilityPermission {
            let warn = NSMenuItem(title: "⚠️  Accessibility Access Required",
                                  action: #selector(openSettings), keyEquivalent: "")
            warn.target = self
            menu.addItem(warn)
            menu.addItem(.separator())
        }

        // Enable / disable toggle
        let toggleTitle = appState.snappingEnabled ? "Disable Snapping" : "Enable Snapping"
        let toggle = NSMenuItem(title: toggleTitle, action: #selector(toggleSnapping), keyEquivalent: "")
        toggle.target = self
        menu.addItem(toggle)
        menu.addItem(.separator())

        // Snap actions — only show when permission is granted
        if appState.hasAccessibilityPermission {
            let snapHeader = NSMenuItem(title: "Snap Window", action: nil, keyEquivalent: "")
            snapHeader.isEnabled = false
            menu.addItem(snapHeader)

            for position in SnapPosition.allCases {
                guard appState.enabledPositions.contains(position) else { continue }
                let item = NSMenuItem(title: position.rawValue,
                                      action: #selector(snapMenuAction(_:)),
                                      keyEquivalent: "")
                item.target = self
                item.representedObject = position.rawValue
                item.image = NSImage(systemSymbolName: position.icon,
                                     accessibilityDescription: position.rawValue)
                menu.addItem(item)
            }
            menu.addItem(.separator())
        }

        let settings = NSMenuItem(title: "Settings…", action: #selector(openSettings), keyEquivalent: ",")
        settings.target = self
        settings.keyEquivalentModifierMask = .command
        menu.addItem(settings)

        menu.addItem(.separator())

        let quit = NSMenuItem(title: "Quit Window Snap Pro",
                              action: #selector(NSApplication.terminate(_:)),
                              keyEquivalent: "q")
        quit.keyEquivalentModifierMask = .command
        menu.addItem(quit)

        return menu
    }

    // MARK: - Actions

    @objc private func toggleSnapping() {
        AppState.shared.snappingEnabled.toggle()
        if AppState.shared.snappingEnabled {
            ShortcutManager.shared.registerAll()
            DragMonitor.shared.start()
        } else {
            ShortcutManager.shared.unregisterAll()
            DragMonitor.shared.stop()
        }
        updateMenu()
    }

    @objc private func snapMenuAction(_ sender: NSMenuItem) {
        guard let raw = sender.representedObject as? String,
              let position = SnapPosition(rawValue: raw) else { return }
        WindowManager.shared.snap(to: position)
    }

    @objc func openSettings() {
        if settingsWindowController == nil {
            let view    = SettingsSidebar().environmentObject(AppState.shared)
            let hosting = NSHostingController(rootView: view)
            let window  = NSWindow(contentViewController: hosting)
            window.title    = "Window Snap Pro — Settings"
            window.styleMask = [.titled, .closable, .miniaturizable, .resizable]
            window.minSize   = NSSize(width: 680, height: 420)
            window.setContentSize(NSSize(width: 780, height: 500))
            window.isReleasedWhenClosed = false
            window.isRestorable = false
            window.appearance = NSAppearance(named: .darkAqua)

            NotificationCenter.default.addObserver(
                forName: NSWindow.willCloseNotification,
                object: window,
                queue: .main
            ) { [weak self] _ in
                self?.settingsWindowController = nil
                NSApp.setActivationPolicy(.accessory)
            }

            settingsWindowController = NSWindowController(window: window)
        }

        guard let window = settingsWindowController?.window else { return }

        let screen = NSScreen.screens.first(where: {
            NSMouseInRect(NSEvent.mouseLocation, $0.frame, false)
        }) ?? NSScreen.main ?? NSScreen.screens[0]

        let sx = screen.visibleFrame.midX - window.frame.width  / 2
        let sy = screen.visibleFrame.midY - window.frame.height / 2
        window.setFrameOrigin(NSPoint(x: sx, y: sy))

        // Switch to .regular so the window can become key and receive all input.
        // The menu is already closed before this action fires, so no corruption risk.
        NSApp.setActivationPolicy(.regular)
        DispatchQueue.main.async {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
    }
}
