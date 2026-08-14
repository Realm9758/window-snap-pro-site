import GuidePage from "../../components/GuidePage";

export default function UltrawideLayoutsGuide() {
  return (
    <GuidePage
      kicker="Layout guide"
      title="Practical Mac window layouts for ultrawide monitors"
      description="Five useful Mac layouts for ultrawide monitors using thirds, two-thirds, Almost Maximize, saved Redock workspaces and app rules."
      lede="An ultrawide works best when the layout follows the task. These five arrangements avoid the two common extremes: one stretched app or a wall of equally important columns."
      path="/guides/ultrawide-window-layouts"
      table={{
        columns: ["Layout", "Main window", "Supporting window(s)", "Good for"],
        rows: [
          ["Focus + reference", "Left or right two-thirds", "Remaining third", "Writing, coding, research"],
          ["Three lanes", "Centre third", "Left and right thirds", "Operations, communication, dashboards"],
          ["Comfortable focus", "Almost Maximize", "Hidden or recalled by shortcut", "Design and deep work"],
          ["Balanced pair", "Left half", "Right half", "Comparison and meetings"],
          ["Command centre", "Custom centre at 70–80%", "Rules route utilities around it", "Large primary app plus tools"],
        ],
      }}
      sections={[
        {
          heading: "1. Two-thirds for the work, one-third for context",
          paragraphs: [
            "Give the editor, browser or design canvas two-thirds of the width and place documentation, notes or chat in the remaining third. This keeps the primary task visually dominant without covering reference material.",
            "Redock includes left and right two-thirds actions. Repeated presses of a half shortcut can also cycle through half, third and two-thirds when size cycling is enabled.",
          ],
        },
        {
          heading: "2. Three lanes for monitoring work",
          paragraphs: [
            "Use equal thirds when three streams genuinely deserve equal attention: inbox, active queue and dashboard, for example. Avoid this for writing or coding, where the centre workspace usually needs more width.",
            "Assign shortcuts to Left Third, Center Third and Right Third, or save the full combination as a workspace so every app returns together.",
          ],
        },
        {
          heading: "3. Almost Maximize for comfortable focus",
          paragraphs: [
            "A full-width ultrawide window can make text lines exhausting to scan. Almost Maximize leaves a five-percent margin on every side, preserving scale while keeping the window visually contained.",
          ],
        },
        {
          heading: "4. A configurable centre for meetings and reading",
          paragraphs: [
            "Redock's centred layout is adjustable from 40 to 90 percent of the work area. Around 70 percent works well for video calls, long-form reading and apps whose controls spread too far apart at full width.",
          ],
        },
        {
          heading: "5. Save a workspace per mode",
          paragraphs: [
            "The useful ultrawide setup changes with the job. Save one workspace for focus, another for communication and another for monitoring. Give each a shortcut, then use app rules for the utilities that should always return to one lane.",
            "If the ultrawide is part of a docked setup, bind the main workspace to that display combination so reconnecting it restores the full arrangement automatically.",
          ],
        },
      ]}
      related={[
        { label: "Best Mac window manager for multiple monitors", href: "/guides/best-window-manager-multiple-monitors" },
        { label: "Restore windows after reconnecting a monitor", href: "/guides/restore-window-positions-after-reconnecting-monitor" },
      ]}
    />
  );
}
