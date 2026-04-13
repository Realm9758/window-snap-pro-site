import Cocoa
import SwiftUI
import UniformTypeIdentifiers

// MARK: - Notification Names

private extension Notification.Name {
    static let cbNavigateDown  = Notification.Name("wsp.cb.down")
    static let cbNavigateUp    = Notification.Name("wsp.cb.up")
    static let cbSelectCurrent = Notification.Name("wsp.cb.select")
}

// MARK: - ClipboardPanel

private final class ClipboardPanel: NSPanel {
    override var canBecomeKey:  Bool { true  }
    override var canBecomeMain: Bool { false }

    override func keyDown(with event: NSEvent) {
        switch event.keyCode {
        case 53:       ClipboardPopupController.shared.hide()
        case 125:      NotificationCenter.default.post(name: .cbNavigateDown, object: nil)
        case 126:      NotificationCenter.default.post(name: .cbNavigateUp, object: nil)
        case 36, 76:   NotificationCenter.default.post(name: .cbSelectCurrent, object: nil)
        default:       super.keyDown(with: event)
        }
    }
}

// MARK: - ClipboardPopupController

final class ClipboardPopupController {
    static let shared = ClipboardPopupController()

    private var panel:         ClipboardPanel?
    private var globalMonitor: Any?
    private var keyMonitor:    Any?

    private let popupWidth:      CGFloat = 320
    private let collapsedHeight: CGFloat = 282
    private let expandedHeight:  CGFloat = 460
    private let shelfTabHeight:  CGFloat = 320

    private init() {}

    // MARK: - Public

    func show() {
        buildPanelIfNeeded()
        guard let panel = panel else { return }

        attachContent()
        positionAtCursor(panel: panel, height: collapsedHeight)

        var startFrame = panel.frame
        startFrame.origin.y -= 8
        panel.setFrame(startFrame, display: false)
        panel.alphaValue = 0
        panel.orderFront(nil)
        panel.makeKey()

        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.18
            ctx.timingFunction = CAMediaTimingFunction(name: .easeOut)
            panel.animator().alphaValue = 1
            var end = startFrame; end.origin.y += 8
            panel.animator().setFrame(end, display: true)
        }

        globalMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: [.leftMouseUp, .rightMouseDown]
        ) { [weak self] _ in self?.hide() }

        keyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard let self, let p = self.panel, p.isKeyWindow else { return event }
            switch event.keyCode {
            case 53:       self.hide();                                                           return nil
            case 125:      NotificationCenter.default.post(name: .cbNavigateDown,  object: nil); return nil
            case 126:      NotificationCenter.default.post(name: .cbNavigateUp,    object: nil); return nil
            case 36, 76:   NotificationCenter.default.post(name: .cbSelectCurrent, object: nil); return nil
            default:       return event
            }
        }
    }

    func hide() {
        guard let panel = panel, panel.isVisible else { return }
        if let m = globalMonitor { NSEvent.removeMonitor(m); globalMonitor = nil }
        if let m = keyMonitor    { NSEvent.removeMonitor(m); keyMonitor    = nil }

        NSAnimationContext.runAnimationGroup({ ctx in
            ctx.duration = 0.12
            ctx.timingFunction = CAMediaTimingFunction(name: .easeIn)
            panel.animator().alphaValue = 0
        }, completionHandler: {
            panel.orderOut(nil)
        })
    }

    func toggle() {
        if let p = panel, p.isVisible { hide() } else { show() }
    }

    /// Resize panel when the clipboard expand/collapse toggle is tapped.
    func setExpanded(_ expanded: Bool) {
        guard let panel = panel else { return }
        let targetH = expanded ? expandedHeight : collapsedHeight
        animatePanel(panel, toHeight: targetH)
    }

    /// Resize panel when switching between Clipboard / File Shelf tabs.
    func setFileShelfTab(_ active: Bool) {
        guard let panel = panel else { return }
        let targetH = active ? shelfTabHeight : collapsedHeight
        animatePanel(panel, toHeight: targetH)
    }

    // MARK: - Private

    private func animatePanel(_ panel: NSPanel, toHeight targetH: CGFloat) {
        var frame = panel.frame
        let topY  = frame.maxY
        frame.size.height = targetH
        frame.origin.y    = topY - targetH

        if let screen = screenContaining(panel: panel) {
            let sf = screen.visibleFrame
            frame.origin.y = max(sf.minY + 8, frame.origin.y)
        }

        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.24
            ctx.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            panel.animator().setFrame(frame, display: true)
        }
    }

    private func buildPanelIfNeeded() {
        guard panel == nil else { return }
        let p = ClipboardPanel(
            contentRect: NSRect(x: 0, y: 0, width: popupWidth, height: collapsedHeight),
            styleMask:   [.borderless, .nonactivatingPanel],
            backing:     .buffered,
            defer:       false
        )
        p.isFloatingPanel      = true
        p.level                = .popUpMenu
        p.isOpaque             = false
        p.backgroundColor      = .clear
        p.hasShadow            = true
        p.isMovable            = false
        p.hidesOnDeactivate    = false
        p.isReleasedWhenClosed = false
        p.collectionBehavior   = [.canJoinAllSpaces, .fullScreenAuxiliary]
        p.appearance           = NSAppearance(named: .darkAqua)
        panel = p
    }

    private func attachContent() {
        guard let panel = panel else { return }
        let content = ClipboardPopupView(
            onExpandToggle:   { [weak self] expanded in self?.setExpanded(expanded) },
            onTabChange:      { [weak self] isShelf  in self?.setFileShelfTab(isShelf) }
        )
        .environmentObject(ClipboardManager.shared)
        .environmentObject(AppState.shared)
        .environmentObject(FileShelfManager.shared)

        let hosting = NSHostingView(rootView: content)
        hosting.translatesAutoresizingMaskIntoConstraints = false
        panel.contentView = hosting
    }

    private func positionAtCursor(panel: NSPanel, height: CGFloat) {
        let mouse = NSEvent.mouseLocation
        var x = mouse.x - popupWidth / 2
        var y = mouse.y + 14

        let screen: NSScreen = NSScreen.screens.first(where: {
            NSMouseInRect(mouse, $0.frame, false)
        }) ?? NSScreen.main ?? NSScreen.screens[0]

        let sf = screen.visibleFrame
        x = max(sf.minX + 8, min(x, sf.maxX - popupWidth - 8))
        if y + height > sf.maxY - 8 { y = mouse.y - height - 14 }
        y = max(sf.minY + 8, y)

        panel.setFrame(NSRect(x: x, y: y, width: popupWidth, height: height), display: false)
    }

    private func screenContaining(panel: NSPanel) -> NSScreen? {
        NSScreen.screens.first(where: {
            NSMouseInRect(NSEvent.mouseLocation, $0.frame, false)
        }) ?? NSScreen.main
    }
}

