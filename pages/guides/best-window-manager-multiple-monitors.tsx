import GuidePage from "../../components/GuidePage";

export default function MultipleMonitorGuide() {
  return (
    <GuidePage
      kicker="Buying guide"
      title="The best Mac window manager for multiple monitors"
      description="Compare the best Mac window-manager approaches for multiple monitors: built-in macOS tiling, Redock, Rectangle Pro and Moom."
      lede="For multiple monitors, counting snap positions is the wrong test. The useful question is whether the app remembers a whole desk, understands display changes and makes that setup easy to recover."
      path="/guides/best-window-manager-multiple-monitors"
      table={{
        columns: ["Best for", "Choice", "Why"],
        rows: [
          ["Free active-window tiling", "macOS or Rectangle", "Fast halves, corners and keyboard placement without paying"],
          ["Automatic desk recovery", "Redock", "Workspaces bind directly to a display setup and restore when it returns"],
          ["Deep gestures and custom actions", "Rectangle Pro", "Window throw, custom positions, repeat actions and display-change automation"],
          ["Powerful manual layout system", "Moom", "Saved layouts, grids, chains, drop zones and a highly configurable palette"],
        ],
      }}
      sections={[
        {
          heading: "What matters with more than one display",
          paragraphs: [
            "A single-window command is useful, but it does not remove the repeated setup work created by docking a laptop. Look for a saved-layout model, stable display matching, proportional frames that survive resolution changes, and a way to trigger the right layout automatically.",
          ],
          bullets: [
            "Can it remember every relevant app window, not just one frame?",
            "Can a layout be associated with a particular monitor combination?",
            "Does it restore relative sizes when resolutions or scaling differ?",
            "Can it route newly opened apps after the workspace is restored?",
            "Is the workflow understandable enough that you will actually maintain it?",
          ],
        },
        {
          heading: "Redock: best for a repeatable docked desk",
          paragraphs: [
            "Redock is built around one event: a known display setup appears. Save the complete arrangement, bind it to those displays and Redock can put the workspace back without a hotkey. Explicit app rules then handle apps opened later.",
            "The free edition covers ordinary snapping. Pro is £19 once for three Macs, includes lifetime updates and has a 14-day trial. That price makes sense when automatic workspace recovery is the job you are buying, rather than basic tiling already supplied by macOS.",
          ],
        },
        {
          heading: "Rectangle Pro and Moom: strong alternatives",
          paragraphs: [
            "Rectangle Pro is the stronger fit when you want a large vocabulary of window actions. Its official feature list includes whole-workspace arrangement and actions triggered by displays connecting or disconnecting, alongside custom targets and repeated execution.",
            "Moom is a mature option for people who like constructing their own system. It provides saved layouts, custom actions, grids, drop zones and chains. Its official site lists it at $15 with a perpetual licence and at least one year of updates.",
          ],
        },
        {
          heading: "Our recommendation",
          paragraphs: [
            "Start with macOS or Rectangle if you only need quicker placement. Trial Redock if your frustration happens specifically at dock and undock time. Trial Rectangle Pro if gestures and bespoke actions matter most, and try Moom if you want the deepest manual layout toolkit.",
          ],
        },
      ]}
      sources={[
        { label: "Apple: Tile windows on Mac", href: "https://support.apple.com/guide/mac-help/tile-app-windows-mchlef287e5d/mac" },
        { label: "Rectangle Pro official features", href: "https://rectangleapp.com/pro/" },
        { label: "Moom official features and pricing", href: "https://manytricks.com/moom/" },
      ]}
      related={[
        { label: "Restore window positions after reconnecting", href: "/guides/restore-window-positions-after-reconnecting-monitor" },
        { label: "Window layouts for ultrawide monitors", href: "/guides/ultrawide-window-layouts" },
      ]}
    />
  );
}
