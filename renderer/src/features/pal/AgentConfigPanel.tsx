import type {
  ComponentProps,
  FormEvent,
  TextareaHTMLAttributes,
} from "react";
import { useEffect, useState } from "react";
import type { AgentConfig } from "../../../../shared/types/pal";
import { Button } from "../../../../src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../src/components/ui/dialog";
import { Input } from "../../../../src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../src/components/ui/select";
import { cn } from "../../../../src/lib/utils";

type AgentConfigBaseInput = Omit<
  AgentConfig,
  "id" | "createdAt" | "updatedAt" | "schemaVersion"
>;

type AgentConfigFormState = {
  name: string;
  agentType: AgentConfig["agentType"];
  systemPrompt: string;
  preferredModel: string;
  permissionMode: NonNullable<AgentConfig["permissionMode"]>;
  persona: string;
};

type AgentConfigSaveInput = AgentConfigBaseInput & { id?: string };

interface MhWindowIpc {
  invoke(channel: "mh:agent-config:list"): Promise<AgentConfig[]>;
  invoke(
    channel: "mh:agent-config:save",
    data: AgentConfigSaveInput | AgentConfig,
  ): Promise<AgentConfig>;
  invoke(channel: "mh:agent-config:delete", id: string): Promise<void>;
}

declare global {
  interface Window {
    ipc: MhWindowIpc;
  }
}

interface AgentConfigPanelProps {
  open: boolean;
  agentId: string | null;
  onClose: () => void;
  onSaved: (agent: AgentConfig) => void;
}

function createEmptyFormState(): AgentConfigFormState {
  return {
    name: "",
    agentType: "claude",
    systemPrompt: "",
    preferredModel: "",
    permissionMode: "default",
    persona: "",
  };
}

function toFormState(agent: AgentConfig): AgentConfigFormState {
  return {
    name: agent.name,
    agentType: agent.agentType,
    systemPrompt: agent.systemPrompt ?? "",
    preferredModel: agent.preferredModel ?? "",
    permissionMode: agent.permissionMode ?? "default",
    persona: agent.persona ?? "",
  };
}

function toOptionalString(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function isAgentType(value: string): value is AgentConfig["agentType"] {
  return (
    value === "claude" ||
    value === "codex" ||
    value === "acp" ||
    value === "pal"
  );
}

function isPermissionMode(
  value: string,
): value is NonNullable<AgentConfig["permissionMode"]> {
  return (
    value === "default" ||
    value === "acceptEdits" ||
    value === "bypassPermissions"
  );
}

function Sheet(props: ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />;
}

function SheetContent(props: ComponentProps<typeof DialogContent>) {
  const { className, ...rest } = props;

  return (
    <DialogContent
      className={cn(
        "left-auto right-0 top-0 h-full max-w-[32rem] translate-x-0 translate-y-0 rounded-none border-l sm:max-w-[32rem]",
        className,
      )}
      {...rest}
    />
  );
}

function Form(props: ComponentProps<"form">) {
  const { className, ...rest } = props;

  return <form className={cn("flex h-full flex-col gap-4", className)} {...rest} />;
}

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40 aria-invalid:ring-destructive/20 dark:bg-input/30 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px] md:text-sm",
        className,
      )}
      {...rest}
    />
  );
}

export function AgentConfigPanel({
  open,
  agentId,
  onClose,
  onSaved,
}: AgentConfigPanelProps) {
  const [formData, setFormData] = useState<AgentConfigFormState>(
    createEmptyFormState,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!agentId) {
      setFormData(createEmptyFormState());
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void window.ipc
      .invoke("mh:agent-config:list")
      .then((agents) => {
        if (cancelled) {
          return;
        }

        const nextAgent = agents.find((agent) => agent.id === agentId);
        if (!nextAgent) {
          setFormData(createEmptyFormState());
          setError("Agent configuration not found.");
          return;
        }

        setFormData(toFormState(nextAgent));
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load the agent configuration.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [agentId, open]);

  function updateField<Key extends keyof AgentConfigFormState>(
    key: Key,
    value: AgentConfigFormState[Key],
  ): void {
    setFormData((currentState) => ({
      ...currentState,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: AgentConfigSaveInput = {
      id: agentId ?? undefined,
      name: formData.name.trim(),
      agentType: formData.agentType,
      systemPrompt: toOptionalString(formData.systemPrompt),
      preferredModel: toOptionalString(formData.preferredModel),
      permissionMode: formData.permissionMode,
      persona: toOptionalString(formData.persona),
      toolSubset: undefined,
    };

    try {
      const savedAgent = await window.ipc.invoke("mh:agent-config:save", payload);
      onSaved(savedAgent);
      onClose();
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save the agent configuration.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <SheetContent>
        <DialogHeader className="pr-6 text-left">
          <DialogTitle>
            {agentId ? "Edit agent configuration" : "Create agent configuration"}
          </DialogTitle>
          <DialogDescription>
            Configure the PAL agent profile that will be stored in MeuHarnss.
          </DialogDescription>
        </DialogHeader>

        <Form onSubmit={handleSubmit}>
          <fieldset
            className="grid gap-4"
            disabled={loading || saving}
          >
            <label className="grid gap-2">
              <span className="text-sm font-medium">Name</span>
              <Input
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Senior Reviewer"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Agent type</span>
              <Select
                value={formData.agentType}
                onValueChange={(value) => {
                  if (isAgentType(value)) {
                    updateField("agentType", value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an agent type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">claude</SelectItem>
                  <SelectItem value="codex">codex</SelectItem>
                  <SelectItem value="acp">acp</SelectItem>
                  <SelectItem value="pal">pal</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">System prompt</span>
              <Textarea
                rows={6}
                value={formData.systemPrompt}
                onChange={(event) =>
                  updateField("systemPrompt", event.target.value)
                }
                placeholder="Describe how the agent should behave."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Preferred model</span>
              <Input
                value={formData.preferredModel}
                onChange={(event) =>
                  updateField("preferredModel", event.target.value)
                }
                placeholder="gpt-5.4-mini"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Permission mode</span>
              <Select
                value={formData.permissionMode}
                onValueChange={(value) => {
                  if (isPermissionMode(value)) {
                    updateField("permissionMode", value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a permission mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">default</SelectItem>
                  <SelectItem value="acceptEdits">acceptEdits</SelectItem>
                  <SelectItem value="bypassPermissions">
                    bypassPermissions
                  </SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Persona</span>
              <Textarea
                rows={3}
                value={formData.persona}
                onChange={(event) => updateField("persona", event.target.value)}
                placeholder="Short style and tone notes for the agent."
              />
            </label>
          </fieldset>

          <div className="mt-auto grid gap-3 border-t pt-4">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || saving || formData.name.trim().length === 0}
              >
                {saving ? "Saving..." : "Save agent"}
              </Button>
            </div>
          </div>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
