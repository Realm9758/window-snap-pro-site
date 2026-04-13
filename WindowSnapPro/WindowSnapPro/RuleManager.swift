import Cocoa
import SwiftUI

class RuleManager: ObservableObject {
    static let shared = RuleManager()

    @Published private(set) var rules: [AppRule] = []

    private var observation: NSObjectProtocol?

    private init() {
        load()
        observe()
    }

    // MARK: - CRUD

    func add(_ rule: AppRule) {
        withAnimation(AnimationManager.listChange) { rules.append(rule) }
        save()
    }

    func delete(_ rule: AppRule) {
        withAnimation(AnimationManager.listChange) { rules.removeAll { $0.id == rule.id } }
        save()
    }

    func update(_ rule: AppRule) {
        guard let i = rules.firstIndex(where: { $0.id == rule.id }) else { return }
        rules[i] = rule
        save()
    }

    // MARK: - App launch observation

    private func observe() {
        observation = NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let app = note.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication,
                  let bid = app.bundleIdentifier else { return }
            self?.applyRule(bundleID: bid)
        }
    }

    func applyRule(bundleID: String) {
        guard AppState.shared.snappingEnabled,
              AppState.shared.hasAccessibilityPermission,
              AppState.shared.rulesEnabled,
              AppState.shared.isProActivated else { return }
        guard let rule = rules.first(where: { $0.bundleIdentifier == bundleID && $0.isEnabled }) else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            WindowManager.shared.snap(to: rule.snapPosition)
        }
    }

    // MARK: - Persistence

    private func save() {
        if let data = try? JSONEncoder().encode(rules) {
            UserDefaults.standard.set(data, forKey: "wsp.appRules")
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: "wsp.appRules"),
              let decoded = try? JSONDecoder().decode([AppRule].self, from: data) else { return }
        rules = decoded
    }
}
