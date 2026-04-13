import SwiftUI

// MARK: - DragZoneSettingsView

struct DragZoneSettingsView: View {
    @ObservedObject private var dzm = DragZoneManager.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {

            HStack(alignment: .firstTextBaseline) {
                SectionHeader("Drag Zones")
                Spacer()
                Button("Reset Defaults") { dzm.reset() }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
            }

            // Feature toggles
            SectionHeader("Features")
            SettingsCard {
                SettingsRow {
                    Label("Edge Snapping", systemImage: "arrow.left.and.right.square")
                    Spacer()
                    Toggle("", isOn: $dzm.edgeSnappingEnabled).labelsHidden().toggleStyle(.switch).controlSize(.small)
                }
                RowDivider()
                SettingsRow {
                    Label("Corner Snapping", systemImage: "arrow.up.left.and.down.right.and.arrow.up.right.and.down.left")
                    Spacer()
                    Toggle("", isOn: $dzm.cornerSnappingEnabled).labelsHidden().toggleStyle(.switch).controlSize(.small)
                }
                RowDivider()
                SettingsRow {
                    Label("Drag Snapping", systemImage: "hand.draw")
                    Spacer()
                    Toggle("", isOn: $dzm.dragSnappingEnabled).labelsHidden().toggleStyle(.switch).controlSize(.small)
                }
            }

            // Sensitivity sliders
            SectionHeader("Sensitivity")
            SettingsCard {
                DZSlider(label: "Edge Zone", value: $dzm.edgeSensitivity,   range: 20...120, unit: "px")
                RowDivider()
                DZSlider(label: "Corner Zone", value: $dzm.cornerSensitivity, range: 30...150, unit: "px")
                RowDivider()
                DZSlider(label: "Drag Threshold", value: $dzm.dragThreshold, range: 4...30,  unit: "px")
                RowDivider()
                DZSlider(label: "Snap Delay",  value: $dzm.snapDelay,      range: 0...0.3,   unit: "s",  decimals: 2)
            }

            // Live zone preview
            SectionHeader("Zone Preview")
            DragZonePreview(edgeSensitivity: dzm.edgeSensitivity,
                            cornerSensitivity: dzm.cornerSensitivity,
                            edgeEnabled: dzm.edgeSnappingEnabled,
                            cornerEnabled: dzm.cornerSnappingEnabled)
        }
    }
}

// MARK: - Slider row

private struct DZSlider: View {
    let label: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    let unit: String
    var decimals: Int = 0

    private var displayValue: String {
        decimals == 0
            ? "\(Int(value))\(unit)"
            : String(format: "%.\(decimals)f\(unit)", value)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(label)
                Spacer()
                Text(displayValue)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
                    .frame(width: 52, alignment: .trailing)
            }
            Slider(value: $value, in: range)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Zone Preview

private struct DragZonePreview: View {
    let edgeSensitivity:   Double
    let cornerSensitivity: Double
    let edgeEnabled:   Bool
    let cornerEnabled: Bool

    var body: some View {
        GeometryReader { geo in
            let w  = geo.size.width
            let h  = geo.size.height
            let eW = min(w * edgeSensitivity   / 600, w * 0.22)
            let eH = min(h * edgeSensitivity   / 400, h * 0.28)
            let cW = min(w * cornerSensitivity / 600, w * 0.28)
            let cH = min(h * cornerSensitivity / 400, h * 0.35)

            ZStack(alignment: .topLeading) {
                // Background
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color(nsColor: .controlBackgroundColor))
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .strokeBorder(Color(nsColor: .separatorColor), lineWidth: 1)

                if edgeEnabled {
                    // Left
                    Rectangle().fill(Color.accentColor.opacity(0.25))
                        .frame(width: eW, height: h - cH * 2)
                        .offset(x: 0, y: cH)
                    // Right
                    Rectangle().fill(Color.accentColor.opacity(0.25))
                        .frame(width: eW, height: h - cH * 2)
                        .offset(x: w - eW, y: cH)
                    // Top
                    Rectangle().fill(Color.accentColor.opacity(0.25))
                        .frame(width: w - cW * 2, height: eH)
                        .offset(x: cW, y: 0)
                    // Bottom
                    Rectangle().fill(Color.accentColor.opacity(0.25))
                        .frame(width: w - cW * 2, height: eH)
                        .offset(x: cW, y: h - eH)
                }

                if cornerEnabled {
                    // Top-left
                    Rectangle().fill(Color.purple.opacity(0.35))
                        .frame(width: cW, height: cH)
                    // Top-right
                    Rectangle().fill(Color.purple.opacity(0.35))
                        .frame(width: cW, height: cH)
                        .offset(x: w - cW, y: 0)
                    // Bottom-left
                    Rectangle().fill(Color.purple.opacity(0.35))
                        .frame(width: cW, height: cH)
                        .offset(x: 0, y: h - cH)
                    // Bottom-right
                    Rectangle().fill(Color.purple.opacity(0.35))
                        .frame(width: cW, height: cH)
                        .offset(x: w - cW, y: h - cH)
                }

                // Legend
                VStack {
                    Spacer()
                    HStack(spacing: 12) {
                        if edgeEnabled {
                            HStack(spacing: 4) {
                                Circle().fill(Color.accentColor.opacity(0.7)).frame(width: 7, height: 7)
                                Text("Edge").font(.system(size: 9)).foregroundStyle(.secondary)
                            }
                        }
                        if cornerEnabled {
                            HStack(spacing: 4) {
                                Circle().fill(Color.purple.opacity(0.7)).frame(width: 7, height: 7)
                                Text("Corner").font(.system(size: 9)).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.bottom, 6)
                }
                .frame(maxWidth: .infinity)
            }
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .frame(height: 140)
    }
}
