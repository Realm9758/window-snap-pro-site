import SwiftUI

struct AnimationManager {
    // Spring animation used for window snapping steps
    static func snapDuration(for speed: AnimationSpeed) -> Double { speed.duration }

    // Overlay animations
    static let overlayIn:  Animation = .easeOut(duration: 0.14)
    static let overlayOut: Animation = .easeIn(duration: 0.18)

    // Settings sidebar / tab transitions
    static let sidebarSwitch: Animation = .easeInOut(duration: 0.16)

    // Sheet slide-in
    static let sheetSlide: Animation = .spring(response: 0.34, dampingFraction: 0.86)

    // List row insert/remove
    static let listChange: Animation = .spring(response: 0.30, dampingFraction: 0.82)

    // Hover
    static let hover: Animation = .easeInOut(duration: 0.10)
}
