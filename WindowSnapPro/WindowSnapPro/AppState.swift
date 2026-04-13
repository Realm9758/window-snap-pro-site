import SwiftUI
import Combine
import ServiceManagement
import Carbon

// MARK: - Snap Position

enum SnapPosition: String, CaseIterable, Identifiable, Codable {
    case leftHalf = "Left Half"
    case rightHalf = "Right Half"
    case topHalf = "Top Half"
    case bottomHalf = "Bottom Half"
    case fullScreen = "Full Screen"
    case topLeft = "Top Left"
    case topRight = "Top Right"
    case bottomLeft = "Bottom Left"
    case bottomRight = "Bottom Right"
    case center = "Center"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .leftHalf: return "rectangle.lefthalf.filled"
        case .rightHalf: return "rectangle.righthalf.filled"
        case .topHalf: return "rectangle.tophalf.filled"
        case .bottomHalf: return "rectangle.bottomhalf.filled"
        case .fullScreen: return "rectangle.fill"
        case .topLeft: return "rectangle.topleft.filled"
        case .topRight: return "rectangle.topright.filled"
        case .bottomLeft: return "rectangle.bottomleft.filled"
        case .bottomRight: return "rectangle.bottomright.filled"
        case .center: return "rectangle.center.inset.filled"
        }
    }

    var defaultShortcut: KeyboardShortcut? {
        switch self {
        case .leftHalf: return KeyboardShortcut(key: .leftArrow, modifiers: [.control, .option])
        case .rightHalf: return KeyboardShortcut(key: .rightArrow, modifiers: [.control, .option])
        case .fullScreen: return KeyboardShortcut(key: .upArrow, modifiers: [.control, .option])
        case .center: return KeyboardShortcut(key: .downArrow, modifiers: [.control, .option])
        default: return nil
        }
    }

    /// Compute the target frame for this snap position within the given screen work area.
    func targetFrame(in screenFrame: CGRect) -> CGRect {
        let w = screenFrame.width
        let h = screenFrame.height
        let x = screenFrame.minX
        let y = screenFrame.minY
        let halfW = w / 2
        let halfH = h / 2
        let centerW = w * 0.6
        let centerH = h * 0.6

        switch self {
        case .leftHalf:    return CGRect(x: x, y: y, width: halfW, height: h)
        case .rightHalf:   return CGRect(x: x + halfW, y: y, width: halfW, height: h)
        case .topHalf:     return CGRect(x: x, y: y + halfH, width: w, height: halfH)
        case .bottomHalf:  return CGRect(x: x, y: y, width: w, height: halfH)
        case .fullScreen:  return screenFrame
        case .topLeft:     return CGRect(x: x, y: y + halfH, width: halfW, height: halfH)
        case .topRight:    return CGRect(x: x + halfW, y: y + halfH, width: halfW, height: halfH)
        case .bottomLeft:  return CGRect(x: x, y: y, width: halfW, height: halfH)
        case .bottomRight: return CGRect(x: x + halfW, y: y, width: halfW, height: halfH)
        case .center:      return CGRect(x: x + (w - centerW) / 2, y: y + (h - centerH) / 2, width: centerW, height: centerH)
        }
    }
}

// MARK: - Keyboard Shortcut Model

struct KeyboardShortcut: Codable, Equatable {
    enum Key: String, Codable {
        case leftArrow, rightArrow, upArrow, downArrow
        case a, b, c, d, e, f, g, h, i, j, k, l, m
        case n, o, p, q, r, s, t, u, v, w, x, y, z
    }

    enum Modifier: String, Codable, CaseIterable {
        case command, option, control, shift
    }

    var key: Key
    var modifiers: Set<Modifier>

    var displayString: String {
        var parts: [String] = []
        if modifiers.contains(.control) { parts.append("⌃") }
        if modifiers.contains(.option)  { parts.append("⌥") }
        if modifiers.contains(.shift)   { parts.append("⇧") }
        if modifiers.contains(.command) { parts.append("⌘") }
        parts.append(key.displayString)
        return parts.joined()
    }
}

extension KeyboardShortcut.Key {
    var displayString: String {
        switch self {
        case .leftArrow: return "←"
        case .rightArrow: return "→"
        case .upArrow: return "↑"
        case .downArrow: return "↓"
        default: return rawValue.uppercased()
        }
    }
}

// MARK: - Animation Speed

enum AnimationSpeed: String, CaseIterable, Codable {
    case slow = "Slow"
    case normal = "Normal"
    case fast = "Fast"

    var duration: Double {
        switch self {
        case .slow:   return 0.5
        case .normal: return 0.25
        case .fast:   return 0.12
        }
    }
}

// MARK: - AppState (Observable)

class AppState: ObservableObject {
    static let shared = AppState()

