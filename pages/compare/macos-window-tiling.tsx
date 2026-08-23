import GuidePage from "../../components/GuidePage";

export default function MacOSTilingComparison() {
  return (
    <GuidePage
      kicker="Comparison"
      title="Redock vs built-in macOS window tiling"
      description="macOS already tiles windows well. Compare its built-in halves, quarters and keyboard controls with Redock's saved multi-display workspaces and automatic restore."
      lede="Use macOS when you only need to place the window in front of you. Use Redock when the real problem is rebuilding an entire desk after a display reconnects."
      path="/compare/macos-window-tiling"
      table={{
        columns: ["Job", "macOS", "Redock"],
        rows: [
          ["Tile one window", "Built in: edges, green button, menus and keyboard", "Included, with configurable shortcuts and drag zones"],
          ["Halves, quarters, centre and fill", "Built in", "Included, plus thirds, two-thirds and Almost Maximize"],
          ["Remember a complete desk", "No saved multi-app workspace", "Saves every eligible app window across displays"],
          ["Restore when a display reconnects", "No automatic workspace restore", "Can bind a workspace to that display setup"],
          ["Route an app on launch", "No per-app placement rules", "Choose its display and snap position"],
          ["Price", "Included with macOS", "Free basics; Pro is £19.99 once"],
        ],
      }}
      sections={[
        {
          heading: "macOS already covers everyday tiling",
          paragraphs: [
            "Apple lets you drag windows to edges and corners, use the green window button, choose Move & Resize commands from the Window menu, or use keyboard shortcuts. It can arrange halves and quarters, centre a window and fill the desktop.",
            "That is enough for many people, and Redock does not pretend otherwise. Installing another app just to put Safari on the left is difficult to justify on a modern Mac.",
          ],
        },
        {
          heading: "Redock solves the next problem",
          paragraphs: [
            "Tiling answers: where should this window go now? A saved workspace answers: where should all of these windows go every time this desk exists? Redock records each window, its display and its relative frame, then can restore that set when the matching displays return.",
            "App rules handle the smaller recurring decisions. A mail app can open on one display while a terminal opens at a chosen size on another, without rebuilding those placements by hand.",
          ],
          bullets: [
            "Choose macOS for quick, free placement of the active window.",
            "Choose Redock for repeatable desks, multiple displays and app routing.",
            "Keep both enabled if you like Apple's controls; Redock's workspace layer remains useful on top.",
          ],
        },
        {
          heading: "The honest verdict",
          paragraphs: [
            "If you use one display and rarely repeat the same arrangement, start with macOS. If plugging in a monitor turns your day into several minutes of reopening, moving and resizing windows, Redock addresses a problem the built-in tiler does not.",
          ],
        },
      ]}
      sources={[{ label: "Apple: Tile windows on Mac", href: "https://support.apple.com/guide/mac-help/tile-app-windows-mchlef287e5d/mac" }]}
      related={[
        { label: "Restore windows after reconnecting a monitor", href: "/guides/restore-window-positions-after-reconnecting-monitor" },
        { label: "Redock vs Rectangle", href: "/compare/redock-vs-rectangle" },
      ]}
    />
  );
}
