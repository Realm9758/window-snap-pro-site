import Foundation

struct AppRule: Codable, Identifiable, Equatable {
    var id: UUID
    var bundleIdentifier: String
    var appName: String
    var snapPosition: SnapPosition
    var isEnabled: Bool

    init(id: UUID = UUID(), bundleIdentifier: String, appName: String,
         snapPosition: SnapPosition, isEnabled: Bool = true) {
        self.id = id
        self.bundleIdentifier = bundleIdentifier
        self.appName = appName
        self.snapPosition = snapPosition
        self.isEnabled = isEnabled
    }
}
