import SwiftUI

// MARK: - SettingsSidebar
// Root view for the Settings window. Custom HStack layout with animated sidebar.

struct SettingsSidebar: View {
    @EnvironmentObject var appState: AppState
    @State private var selection: SidebarItem = .general
    @State private var contentOpacity: Double = 1.0

    // MARK: Sidebar items

    enum SidebarItem: String, CaseIterable, Hashable {
        case general    = "General"
        case shortcuts  = "Shortcuts"
        case layouts    = "Layouts"
        case appearance = "Appearance"
        case clipboard  = "Clipboard"
        case rules      = "App Rules"
        case dragZones  = "Drag Zones"
        case premium    = "Premium"
        case license    = "License"

        var icon: String {
            switch self {
            case .general:    return "gearshape.fill"
            case .shortcuts:  return "keyboard.fill"
            case .layouts:    return "rectangle.3.group.fill"
            case .appearance: return "paintbrush.fill"
            case .clipboard:  return "clipboard.fill"
            case .rules:      return "app.badge.checkmark.fill"
            case .dragZones:  return "hand.draw.fill"
            case .premium:    return "star.fill"
            case .license:    return "key.horizontal.fill"
            }
        }

        var tint: Color {
            switch self {
            case .general:    return Color(hue: 0.578, saturation: 0.72, brightness: 0.92)
            case .shortcuts:  return Color(hue: 0.720, saturation: 0.65, brightness: 0.90)
            case .layouts:    return Color(hue: 0.500, saturation: 0.68, brightness: 0.82)
            case .appearance: return Color(hue: 0.070, saturation: 0.82, brightness: 0.95)
            case .clipboard:  return Color(hue: 0.480, saturation: 0.70, brightness: 0.85)
            case .rules:      return Color(hue: 0.360, saturation: 0.65, brightness: 0.80)
            case .dragZones:  return Color(hue: 0.105, saturation: 0.82, brightness: 0.95)
            case .premium:    return Color(hue: 0.130, saturation: 0.88, brightness: 0.95)
            case .license:    return Color(hue: 0.760, saturation: 0.60, brightness: 0.90)
            }
        }

        var requiresPro: Bool {
            switch self {
            case .rules, .dragZones, .premium: return true
            default: return false
            }
        }
    }

    static let standardItems: [SidebarItem] = [.general, .shortcuts, .layouts, .appearance, .clipboard]
    static let premiumItems:  [SidebarItem] = [.rules, .dragZones, .premium, .license]

    // MARK: Body

    var body: some View {
        HStack(spacing: 0) {
            sidebarPanel
            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(width: 1)
            contentPanel
        }
        .preferredColorScheme(.dark)
        .environmentObject(appState)
        .frame(minWidth: 720, minHeight: 480)
        .background(Color(nsColor: .underPageBackgroundColor).ignoresSafeArea())
    }

    // MARK: Sidebar panel

    private var sidebarPanel: some View {
        VStack(alignment: .leading, spacing: 0) {

            // App header
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(LinearGradient(
                            colors: [Color.accentColor, Color.accentColor.opacity(0.65)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 30, height: 30)
                        .shadow(color: Color.accentColor.opacity(0.35), radius: 6, x: 0, y: 3)
                    Image(systemName: "rectangle.3.group.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 0) {
                    Text("Window Snap Pro")
                        .font(.system(size: 11.5, weight: .semibold))
                        .foregroundStyle(.primary)
                    Text("Settings")
                        .font(.system(size: 10))
                        .foregroundStyle(.quaternary)
                }
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 18)
            .padding(.bottom, 12)

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    sidebarGroup(label: "Settings", items: Self.standardItems)
                    sidebarGroup(label: "Pro", items: Self.premiumItems)
                }
                .padding(.bottom, 12)
            }

            Spacer()
        }
        .frame(width: 188)
        .background(
            VisualEffectView(material: .sidebar, blendingMode: .behindWindow)
                .ignoresSafeArea()
        )
    }

    @ViewBuilder
    private func sidebarGroup(label: String, items: [SidebarItem]) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label)
                .font(.system(size: 9.5, weight: .semibold))
                .foregroundStyle(.quaternary)
                .kerning(0.7)
                .textCase(.uppercase)
                .padding(.horizontal, 18)
                .padding(.top, 14)
                .padding(.bottom, 4)

            ForEach(items, id: \.self) { item in
                SidebarRowView(
                    item: item,
                    isSelected: selection == item,
                    isLocked: item.requiresPro && !appState.isProActivated,
                    onTap: { navigate(to: item) }
                )
            }
        }
    }

    // MARK: Content panel

    private var contentPanel: some View {
        ZStack {
            ScrollView {
                detailView
                    .padding(26)
                    .frame(maxWidth: .infinity, alignment: .topLeading)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .opacity(contentOpacity)
    }

    // MARK: Navigation with crossfade

    private func navigate(to item: SidebarItem) {
        guard item != selection else { return }
        withAnimation(.easeOut(duration: 0.10)) { contentOpacity = 0 }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.10) {
            selection = item
            withAnimation(.easeIn(duration: 0.14)) { contentOpacity = 1 }
        }
    }

    // MARK: Detail router

    @ViewBuilder
    private var detailView: some View {
        switch selection {
        case .general:    GeneralSettingsView()
        case .shortcuts:  ShortcutsSettingsView()
        case .layouts:    LayoutsSettingsView()
        case .appearance: AppearanceSettingsView()
        case .clipboard:  ClipboardSettingsView()
        case .rules:
            ProGateView(navigateToLicense: { navigate(to: .license) }) { RulesSettingsView() }
        case .dragZones:
            ProGateView(navigateToLicense: { navigate(to: .license) }) { DragZoneSettingsView() }
        case .premium:
            ProGateView(navigateToLicense: { navigate(to: .license) }) { PremiumSettingsView() }
        case .license:
            ProActivationView()
        }
    }
}

// MARK: - SidebarRowView

private struct SidebarRowView: View {
    let item: SettingsSidebar.SidebarItem
    let isSelected: Bool
    let isLocked: Bool
    let onTap: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 9) {
                // Colored icon pill
                ZStack {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(item.tint.opacity(isSelected ? 0.28 : 0.16))
                        .frame(width: 26, height: 26)
                    Image(systemName: item.icon)
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(item.tint)
                }

                Text(item.rawValue)
                    .font(.system(size: 12.5, weight: isSelected ? .semibold : .regular))
                    .foregroundStyle(isSelected ? Color.primary : Color.secondary)
                    .lineLimit(1)
                    .animation(nil, value: isSelected)

                Spacer(minLength: 4)

                if isLocked {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 8, weight: .semibold))
                        .foregroundStyle(Color.white.opacity(0.2))
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                    .fill(
                        isSelected
                            ? Color.white.opacity(0.10)
                            : (isHovered ? Color.white.opacity(0.055) : Color.clear)
                    )
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 8)
        .onHover { hovered in
            withAnimation(.easeOut(duration: 0.12)) { isHovered = hovered }
        }
        .animation(.spring(response: 0.22, dampingFraction: 0.78), value: isSelected)
    }
}

// MARK: - VisualEffectView

struct VisualEffectView: NSViewRepresentable {
    let material: NSVisualEffectView.Material
    let blendingMode: NSVisualEffectView.BlendingMode

    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = blendingMode
        view.state = .active
        return view
    }

    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
        nsView.blendingMode = blendingMode
    }
}
