import { useState, useMemo } from "react";
import type { Skill } from "../../../../shared/types/pal";
import { useSkills } from "./hooks/useSkills";
import { Button } from "../../../../src/components/ui/button";
import { Badge } from "../../../../src/components/ui/badge";
import { Input } from "../../../../src/components/ui/input";
import { Label } from "../../../../src/components/ui/label";
import { Textarea } from "../../../../src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../src/components/ui/dialog";

interface SkillsPickerProps {
  open: boolean;
  onApply: (text: string) => void;
  onClose: () => void;
}

export function SkillsPicker({ open, onApply, onClose }: SkillsPickerProps) {
  const { skills, apply } = useSkills();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }, [skills, query]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    filtered.forEach((s) => cats.add(s.category));
    return Array.from(cats);
  }, [filtered]);

  function handleSelectSkill(skill: Skill) {
    if (skill.variables && skill.variables.length > 0) {
      setSelectedSkill(skill);
      const init: Record<string, string> = {};
      skill.variables.forEach((v) => { init[v.name] = (v.default as string) ?? ""; });
      setVariables(init);
    } else {
      void apply(skill.id, {}).then((result) => {
        onApply(result);
        handleClose();
      });
    }
  }

  async function handleApply() {
    if (!selectedSkill) return;
    const result = await apply(selectedSkill.id, variables);
    onApply(result);
    handleClose();
  }

  function handleClose() {
    setSelectedSkill(null);
    setVariables({});
    setQuery("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedSkill ? `Preencher: ${selectedSkill.name}` : "Selecionar Skill"}
          </DialogTitle>
        </DialogHeader>

        {!selectedSkill ? (
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Buscar skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div className="max-h-64 overflow-y-auto space-y-3">
              {filtered.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma skill encontrada.
                </p>
              )}
              {categories.map((cat) => (
                <div key={cat}>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {cat}
                  </p>
                  {filtered
                    .filter((s) => s.category === cat)
                    .map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => handleSelectSkill(skill)}
                        className="w-full text-left rounded-md px-3 py-2 hover:bg-muted/60 flex flex-col gap-0.5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <Badge variant="outline" className="text-[10px]">{skill.category}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{skill.description}</span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {selectedSkill.variables.map((variable) => (
              <div key={variable.name} className="flex flex-col gap-2">
                <Label htmlFor={variable.name}>
                  {variable.name}
                  {variable.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                {variable.name.toLowerCase() === "code" ||
                variable.name.toLowerCase() === "context" ? (
                  <Textarea
                    id={variable.name}
                    value={variables[variable.name] ?? ""}
                    onChange={(e) =>
                      setVariables({ ...variables, [variable.name]: e.target.value })
                    }
                    placeholder={variable.description ?? `Enter ${variable.name}...`}
                    rows={4}
                  />
                ) : (
                  <Input
                    id={variable.name}
                    value={variables[variable.name] ?? ""}
                    onChange={(e) =>
                      setVariables({ ...variables, [variable.name]: e.target.value })
                    }
                    placeholder={variable.description ?? `Enter ${variable.name}...`}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedSkill(null)}>
                Voltar
              </Button>
              <Button onClick={() => void handleApply()}>Aplicar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
