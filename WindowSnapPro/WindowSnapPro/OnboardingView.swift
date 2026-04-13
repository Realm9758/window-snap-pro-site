import SwiftUI

// MARK: - OnboardingView

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var permissionCheckFailed = false

    var body: some View {
        VStack(spacing: 0) {

            // Icon + Title
            VStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(Color.accentColor)
                        .frame(width: 72, height: 72)
                    Image(systemName: "rectangle.3.group")
                        .font(.system(size: 32, weight: .medium))
                        .foregroundStyle(.white)
                }

                Text("Window Snap Pro")
                    .font(.system(size: 22, weight: .semibold))

                Text("Snap windows instantly by dragging to screen edges\nor using keyboard shortcuts.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)
            }
            .padding(.top, 40)
            .padding(.horizontal, 32)

            Spacer(minLength: 28)

            // Steps
            VStack(spacing: 0) {
                StepRow(number: "1", icon: "lock.open",
                        title: "Grant Accessibility Access",
                        description: "Required to move and resize windows on your behalf.")

                Rectangle().fill(Color(nsColor: .separatorColor)).frame(height: 1).padding(.leading, 50)

                StepRow(number: "2", icon: "rectangle.lefthalf.filled",
                        title: "Drag to Snap",
                        description: "Drag any window to a screen edge or corner — a blue overlay shows the snap zone. Release to place it.")

                Rectangle().fill(Color(nsColor: .separatorColor)).frame(height: 1).padding(.leading, 50)

                StepRow(number: "3", icon: "keyboard",
                        title: "Keyboard Shortcuts",
                        description: "Press ⌃⌥ + arrow keys to snap the frontmost window from anywhere.")
            }
            .background(Color(nsColor: .controlBackgroundColor))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(Color(nsColor: .separatorColor), lineWidth: 1)
            )
            .padding(.horizontal, 28)

            Spacer(minLength: 28)

            // Permission CTA
            VStack(spacing: 12) {
                if appState.hasAccessibilityPermission {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text("Accessibility access granted")
                            .fontWeight(.medium)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .background(Color.green.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .strokeBorder(Color.green.opacity(0.2), lineWidth: 1)
                    )

                    Button("Get Started") {
                        NSApp.keyWindow?.close()
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .frame(maxWidth: .infinity)

                } else {
                    Button("Open System Settings") {
                        appState.requestAccessibilityPermission()
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .frame(maxWidth: .infinity)

                    Button("I've Already Granted Access") {
                        AppState.shared.checkAccessibilityPermission()
                        if !AppState.shared.hasAccessibilityPermission {
                            permissionCheckFailed = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                permissionCheckFailed = false
                            }
                        }
                    }
                    .buttonStyle(.bordered)
                    .font(.callout)

                    if permissionCheckFailed {
                        Text("Not detected. In System Settings → Privacy & Security → Accessibility, remove WindowSnapPro and re-add it with the + button.")
                            .font(.caption)
                            .foregroundStyle(.orange)
                            .multilineTextAlignment(.center)
                    } else {
                        Text("System Settings → Privacy & Security → Accessibility")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal, 28)
            .padding(.bottom, 36)
        }
        .frame(width: 420)
        .background(Color(nsColor: .windowBackgroundColor))
        .preferredColorScheme(.dark)
    }
}

// MARK: - Step Row

private struct StepRow: View {
    let number: String
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color.accentColor.opacity(0.10))
                    .frame(width: 34, height: 34)
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.accentColor)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).fontWeight(.semibold)
                Text(description)
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .lineSpacing(1.5)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
}

// MARK: - Primary Button Style

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.body, weight: .semibold))
            .padding(.vertical, 10)
            .padding(.horizontal, 24)
            .foregroundStyle(.white)
            .background(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color.accentColor.opacity(configuration.isPressed ? 0.8 : 1.0))
            )
    }
}
