import Cocoa

// MARK: - ClipboardManager
// Monitors NSPasteboard via a lightweight polling timer, manages clipboard history,
// enforces Free/Pro limits, persists to UserDefaults, and drives the popup window.

final class ClipboardManager: ObservableObject {
    static let shared = ClipboardManager()

    @Published private(set) var items: [ClipboardItem] = []

    private var lastChangeCount: Int  = 0
    private var lastImageHash:   Int  = 0
    private var pollTimer:       Timer?
    private var isMonitoring           = false

    private let storageKey = "wsp.clipboardHistory"

    private init() {
        loadFromDisk()
        lastChangeCount = NSPasteboard.general.changeCount
    }

    // MARK: - Monitoring

    func startMonitoring() {
        guard !isMonitoring else { return }
        isMonitoring    = true
        lastChangeCount = NSPasteboard.general.changeCount

        let t = Timer(timeInterval: 0.5, repeats: true) { [weak self] _ in
            self?.checkPasteboard()
        }
        RunLoop.main.add(t, forMode: .common)
        pollTimer = t
    }

    func stopMonitoring() {
        pollTimer?.invalidate()
        pollTimer    = nil
        isMonitoring = false
    }

    // MARK: - Pasteboard polling

    private func checkPasteboard() {
        guard AppState.shared.clipboardHistoryEnabled else { return }
        let pb = NSPasteboard.general
        guard pb.changeCount != lastChangeCount else { return }
        lastChangeCount = pb.changeCount

        // Text takes priority — most apps (Safari, Chrome, TextEdit…) also write
        // TIFF alongside copied text. Check string first so text copies don't end
        // up stored as image thumbnails.
        if let text = pb.string(forType: .string),
           !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            addItem(text: text)
            return
        }

        // Pure image copy (screenshots, image editor copies, etc.)
        if let tiff = pb.data(forType: .tiff),
           let image = NSImage(data: tiff),
           let png = image.pngData() {
            addImageItem(data: png)
            return
        }
        if let png = pb.data(forType: NSPasteboard.PasteboardType("public.png")) {
            addImageItem(data: png)
            return
        }
    }

    // MARK: - Item management

    func addItem(text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        let wasPinned = items.first(where: { $0.text == trimmed })?.isPinned ?? false
        items.removeAll { $0.text == trimmed }

        let new = ClipboardItem(text: trimmed, isPinned: wasPinned)

        var pinned   = items.filter(\.isPinned)
        var unpinned = items.filter { !$0.isPinned }
        unpinned.insert(new, at: 0)

        let limit = effectiveLimit
        if unpinned.count > limit { unpinned = Array(unpinned.prefix(limit)) }

        items = pinned + unpinned
        saveToDisk()
    }

    func addImageItem(data: Data) {
        let hash = data.hashValue
        guard hash != lastImageHash else { return }
        lastImageHash = hash

        let new = ClipboardItem(imageData: data)
        var pinned   = items.filter(\.isPinned)
        var unpinned = items.filter { !$0.isPinned }
        unpinned.insert(new, at: 0)

        let limit = effectiveLimit
        if unpinned.count > limit { unpinned = Array(unpinned.prefix(limit)) }

        items = pinned + unpinned
        saveToDisk()
    }

    func removeItem(_ item: ClipboardItem) {
        items.removeAll { $0.id == item.id }
        saveToDisk()
    }

    func togglePin(_ item: ClipboardItem) {
        guard let idx = items.firstIndex(where: { $0.id == item.id }) else { return }
        items[idx].isPinned.toggle()
        saveToDisk()
    }

    func clearHistory() {
        items.removeAll { !$0.isPinned }
        saveToDisk()
    }

    // MARK: - Paste

    func paste(_ item: ClipboardItem) {
        let pb = NSPasteboard.general
        pb.clearContents()

        if item.kind == .image, let data = item.imageData, let image = NSImage(data: data) {
            pb.writeObjects([image])
        } else {
            pb.setString(item.text, forType: .string)
        }
        lastChangeCount = pb.changeCount

        if !item.isPinned {
            if let idx = items.firstIndex(where: { $0.id == item.id }) {
                let copy = items[idx]
                items.remove(at: idx)
                items.insert(copy, at: items.firstIndex(where: { !$0.isPinned }) ?? 0)
            }
            saveToDisk()
        }

        ClipboardPopupController.shared.hide()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            Self.simulatePaste()
        }
    }

    private static func simulatePaste() {
        let src  = CGEventSource(stateID: .hidSystemState)
        let vKey = CGKeyCode(9)
        let down = CGEvent(keyboardEventSource: src, virtualKey: vKey, keyDown: true)
        let up   = CGEvent(keyboardEventSource: src, virtualKey: vKey, keyDown: false)
        down?.flags = .maskCommand
        up?.flags   = .maskCommand
        down?.post(tap: .cgAnnotatedSessionEventTap)
        up?.post(tap: .cgAnnotatedSessionEventTap)
    }

    // MARK: - Popup

    func showPopup()   { ClipboardPopupController.shared.show()   }
    func hidePopup()   { ClipboardPopupController.shared.hide()   }
    func togglePopup() { ClipboardPopupController.shared.toggle() }

    // MARK: - Tier limit

    var effectiveLimit: Int {
        AppState.shared.isProActivated ? AppState.shared.clipboardHistorySize : 5
    }

    // MARK: - Persistence

    private func loadFromDisk() {
        guard let data    = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([ClipboardItem].self, from: data)
        else { return }
        items = decoded
    }

    func saveToDisk() {
        guard let data = try? JSONEncoder().encode(items) else { return }
        UserDefaults.standard.set(data, forKey: storageKey)
    }
}

// MARK: - NSImage PNG helper

private extension NSImage {
    func pngData() -> Data? {
        guard let tiff   = tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiff) else { return nil }
        return bitmap.representation(using: .png, properties: [:])
    }
}
