import { useState } from "react";
import type { Skill, SkillVariable } from "../../../../shared/types/pal";
import { useSkills } from "./hooks/useSkills";
import { Button } from "../../../../src/components/ui/button";
import { Input } from "../../../../src/components/ui/input";
import { Label } from "../../../../src/components/ui/label";
import { Textarea } from "../../../../src/components/ui/textarea";
import { Badge } from "../../../../src/components/ui/badge";
import { Lock, Trash2, Pencil, Plus, X } from "lucide-react";

export function SkillsPanel() {
  const { skills, save, remove } = useSkills();
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);

  async function handleSave() {
    if (!editingSkill?.name || !editingSkill?.template) return;
    await save({
      id: editingSkill.id,
      name: editingSkill.name,
      category: editingSkill.category ?? "Custom",
      description: editingSkill.description ?? "",
      template: editingSkill.template,
      variables: editingSkill.variables ?? [],
      isBuiltin: false,
    });
    setEditingSkill(null);
  }

  function addVariable() {
    const v: SkillVariable = { name: "", type: "string", required: false };
    setEditingSkill((prev) => ({
      ...prev,
      variables: [...(prev?.variables ?? []), v],
    }));
  }

  function updateVariable(index: number, field: keyof SkillVariable, value: string | boolean) {
    setEditingSkill((prev) => {
      const vars = [...(prev?.variables ?? [])];
      vars[index] = { ...vars[index], [field]: value };
      return { ...prev, variables: vars };
    });
  }

  function removeVariable(index: number) {
    setEditingSkill((prev) => {
      const vars = (prev?.variables ?? []).filter((_, i) => i !== index);
      return { ...prev, variables: vars };
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Skills</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setEditingSkill({ name: "", category: "Custom", description: "", template: "", variables: [] })
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Nova Skill
        </Button>
      </div>

      {/* Edit form */}
      {editingSkill && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {editingSkill.id ? "Editar Skill" : "Nova Skill"}
            </span>
            <button onClick={() => setEditingSkill(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={editingSkill.name ?? ""}
              onChange={(e) => setEditingSkill((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nome da skill"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input
              value={editingSkill.category ?? "Custom"}
              onChange={(e) => setEditingSkill((p) => ({ ...p, category: e.target.value }))}
              placeholder="Custom"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={editingSkill.description ?? ""}
              onChange={(e) => setEditingSkill((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descrição curta"
            />
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Textarea
              value={editingSkill.template ?? ""}
              onChange={(e) => setEditingSkill((p) => ({ ...p, template: e.target.value }))}
              placeholder="Use {{variable}} para variáveis dinâmicas"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Variáveis</Label>
              <Button size="sm" variant="ghost" onClick={addVariable}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {(editingSkill.variables ?? []).map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={v.name}
                  onChange={(e) => updateVariable(i, "name", e.target.value)}
                  placeholder="nome"
                  className="flex-1"
                />
                <button onClick={() => removeVariable(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setEditingSkill(null)}>Cancelar</Button>
            <Button size="sm" onClick={() => void handleSave()}>Salvar</Button>
          </div>
        </div>
      )}

      {/* Skills list */}
      <div className="space-y-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-start justify-between rounded-lg border border-border p-3"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{skill.name}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{skill.category}</Badge>
                {skill.isBuiltin && (
                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">{skill.description}</span>
            </div>
            {!skill.isBuiltin && (
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button
                  onClick={() => setEditingSkill(skill)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => void remove(skill.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
