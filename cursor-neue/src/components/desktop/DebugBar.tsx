import {
  AGENT_NAMES_LABEL,
  AGENT_NAMES_MODES,
  BOTS_LABEL,
  BOTS_MODES,
  DOC_IDS_LABEL,
  DOC_IDS_MODES,
  IDENTICON_STYLE_LABEL,
  IDENTICON_STYLE_MODES,
  PROJECT_FOLDERS_LABEL,
  PROJECT_FOLDERS_MODES,
  PROJECT_SURFACE_LABEL,
  PROJECT_SURFACE_MODES,
  SIDEBAR_SECTIONS_LABEL,
  SIDEBAR_SECTIONS_MODES,
  TRIGGERS_LABEL,
  TRIGGERS_MODES,
  useFeatureFlags,
} from "@/store/useFeatureFlags";

const DEBUG_CHIP =
  "pointer-events-auto flex items-center gap-0.5 rounded-[14px] border border-[color:var(--bg-luminous-secondary)] bg-luminous-secondary p-1 backdrop-blur-[8px]";

/** Slim horizontal debug dock, centered at the bottom of the desktop.
 *  Same glass chrome as the left Dock, smaller padding and text segments
 *  instead of 44px tiles. Prototype-only — writes experiment flags. */
export function DebugBar() {
  const sectionsMode = useFeatureFlags((s) => s.sidebarSections);
  const setSectionsMode = useFeatureFlags((s) => s.setSidebarSections);
  const foldersMode = useFeatureFlags((s) => s.projectFolders);
  const setFoldersMode = useFeatureFlags((s) => s.setProjectFolders);
  const projectSurface = useFeatureFlags((s) => s.projectSurface);
  const setProjectSurface = useFeatureFlags((s) => s.setProjectSurface);
  const docIds = useFeatureFlags((s) => s.docIds);
  const setDocIds = useFeatureFlags((s) => s.setDocIds);
  const agentNames = useFeatureFlags((s) => s.agentNames);
  const setAgentNames = useFeatureFlags((s) => s.setAgentNames);
  const bots = useFeatureFlags((s) => s.bots);
  const setBots = useFeatureFlags((s) => s.setBots);
  const triggers = useFeatureFlags((s) => s.triggers);
  const setTriggers = useFeatureFlags((s) => s.setTriggers);
  const identiconStyle = useFeatureFlags((s) => s.identiconStyle);
  const setIdenticonStyle = useFeatureFlags((s) => s.setIdenticonStyle);
  return (
    <div
      data-debug-bar=""
      className="pointer-events-none absolute inset-x-0 bottom-3 z-[200] flex flex-wrap justify-center gap-3"
    >
      <Segmented
        label="Sections"
        options={SIDEBAR_SECTIONS_MODES}
        labels={SIDEBAR_SECTIONS_LABEL}
        value={sectionsMode}
        onSelect={setSectionsMode}
      />
      <Segmented
        label="Project folders"
        options={PROJECT_FOLDERS_MODES}
        labels={PROJECT_FOLDERS_LABEL}
        value={foldersMode}
        onSelect={setFoldersMode}
      />
      <Segmented
        label="Surfaces"
        options={PROJECT_SURFACE_MODES}
        labels={PROJECT_SURFACE_LABEL}
        value={projectSurface}
        onSelect={setProjectSurface}
      />
      <Segmented
        label="Document IDs"
        options={DOC_IDS_MODES}
        labels={DOC_IDS_LABEL}
        value={docIds}
        onSelect={setDocIds}
      />
      <Segmented
        label="Agent names"
        options={AGENT_NAMES_MODES}
        labels={AGENT_NAMES_LABEL}
        value={agentNames}
        onSelect={setAgentNames}
      />
      <Segmented
        label="Bots"
        options={BOTS_MODES}
        labels={BOTS_LABEL}
        value={bots}
        onSelect={setBots}
      />
      {bots === "bots" && (
        <>
          <Segmented
            label="Triggers"
            options={TRIGGERS_MODES}
            labels={TRIGGERS_LABEL}
            value={triggers}
            onSelect={setTriggers}
          />
          <Segmented
            label="Identicons"
            options={IDENTICON_STYLE_MODES}
            labels={IDENTICON_STYLE_LABEL}
            value={identiconStyle}
            onSelect={setIdenticonStyle}
          />
        </>
      )}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  options,
  labels,
  value,
  onSelect,
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onSelect: (mode: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-debug=""
      className={DEBUG_CHIP}
    >
      {options.map((option) => (
        <Segment
          key={option}
          value={option}
          selected={value === option}
          onSelect={onSelect}
          label={labels[option]}
        />
      ))}
    </div>
  );
}

function Segment<T extends string>({
  value,
  selected,
  onSelect,
  label,
}: {
  value: T;
  selected: boolean;
  onSelect: (mode: T) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={
        selected
          ? // Same tile surface as the dock camera/settings buttons: luminous
            // wash, hairline, inset top highlight.
            "h-6 rounded-[8px] border border-[color:var(--bg-luminous-quaternary)] bg-luminous-secondary px-2.5 text-sm text-white shadow-[inset_0_1px_1px_0_var(--bg-luminous-tertiary)]"
          : "h-6 rounded-[8px] border border-transparent px-2.5 text-sm text-luminous-secondary hover:text-luminous"
      }
    >
      {label}
    </button>
  );
}
