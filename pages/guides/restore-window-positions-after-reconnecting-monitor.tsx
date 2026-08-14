import GuidePage from "../../components/GuidePage";

export default function ReconnectMonitorGuide() {
  return (
    <GuidePage
      kicker="How-to guide"
      title="Restore Mac window positions after reconnecting a monitor"
      description="Stop rebuilding your Mac desktop after docking. Save a Redock workspace and restore every window automatically when the same displays reconnect."
      lede="When an external display disappears, macOS has to move its windows somewhere. Redock records the arrangement before that happens and can restore it when the same desk returns."
      path="/guides/restore-window-positions-after-reconnecting-monitor"
      sections={[
        {
          heading: "1. Build the desk you want to keep",
          paragraphs: [
            "Connect the displays you normally use and place each app where it belongs. Redock stores relative positions and sizes, so a saved layout is not tied to one exact pixel resolution.",
          ],
          bullets: [
            "Put long-lived apps such as Mail, Slack, Terminal and your browser in their normal places.",
            "Open the specific document windows you expect Redock to match later.",
            "Leave transient dialogs and utility panels out of the arrangement where possible.",
          ],
        },
        {
          heading: "2. Save a complete workspace",
          paragraphs: [
            "Open Redock from the menu bar, choose Save a Workspace and give the layout a name such as Studio, Office or Home Desk. Redock records eligible app windows across every connected display.",
            "A workspace can also have its own shortcut, which is useful when the displays are already connected but the windows have drifted during the day.",
          ],
        },
        {
          heading: "3. Bind it to this display setup",
          paragraphs: [
            "Enable automatic restore for the workspace while the intended monitors are attached. Redock associates it with that display signature. The next time the same setup returns, the matching workspace can restore without a menu command.",
          ],
        },
        {
          heading: "4. Add rules for apps that open later",
          paragraphs: [
            "A saved workspace handles windows that exist when it restores. An app rule handles the next launch: choose the app, destination display and target position. The two systems complement each other instead of asking one snapshot to predict every future window.",
          ],
        },
        {
          heading: "What Redock can and cannot restore",
          paragraphs: [
            "Redock restores window size and position across displays. It does not move windows between macOS Spaces, because macOS does not provide a reliable public mechanism for third-party apps to do that. Some apps with unusual or temporary windows may also need an app rule or a second restore.",
            "If you only need to place one window after reconnecting, macOS tiling is already enough. Redock is useful when the cost is rebuilding the complete desk repeatedly.",
          ],
        },
      ]}
      sources={[{ label: "Apple: Connect an external display to your Mac", href: "https://support.apple.com/guide/mac-help/connect-an-external-display-mchl7c7ebe08/mac" }]}
      related={[
        { label: "Best Mac window manager for multiple monitors", href: "/guides/best-window-manager-multiple-monitors" },
        { label: "Redock vs built-in macOS tiling", href: "/compare/macos-window-tiling" },
      ]}
    />
  );
}
