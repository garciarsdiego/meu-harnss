import React, { useState, useMemo } from "react";
import { useSkills } from "./hooks/useSkills";
import { Skill } from "../../../../shared/types/pal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "../../components/ui/command";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

interface SkillsPickerProps {
  open: boolean;
  onApply: (text: string) => void;
  onClose: () => void;
}

export function SkillsPicker({ open, onApply, onClose }: SkillsPickerProps) {
  const { skills, apply } = useSkills();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const categories = useMemo(() => {
    const cats = new Set<string>();
    skills.forEach((s) => cats.add(s.category));
    return Array.from(cats);
  }, [skills]);

  const handleSelectSkill = (skill: Skill) => {
    if (skill.variables && skill.variables.length > 0) {
      setSelectedSkill(skill);
      const initialVars: Record<string, string> = {};
      skill.variables.forEach((v) => {
        initialVars[v.name] = (v.default as string) || "";
      });
      setVariables(initialVars);
    } else {
      apply(skill.id, {}).then((result) => {
        onApply(result);
        onClose();
      });
    }
  };

  const handleApply = async () => {
    if (!selectedSkill) return;
    const result = await apply(selectedSkill.id, variables);
    onApply(result);
    onClose();
    setSelectedSkill(null);
    setVariables({});
  };

  const handleClose = () => {
    setSelectedSkill(null);
    setVariables({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedSkill ? `Fill Variables: ${selectedSkill.name}` : "Select a Skill"}</DialogTitle>
        </DialogHeader>

        {!selectedSkill ? (
          <Command>
            <CommandInput placeholder="Search skills..." />
            <CommandList>
              <CommandEmpty>No skills found.</CommandEmpty>
              {categories.map((cat) => (
                <CommandGroup key={cat} heading={cat}>
                  {skills
                    .filter((s) => s.category === cat)
                    .map((skill) => (
                      <CommandItem
                        key={skill.id}
                        onSelect={() => handleSelectSkill(skill)}
                        className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{skill.name}</span>
                          <Badge variant="outline">{skill.category}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{skill.description}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        ) : (
          <div className="flex flex-col gap-4">
            {selectedSkill.variables.map((variable) => (
              <div key={variable.name} className="flex flex-col gap-2">
                <Label htmlFor={variable.name}>
                  {variable.name} {variable.required && <span className="text-red-500">*</span>}
                </Label>
                {variable.name.toLowerCase() === "code" || variable.name.toLowerCase() === "context" ? (
                  <Textarea
                    id={variable.name}
                    value={variables[variable.name] || ""}
                    onChange={(e) => setVariables({ ...variables, [variable.name]: e.target.value })}
                    placeholder={variable.description || `Enter ${variable.name}...`}
                    rows={4}
                  />
                ) : (
                  <Input
                    id={variable.name}
                    value={variables[variable.name] || ""}
                    onChange={(e) => setVariables({ ...variables, [variable.name]: e.target.value })}
                    placeholder={variable.description || `Enter ${variable.name}...`}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setSelectedSkill(null)}>
                Back
              </Button>
              <Button onClick={handleApply}>Apply</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
