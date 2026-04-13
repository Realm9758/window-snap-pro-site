import Foundation

// MARK: - ClipboardKind

enum ClipboardKind: String, Codable {
    case text
    case link
    case image
}

// MARK: - ClipboardItem

struct ClipboardItem: Identifiable, Codable, Equatable {
    let id:        UUID
    let kind:      ClipboardKind
    let text:      String       // empty for images
    let imageData: Data?        // PNG data for .image items
    let timestamp: Date
    var isPinned:  Bool

    // Text / link item
    init(id: UUID = UUID(), text: String, timestamp: Date = Date(), isPinned: Bool = false) {
        self.id        = id
        self.text      = text
        self.timestamp = timestamp
        self.isPinned  = isPinned
        self.imageData = nil
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        self.kind = (t.hasPrefix("http://") || t.hasPrefix("https://")) ? .link : .text
    }

    // Image item
    init(id: UUID = UUID(), imageData: Data, timestamp: Date = Date(), isPinned: Bool = false) {
        self.id        = id
        self.text      = ""
        self.imageData = imageData
        self.timestamp = timestamp
        self.isPinned  = isPinned
        self.kind      = .image
    }

    // MARK: - Codable (backward-compat: old items have no `kind` or `imageData`)

    enum CodingKeys: String, CodingKey {
        case id, kind, text, imageData, timestamp, isPinned
    }

    init(from decoder: Decoder) throws {
        let c  = try decoder.container(keyedBy: CodingKeys.self)
        id        = try c.decode(UUID.self, forKey: .id)
        text      = try c.decodeIfPresent(String.self, forKey: .text) ?? ""
        timestamp = try c.decode(Date.self, forKey: .timestamp)
        isPinned  = try c.decode(Bool.self, forKey: .isPinned)
        imageData = try c.decodeIfPresent(Data.self, forKey: .imageData)

        if let k = try c.decodeIfPresent(ClipboardKind.self, forKey: .kind) {
            kind = k
        } else if imageData != nil {
            kind = .image
        } else {
            let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
            kind = (t.hasPrefix("http://") || t.hasPrefix("https://")) ? .link : .text
        }
    }

    // MARK: - Display

    var preview: String {
        kind == .image
            ? "Image"
            : text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var isLink:  Bool { kind == .link  }
    var isImage: Bool { kind == .image }

    var relativeTime: String {
        let diff = Date().timeIntervalSince(timestamp)
        if diff < 5    { return "Just now" }
        if diff < 60   { return "\(Int(diff))s ago" }
        if diff < 3600 { return "\(Int(diff / 60))m ago" }
        if diff < 86400 {
            return "\(Int(diff / 3600))h ago"
        }
        let fmt = DateFormatter()
        fmt.dateFormat = "MMM d"
        return fmt.string(from: timestamp)
    }
}

// MARK: - Safe subscript

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
