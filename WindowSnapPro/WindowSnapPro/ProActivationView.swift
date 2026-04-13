import SwiftUI

// MARK: - Models

private struct LicenseError: Error {
    let message: String
}

private struct ValidateResponse: Codable {
    let valid: Bool
    let plan: String?
    let status: String?
    let expiresAt: String?
    let maxActivations: Int?
    let activationCount: Int?

    enum CodingKeys: String, CodingKey {
        case valid, plan, status
        case expiresAt        = "expires_at"
        case maxActivations   = "max_activations"
        case activationCount  = "activation_count"
    }
}

// MARK: - ViewModel

@MainActor
final class ProLicenseViewModel: ObservableObject {

    // MARK: Persisted state
    @AppStorage("pro_licenseKey")       var storedLicenseKey: String = ""
    @AppStorage("pro_isActivated")      var isActivated: Bool        = false
    @AppStorage("pro_expiresAt")        var expiresAt: String        = ""
    @AppStorage("pro_activationCount")  var activationCount: Int     = 0
    @AppStorage("pro_maxActivations")   var maxActivations: Int      = 3
    @AppStorage("pro_subscriptionStatus") var subscriptionStatus: String = ""

    // MARK: Transient state
    @Published var licenseInput:  String = ""
    @Published var errorMessage:  String = ""
    @Published var isLoading:     Bool   = false
    @Published var didJustActivate: Bool = false

    private let apiBase = "https://window-snap-pro-site.vercel.app/"

    // Unique device identifier stored in UserDefaults
    var deviceId: String {
        if let stored = UserDefaults.standard.string(forKey: "pro_deviceId") { return stored }
        let id = UUID().uuidString
        UserDefaults.standard.set(id, forKey: "pro_deviceId")
        return id
    }

    var deviceName: String { Host.current().localizedName ?? "Mac" }

    // MARK: Activate

