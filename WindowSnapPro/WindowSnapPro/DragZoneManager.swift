import SwiftUI
import Combine

class DragZoneManager: ObservableObject {
    static let shared = DragZoneManager()

    @AppStorage("dz_edgeSensitivity")   var edgeSensitivity:   Double = 48 { willSet { objectWillChange.send() } }
    @AppStorage("dz_cornerSensitivity") var cornerSensitivity: Double = 60 { willSet { objectWillChange.send() } }
    @AppStorage("dz_snapDelay")         var snapDelay:         Double = 0.06 { willSet { objectWillChange.send() } }
    @AppStorage("dz_dragThreshold")     var dragThreshold:     Double = 10 { willSet { objectWillChange.send() } }

    @AppStorage("dz_cornerSnapping") var cornerSnappingEnabled: Bool = true { willSet { objectWillChange.send() } }
    @AppStorage("dz_edgeSnapping")   var edgeSnappingEnabled:   Bool = true { willSet { objectWillChange.send() } }
    @AppStorage("dz_dragSnapping")   var dragSnappingEnabled:   Bool = true { willSet { objectWillChange.send() } }

    private init() {}

    func reset() {
        edgeSensitivity       = 48
        cornerSensitivity     = 60
        snapDelay             = 0.06
        dragThreshold         = 10
        cornerSnappingEnabled = true
        edgeSnappingEnabled   = true
        dragSnappingEnabled   = true
    }
}
