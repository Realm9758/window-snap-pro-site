import Carbon

// MARK: - ClipboardShortcut
// Registers a single global Carbon hotkey (⌘⇧V by default) that triggers the
// clipboard history popup. Installed AFTER ShortcutManager so this handler sits
// first in the LIFO Carbon event chain — it returns noErr for its own hotkey and
// eventNotHandledErr for everything else, letting ShortcutManager handle snap keys.

final class ClipboardShortcut {
    static let shared = ClipboardShortcut()

    private var hotKeyRef: EventHotKeyRef?
    private var eventHandlerRef: EventHandlerRef?

    // The signature uniquely distinguishes clipboard events from snap events (WSNP).
    private let sig: FourCharCode = {
        var r: FourCharCode = 0
        for c in "WSCB".utf8.prefix(4) { r = r << 8 + FourCharCode(c) }
        return r
    }()
    private let hotkeyID: UInt32 = 1

    private init() {
        installEventHandler()
    }

    deinit {
        unregister()
        if let h = eventHandlerRef { RemoveEventHandler(h) }
    }

    // MARK: - Public

    func register() {
        unregister()
        guard AppState.shared.clipboardHistoryEnabled else { return }

        let shortcut  = AppState.shared.clipboardHistoryShortcut
        guard let key = ShortcutManager.carbonKeyCode(for: shortcut.key) else { return }
        let modifiers = ShortcutManager.carbonModifiers(for: shortcut.modifiers)
        let hkID      = EventHotKeyID(signature: sig, id: hotkeyID)

        RegisterEventHotKey(
            UInt32(key), modifiers, hkID,
            GetApplicationEventTarget(), 0,
            &hotKeyRef
        )
    }

    func unregister() {
        if let ref = hotKeyRef { UnregisterEventHotKey(ref); hotKeyRef = nil }
    }

    // MARK: - Carbon event handler

    private func installEventHandler() {
        var eventSpec = EventTypeSpec(
            eventClass: OSType(kEventClassKeyboard),
            eventKind:  OSType(kEventHotKeyPressed)
        )

        InstallEventHandler(
            GetApplicationEventTarget(),
            { (_, eventRef, userData) -> OSStatus in
                guard let eventRef = eventRef, let userData = userData else {
                    return OSStatus(eventNotHandledErr)
                }

                var hkID = EventHotKeyID()
                GetEventParameter(
                    eventRef,
                    EventParamName(kEventParamDirectObject),
                    EventParamType(typeEventHotKeyID),
                    nil,
                    MemoryLayout<EventHotKeyID>.size,
                    nil,
                    &hkID
                )

                let me = Unmanaged<ClipboardShortcut>.fromOpaque(userData).takeUnretainedValue()

                // Only handle our own hotkey; let ShortcutManager handle everything else.
                guard hkID.signature == me.sig, hkID.id == me.hotkeyID else {
                    return OSStatus(eventNotHandledErr)
                }

                DispatchQueue.main.async {
                    ClipboardManager.shared.togglePopup()
                }
                return noErr
            },
            1,
            &eventSpec,
            Unmanaged.passUnretained(self).toOpaque(),
            &eventHandlerRef
        )
    }
}
