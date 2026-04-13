import Cocoa

// MARK: - FileShelfManager
// Manages the File Shelf: a small persistent store of file URLs that users
// can drag in and paste back to other apps.

final class FileShelfManager: ObservableObject {
    static let shared = FileShelfManager()

    @Published private(set) var items: [FileShelfItem] = []

    private let storageKey = "wsp.fileShelf"

    private init() {
        loadFromDisk()
    }

    // MARK: - Limits

    /// Max unpinned items. Free: 3, Pro: user-configured (default 10).
    var effectiveLimit: Int {
        AppState.shared.isProActivated ? max(3, AppState.shared.fileShelfSize) : 3
    }

    // MARK: - Add

    func addFile(url: URL) {
        let canonical = url.standardizedFileURL

        // Deduplicate: remove any existing entry for this URL
        items.removeAll { $0.url.standardizedFileURL == canonical }

        let item = FileShelfItem(url: canonical)

        var pinned   = items.filter(\.isPinned)
        var unpinned = items.filter { !$0.isPinned }
        unpinned.insert(item, at: 0)

        // Enforce tier limit on unpinned items
        if unpinned.count > effectiveLimit {
            unpinned = Array(unpinned.prefix(effectiveLimit))
        }

        items = pinned + unpinned
        saveToDisk()
    }

    // MARK: - Remove

    func removeItem(_ item: FileShelfItem) {
        items.removeAll { $0.id == item.id }
        saveToDisk()
    }

    func clearShelf() {
        items.removeAll { !$0.isPinned }
        saveToDisk()
    }

    // MARK: - Pin

    func togglePin(_ item: FileShelfItem) {
        guard let idx = items.firstIndex(where: { $0.id == item.id }) else { return }
        items[idx].isPinned.toggle()
        saveToDisk()
    }

    // MARK: - Paste

    /// Writes the file URL to the general pasteboard, hides the popup, then simulates ⌘V.
    func pasteFile(_ item: FileShelfItem) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.writeObjects([item.url as NSURL])

        ClipboardPopupController.shared.hide()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            Self.simulatePaste()
        }
    }

    /// Opens the file with its default application and closes the popup.
    func openFile(_ item: FileShelfItem) {
        NSWorkspace.shared.open(item.url)
        ClipboardPopupController.shared.hide()
    }

    /// Reveals the file in Finder and closes the popup.
    func revealInFinder(_ item: FileShelfItem) {
        NSWorkspace.shared.activateFileViewerSelecting([item.url])
        ClipboardPopupController.shared.hide()
    }

    // MARK: - Private helpers

    private static func simulatePaste() {
        let src  = CGEventSource(stateID: .hidSystemState)
        let vKey = CGKeyCode(9) // kVK_ANSI_V
        let down = CGEvent(keyboardEventSource: src, virtualKey: vKey, keyDown: true)
        let up   = CGEvent(keyboardEventSource: src, virtualKey: vKey, keyDown: false)
        down?.flags = .maskCommand
        up?.flags   = .maskCommand
        down?.post(tap: .cgAnnotatedSessionEventTap)
        up?.post(tap: .cgAnnotatedSessionEventTap)
    }

    // MARK: - Persistence

    private func loadFromDisk() {
        guard let data    = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([FileShelfItem].self, from: data)
        else { return }
        items = decoded
    }

    func saveToDisk() {
        guard let data = try? JSONEncoder().encode(items) else { return }
        UserDefaults.standard.set(data, forKey: storageKey)
    }
}
