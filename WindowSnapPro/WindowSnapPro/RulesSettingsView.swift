import SwiftUI
import AppKit

// MARK: - RulesSettingsView

struct RulesSettingsView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject private var ruleManager = RuleManager.shared
    @State private var showingAddRule = false

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(alignment: .firstTextBaseline) {
                SectionHeader("App Rules")
                Spacer()
                Toggle("Enabled", isOn: $appState.rulesEnabled)
                    .toggleStyle(.switch)
                    .controlSize(.small)
                    .labelsHidden()
                Button {
                    showingAddRule = true
                } label: {
                    Label("Add Rule", systemImage: "plus")
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }

            if ruleManager.rules.isEmpty {
                EmptyRulesView()
            } else {
                SettingsCard {
                    VStack(spacing: 0) {
                        ForEach(ruleManager.rules) { rule in
                            AppRuleRow(rule: rule)
                            if rule.id != ruleManager.rules.last?.id {
                                RowDivider()
                            }
                        }
                    }
                }
            }

            Text("Rules automatically snap an app's window when it becomes active.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .sheet(isPresented: $showingAddRule) {
            AddRuleSheet(isPresented: $showingAddRule)
        }
    }
}

// MARK: - Empty State

private struct EmptyRulesView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "app.badge.checkmark")
                .font(.system(size: 40, weight: .light))
                .foregroundStyle(.tertiary)
            Text("No App Rules")
                .font(.headline)
                .foregroundStyle(.secondary)
            Text("Add a rule to automatically snap an app to a position when it launches.")
                .font(.callout)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 280)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 44)
    }
}

// MARK: - Rule Row

private struct AppRuleRow: View {
    @ObservedObject private var ruleManager = RuleManager.shared
    let rule: AppRule

    var body: some View {
        SettingsRow {
            appIconView
                .frame(width: 28, height: 28)

            VStack(alignment: .leading, spacing: 1) {
                Text(rule.appName)
                    .fontWeight(.medium)
                    .lineLimit(1)
                HStack(spacing: 4) {
                    Image(systemName: rule.snapPosition.icon)
                        .font(.system(size: 10))
                    Text(rule.snapPosition.rawValue)
                        .font(.caption)
                }
                .foregroundStyle(.secondary)
            }

            Spacer()

            Toggle("", isOn: Binding(
                get: { rule.isEnabled },
                set: { enabled in
                    var updated = rule
                    updated.isEnabled = enabled
                    ruleManager.update(updated)
                }
            ))
            .labelsHidden()
            .toggleStyle(.switch)
            .controlSize(.small)

            Button {
                withAnimation(AnimationManager.listChange) {
                    ruleManager.delete(rule)
                }
            } label: {
                Image(systemName: "trash")
                    .font(.caption)
                    .foregroundStyle(.red.opacity(0.8))
            }
            .buttonStyle(.plain)
        }
    }

    @ViewBuilder
    private var appIconView: some View {
        if let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: rule.bundleIdentifier) {
            let icon = NSWorkspace.shared.icon(forFile: url.path)
            Image(nsImage: icon)
                .resizable()
                .aspectRatio(contentMode: .fit)
        } else {
            Image(systemName: "app.fill")
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Add Rule Sheet

struct AddRuleSheet: View {
    @Binding var isPresented: Bool
    @ObservedObject private var ruleManager = RuleManager.shared

    @State private var selectedApp: AppInfo? = nil
    @State private var selectedPosition: SnapPosition = .leftHalf
    @State private var apps: [AppInfo] = []
    @State private var isLoading = true

    var body: some View {
        VStack(spacing: 0) {
            // Title bar
            HStack {
                Text("Add App Rule")
                    .font(.headline)
                Spacer()
                Button {
                    isPresented = false
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                        .font(.title3)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)

            Divider()

            // Form
            VStack(alignment: .leading, spacing: 16) {
                // App picker
                VStack(alignment: .leading, spacing: 6) {
                    Text("Application")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if isLoading {
                        ProgressView()
                            .controlSize(.small)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        Picker("", selection: $selectedApp) {
                            Text("Select an app…").tag(Optional<AppInfo>.none)
                            ForEach(apps) { app in
                                HStack(spacing: 6) {
                                    if let icon = app.icon {
                                        Image(nsImage: icon)
                                            .resizable()
                                            .frame(width: 16, height: 16)
                                    }
                                    Text(app.name)
                                }
                                .tag(Optional(app))
                            }
                        }
                        .labelsHidden()
                        .frame(maxWidth: .infinity)
                    }
                }

                // Snap position
                VStack(alignment: .leading, spacing: 6) {
                    Text("Snap Position")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Picker("", selection: $selectedPosition) {
                        ForEach(SnapPosition.allCases) { pos in
                            Label(pos.rawValue, systemImage: pos.icon).tag(pos)
                        }
                    }
                    .labelsHidden()
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(20)

            Divider()

            // Actions
            HStack {
                Button("Cancel") { isPresented = false }
                    .keyboardShortcut(.cancelAction)
                Spacer()
                Button("Add Rule") {
                    guard let app = selectedApp else { return }
                    let rule = AppRule(
                        bundleIdentifier: app.bundleIdentifier,
                        appName: app.name,
                        snapPosition: selectedPosition
                    )
                    ruleManager.add(rule)
                    isPresented = false
                }
                .buttonStyle(.borderedProminent)
                .disabled(selectedApp == nil)
                .keyboardShortcut(.defaultAction)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
        }
        .frame(width: 340)
        .preferredColorScheme(.dark)
        .task { await loadApps() }
    }

    @MainActor
    private func loadApps() async {
        isLoading = true
        let result = await Task.detached(priority: .userInitiated) {
            Self.scanInstalledApps()
        }.value
        apps = result
        isLoading = false
    }

    nonisolated private static func scanInstalledApps() -> [AppInfo] {
        let dirs = ["/Applications", "/System/Applications",
                    (NSHomeDirectory() as NSString).appendingPathComponent("Applications")]
        var seen = Set<String>()
        var result: [AppInfo] = []
        let fm = FileManager.default

        for dir in dirs {
            guard let contents = try? fm.contentsOfDirectory(atPath: dir) else { continue }
            for name in contents where name.hasSuffix(".app") {
                let path = "\(dir)/\(name)"
                guard let bundle = Bundle(path: path),
                      let bid = bundle.bundleIdentifier,
                      !seen.contains(bid) else { continue }
                seen.insert(bid)
                let appName = (name as NSString).deletingPathExtension
                var icon = NSWorkspace.shared.icon(forFile: path)
                icon.size = NSSize(width: 16, height: 16)
                result.append(AppInfo(name: appName, bundleIdentifier: bid, icon: icon))
            }
        }
        return result.sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
    }
}

// MARK: - AppInfo

struct AppInfo: Identifiable, Hashable, Equatable {
    let id = UUID()
    let name: String
    let bundleIdentifier: String
    let icon: NSImage?

    func hash(into hasher: inout Hasher) { hasher.combine(bundleIdentifier) }
    static func == (lhs: AppInfo, rhs: AppInfo) -> Bool { lhs.bundleIdentifier == rhs.bundleIdentifier }
}
