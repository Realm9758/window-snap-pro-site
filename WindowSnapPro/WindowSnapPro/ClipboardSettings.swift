import SwiftUI

// MARK: - ClipboardSettingsView
// Settings panel for the Clipboard History feature. Basic toggle is available
// to all users; history-size control and advanced options are Pro-only.

struct ClipboardSettingsView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject private var manager      = ClipboardManager.shared
    @ObservedObject private var shelfManager = FileShelfManager.shared

    @State private var showClearConfirm      = false
    @State private var showClearShelfConfirm = false
    @State private var isRecordingShortcut   = false
    @State private var shortcutMonitor: Any? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {

            PageHeader(icon: "clipboard.fill", title: "Clipboard",
                       tint: Color(hue: 0.480, saturation: 0.70, brightness: 0.85))

            // ── General ───────────────────────────────────────────────
            SectionHeader("Clipboard History")
            SettingsCard {
                SettingsRow {
                    RowLabel("Enable Clipboard History",
                             subtitle: "Automatically track copied text in the background")
                    Spacer()
                    Toggle("", isOn: $appState.clipboardHistoryEnabled)
                        .labelsHidden()
                        .toggleStyle(.switch)
                        .onChange(of: appState.clipboardHistoryEnabled) { enabled in
                            if enabled {
                                ClipboardManager.shared.startMonitoring()
                                ClipboardShortcut.shared.register()
                            } else {
                                ClipboardManager.shared.stopMonitoring()
                                ClipboardShortcut.shared.unregister()
                                ClipboardPopupController.shared.hide()
                            }
                        }
                }

                RowDivider()

                SettingsRow {
                    RowLabel("Keyboard Shortcut",
                             subtitle: "Show clipboard history popup")
                    Spacer()
                    ShortcutBadge(
                        shortcut: appState.clipboardHistoryShortcut,
                        isRecording: isRecordingShortcut
                    )
                    .onTapGesture {
                        isRecordingShortcut ? stopRecordingShortcut() : startRecordingShortcut()
                    }
                    .help(isRecordingShortcut ? "Press a key combo — Esc to cancel." : "Click to record a shortcut.")

                    if !isRecordingShortcut {
                        Button {
                            appState.clipboardHistoryShortcut = KeyboardShortcut(key: .v, modifiers: [.command, .shift])
                            ClipboardShortcut.shared.register()
                        } label: {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .buttonStyle(.plain)
                        .help("Reset to default (⌘⇧V)")
                    }
                }
            }

            // ── History Size (Pro) ────────────────────────────────────
            SectionHeader("Storage")
            SettingsCard {
                SettingsRow {
                    VStack(alignment: .leading, spacing: 1) {
                        HStack(spacing: 6) {
                            Text("History Size")
                                .font(.system(size: 13, weight: .medium))
                            if !appState.isProActivated {
                                ProBadge()
                            }
                        }
                        Text(appState.isProActivated
                             ? "Store up to \(appState.clipboardHistorySize) items"
                             : "Free plan stores up to 5 items")
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                    }
                    Spacer()

                    if appState.isProActivated {
                        HStack(spacing: 8) {
                            Slider(
                                value: Binding(
                                    get: { Double(appState.clipboardHistorySize) },
                                    set: { appState.clipboardHistorySize = Int($0) }
                                ),
                                in: 5...50,
                                step: 5
                            )
                            .frame(width: 100)

                            Text("\(appState.clipboardHistorySize)")
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .foregroundStyle(.secondary)
                                .frame(width: 24, alignment: .trailing)
                        }
                    } else {
                        Text("5")
                            .font(.system(size: 12, weight: .semibold, design: .monospaced))
                            .foregroundStyle(.tertiary)
                    }
                }

                RowDivider()

                SettingsRow {
                    RowLabel("Items stored",
                             subtitle: "\(manager.items.filter { !$0.isPinned }.count) unpinned · \(manager.items.filter(\.isPinned).count) pinned")
                    Spacer()
                    Text("\(manager.items.count) / \(manager.effectiveLimit)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                }
            }

            // ── Pinned items (Pro) ────────────────────────────────────
            if appState.isProActivated && manager.items.contains(where: \.isPinned) {
                SectionHeader("Pinned Items")
                SettingsCard {
                    ForEach(Array(manager.items.filter(\.isPinned).enumerated()), id: \.element.id) { idx, item in
                        if idx > 0 { RowDivider() }
                        SettingsRow {
                            HStack(spacing: 6) {
                                Image(systemName: "pin.fill")
                                    .font(.system(size: 10))
                                    .foregroundStyle(Color.accentColor)
                                Text(item.preview)
                                    .font(.system(size: 12))
                                    .lineLimit(1)
                                    .truncationMode(.tail)
                            }
                            Spacer()
                            Button {
                                ClipboardManager.shared.togglePin(item)
                            } label: {
                                Image(systemName: "pin.slash")
                                    .font(.system(size: 11))
                                    .foregroundStyle(.secondary)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }

            // ── File Shelf ────────────────────────────────────────────
            SectionHeader("File Shelf")
            SettingsCard {
                SettingsRow {
                    RowLabel("Enable File Shelf",
                             subtitle: "Drag files into the clipboard popup to store them temporarily")
                    Spacer()
                    Toggle("", isOn: $appState.fileShelfEnabled)
                        .labelsHidden()
                        .toggleStyle(.switch)
                }

                RowDivider()

                SettingsRow {
                    VStack(alignment: .leading, spacing: 1) {
                        HStack(spacing: 6) {
                            Text("Max Items")
                                .font(.system(size: 13, weight: .medium))
                            if !appState.isProActivated {
                                ProBadge()
                            }
                        }
                        Text(appState.isProActivated
                             ? "Store up to \(appState.fileShelfSize) files"
                             : "Free plan stores up to 3 files")
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                    }
                    Spacer()

                    if appState.isProActivated {
                        HStack(spacing: 8) {
                            Slider(
                                value: Binding(
                                    get: { Double(appState.fileShelfSize) },
                                    set: { appState.fileShelfSize = Int($0) }
                                ),
                                in: 3...20,
                                step: 1
                            )
                            .frame(width: 100)

                            Text("\(appState.fileShelfSize)")
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .foregroundStyle(.secondary)
                                .frame(width: 24, alignment: .trailing)
                        }
                    } else {
                        Text("3")
                            .font(.system(size: 12, weight: .semibold, design: .monospaced))
                            .foregroundStyle(.tertiary)
                    }
                }

                RowDivider()

                SettingsRow {
                    RowLabel("Files stored",
                             subtitle: "\(shelfManager.items.filter { !$0.isPinned }.count) unpinned · \(shelfManager.items.filter(\.isPinned).count) pinned")
                    Spacer()
                    Text("\(shelfManager.items.count) / \(shelfManager.effectiveLimit)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                }

                RowDivider()

                SettingsRow {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Clear File Shelf")
                            .font(.system(size: 13, weight: .medium))
                        Text("Remove all unpinned files from the shelf")
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                    }
                    Spacer()

                    Button(role: .destructive) {
                        showClearShelfConfirm = true
                    } label: {
                        Text("Clear")
                            .font(.system(size: 12, weight: .medium))
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .tint(.red)
                    .disabled(shelfManager.items.filter { !$0.isPinned }.isEmpty)
                    .confirmationDialog(
                        "Clear file shelf?",
                        isPresented: $showClearShelfConfirm,
                        titleVisibility: .visible
                    ) {
                        Button("Clear Shelf", role: .destructive) {
                            FileShelfManager.shared.clearShelf()
                        }
                        Button("Cancel", role: .cancel) {}
                    } message: {
                        Text("This will remove all unpinned files. Pinned files are kept.")
                    }
                }
            }

            // ── Danger zone ───────────────────────────────────────────
            SectionHeader("History")
            SettingsCard {
                SettingsRow {
                    VStack(alignment: .leading, spacing: 1) {
                        HStack(spacing: 6) {
                            Text("Clear History")
                                .font(.system(size: 13, weight: .medium))
                            if !appState.isProActivated {
                                ProBadge()
                            }
                        }
                        Text("Remove all unpinned clipboard items")
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                    }
                    Spacer()

                    if appState.isProActivated {
                        Button(role: .destructive) {
                            showClearConfirm = true
                        } label: {
                            Text("Clear")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                        .tint(.red)
                        .confirmationDialog(
                            "Clear clipboard history?",
                            isPresented: $showClearConfirm,
                            titleVisibility: .visible
                        ) {
                            Button("Clear History", role: .destructive) {
                                ClipboardManager.shared.clearHistory()
                            }
                            Button("Cancel", role: .cancel) {}
                        } message: {
                            Text("This will remove all unpinned items. Pinned items are kept.")
                        }
                    } else {
                        Text("Pro only")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
    }

    // MARK: - Shortcut recording

    private func startRecordingShortcut() {
        isRecordingShortcut = true
        shortcutMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [self] event -> NSEvent? in
            if event.keyCode == 53 { // Escape — cancel without saving
                DispatchQueue.main.async { self.stopRecordingShortcut() }
                return nil
            }
            guard let key = KeyboardShortcut.Key(keyCode: Int(event.keyCode)) else {
                NSSound.beep(); return nil
            }
            let mods = KeyboardShortcut.Modifier.from(flags: event.modifierFlags)
            guard !mods.isEmpty else { NSSound.beep(); return nil }
            DispatchQueue.main.async {
                self.appState.clipboardHistoryShortcut = KeyboardShortcut(key: key, modifiers: mods)
                ClipboardShortcut.shared.register()
                self.stopRecordingShortcut()
            }
            return nil
        }
    }

    private func stopRecordingShortcut() {
        isRecordingShortcut = false
        if let m = shortcutMonitor { NSEvent.removeMonitor(m); shortcutMonitor = nil }
    }
}

// MARK: - ProBadge

private struct ProBadge: View {
    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: "star.fill").font(.system(size: 6.5, weight: .bold))
            Text("Pro").font(.system(size: 9, weight: .bold))
        }
        .foregroundStyle(Color(hue: 0.130, saturation: 0.88, brightness: 0.95))
        .padding(.horizontal, 6)
        .padding(.vertical, 2.5)
        .background(
            Capsule(style: .continuous)
                .fill(Color(hue: 0.130, saturation: 0.88, brightness: 0.95).opacity(0.15))
        )
    }
}
