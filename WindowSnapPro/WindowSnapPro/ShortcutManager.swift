import Cocoa
import Carbon

// MARK: - ShortcutManager
// Registers global hotkeys using the Carbon Event Manager so shortcuts
// work regardless of which app has focus.

class ShortcutManager {
    static let shared = ShortcutManager()

    // Map from hotkey ID to snap position
    private var registeredHotkeys: [UInt32: (EventHotKeyRef, SnapPosition)] = [:]
    private var nextHotkeyID: UInt32 = 1
    private var eventHandler: EventHandlerRef?

    private init() {
        installEventHandler()
    }

    deinit {
        unregisterAll()
        if let handler = eventHandler {
            RemoveEventHandler(handler)
        }
    }

    // MARK: - Public

    func registerAll() {
        unregisterAll()
        guard AppState.shared.snappingEnabled, AppState.shared.hasAccessibilityPermission else { return }
        let shortcuts = AppState.shared.shortcuts
        for (position, shortcut) in shortcuts {
            register(shortcut: shortcut, for: position)
        }
    }

    func unregisterAll() {
        for (_, (ref, _)) in registeredHotkeys {
            UnregisterEventHotKey(ref)
        }
        registeredHotkeys.removeAll()
    }

    // MARK: - Private

    private func register(shortcut: KeyboardShortcut, for position: SnapPosition) {
        guard let keyCode = ShortcutManager.carbonKeyCode(for: shortcut.key) else { return }
        let modifiers = ShortcutManager.carbonModifiers(for: shortcut.modifiers)

        let hotkeyID = EventHotKeyID(signature: fourCharCode("WSNP"), id: nextHotkeyID)
        var hotKeyRef: EventHotKeyRef?

        let status = RegisterEventHotKey(
            UInt32(keyCode),
            UInt32(modifiers),
            hotkeyID,
            GetApplicationEventTarget(),
            0,
            &hotKeyRef
        )

        if status == noErr, let ref = hotKeyRef {
            registeredHotkeys[nextHotkeyID] = (ref, position)
            nextHotkeyID += 1
        }
    }

    private func installEventHandler() {
        var eventType = EventTypeSpec(eventClass: OSType(kEventClassKeyboard),
                                      eventKind:  OSType(kEventHotKeyPressed))

        InstallEventHandler(
            GetApplicationEventTarget(),
            { _, event, userData -> OSStatus in
                guard let event = event else { return OSStatus(eventNotHandledErr) }
                var hotkeyID = EventHotKeyID()
                GetEventParameter(event,
                                  EventParamName(kEventParamDirectObject),
                                  EventParamType(typeEventHotKeyID),
                                  nil,
                                  MemoryLayout<EventHotKeyID>.size,
                                  nil,
                                  &hotkeyID)
                // Dispatch back to the manager via the stored pointer
                let manager = Unmanaged<ShortcutManager>.fromOpaque(userData!).takeUnretainedValue()
                let handled = manager.handleHotkey(id: hotkeyID.id)
                return handled ? noErr : OSStatus(eventNotHandledErr)
            },
            1,
            &eventType,
            Unmanaged.passUnretained(self).toOpaque(),
            &eventHandler
        )
    }

    @discardableResult
    private func handleHotkey(id: UInt32) -> Bool {
        guard let (_, position) = registeredHotkeys[id] else { return false }
        DispatchQueue.main.async {
            WindowManager.shared.snap(to: position)
        }
        return true
    }

    // MARK: - Key Code Mapping

    static func carbonKeyCode(for key: KeyboardShortcut.Key) -> Int? {
        switch key {
        case .leftArrow:  return kVK_LeftArrow
        case .rightArrow: return kVK_RightArrow
        case .upArrow:    return kVK_UpArrow
        case .downArrow:  return kVK_DownArrow
        case .a: return kVK_ANSI_A
        case .b: return kVK_ANSI_B
        case .c: return kVK_ANSI_C
        case .d: return kVK_ANSI_D
        case .e: return kVK_ANSI_E
        case .f: return kVK_ANSI_F
        case .g: return kVK_ANSI_G
        case .h: return kVK_ANSI_H
        case .i: return kVK_ANSI_I
        case .j: return kVK_ANSI_J
        case .k: return kVK_ANSI_K
        case .l: return kVK_ANSI_L
        case .m: return kVK_ANSI_M
        case .n: return kVK_ANSI_N
        case .o: return kVK_ANSI_O
        case .p: return kVK_ANSI_P
        case .q: return kVK_ANSI_Q
        case .r: return kVK_ANSI_R
        case .s: return kVK_ANSI_S
        case .t: return kVK_ANSI_T
        case .u: return kVK_ANSI_U
        case .v: return kVK_ANSI_V
        case .w: return kVK_ANSI_W
        case .x: return kVK_ANSI_X
        case .y: return kVK_ANSI_Y
        case .z: return kVK_ANSI_Z
        }
    }

    static func carbonModifiers(for modifiers: Set<KeyboardShortcut.Modifier>) -> UInt32 {
        var result: UInt32 = 0
        if modifiers.contains(.command) { result |= UInt32(cmdKey) }
        if modifiers.contains(.option)  { result |= UInt32(optionKey) }
        if modifiers.contains(.control) { result |= UInt32(controlKey) }
        if modifiers.contains(.shift)   { result |= UInt32(shiftKey) }
        return result
    }

    private func fourCharCode(_ string: String) -> FourCharCode {
        var result: FourCharCode = 0
        for char in string.utf8.prefix(4) {
            result = result << 8 + FourCharCode(char)
        }
        return result
    }
}
