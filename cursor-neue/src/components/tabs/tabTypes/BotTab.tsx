import type { ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import type { Tab } from "@/types";
import { isBot } from "@/types";
import { emptyBotDoc, firstParagraphText } from "@/lib/botDetails";
import { BotBadge } from "@/components/ui/BotBadge";
import { BotIdentityPicker } from "@/components/ui/BotIdentityPicker";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Switch } from "@/components/tiptap-ui-primitive/switch";
import { EmptyTabSidebar } from "./placeholder";
import { NotionEditorLocal } from "@/components/tiptap-templates/notion-like/notion-like-editor-local";
import { useActiveAgent, useWorkspaceStore } from "@/store/useWorkspaceStore";

const FIELD =
  "w-full rounded-lg border border-secondary bg-quaternary px-2.5 py-2 text-base text-primary outline-none placeholder:text-tertiary";

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 pt-2">
        <h2 className="px-0.5 text-lg font-medium text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-7 shrink-0 items-center justify-center rounded-md border border-secondary px-2 text-sm text-primary hover:bg-quaternary"
    >
      Add
    </button>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl bg-elevated shadow-[0_0_0_1px_var(--border-tertiary)]">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[var(--border-tertiary)]" />;
}

function DetailRow({
  icon,
  primary,
  secondary,
  trailing,
}: {
  icon: IconName;
  primary: string;
  secondary: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center px-4 py-3">
      <Icon name={icon} size="base" color="tertiary" />
      <span className="ml-3 flex min-w-0 flex-1 items-center overflow-hidden">
        <span className="shrink-0 text-base font-medium text-primary">{primary}</span>
        <span className="ml-2 truncate text-base text-tertiary">{secondary}</span>
      </span>
      {trailing ? <span className="ml-3 shrink-0">{trailing}</span> : null}
    </div>
  );
}

/** Bot configuration form. Same reading width as the tracker document. */
export function BotContent({ tab }: { tab: Tab; tileId: string }) {
  const agent = useActiveAgent();
  const updateAgentMeta = useWorkspaceStore((s) => s.updateAgentMeta);

  if (!agent || !isBot(agent)) {
    return (
      <div className="flex h-full items-center justify-center bg-editor px-6">
        <p className="text-base text-tertiary">Open a bot to edit its details.</p>
      </div>
    );
  }

  const color = agent.color ?? "blue";
  const skills = agent.skills ?? [];
  const routines = agent.routines ?? [];
  const instructions = agent.instructions ?? emptyBotDoc();
  const memories = agent.memories ?? emptyBotDoc();

  return (
    <div className="min-h-full bg-editor">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-8 px-3 py-8">
        <Section title="General">
          <Card>
            <div className="flex items-center justify-between gap-6 px-4 py-3.5">
              <p className="text-base text-primary">Identity</p>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Edit bot identity">
                    <BotBadge
                      name={agent.title}
                      color={color}
                      seed={agent.identiconSeed}
                      size={40}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-[700] !min-w-0 overflow-hidden !rounded-[12px] border border-tertiary p-0"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <BotIdentityPicker
                    color={color}
                    onPickColor={(next) => updateAgentMeta(agent.id, { color: next })}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Divider />
            <div className="grid grid-cols-3 items-center gap-4 px-4 py-3.5">
              <p className="text-base text-primary">Name</p>
              <input
                key={`${agent.id}-title`}
                className={`${FIELD} col-start-3`}
                defaultValue={agent.title}
                onBlur={(e) => updateAgentMeta(agent.id, { title: e.target.value })}
                aria-label="Bot name"
              />
            </div>
          </Card>
        </Section>

        <Section title="Routines" action={<AddButton label="Add routine" />}>
          <Card>
            {routines.length === 0 ? (
              <p className="px-4 py-3.5 text-base text-tertiary">No routines yet.</p>
            ) : (
              <ul>
                {routines.map((routine, i) => (
                  <li key={routine.id}>
                    {i > 0 ? <Divider /> : null}
                    <DetailRow
                      icon="arrow-cw"
                      primary={routine.title}
                      secondary={routine.schedule}
                      trailing={
                        <Switch
                          size="sm"
                          checked={routine.enabled !== false}
                          aria-label={`${routine.title} on`}
                          onCheckedChange={(checked) =>
                            updateAgentMeta(agent.id, {
                              routines: routines.map((item) =>
                                item.id === routine.id ? { ...item, enabled: checked } : item,
                              ),
                            })
                          }
                        />
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>

        <Section title="Instructions">
          <Card>
            <div className="h-[160px]">
              <NotionEditorLocal
                variant="card"
                sourceKey={`${tab.id}-${agent.id}-instructions`}
                content={instructions}
                placeholder="Write the script this bot follows…"
                onUpdate={(json: JSONContent) =>
                  updateAgentMeta(agent.id, {
                    instructions: json,
                    description: firstParagraphText(json),
                  })
                }
              />
            </div>
          </Card>
        </Section>

        <Section title="Memories">
          <Card>
            <div className="h-[160px]">
              <NotionEditorLocal
                variant="card"
                sourceKey={`${tab.id}-${agent.id}-memories`}
                content={memories}
                placeholder="Facts this bot has learned…"
                onUpdate={(json: JSONContent) => updateAgentMeta(agent.id, { memories: json })}
              />
            </div>
          </Card>
        </Section>

        <Section title="Skills" action={<AddButton label="Add skill" />}>
          <Card>
            {skills.length === 0 ? (
              <p className="px-4 py-3.5 text-base text-tertiary">No skills yet.</p>
            ) : (
              <ul>
                {skills.map((item, i) => (
                  <li key={item.id}>
                    {i > 0 ? <Divider /> : null}
                    <DetailRow
                      icon="cube"
                      primary={item.name}
                      secondary={item.description}
                      trailing={<Icon name="chevron-right" size="base" color="tertiary" />}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Section>
      </div>
    </div>
  );
}

export const BotSidebar = () => <EmptyTabSidebar />;
