import { useState } from "react";
import type { Skill } from "../../../../shared/types/pal";
import { useSkills } from "./hooks/useSkills";
import { Button } from "../../../../src/components/ui/button";
import { Badge } from "../../../../src/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../src/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../src/components/ui/dialog";
import { Wand2, ChevronDown, Layers } from "lucide-react";

// ── Shared button class (same as PermissionDropdown / ModelDropdown) ──
const BTN = "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground";

interface MhSkillsControlProps {
  onApply: (text: string) => void;
}

export function MhSkillsControl({ onApply }: MhSkillsControlProps) {
  const { skills, apply } = useSkills();
  const [multiOpen, setMultiOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function applySingle(skill: Skill) {
    const result = await apply(skill.id, {});
    onApply(result);
  }

  async function applyMulti() {
    const texts: string[] = [];
    for (const id of selected) {
      const skill = skills.find((s) => s.id === id);
      if (skill) {
        const result = await apply(skill.id, {});
        texts.push(result);
      }
    }
    if (texts.length > 0) {
      onApply(texts.join("\n\n"));
    }
    setMultiOpen(false);
    setSelected(new Set());
  }

  function toggleSkill(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={BTN} title="Skills PAL">
            <Wand2 className="h-3 w-3" />
            Skills
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {skills.map((skill) => (
            <DropdownMenuItem
              key={skill.id}
              onClick={() => void applySingle(skill)}
            >
              <div className="flex min-w-0 flex-col">
                <span>{skill.name}</span>
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {skill.description}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
          {skills.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onClick={() => {
              setSelected(new Set());
              setMultiOpen(true);
            }}
          >
            <Layers className="mr-2 h-3.5 w-3.5 shrink-0" />
            Aplicar Múltiplas…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Multi-skill modal */}
      <Dialog open={multiOpen} onOpenChange={(v) => { if (!v) { setMultiOpen(false); setSelected(new Set()); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Aplicar Múltiplas Skills</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {skills.map((skill) => (
              <label
                key={skill.id}
                className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(skill.id)}
                  onChange={() => toggleSkill(skill.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <Badge variant="outline" className="text-[10px]">{skill.category}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{skill.description}</span>
                </div>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selecionada${selected.size > 1 ? "s" : ""}` : "Nenhuma selecionada"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setMultiOpen(false); setSelected(new Set()); }}>
                Cancelar
              </Button>
              <Button size="sm" disabled={selected.size === 0} onClick={() => void applyMulti()}>
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