    func activate() {
        let key = normalize(licenseInput)
        guard !key.isEmpty else { errorMessage = "Please enter a license key."; return }
        guard isValidFormat(key) else {
            errorMessage = "Keys look like WSP-XXXX-XXXX-XXXX. Please check yours."
            return
        }

        isLoading    = true
        errorMessage = ""

        Task {
            await validate(key: key, deviceId: deviceId, deviceName: deviceName) { [weak self] result in
                guard let self else { return }
                self.isLoading = false
                switch result {
                case .success(let response):
                    self.storedLicenseKey    = key
                    self.isActivated         = true
                    self.subscriptionStatus  = response.status ?? "active"
                    self.expiresAt           = response.expiresAt ?? ""
                    self.activationCount     = response.activationCount ?? 0
                    self.maxActivations      = response.maxActivations ?? 3
                    self.errorMessage        = ""
                    self.didJustActivate     = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                        self.didJustActivate = false
                    }
                case .failure(let err):
                    self.errorMessage = err.message
                }
            }
        }
    }

    // MARK: Restore (button on the not-activated screen)

    func restore() {
        // Use whatever key is available: typed input first, then a previously stored key.
        let raw = licenseInput.trimmingCharacters(in: .whitespaces).isEmpty
            ? storedLicenseKey
            : licenseInput
        let key = normalize(raw)

        guard !key.isEmpty else {
            errorMessage = "Enter your license key to restore Pro."
            return
        }
        guard isValidFormat(key) else {
            errorMessage = "Keys look like WSP-XXXX-XXXX-XXXX. Please check yours."
            return
        }

        isLoading    = true
        errorMessage = ""

        Task {
            await validate(key: key, deviceId: deviceId, deviceName: deviceName) { [weak self] result in
                guard let self else { return }
                self.isLoading = false
                switch result {
                case .success(let response):
                    self.storedLicenseKey   = key
                    self.isActivated        = true
                    self.subscriptionStatus = response.status ?? "active"
                    self.expiresAt          = response.expiresAt ?? ""
                    self.activationCount    = response.activationCount ?? 0
                    self.maxActivations     = response.maxActivations ?? 3
                    self.errorMessage       = ""
                    self.didJustActivate    = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                        self.didJustActivate = false
                    }
                case .failure(let err):
                    self.errorMessage = err.message
                }
            }
        }
    }

    // MARK: Revalidate (called silently on app launch)

    func revalidate() {
        guard isActivated, !storedLicenseKey.isEmpty else { return }
        Task {
            await validate(key: storedLicenseKey, deviceId: deviceId, deviceName: deviceName) { [weak self] result in
                guard let self else { return }
                if case .failure(let err) = result,
                   err.message.contains("inactive") || err.message.contains("cancelled") || err.message.contains("payment") {
                    self.isActivated = false
                    self.errorMessage = err.message
                }
            }
        }
    }

    // MARK: Deactivate

    func deactivate() {
        storedLicenseKey   = ""
        licenseInput       = ""
        isActivated        = false
        expiresAt          = ""
        activationCount    = 0
        subscriptionStatus = ""
        errorMessage       = ""
    }

    // MARK: Private helpers

    private func validate(
        key: String,
        deviceId: String,
        deviceName: String,
        completion: @escaping (Result<ValidateResponse, LicenseError>) -> Void
    ) async {
        guard let url = URL(string: "\(apiBase)/api/license/validate") else { return }
        var request = URLRequest(url: url)
        request.httpMethod  = "POST"
        request.timeoutInterval = 10
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "license_key": key,
            "device_id":   deviceId,
            "device_name": deviceName,
        ])

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let http = response as? HTTPURLResponse
            let decoded = try? JSONDecoder().decode(ValidateResponse.self, from: data)

            if http?.statusCode == 200, decoded?.valid == true {
                completion(.success(decoded!))
            } else {
                let msg = errorMessage(forStatus: decoded?.status, httpStatus: http?.statusCode)
                completion(.failure(LicenseError(message: msg)))
            }
        } catch {
            completion(.failure(LicenseError(message: "Connection error. Please check your internet connection.")))
        }
    }

    private func normalize(_ raw: String) -> String {
        let stripped = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            .uppercased()
            .replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: "-", with: "")
        guard stripped.hasPrefix("WSP"), stripped.count == 15 else {
            return raw.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        }
        let s = stripped
        let i3  = s.index(s.startIndex, offsetBy: 3)
        let i7  = s.index(s.startIndex, offsetBy: 7)
        let i11 = s.index(s.startIndex, offsetBy: 11)
        return "WSP-\(s[i3..<i7])-\(s[i7..<i11])-\(s[i11...])"
    }

    private func isValidFormat(_ key: String) -> Bool {
        key.range(of: #"^WSP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$"#, options: .regularExpression) != nil
    }

    private func errorMessage(forStatus status: String?, httpStatus: Int?) -> String {
        switch status {
        case "past_due":
            return "Payment failed. Please update your payment method at windowsnappro.com/manage-license."
        case "canceled":
            return "Your subscription has been cancelled. Renew at windowsnappro.com/pricing."
        case "inactive":
            return "Your subscription appears inactive. Please renew at windowsnappro.com/pricing."
        case "max_activations":
            return "This license is already activated on the maximum number of devices."
        case "not_found", "invalid_format":
            return "This license key could not be verified. Please check and try again."
        case "rate_limited":
            return "Too many attempts. Please try again in a minute."
        default:
            if httpStatus == 429 { return "Too many attempts. Please try again shortly." }
            return "This license key could not be verified. Please check and try again."
        }
    }
}

// MARK: - Not Activated View

private struct NotActivatedView: View {
    @ObservedObject var vm: ProLicenseViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {

            // Pro badge header
            SectionHeader("Pro License")
            SettingsCard {
                HStack(spacing: 14) {
                    // Icon
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(LinearGradient(
                                colors: [Color.accentColor, Color.accentColor.opacity(0.6)],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ))
                            .frame(width: 38, height: 38)
                        Image(systemName: "sparkles")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text("Window Snap Pro")
                                .fontWeight(.semibold)
                            Text("PRO")
                                .font(.system(size: 9, weight: .bold))
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(Color.accentColor.opacity(0.15))
                                .foregroundStyle(Color.accentColor)
                                .cornerRadius(4)
                        }
                        Text("Unlock all Pro features")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }
                .padding(.vertical, 6)
            }

