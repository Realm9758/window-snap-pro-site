import SwiftUI

// MARK: - General Settings

struct GeneralSettingsView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            PageHeader(icon: "gearshape.fill", title: "General",
                       tint: Color(hue: 0.578, saturation: 0.72, brightness: 0.92))

            // General toggles
            SectionHeader("Behaviour")
            SettingsCard {
                SettingsRow {
                    RowLabel("Enable window snapping",
                             subtitle: "Snap windows using keyboard shortcuts")
                    Spacer()
                    Toggle("", isOn: $appState.snappingEnabled)
                        .labelsHidden()
                        .onChange(of: appState.snappingEnabled) { enabled in
                            if enabled {
                                ShortcutManager.shared.registerAll()
                                DragMonitor.shared.start()
                            } else {
                                ShortcutManager.shared.unregisterAll()
                                DragMonitor.shared.stop()
                            }
                        }
                }
                RowDivider()
                SettingsRow {
                    RowLabel("Launch at login",
                             subtitle: "Start Window Snap Pro when you log in")
                    Spacer()
                    Toggle("", isOn: $appState.launchAtLogin)
                        .labelsHidden()
                }
                RowDivider()
                SettingsRow {
                    RowLabel("Show snap preview overlay",
                             subtitle: "Preview window position before snapping")
                    Spacer()
                    Toggle("", isOn: $appState.showSnapPreview)
                        .labelsHidden()
                }
            }

            // Accessibility
            SectionHeader("Accessibility")
            SettingsCard {
                SettingsRow {
                    ZStack {
                        Circle()
                            .fill(appState.hasAccessibilityPermission
                                  ? Color.green.opacity(0.15) : Color.orange.opacity(0.15))
                            .frame(width: 36, height: 36)
                        Image(systemName: appState.hasAccessibilityPermission
                              ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                            .foregroundStyle(appState.hasAccessibilityPermission ? .green : .orange)
                            .font(.system(size: 17))
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(appState.hasAccessibilityPermission
                             ? "Accessibility access granted"
                             : "Accessibility access required")
                            .fontWeight(.medium)
                        Text(appState.hasAccessibilityPermission
                             ? "Window Snap Pro can control your windows."
                             : "Grant access in System Settings to move and resize windows.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    if !appState.hasAccessibilityPermission {
                        Button("Open Settings") {
                            appState.requestAccessibilityPermission()
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                    }
                }
            }
        }
        .onAppear { appState.checkAccessibilityPermission() }
    }
}

// MARK: - Shortcuts Settings

struct ShortcutsSettingsView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            PageHeader(icon: "keyboard.fill", title: "Shortcuts",
                       tint: Color(hue: 0.720, saturation: 0.65, brightness: 0.90))

            HStack(alignment: .center) {
                SectionHeader("Keyboard Shortcuts")
                Spacer()
                Button("Reset All") {
                    appState.resetShortcuts()
                    ShortcutManager.shared.registerAll()
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }

            SettingsCard {
                VStack(spacing: 0) {
                    ForEach(Array(SnapPosition.allCases.enumerated()), id: \.element.id) { index, position in
                        ShortcutRow(position: position)
                        if index < SnapPosition.allCases.count - 1 {
                            RowDivider()
                        }
                    }
                }
            }

            Text("Click a shortcut badge to record a new key combination. Press Esc to cancel.")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
    }
}

struct ShortcutRow: View {
    @EnvironmentObject var appState: AppState
    let position: SnapPosition
    @State private var isRecording = false
    @State private var isHovered   = false
    @State private var eventMonitor: Any?

    var currentShortcut: KeyboardShortcut? { appState.shortcuts[position] }