// MARK: - VisualEffectBlur

struct VisualEffectBlur: NSViewRepresentable {
    func makeNSView(context: Context) -> NSVisualEffectView {
        let v = NSVisualEffectView()
        v.material     = .hudWindow
        v.blendingMode = .behindWindow
        v.state        = .active
        return v
    }
    func updateNSView(_ v: NSVisualEffectView, context: Context) {}
}

// MARK: - ClipboardTab

private enum ClipboardTab {
    case clipboard, fileShelf
}

// MARK: - ClipboardFilter

private enum ClipboardFilter: CaseIterable {
    case all, text, links, images

    var label: String {
        switch self {
        case .all:    return "All"
        case .text:   return "Text"
        case .links:  return "Links"
        case .images: return "Images"
        }
    }

    var icon: String {
        switch self {
        case .all:    return "tray"
        case .text:   return "doc.text"
        case .links:  return "link"
        case .images: return "photo"
        }
    }
}

// MARK: - ClipboardPopupView

struct ClipboardPopupView: View {
    @EnvironmentObject var manager:      ClipboardManager
    @EnvironmentObject var appState:     AppState
    @EnvironmentObject var shelfManager: FileShelfManager

    let onExpandToggle: (Bool) -> Void
    let onTabChange:    (Bool) -> Void   // true = file shelf tab active

    @State private var activeTab:    ClipboardTab    = .clipboard
    @State private var activeFilter: ClipboardFilter = .all
    @State private var isExpanded    = false
    @State private var selectedIndex = 0
    @State private var searchText    = ""
    @State private var copiedId:     UUID? = nil
    @State private var scrollProxy:  ScrollViewProxy? = nil
    @State private var isDroppingFiles  = false
    @State private var newlyAddedFileId: UUID? = nil
    @FocusState private var searchFocused: Bool

    // MARK: - Filtered items

    private var filteredItems: [ClipboardItem] {
        var result = manager.items

        // Search (text/link only — images can't be text-searched)
        if !searchText.isEmpty {
            result = result.filter { item in
                item.kind != .image
                    && item.text.localizedCaseInsensitiveContains(searchText)
            }
        }

        // Kind filter
        switch activeFilter {
        case .all:    break
        case .text:   result = result.filter { $0.kind == .text   }
        case .links:  result = result.filter { $0.kind == .link   }
        case .images: result = result.filter { $0.kind == .image  }
        }

        return result
    }