            // Pro benefits
            SectionHeader("What's included")
            SettingsCard {
                ForEach(proBenefits.indices, id: \.self) { i in
                    let benefit = proBenefits[i]
                    SettingsRow {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Color.accentColor)
                            .font(.system(size: 13))
                        Text(benefit)
                        Spacer()
                    }
                    if i < proBenefits.count - 1 { RowDivider() }
                }
            }

            // Activation form
            SectionHeader("Activate")
            SettingsCard {
                SettingsRow {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("License Key")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("WSP-XXXX-XXXX-XXXX", text: $vm.licenseInput)
                            .textFieldStyle(.roundedBorder)
                            .font(.system(.body, design: .monospaced))
                            .autocorrectionDisabled()

                        if !vm.errorMessage.isEmpty {
                            HStack(spacing: 5) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .font(.caption)
                                    .foregroundStyle(.red)
                                Text(vm.errorMessage)
                                    .font(.caption)
                                    .foregroundStyle(.red)
                            }
                            .transition(.opacity.combined(with: .move(edge: .top)))
                        }

                        HStack(spacing: 8) {
                            Button(action: vm.activate) {
                                HStack(spacing: 6) {
                                    if vm.isLoading {
                                        ProgressView().scaleEffect(0.7).frame(width: 14, height: 14)
                                    }
                                    Text(vm.isLoading ? "Activating…" : "Activate Pro")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(vm.isLoading || vm.licenseInput.trimmingCharacters(in: .whitespaces).isEmpty)
                            .controlSize(.regular)

                            Button("Restore") { vm.revalidate() }
                                .buttonStyle(.bordered)
                                .controlSize(.regular)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }

            // Buy link
            HStack {
                Spacer()
                Link("Don't have a license? Get Pro →",
                     destination: URL(string: "https://windowsnappro.com/pricing")!)
                    .font(.caption)
                    .foregroundStyle(Color.accentColor)
                Spacer()
            }
        }
    }

    private var proBenefits: [String] {
        [
            "App-specific snap rules",
            "Custom drag zone configuration",
            "Advanced spring animations",
            "Premium settings panel",
            "Up to 3 Mac activations",
            "All future Pro updates",
        ]
    }
}

// MARK: - Activated View

private struct ActivatedView: View {
    @ObservedObject var vm: ProLicenseViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {

            // Status header
            SectionHeader("Pro License")
            SettingsCard {
                SettingsRow {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Color.green.opacity(0.15))
                                .frame(width: 36, height: 36)
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 20))
                                .foregroundStyle(.green)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text("Pro Active")
                                    .fontWeight(.semibold)
                                Text("ACTIVE")
                                    .font(.system(size: 9, weight: .bold))
                                    .padding(.horizontal, 5)
                                    .padding(.vertical, 2)
                                    .background(Color.green.opacity(0.12))
                                    .foregroundStyle(.green)
                                    .cornerRadius(4)
                            }
                            Text("All Pro features are unlocked")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    .padding(.vertical, 4)
                }
            }

            // License details
            SectionHeader("License Details")
            SettingsCard {
                SettingsRow {
                    Text("License Key")
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(maskedKey)
                        .font(.system(.body, design: .monospaced))
                        .foregroundStyle(.primary)
                }
                if !vm.expiresAt.isEmpty {
                    RowDivider()
                    SettingsRow {
                        Text("Renews")
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(formattedExpiry)
                            .foregroundStyle(.primary)
                    }
                }
                RowDivider()
                SettingsRow {
                    Text("Activations")
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(vm.activationCount) of \(vm.maxActivations)")
                        .foregroundStyle(.primary)
                }
            }

            // Actions
            SectionHeader("Manage")
            SettingsCard {
                SettingsRow {
                    Link(destination: URL(string: "https://windowsnappro.com/manage-license")!) {
                        HStack(spacing: 6) {
                            Image(systemName: "creditcard")
                                .font(.system(size: 12))
                            Text("Manage Subscription")
                        }
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(Color.accentColor)
                    Spacer()
                    Image(systemName: "arrow.up.right")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                RowDivider()
                SettingsRow {
                    Button(role: .destructive) { vm.deactivate() } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "trash")
                                .font(.system(size: 12))
                            Text("Deactivate on This Mac")
                        }
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.red.opacity(0.8))
                    Spacer()
                }
            }
        }
    }

    private var maskedKey: String {
        let parts = vm.storedLicenseKey.split(separator: "-")
        guard parts.count == 4 else { return vm.storedLicenseKey }
        return "\(parts[0])-••••-••••-\(parts[3])"
    }

    private var formattedExpiry: String {
        let f = ISO8601DateFormatter()
        guard let date = f.date(from: vm.expiresAt) else { return vm.expiresAt }
        let d = DateFormatter()
        d.dateStyle = .medium
        d.timeStyle = .none
        return d.string(from: date)
    }
}

// MARK: - ProActivationView (root)

struct ProActivationView: View {
    @StateObject private var vm = ProLicenseViewModel()

    var body: some View {
        Group {
            if vm.isActivated {
                ActivatedView(vm: vm)
            } else {
                NotActivatedView(vm: vm)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: vm.isActivated)
        .onAppear {
            if vm.isActivated {
                // Silently revalidate on each Settings open
                vm.revalidate()
            }
        }
    }
}

#Preview {
    ScrollView {
        ProActivationView()
            .padding(24)
    }
    .frame(width: 500)
    .preferredColorScheme(.dark)
}