    var body: some View {
        SettingsRow {
            ZStack {
                RoundedRectangle(cornerRadius: 5, style: .continuous)
                    .fill(Color.white.opacity(0.07))
                    .frame(width: 22, height: 22)
                Image(systemName: position.icon)
                    .font(.system(size: 10.5, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            Text(position.rawValue)
                .font(.system(size: 13))
            Spacer()

            ShortcutBadge(shortcut: currentShortcut, isRecording: isRecording)
                .onTapGesture { isRecording ? stopRecording() : startRecording() }
                .help(isRecording ? "Press a key combo — Esc to cancel." : "Click to record a shortcut.")

            if currentShortcut != nil && !isRecording {
                Button {
                    saveShortcut(nil)
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.white.opacity(0.2))
                }
                .buttonStyle(.plain)
                .transition(.opacity.combined(with: .scale(scale: 0.85)))
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 7, style: .continuous)
                .fill(isHovered ? Color.white.opacity(0.04) : Color.clear)
                .padding(.horizontal, -14)
        )
        .onHover { hovered in
            withAnimation(.easeOut(duration: 0.12)) { isHovered = hovered }
        }
        .onDisappear { stopRecording() }
    }

    private func startRecording() {
        isRecording = true
        eventMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [self] event -> NSEvent? in
            if event.keyCode == 53 {
                DispatchQueue.main.async { self.stopRecording() }
                return nil
            }
            guard let key = KeyboardShortcut.Key(keyCode: Int(event.keyCode)) else {
                NSSound.beep(); return nil
            }
            let mods = KeyboardShortcut.Modifier.from(flags: event.modifierFlags)
            guard !mods.isEmpty else { NSSound.beep(); return nil }
            DispatchQueue.main.async {
                self.saveShortcut(KeyboardShortcut(key: key, modifiers: mods))
                self.stopRecording()
            }
            return nil
        }
    }

    private func stopRecording() {
        isRecording = false
        if let m = eventMonitor { NSEvent.removeMonitor(m); eventMonitor = nil }
    }

    private func saveShortcut(_ shortcut: KeyboardShortcut?) {
        var current = appState.shortcuts
        if let s = shortcut { current[position] = s } else { current.removeValue(forKey: position) }
        appState.shortcuts = current
        ShortcutManager.shared.registerAll()
    }
}

// MARK: - Layouts Settings

struct LayoutsSettingsView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            PageHeader(icon: "rectangle.3.group.fill", title: "Layouts",
                       tint: Color(hue: 0.500, saturation: 0.68, brightness: 0.82))

            SectionHeader("Snap Positions")
            SettingsCard {
                VStack(spacing: 0) {
                    ForEach(Array(SnapPosition.allCases.enumerated()), id: \.element.id) { index, position in
                        LayoutRow(position: position)
                        if index < SnapPosition.allCases.count - 1 {
                            RowDivider()
                        }
                    }
                }
            }

            SectionHeader("Animation Speed")
            SettingsCard {
                VStack(alignment: .leading, spacing: 12) {
                    Picker("", selection: Binding(
                        get: { appState.animationSpeed },
                        set: { appState.animationSpeed = $0 }
                    )) {
                        ForEach(AnimationSpeed.allCases, id: \.self) { speed in
                            Text(speed.rawValue).tag(speed)
                        }
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                    .padding(.vertical, 10)
                }
            }
        }
    }
}

private struct LayoutRow: View {
    @EnvironmentObject var appState: AppState
    let position: SnapPosition
    @State private var isHovered = false

    var body: some View {
        SettingsRow {
            ZStack {
                RoundedRectangle(cornerRadius: 5, style: .continuous)
                    .fill(Color.white.opacity(0.07))
                    .frame(width: 22, height: 22)
                Image(systemName: position.icon)
                    .font(.system(size: 10.5, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            Text(position.rawValue)
                .font(.system(size: 13))
            Spacer()
            Toggle("", isOn: Binding(
                get: { appState.enabledPositions.contains(position) },
                set: { enabled in
                    var positions = appState.enabledPositions
                    if enabled { positions.insert(position) }
                    else       { positions.remove(position) }
                    appState.enabledPositions = positions
                }
            ))
            .labelsHidden()
        }
        .background(
            RoundedRectangle(cornerRadius: 7, style: .continuous)
                .fill(isHovered ? Color.white.opacity(0.04) : Color.clear)
                .padding(.horizontal, -14)
        )
        .onHover { hovered in
            withAnimation(.easeOut(duration: 0.12)) { isHovered = hovered }
        }
    }
}

// MARK: - Appearance Settings

struct AppearanceSettingsView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            PageHeader(icon: "paintbrush.fill", title: "Appearance",
                       tint: Color(hue: 0.070, saturation: 0.82, brightness: 0.95))

            SectionHeader("Preview Overlay")
            SettingsCard {
                VStack(alignment: .leading, spacing: 0) {
                    SettingsRow {
                        RowLabel("Opacity", subtitle: "Overlay transparency when previewing")
                        Spacer()
                        Text("\(Int(appState.previewOpacity * 100))%")
                            .font(.system(size: 12, weight: .medium, design: .monospaced))
                            .foregroundStyle(.secondary)
                            .frame(width: 36, alignment: .trailing)
                    }
                    Slider(value: $appState.previewOpacity, in: 0.1...0.7, step: 0.05)
                        .padding(.bottom, 12)
                        .padding(.top, -4)
                }
                RowDivider()
                SettingsRow {
                    RowLabel("Rounded corners", subtitle: "Apply rounded corners to the preview")
                    Spacer()
                    Toggle("", isOn: $appState.useRoundedCorners)
                        .labelsHidden()
                }
            }

            SectionHeader("Preview")
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color.white.opacity(0.04))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .strokeBorder(Color.white.opacity(0.07), lineWidth: 0.5)
                    )
                    .frame(height: 120)
                RoundedRectangle(cornerRadius: appState.useRoundedCorners ? 10 : 2, style: .continuous)
                    .fill(.white.opacity(appState.previewOpacity))
                    .frame(width: 190, height: 88)
                    .overlay(
                        RoundedRectangle(cornerRadius: appState.useRoundedCorners ? 10 : 2, style: .continuous)
                            .strokeBorder(.white.opacity(0.45), lineWidth: 1.5)
                    )
                    .animation(.spring(response: 0.3, dampingFraction: 0.75), value: appState.useRoundedCorners)
                    .animation(.easeOut(duration: 0.15), value: appState.previewOpacity)
            }
        }
    }
}