    // MARK: - Body

    var body: some View {
        VStack(spacing: 0) {
            headerBar
            Divider().opacity(0.15)

            if activeTab == .clipboard {
                searchBar
                filterBar
                Divider().opacity(0.15)
                clipboardItemsArea
                Divider().opacity(0.15)
                footerBar
            } else {
                fileShelfTabContent
            }
        }
        .background(popupBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(
                    isDroppingFiles
                        ? Color.accentColor.opacity(0.55)
                        : Color.white.opacity(0.09),
                    lineWidth: isDroppingFiles ? 1.5 : 1
                )
                .animation(.easeOut(duration: 0.14), value: isDroppingFiles)
        )
        .onAppear { resetState() }
        .onReceive(NotificationCenter.default.publisher(for: .cbNavigateDown)) { _ in
            guard activeTab == .clipboard,
                  selectedIndex < filteredItems.count - 1 else { return }
            selectedIndex += 1
            scrollProxy?.scrollTo(selectedIndex, anchor: .center)
        }
        .onReceive(NotificationCenter.default.publisher(for: .cbNavigateUp)) { _ in
            guard activeTab == .clipboard, selectedIndex > 0 else { return }
            selectedIndex -= 1
            scrollProxy?.scrollTo(selectedIndex, anchor: .center)
        }
        .onReceive(NotificationCenter.default.publisher(for: .cbSelectCurrent)) { _ in
            guard activeTab == .clipboard else { return }
            if let item = filteredItems[safe: selectedIndex] { paste(item) }
        }
        .onChange(of: searchText)    { _ in selectedIndex = 0 }
        .onChange(of: activeFilter)  { _ in selectedIndex = 0 }
        .onDrop(of: [UTType.fileURL], isTargeted: $isDroppingFiles) { providers in
            handleFileDrop(providers: providers)
            return true
        }
    }

    // MARK: - Header

    private var headerBar: some View {
        HStack(spacing: 8) {
            // Tab switcher
            HStack(spacing: 1) {
                tabPill(.clipboard, icon: "clipboard",  label: "Clipboard")
                tabPill(.fileShelf, icon: "tray.full",  label: "File Shelf")
            }
            .padding(2)
            .background(Color.white.opacity(0.06),
                        in: RoundedRectangle(cornerRadius: 7, style: .continuous))

            Spacer()

            // Total count badge
            let totalCount = manager.items.count + shelfManager.items.count
            if totalCount > 0 {
                Text("\(totalCount)")
                    .font(.system(size: 9, weight: .semibold, design: .monospaced))
                    .foregroundStyle(.quaternary)
                    .padding(.horizontal, 5)
                    .padding(.vertical, 2)
                    .background(Color.white.opacity(0.07), in: Capsule())
            }

            Button { ClipboardManager.shared.hidePopup() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.tertiary)
                    .frame(width: 18, height: 18)
                    .background(Color.white.opacity(0.07), in: Circle())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private func tabPill(_ tab: ClipboardTab, icon: String, label: String) -> some View {
        Button {
            guard activeTab != tab else { return }
            withAnimation(.easeInOut(duration: 0.15)) { activeTab = tab }
            onTabChange(tab == .fileShelf)
        } label: {
            HStack(spacing: 3) {
                Image(systemName: icon)
                    .font(.system(size: 9, weight: .medium))
                Text(label)
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundStyle(activeTab == tab ? .primary : .tertiary)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                activeTab == tab
                    ? Color.white.opacity(0.13)
                    : Color.clear,
                in: RoundedRectangle(cornerRadius: 5, style: .continuous)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack(spacing: 7) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 11))
                .foregroundStyle(.tertiary)

            TextField("Search…", text: $searchText)
                .textFieldStyle(.plain)
                .font(.system(size: 12))
                .foregroundStyle(.primary)
                .focused($searchFocused)

            if !searchText.isEmpty {
                Button { searchText = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(.tertiary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(
            RoundedRectangle(cornerRadius: 7, style: .continuous)
                .fill(Color.white.opacity(0.05))
        )
        .padding(.horizontal, 8)
        .padding(.top, 7)
        .padding(.bottom, 2)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                searchFocused = true
            }
        }
    }

    // MARK: - Filter chips

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 5) {
                ForEach(ClipboardFilter.allCases, id: \.label) { filter in
                    filterChip(filter)
                }
            }
            .padding(.horizontal, 8)
        }
        .padding(.vertical, 5)
    }

