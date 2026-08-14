import GuidePage from "../../components/GuidePage";

export default function RedockVsRectangle() {
  return (
    <GuidePage
      kicker="Comparison"
      title="Redock vs Rectangle: which Mac window manager fits you?"
      description="A fair Redock vs Rectangle comparison for Mac users: free tiling, Pro workspace restore, display changes, app rules, clipboard tools and pricing."
      lede="Rectangle is excellent at moving individual windows, and Rectangle Pro also supports whole-workspace actions. Redock is the more focused choice when your day starts by reconnecting a known multi-display desk."
      path="/compare/redock-vs-rectangle"
      table={{
        columns: ["Capability", "Redock", "Rectangle / Rectangle Pro"],
        rows: [
          ["Basic snapping", "Free keyboard, menu and drag controls", "Rectangle is a strong free, open-source tiler"],
          ["Saved workspaces", "Pro: save every eligible window and restore on demand", "Rectangle Pro: arrange an entire workspace with a shortcut"],
          ["Display-change automation", "Bind a workspace to a display setup", "Rectangle Pro can activate when displays connect or disconnect"],
          ["Custom window mechanics", "A focused set of halves, thirds, corners and drag zones", "Rectangle Pro offers deeper custom sizes, repeated execution and window throw"],
          ["Per-app routing", "Explicit rules for an app's display and position", "Not presented as an app-launch rules feature on the Pro overview"],
          ["Extra daily tools", "Local clipboard history and a temporary file shelf", "Focused on window management"],
        ],
      }}
      sections={[
        {
          heading: "Choose Rectangle for deep window control",
          paragraphs: [
            "Rectangle's free edition is a capable starting point for shortcuts and common positions. Rectangle Pro goes much further: its official feature list includes window throw, custom sizes and positions, repeated-execution behaviour, custom snap targets and a configurable command list.",
            "It also supports arranging an entire workspace from a shortcut and activating actions when displays connect or disconnect. Those are real strengths, so a comparison that says Rectangle cannot restore layouts would be inaccurate.",
          ],
        },
        {
          heading: "Choose Redock for a simpler desk-recovery workflow",
          paragraphs: [
            "Redock puts the display setup at the centre of the experience. Arrange the desk, save it, bind it to the connected monitors, and let that workspace return when the setup reappears. App rules separately route individual apps to a chosen display and position.",
            "Redock also keeps a searchable local clipboard history and a temporary file shelf one shortcut away. If those are already separate parts of your workflow, having them in the same lightweight menu-bar app can be the deciding factor.",
          ],
        },
        {
          heading: "The honest verdict",
          paragraphs: [
            "Pick Rectangle if your priority is the broadest set of window-moving gestures and custom actions. Pick Redock if you want a guided 'plug in and get my desk back' workflow, explicit app routing, and a few adjacent productivity tools without assembling several utilities.",
          ],
        },
      ]}
      sources={[
        { label: "Rectangle Pro official feature list", href: "https://rectangleapp.com/pro/" },
        { label: "Apple: built-in Mac window tiling", href: "https://support.apple.com/guide/mac-help/tile-app-windows-mchlef287e5d/mac" },
      ]}
      related={[
        { label: "Best window manager for multiple monitors", href: "/guides/best-window-manager-multiple-monitors" },
        { label: "Redock vs built-in macOS tiling", href: "/compare/macos-window-tiling" },
      ]}
    />
  );
}