// MARK: - Reusable Components

// MARK: PageHeader

struct PageHeader: View {
    let icon: String
    let title: String
    let tint: Color

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .fill(tint.opacity(0.18))
                    .frame(width: 34, height: 34)
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(tint)
            }
            Text(title)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(.primary)
        }
        .padding(.bottom, 2)
    }
}

// MARK: RowLabel

struct RowLabel: View {
    let title: String
    let subtitle: String?

    init(_ title: String, subtitle: String? = nil) {
        self.title    = title
        self.subtitle = subtitle
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(title)
                .font(.system(size: 13, weight: .medium))
            if let sub = subtitle {
                Text(sub)
                    .font(.system(size: 11))
                    .foregroundStyle(.tertiary)
            }
        }
    }
}

// MARK: SectionHeader

struct SectionHeader: View {
    let title: String
    init(_ title: String) { self.title = title }
    var body: some View {
        Text(title)
            .font(.system(size: 10, weight: .semibold))
            .foregroundStyle(.tertiary)
            .textCase(.uppercase)
            .kerning(0.5)
    }
}

// MARK: SettingsCard

struct SettingsCard<Content: View>: View {
    @ViewBuilder let content: Content
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            content
        }
        .padding(.horizontal, 14)
        .background(Color.white.opacity(0.045))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color.white.opacity(0.08), lineWidth: 0.5)
        )
    }
}

// MARK: SettingsRow

struct SettingsRow<Content: View>: View {
    @ViewBuilder let content: Content
    var body: some View {
        HStack(spacing: 10) {
            content
        }
        .padding(.vertical, 11)
    }
}

// MARK: RowDivider

struct RowDivider: View {
    var body: some View {
        Rectangle()
            .fill(Color.white.opacity(0.06))
            .frame(height: 0.5)
    }
}

// MARK: ShortcutBadge

struct ShortcutBadge: View {
    let shortcut: KeyboardShortcut?
    let isRecording: Bool

    var body: some View {
        HStack(spacing: 5) {
            if isRecording {
                Circle()
                    .fill(Color.red)
                    .frame(width: 5, height: 5)
                    .transition(.scale.combined(with: .opacity))
            }
            Text(isRecording ? "Recording…" : (shortcut?.displayString ?? "—"))
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundStyle(isRecording ? Color.red.opacity(0.9) : Color.primary.opacity(0.7))
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .background(
            Capsule(style: .continuous)
                .fill(isRecording
                      ? Color.red.opacity(0.10)
                      : Color.white.opacity(0.08))
        )
        .overlay(
            Capsule(style: .continuous)
                .strokeBorder(
                    isRecording ? Color.red.opacity(0.40) : Color.white.opacity(0.12),
                    lineWidth: 0.5
                )
        )
        .animation(.spring(response: 0.22, dampingFraction: 0.7), value: isRecording)
    }
}