    private func filterChip(_ filter: ClipboardFilter) -> some View {
        Button {
            withAnimation(.easeInOut(duration: 0.12)) { activeFilter = filter }
        } label: {
            HStack(spacing: 3) {
                Image(systemName: filter.icon)
                    .font(.system(size: 9))
                Text(filter.label)
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundStyle(activeFilter == filter ? .primary : .tertiary)
            .padding(.horizontal, 7)
            .padding(.vertical, 3.5)
            .background(
                activeFilter == filter
                    ? Color.accentColor.opacity(0.25)
                    : Color.white.opacity(0.07),
                in: Capsule()
            )
        }
        .buttonStyle(.plain)
        .animation(.easeInOut(duration: 0.12), value: activeFilter == filter)
    }

    // MARK: - Clipboard items area

    @ViewBuilder
    private var clipboardItemsArea: some View {
        ScrollViewReader { proxy in
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 2) {
                    if filteredItems.isEmpty {
                        if appState.fileShelfEnabled && !shelfManager.items.isEmpty {
                            emptyClipboardInline
                        } else {
                            emptyState
                        }
                    } else {
                        ForEach(Array(filteredItems.enumerated()), id: \.element.id) { idx, item in
                            ClipboardItemRowView(
                                item:       item,
                                isSelected: idx == selectedIndex,
                                isCopied:   copiedId == item.id,
                                onPaste:    { paste(item) }
                            )
                            .id(idx)
                            .onHover { hovering in if hovering { selectedIndex = idx } }
                        }
                    }

                    // File shelf section at the bottom of clipboard tab
                    if appState.fileShelfEnabled {
                        fileShelfInlineSection
                    }
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 5)
            }
            .frame(maxHeight: isExpanded ? 268 : 100)
            .onAppear { scrollProxy = proxy }
        }
    }

    // MARK: - Empty states

    private var emptyState: some View {
        VStack(spacing: 7) {
            Image(systemName: "clipboard")
                .font(.system(size: 22, weight: .light))
                .foregroundStyle(.quaternary)
            Text(searchText.isEmpty
                 ? "Nothing copied yet"
                 : "No results for \"\(searchText)\"")
                .font(.system(size: 11))
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
    }

    private var emptyClipboardInline: some View {
        HStack(spacing: 5) {
            Image(systemName: "clipboard")
                .font(.system(size: 10, weight: .light))
                .foregroundStyle(.quaternary)
            Text(searchText.isEmpty ? "Nothing copied yet" : "No results for \"\(searchText)\"")
                .font(.system(size: 10))
                .foregroundStyle(.quaternary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - File shelf inline section (bottom of clipboard tab)

    private var fileShelfInlineSection: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 5) {
                Image(systemName: "tray.full")
                    .font(.system(size: 8.5, weight: .semibold))
                    .foregroundStyle(.quaternary)
                Text("File Shelf")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.quaternary)
                    .textCase(.uppercase)
                    .kerning(0.5)
                if !shelfManager.items.isEmpty {
                    Text("· \(shelfManager.items.count)")
                        .font(.system(size: 9, weight: .semibold, design: .monospaced))
                        .foregroundStyle(.quaternary)
                }
                Spacer()
                if isDroppingFiles {
                    HStack(spacing: 3) {
                        Image(systemName: "plus.circle.fill").font(.system(size: 9))
                        Text("Drop to add").font(.system(size: 9, weight: .medium))
                    }
                    .foregroundStyle(Color.accentColor.opacity(0.85))
                    .transition(.opacity.combined(with: .scale(scale: 0.9)))
                }
            }
            .padding(.horizontal, 9)
            .padding(.top, 10)
            .padding(.bottom, 3)

            ForEach(shelfManager.items) { item in
                FileShelfItemRowView(
                    item:     item,
                    isNew:    newlyAddedFileId == item.id,
                    onPaste:  { FileShelfManager.shared.pasteFile(item) },
                    onOpen:   { FileShelfManager.shared.openFile(item) },
                    onReveal: { FileShelfManager.shared.revealInFinder(item) },
                    onRemove: { FileShelfManager.shared.removeItem(item) }
                )
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            if shelfManager.items.isEmpty && !isDroppingFiles {
                HStack(spacing: 5) {
                    Image(systemName: "tray")
                        .font(.system(size: 11, weight: .light))
                        .foregroundStyle(.quaternary)
                    Text("Drag files here")
                        .font(.system(size: 10))
                        .foregroundStyle(.quaternary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
            }
        }
        .animation(.spring(response: 0.28, dampingFraction: 0.82), value: shelfManager.items.count)
        .animation(.easeOut(duration: 0.14), value: isDroppingFiles)
    }

    // MARK: - File Shelf tab full view

    private var fileShelfTabContent: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 2) {
                if shelfManager.items.isEmpty {
                    VStack(spacing: 10) {
                        Image(systemName: isDroppingFiles ? "tray.and.arrow.down.fill" : "tray")
                            .font(.system(size: 26, weight: .light))
                            .foregroundStyle(isDroppingFiles ? AnyShapeStyle(Color.accentColor) : AnyShapeStyle(.quaternary))
                        Text(isDroppingFiles ? "Drop to add" : "Drag files here to save them")
                            .font(.system(size: 11))
                            .foregroundStyle(isDroppingFiles
                                             ? AnyShapeStyle(Color.accentColor.opacity(0.8)) : AnyShapeStyle(.tertiary))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 36)
                    .animation(.easeOut(duration: 0.14), value: isDroppingFiles)
                } else {
                    ForEach(shelfManager.items) { item in
                        FileShelfItemRowView(
                            item:     item,
                            isNew:    newlyAddedFileId == item.id,
                            onPaste:  { FileShelfManager.shared.pasteFile(item) },
                            onOpen:   { FileShelfManager.shared.openFile(item) },
                            onReveal: { FileShelfManager.shared.revealInFinder(item) },
                            onRemove: { FileShelfManager.shared.removeItem(item) }
                        )
                        .transition(.opacity.combined(with: .move(edge: .top)))
                    }

                    if isDroppingFiles {
                        HStack(spacing: 4) {
                            Image(systemName: "plus.circle.fill").font(.system(size: 10))
                            Text("Drop to add").font(.system(size: 10, weight: .medium))
                        }
                        .foregroundStyle(Color.accentColor.opacity(0.85))
                        .padding(.vertical, 6)
                        .transition(.opacity.combined(with: .scale(scale: 0.9)))
                    }
                }
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 6)
        }
        .frame(maxHeight: 268)
        .animation(.spring(response: 0.28, dampingFraction: 0.82), value: shelfManager.items.count)
        .animation(.easeOut(duration: 0.14), value: isDroppingFiles)
    }

    // MARK: - Footer (clipboard tab only)

    private var footerBar: some View {
        HStack(spacing: 0) {
            Button {
                withAnimation(.spring(response: 0.28, dampingFraction: 0.82)) {
                    isExpanded.toggle()
                }
                onExpandToggle(isExpanded)
            } label: {
                HStack(spacing: 3) {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 9, weight: .semibold))
                    Text(isExpanded ? "Less" : "More")
                        .font(.system(size: 10, weight: .medium))
                }
                .foregroundStyle(.tertiary)
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(Color.white.opacity(0.07), in: Capsule())
            }
            .buttonStyle(.plain)

            Spacer()

            HStack(spacing: 4) {
                Text("↑↓")
                Text("·").foregroundStyle(.quaternary).opacity(0.5)
                Text("↵")
                Text("·").foregroundStyle(.quaternary).opacity(0.5)
                Text("⎋")
            }
            .font(.system(size: 9, weight: .medium))
            .foregroundStyle(.quaternary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
    }

    // MARK: - Background

    private var popupBackground: some View {
        ZStack {
            VisualEffectBlur()
            Color.black.opacity(0.52)
        }
    }

    // MARK: - Actions

    private func paste(_ item: ClipboardItem) {
        guard copiedId == nil else { return }
        withAnimation(.spring(response: 0.22, dampingFraction: 0.7)) {
            copiedId = item.id
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            manager.paste(item)
        }
    }

    private func handleFileDrop(providers: [NSItemProvider]) {
        for provider in providers {
            provider.loadDataRepresentation(forTypeIdentifier: UTType.fileURL.identifier) { data, _ in
                guard let data,
                      let url = URL(dataRepresentation: data, relativeTo: nil) else { return }
                DispatchQueue.main.async {
                    withAnimation(.spring(response: 0.28, dampingFraction: 0.82)) {
                        FileShelfManager.shared.addFile(url: url)
                        newlyAddedFileId = FileShelfManager.shared.items.first?.id
                    }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                        withAnimation { newlyAddedFileId = nil }
                    }
                }
            }
        }
    }

    private func resetState() {
        activeTab        = .clipboard
        activeFilter     = .all
        selectedIndex    = 0
        searchText       = ""
        isExpanded       = false
        copiedId         = nil
        newlyAddedFileId = nil
    }
}