    // General
    @AppStorage("snappingEnabled") var snappingEnabled: Bool = true {
        willSet { objectWillChange.send() }
    }
    @AppStorage("launchAtLogin")   var launchAtLogin: Bool   = false {
        willSet { objectWillChange.send() }
        didSet  { applyLaunchAtLogin() }
    }
    @AppStorage("showSnapPreview") var showSnapPreview: Bool = true {
        willSet { objectWillChange.send() }
    }

    // Pro license state — written by ProLicenseViewModel, read everywhere
    @AppStorage("pro_isActivated") var isProActivated: Bool = false { willSet { objectWillChange.send() } }

    // Premium feature toggles
    @AppStorage("rulesEnabled")           var rulesEnabled:           Bool = true  { willSet { objectWillChange.send() } }
    @AppStorage("advancedSnappingEnabled") var advancedSnappingEnabled: Bool = false { willSet { objectWillChange.send() } }
    @AppStorage("animationsEnabled")      var animationsEnabled:      Bool = true  { willSet { objectWillChange.send() } }
    @AppStorage("smartSnappingEnabled")   var smartSnappingEnabled:   Bool = false { willSet { objectWillChange.send() } }

    // File Shelf
    @AppStorage("fileShelfEnabled") var fileShelfEnabled: Bool = true {
        willSet { objectWillChange.send() }
    }
    /// Pro: configurable 3–20. Free: capped at 3 by FileShelfManager.effectiveLimit.
    @AppStorage("fileShelfSize") var fileShelfSize: Int = 10 {
        willSet { objectWillChange.send() }
    }

    // Clipboard History
    @AppStorage("clipboardHistoryEnabled") var clipboardHistoryEnabled: Bool = true {
        willSet { objectWillChange.send() }
    }
    /// Pro: configurable 5–50. Free: capped at 5 by ClipboardManager.effectiveLimit.
    @AppStorage("clipboardHistorySize") var clipboardHistorySize: Int = 25 {
        willSet { objectWillChange.send() }
    }
    @AppStorage("clipboardShortcutData") private var clipboardShortcutData: Data = {
        let def = KeyboardShortcut(key: .v, modifiers: [.command, .shift])
        return (try? JSONEncoder().encode(def)) ?? Data()
    }() {
        willSet { objectWillChange.send() }
    }
    var clipboardHistoryShortcut: KeyboardShortcut {
        get {
            (try? JSONDecoder().decode(KeyboardShortcut.self, from: clipboardShortcutData))
                ?? KeyboardShortcut(key: .v, modifiers: [.command, .shift])
        }
        set { clipboardShortcutData = (try? JSONEncoder().encode(newValue)) ?? Data() }
    }

    // Appearance
    @AppStorage("previewOpacity")      var previewOpacity: Double = 0.35 {
        willSet { objectWillChange.send() }
    }
    @AppStorage("useRoundedCorners")   var useRoundedCorners: Bool = true {
        willSet { objectWillChange.send() }
    }
    @AppStorage("animationSpeedRaw")   private var animationSpeedRaw: String = AnimationSpeed.normal.rawValue {
        willSet { objectWillChange.send() }
    }

    var animationSpeed: AnimationSpeed {
        get { AnimationSpeed(rawValue: animationSpeedRaw) ?? .normal }
        set { animationSpeedRaw = newValue.rawValue }
    }

    // Enabled snap positions
    @AppStorage("enabledPositions") private var enabledPositionsData: Data = {
        let all = SnapPosition.allCases.map(\.rawValue)
        return (try? JSONEncoder().encode(all)) ?? Data()
    }() {
        willSet { objectWillChange.send() }
    }

    var enabledPositions: Set<SnapPosition> {
        get {
            guard let names = try? JSONDecoder().decode([String].self, from: enabledPositionsData) else {
                return Set(SnapPosition.allCases)
            }
            return Set(names.compactMap { SnapPosition(rawValue: $0) })
        }
        set {
            let names = newValue.map(\.rawValue)
            enabledPositionsData = (try? JSONEncoder().encode(names)) ?? Data()
        }
    }

    // Keyboard shortcuts
    @AppStorage("shortcutsData") private var shortcutsData: Data = Data() {
        willSet { objectWillChange.send() }
    }

    var shortcuts: [SnapPosition: KeyboardShortcut] {
        get {
            guard let decoded = try? JSONDecoder().decode([String: KeyboardShortcut].self, from: shortcutsData) else {
                return defaultShortcuts()
            }
            var result: [SnapPosition: KeyboardShortcut] = [:]
            for (key, value) in decoded {
                if let pos = SnapPosition(rawValue: key) {
                    result[pos] = value
                }
            }
            return result.isEmpty ? defaultShortcuts() : result
        }
        set {
            var dict: [String: KeyboardShortcut] = [:]
            for (key, value) in newValue {
                dict[key.rawValue] = value
            }
            shortcutsData = (try? JSONEncoder().encode(dict)) ?? Data()
        }
    }

    // Accessibility
    @Published var hasAccessibilityPermission: Bool = false

    private var permissionTimer: Timer?

