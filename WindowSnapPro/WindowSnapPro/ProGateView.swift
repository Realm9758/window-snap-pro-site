import SwiftUI

// MARK: - ProGateView
// Wraps any settings content. If the user is not Pro, the content is blurred
// and a paywall card is shown on top.

struct ProGateView<Content: View>: View {
    @EnvironmentObject private var appState: AppState
    private let content: Content
    private let navigateToLicense: () -> Void

    init(navigateToLicense: @escaping () -> Void, @ViewBuilder content: () -> Content) {
        self.navigateToLicense = navigateToLicense
        self.content            = content()
    }

    var body: some View {
        ZStack {
            content
                .blur(radius: appState.isProActivated ? 0 : 5)
                .saturation(appState.isProActivated ? 1 : 0.4)
                .allowsHitTesting(appState.isProActivated)

            if !appState.isProActivated {
                paywallCard
                    .transition(.opacity.combined(with: .scale(scale: 0.96)))
            }
        }
        .animation(.easeInOut(duration: 0.22), value: appState.isProActivated)
    }

    // MARK: Paywall card

    private var paywallCard: some View {
        VStack(spacing: 20) {
            // Icon
            ZStack {
                Circle()
                    .fill(Color.accentColor.opacity(0.14))
                    .frame(width: 56, height: 56)
                Image(systemName: "lock.fill")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(Color.accentColor)
            }

            VStack(spacing: 6) {
                Text("Pro Required")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.primary)
                Text("This feature is available with a\nWindow Snap Pro subscription.")
                    .font(.system(size: 12.5))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)
            }

            VStack(spacing: 8) {
                Button(action: navigateToLicense) {
                    Label("Activate License", systemImage: "key.horizontal")
                        .fontWeight(.semibold)
                        .frame(minWidth: 160)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.regular)

                Link("Get Pro — £4.99/month",
                     destination: URL(string: "https://windowsnappro.com/pricing")!)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.accentColor)
            }
        }
        .padding(.horizontal, 36)
        .padding(.vertical, 32)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.primary.opacity(0.08), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.18), radius: 24, x: 0, y: 8)
    }
}
