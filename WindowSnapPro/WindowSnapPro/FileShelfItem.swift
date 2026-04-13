import Foundation
import AppKit

// MARK: - FileShelfItem
// Model for a file stored in the File Shelf.

struct FileShelfItem: Identifiable, Codable, Equatable {
    let id:        UUID
    let url:       URL
    let filename:  String
    let timestamp: Date
    var isPinned:  Bool

    init(url: URL, isPinned: Bool = false) {
        self.id        = UUID()
        self.url       = url
        self.filename  = url.lastPathComponent
        self.timestamp = Date()
        self.isPinned  = isPinned
    }

    // MARK: - Display helpers

    /// Short extension label, e.g. "PDF", "PNG", "Folder".
    var fileExtensionLabel: String {
        let ext = url.pathExtension.uppercased()
        if !ext.isEmpty { return ext }
        var isDir: ObjCBool = false
        FileManager.default.fileExists(atPath: url.path, isDirectory: &isDir)
        return isDir.boolValue ? "Folder" : "File"
    }

    /// True if this points to a directory.
    var isDirectory: Bool {
        var isDir: ObjCBool = false
        return FileManager.default.fileExists(atPath: url.path, isDirectory: &isDir)
            && isDir.boolValue
    }

    /// Whether the file still exists on disk.
    var isReachable: Bool {
        (try? url.checkResourceIsReachable()) ?? false
    }

    /// Compact relative timestamp string.
    var relativeTime: String {
        let diff = Date().timeIntervalSince(timestamp)
        if diff < 5    { return "Just now" }
        if diff < 60   { return "\(Int(diff))s ago" }
        if diff < 3600 { return "\(Int(diff / 60))m ago" }
        if diff < 86400 { return "\(Int(diff / 3600))h ago" }
        let fmt = DateFormatter()
        fmt.dateFormat = "MMM d"
        return fmt.string(from: timestamp)
    }

    /// Fallback SF Symbol for when a native icon can't be displayed.
    var sfSymbol: String {
        if isDirectory { return "folder.fill" }
        switch url.pathExtension.lowercased() {
        case "pdf":                                          return "doc.richtext"
        case "jpg", "jpeg", "png", "heic", "gif", "webp":  return "photo"
        case "mp4", "mov", "avi", "mkv":                   return "film"
        case "mp3", "wav", "aiff", "m4a":                  return "music.note"
        case "zip", "gz", "tar", "rar":                    return "archivebox"
        case "app":                                         return "app.badge"
        case "swift":                                       return "swift"
        case "html", "htm":                                 return "globe"
        default:                                            return "doc"
        }
    }
}
