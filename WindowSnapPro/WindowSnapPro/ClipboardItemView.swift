import SwiftUI
import AppKit

// MARK: - ClipboardItemRowView

struct ClipboardItemRowView: View {
    let item:       ClipboardItem
    let isSelected: Bool
    let isCopied:   Bool
    let onPaste:    () -> Void

    @State private var isHovered = false

    var body: some View {
        HStack(spacing: 8) {
            leadingContent
            if item.kind != .image { textContent }
            Spacer(minLength: 0)
            trailingAccessory
        }
        .padding(.horizontal, 9)
        .padding(.vertical, item.kind == .image ? 6 : 8)
        .background(rowBackground)
        .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
        .contentShape(Rectangle())
        .onTapGesture { onPaste() }
        .onHover { isHovered = $0 }
        .animation(.easeInOut(duration: 0.1),  value: isHovered)
        .animation(.easeInOut(duration: 0.12), value: isSelected)
        .animation(.spring(response: 0.25, dampingFraction: 0.72), value: isCopied)
    }

    // MARK: - Leading content

    @ViewBuilder
    private var leadingContent: some View {
        if item.kind == .image {
            imageThumbnail
        } else {
            leadingIcon
        }
    }

    private var leadingIcon: some View {
        Group {
            if isCopied {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            } else if item.isPinned {
                Image(systemName: "pin.fill")
                    .foregroundStyle(Color.accentColor)
            } else if item.kind == .link {
                Image(systemName: "link")
                    .foregroundStyle(.tertiary)
            } else {
                Image(systemName: "doc.on.clipboard")
                    .foregroundStyle(.quaternary)
            }
        }
        .font(.system(size: 11))
        .frame(width: 16, height: 16)
        .animation(.spring(response: 0.25, dampingFraction: 0.72), value: isCopied)
    }

    private var imageThumbnail: some View {
        Group {
            if let data = item.imageData, let nsImg = NSImage(data: data) {
                Image(nsImage: nsImg)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 52, height: 36)
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 4, style: .continuous)
                            .strokeBorder(Color.white.opacity(0.1), lineWidth: 0.5)
                    )
            } else {
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .fill(Color.white.opacity(0.06))
                    .frame(width: 52, height: 36)
                    .overlay(
                        Image(systemName: "photo")
                            .font(.system(size: 11))
                            .foregroundStyle(.quaternary)
                    )
            }
        }
    }

    // MARK: - Text content (text/link items only)

    private var textContent: some View {
        Text(item.preview)
            .font(.system(size: 12))
            .foregroundStyle(isCopied ? Color.green.opacity(0.9) : .primary)
            .lineLimit(2)
            .truncationMode(.tail)
            .frame(maxWidth: .infinity, alignment: .leading)
            .animation(.easeInOut(duration: 0.15), value: isCopied)
    }

    // MARK: - Trailing accessory

    @ViewBuilder
    private var trailingAccessory: some View {
        if isCopied {
            Text("Copied")
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(.green.opacity(0.75))
                .transition(.opacity.combined(with: .scale(scale: 0.85, anchor: .trailing)))
        } else if isSelected || isHovered {
            VStack(alignment: .trailing, spacing: 2) {
                Text(item.relativeTime)
                    .font(.system(size: 9))
                    .foregroundStyle(.quaternary)
                if item.kind == .image {
                    Text("Image")
                        .font(.system(size: 8, weight: .medium))
                        .foregroundStyle(.quaternary)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 1.5)
                        .background(Color.white.opacity(0.08),
                                    in: RoundedRectangle(cornerRadius: 3))
                }
            }
            .transition(.opacity)
        }
    }

    // MARK: - Background

    @ViewBuilder
    private var rowBackground: some View {
        if isCopied {
            RoundedRectangle(cornerRadius: 7, style: .continuous)
                .fill(Color.green.opacity(0.11))
        } else if isSelected {
            RoundedRectangle(cornerRadius: 7, style: .continuous)
                .fill(Color.accentColor.opacity(0.18))
        } else if isHovered {
            RoundedRectangle(cornerRadius: 7, style: .continuous)
                .fill(Color.white.opacity(0.07))
        }
    }
}