    private init() {
        // Synchronous check so the correct value is available immediately on launch
        // (before applicationDidFinishLaunching reads it). The polling timer then
        // takes over and will activate features once trust is confirmed.
        hasAccessibilityPermission = AXIsProcessTrusted()
        startPermissionPolling()
    }

    // MARK: - Permission API

    /// Force an immediate synchronous re-check. Always call on the main thread.
    func checkAccessibilityPermission() {
        apply(trusted: AXIsProcessTrusted())
    }

    /// Open the Accessibility pane in System Settings directly.
    func requestAccessibilityPermission() {
        // kAXTrustedCheckOptionPrompt: true opens System Settings and adds this
        // app to the Accessibility list on macOS 13+.
        let opts = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
        AXIsProcessTrustedWithOptions(opts as CFDictionary)
    }

    // MARK: - Private

    private func apply(trusted: Bool) {
        let changed = hasAccessibilityPermission != trusted
        hasAccessibilityPermission = trusted
        if trusted {
            permissionTimer?.invalidate()
            permissionTimer = nil
            ShortcutManager.shared.registerAll()
            DragMonitor.shared.start()
            if changed {
                NotificationCenter.default.post(name: .accessibilityPermissionGranted, object: nil)
            }
        }
        // Rebuild the menu bar menu so the permission warning appears/disappears.
        if changed { MenuBarController.shared.updateMenu() }
    }

    /// Poll AXIsProcessTrusted() every 0.5 s on the common RunLoop mode.
    /// This is the single source of truth — no NSNotification needed.
    func startPermissionPolling() {
        guard permissionTimer == nil else { return }
        let timer = Timer(timeInterval: 0.5, repeats: true) { [weak self] t in
            guard let self else { t.invalidate(); return }
            self.apply(trusted: AXIsProcessTrusted())
        }
        RunLoop.main.add(timer, forMode: .common)
        permissionTimer = timer
    }

    func resetShortcuts() {
        shortcuts = defaultShortcuts()
    }

    private func defaultShortcuts() -> [SnapPosition: KeyboardShortcut] {
        var result: [SnapPosition: KeyboardShortcut] = [:]
        for position in SnapPosition.allCases {
            if let shortcut = position.defaultShortcut {
                result[position] = shortcut
            }
        }
        return result
    }

    private func applyLaunchAtLogin() {
        if #available(macOS 13.0, *) {
            do {
                if launchAtLogin {
                    try SMAppService.mainApp.register()
                } else {
                    try SMAppService.mainApp.unregister()
                }
            } catch {
                print("Launch at login error: \(error)")
            }
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let accessibilityPermissionGranted = Notification.Name("wsp.accessibilityPermissionGranted")
}

// MARK: - KeyboardShortcut.Key — Carbon key-code initialiser

extension KeyboardShortcut.Key {
    init?(keyCode: Int) {
        switch keyCode {
        case kVK_LeftArrow:  self = .leftArrow
        case kVK_RightArrow: self = .rightArrow
        case kVK_UpArrow:    self = .upArrow
        case kVK_DownArrow:  self = .downArrow
        case kVK_ANSI_A:     self = .a
        case kVK_ANSI_B:     self = .b
        case kVK_ANSI_C:     self = .c
        case kVK_ANSI_D:     self = .d
        case kVK_ANSI_E:     self = .e
        case kVK_ANSI_F:     self = .f
        case kVK_ANSI_G:     self = .g
        case kVK_ANSI_H:     self = .h
        case kVK_ANSI_I:     self = .i
        case kVK_ANSI_J:     self = .j
        case kVK_ANSI_K:     self = .k
        case kVK_ANSI_L:     self = .l
        case kVK_ANSI_M:     self = .m
        case kVK_ANSI_N:     self = .n
        case kVK_ANSI_O:     self = .o
        case kVK_ANSI_P:     self = .p
        case kVK_ANSI_Q:     self = .q
        case kVK_ANSI_R:     self = .r
        case kVK_ANSI_S:     self = .s
        case kVK_ANSI_T:     self = .t
        case kVK_ANSI_U:     self = .u
        case kVK_ANSI_V:     self = .v
        case kVK_ANSI_W:     self = .w
        case kVK_ANSI_X:     self = .x
        case kVK_ANSI_Y:     self = .y
        case kVK_ANSI_Z:     self = .z
        default: return nil
        }
    }
}

// MARK: - KeyboardShortcut.Modifier — NSEvent flag conversion

extension KeyboardShortcut.Modifier {
    static func from(flags: NSEvent.ModifierFlags) -> Set<KeyboardShortcut.Modifier> {
        var mods: Set<KeyboardShortcut.Modifier> = []
        if flags.contains(.command) { mods.insert(.command) }
        if flags.contains(.option)  { mods.insert(.option)  }
        if flags.contains(.control) { mods.insert(.control) }
        if flags.contains(.shift)   { mods.insert(.shift)   }
        return mods
    }
}
