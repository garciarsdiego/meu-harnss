import React, { useState } from "react";
import { useSkills } from "./hooks/useSkills";
import { Skill, SkillVariable } from "../../../../shared/types/pal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Lock, Trash, Edit, Plus, X } from "lucide-react";

export function SkillsPanel() {
  const { skills, save, remove } = useSkills();
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);

  const handleSave = async () => {
    if (!editingSkill?.name || !editingSkill?.template) return;
    
    await save({
      id: editingSkill.id,
      name: editingSkill.name,
      category: editingSkill.category || "Custom",
      description: editingSkill.description || "",
      template: editingSkill.template,
      variables: editingSkill.variables || [],
      isBuiltin: false
    });
    setEditingSkill(null);
  };

  const handleAddVariable = () => {
    if (!editingSkill) return;
    const newVars = [...(editingSkill.variables || []), { name: "", type: "string" as const, required: true }];
    setEditingSkill({ ...editingSkill, variables: newVars });
  };

  const handleUpdateVariable = (index: number, field: keyof SkillVariable, value: string | boolean) => {
    if (!editingSkill?.variables) return;
    const newVars = [...editingSkill.variables];
    newVars[index] = { ...newVars[index], [field]: value };
    setEditingSkill({ ...editingSkill, variables: newVars });
  };

  const handleRemoveVariable = (index: number) => {
    if (!editingSkill?.variables) return;
    const newVars = editingSkill.variables.filter((_, i) => i !== index);
    setEditingSkill({ ...editingSkill, variables: newVars });
  };

  return (
    <div className="flex h-full gap-6 p-6">
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Skills Management</h2>
          <Button onClick={() => setEditingSkill({ name: "", category: "Custom", description: "", template: "", variables: [] })}>
            <Plus className="w-4 h-4 mr-2" /> New Skill
          </Button>
        </div>

        <div className="grid gap-4">
          {skills.map((skill) => (
            <Card key={skill.id}>
              <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {skill.name}
                    {skill.isBuiltin && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </CardTitle>
                  <CardDescription className="mt-1">{skill.description}</CardDescription>
                </div>
                <Badge variant="secondary">{skill.category}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono bg-muted p-2 rounded-md truncate">
                  {skill.template.length > 60 ? skill.template.slice(0, 60) + "..." : skill.template}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {!skill.isBuiltin && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditingSkill(skill)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(skill.id)}>
                      <Trash className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {editingSkill && (
        <Card className="w-1/3 flex flex-col">
          <CardHeader>
            <CardTitle>{editingSkill.id ? "Edit Skill" : "New Skill"}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editingSkill.name || ""} onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={editingSkill.category || ""} onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={editingSkill.description || ""} onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Template (Use {"{{var}}"} for variables)</Label>
              <Textarea 
                rows={6} 
                value={editingSkill.template || ""} 
                onChange={(e) => setEditingSkill({ ...editingSkill, template: e.target.value })} 
              />
            </div>
            
            <div className="space-y-3 pt-2 border-t">
              <div className="flex justify-between items-center">
                <Label>Variables</Label>
                <Button variant="ghost" size="sm" onClick={handleAddVariable}>
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
              
              {editingSkill.variables?.map((v, i) => (
                <div key={i} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <Input 
                    placeholder="Name" 
                    value={v.name} 
                    onChange={(e) => handleUpdateVariable(i, "name", e.target.value)}
                    className="h-8"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveVariable(i)}>
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingSkill(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editingSkill.name || !editingSkill.template}>Save</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
