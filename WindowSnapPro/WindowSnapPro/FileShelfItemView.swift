import SwiftUI
import AppKit

// MARK: - FileShelfItemRowView
// Individual row in the File Shelf section of the clipboard popup.
// Matches the visual style of ClipboardItemRowView.

struct FileShelfItemRowView: View {
    let item:     FileShelfItem
    let isNew:    Bool          // briefly true after drag-drop to flash the row
    let onPaste:  () -> Void
    let onOpen:   () -> Void
    let onReveal: () -> Void
    let onRemove: () -> Void

    @State private var isHovered = false

    var body: some View {
        HStack(spacing: 8) {
            fileIcon
            fileInfo
            Spacer(minLength: 0)
            trailingAccessory
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 7)
        .background(rowBackground)
        .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
        .contentShape(Rectangle())
        .onTapGesture { onPaste() }
        .onDrag { NSItemProvider(object: item.url as NSURL) }
        .onHover { isHovered = $0 }
        .animation(.easeInOut(duration: 0.10), value: isHovered)
        .animation(.spring(response: 0.22, dampingFraction: 0.72), value: isNew)
        .contextMenu { contextMenuItems }
    }

    // MARK: - File icon (native macOS workspace icon)

    private var fileIcon: some View {
        Group {
            if item.isReachable {
                Image(nsImage: NSWorkspace.shared.icon(forFile: item.url.path))
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            } else {
                Image(systemName: item.sfSymbol)
                    .font(.system(size: 13, weight: .light))
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(width: 20, height: 20)
    }

    // MARK: - Filename + type label

    private var fileInfo: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(item.filename)
                .font(.system(size: 12))
                .foregroundStyle(.primary)
                .lineLimit(1)
                .truncationMode(.middle)

            HStack(spacing: 4) {
                Text(item.fileExtensionLabel)
                    .font(.system(size: 8.5, weight: .semibold))
                    .foregroundStyle(.quaternary)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 1.5)
                    .background(Color.white.opacity(0.09),
                                in: RoundedRectangle(cornerRadius: 3, style: .continuous))

                if isHovered {
                    Text(item.relativeTime)
                        .font(.system(size: 9))
                        .foregroundStyle(.quaternary)
                        .transition(.opacity)
                }
            }
            .animation(.easeOut(duration: 0.10), value: isHovered)
        }
    }

    // MARK: - Trailing remove button (hover only)

    @ViewBuilder
    private var trailingAccessory: some View {
        if isHovered {
            Button {
                withAnimation(.spring(response: 0.22, dampingFraction: 0.75)) {
                    onRemove()
                }
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.white.opacity(0.22))
            }
            .buttonStyle(.plain)
            .transition(.opacity.combined(with: .scale(scale: 0.8)))
        }
    }

    // MARK: - Row background

    @ViewBuilder
    private var rowBackground: some View {
        if isNew {
            RoundedRectangle(cornerRadius: 7, style: .continuous)
                .fill(Color.accentColor.opacity(0.14))
        } else if isHovered {
            RoundedRectangle(cornerRadius: 7, style: .continuous)
                .fill(Color.white.opacity(0.07))
        }
    }

    // MARK: - Context menu

    @ViewBuilder
    private var contextMenuItems: some View {
        Button("Paste File") { onPaste() }
        Button("Open with Default App") { onOpen() }
        Button("Reveal in Finder") { onReveal() }
        Divider()
        Button("Remove from Shelf", role: .destructive) { onRemove() }
    }
}
