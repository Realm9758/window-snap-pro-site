import SwiftUI
import AppKit
import Carbon

// MARK: - KeyRecorderView
// An NSViewRepresentable that captures a single key-down event and converts it
// into a KeyboardShortcut model. Activate by setting isRecording = true.

struct KeyRecorderView: NSViewRepresentable {
    @Binding var shortcut: KeyboardShortcut?
    @Binding var isRecording: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(shortcut: $shortcut, isRecording: $isRecording)
    }

    func makeNSView(context: Context) -> KeyRecorderNSView {
        let view = KeyRecorderNSView()
        view.coordinator = context.coordinator
        return view
    }

    func updateNSView(_ nsView: KeyRecorderNSView, context: Context) {
        nsView.isRecording = isRecording
        if isRecording {
            nsView.window?.makeFirstResponder(nsView)
        }
    }

    // MARK: - Coordinator

    class Coordinator {
        @Binding var shortcut: KeyboardShortcut?
        @Binding var isRecording: Bool

        init(shortcut: Binding<KeyboardShortcut?>, isRecording: Binding<Bool>) {
            _shortcut = shortcut
            _isRecording = isRecording
        }

        func commit(shortcut: KeyboardShortcut) {
            self.shortcut = shortcut
            isRecording = false
        }

        func cancel() {
            isRecording = false
        }
    }
}

// MARK: - KeyRecorderNSView

class KeyRecorderNSView: NSView {
    var coordinator: KeyRecorderView.Coordinator?
    var isRecording = false {
        didSet {
            needsDisplay = true
            if isRecording { window?.makeFirstResponder(self) }
        }
    }

    override var acceptsFirstResponder: Bool { true }
    override var canBecomeKeyView: Bool { true }

    // MARK: Key Handling

    override func keyDown(with event: NSEvent) {
        guard isRecording else { super.keyDown(with: event); return }

        // Escape cancels recording
        if event.keyCode == UInt16(kVK_Escape) {
            coordinator?.cancel()
            return
        }

        // Build the shortcut from the event
        guard let key = KeyboardShortcut.Key(keyCode: Int(event.keyCode)) else {
            // Key not supported — flash and ignore
            NSSound.beep()
            return
        }

        let modifiers = KeyboardShortcut.Modifier.from(flags: event.modifierFlags)

        // Require at least one modifier to avoid swallowing bare keys.
        guard !modifiers.isEmpty else {
            NSSound.beep()
            return
        }

        coordinator?.commit(shortcut: KeyboardShortcut(key: key, modifiers: modifiers))
    }

    // Draw a subtle focus ring when recording
    override func draw(_ dirtyRect: NSRect) {
        if isRecording {
            NSColor.controlAccentColor.withAlphaComponent(0.25).setFill()
            let path = NSBezierPath(roundedRect: bounds.insetBy(dx: 1, dy: 1), xRadius: 6, yRadius: 6)
            path.fill()
            NSColor.controlAccentColor.setStroke()
            path.lineWidth = 1.5
            path.stroke()
        }
    }
}

// KeyboardShortcut.Key.init?(keyCode:) and KeyboardShortcut.Modifier.from(flags:)
// are defined in AppState.swift — no duplicate declarations needed here.
