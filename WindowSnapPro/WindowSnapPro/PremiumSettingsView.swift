import SwiftUI

// MARK: - PremiumSettingsView
// Dashboard for advanced / premium feature toggles.

struct PremiumSettingsView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject private var ruleManager  = RuleManager.shared
    @ObservedObject private var dzm          = DragZoneManager.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {

            SectionHeader("App Rules")
            SettingsCard {
                SettingsRow {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Enable App Rules")
                            .fontWeight(.medium)
                        Text("\(ruleManager.rules.count) rule\(ruleManager.rules.count == 1 ? "" : "s") configured")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Toggle("", isOn: $appState.rulesEnabled)
                        .labelsHidden().toggleStyle(.switch)
                }
            }

            SectionHeader("Drag Zones")
            SettingsCard {
                SettingsRow {
                    Text("Edge Snapping")
                    Spacer()
                    Toggle("", isOn: $dzm.edgeSnappingEnabled).labelsHidden().toggleStyle(.switch).controlSize(.small)
                }
                RowDivider()
                SettingsRow {
                    Text("Corner Snapping")
                    Spacer()
                    Toggle("", isOn: $dzm.cornerSnappingEnabled).labelsHidden().toggleStyle(.switch).controlSize(.small)
                }
                RowDivider()
                SettingsRow {
                    Text("Drag Snapping")
                    Spacer()
                    Toggle("", isOn: $dzm.dragSnappingEnabled).labelsHidden().toggleStyle(.switch).controlSize(.small)
                }
            }

            SectionHeader("Advanced")
            SettingsCard {
                SettingsRow {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Smooth Animations")
                            .fontWeight(.medium)
                        Text("Spring-based window movement")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Toggle("", isOn: $appState.animationsEnabled)
                        .labelsHidden().toggleStyle(.switch)
                }
                RowDivider()
                SettingsRow {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Smart Snapping")
                            .fontWeight(.medium)
                        Text("Learns your preferred snap positions")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Toggle("", isOn: $appState.smartSnappingEnabled)
                        .labelsHidden().toggleStyle(.switch)
                }
                RowDivider()
                SettingsRow {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Advanced Snapping")
                            .fontWeight(.medium)
                        Text("Additional snap positions and gestures")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Toggle("", isOn: $appState.advancedSnappingEnabled)
                        .labelsHidden().toggleStyle(.switch)
                }
            }
        }
    }
}
