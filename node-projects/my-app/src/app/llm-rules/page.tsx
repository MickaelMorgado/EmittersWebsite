'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Save, X, ExternalLink, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LLMRule {
  id: string;
  section: string;
  title: string;
  content: string;
  sort_order: number;
  updated_at: string;
}

interface LLMSection {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  green: 'bg-green-500/10 text-green-400 border-green-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export default function LLMRulesPage() {
  const [rules, setRules] = useState<LLMRule[]>([]);
  const [sections, setSections] = useState<LLMSection[]>([]);
  const [loading, setLoading] = useState(true);

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LLMRule | null>(null);
  const [ruleForm, setRuleForm] = useState({ section: '', title: '', content: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<LLMSection | null>(null);
  const [sectionForm, setSectionForm] = useState({ name: '', color: 'gray', sort_order: 0 });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([fetchRules(), fetchSections()]).then(() => setLoading(false));
  }, []);

  const fetchRules = async () => {
    const res = await fetch('/api/llm-rules');
    const data = await res.json();
    setRules(Array.isArray(data) ? data : []);
  };

  const fetchSections = async () => {
    const res = await fetch('/api/llm-sections');
    const data = await res.json();
    setSections(Array.isArray(data) ? data : []);
  };

  const openCreateRule = () => {
    setEditingRule(null);
    setRuleForm({ section: effectiveSections[0]?.name || 'general', title: '', content: '', sort_order: rules.length });
    setRuleDialogOpen(true);
  };

  const openEditRule = (rule: LLMRule) => {
    setEditingRule(rule);
    setRuleForm({ section: rule.section, title: rule.title, content: rule.content, sort_order: rule.sort_order });
    setRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    setSaving(true);
    const payload = editingRule ? { ...ruleForm, id: editingRule.id } : ruleForm;
    await fetch('/api/llm-rules', {
      method: editingRule ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setRuleDialogOpen(false);
    setSaving(false);
    fetchRules();
  };

  const handleDeleteRule = async (id: string) => {
    await fetch(`/api/llm-rules?id=${id}`, { method: 'DELETE' });
    fetchRules();
  };

  const openCreateSection = () => {
    setEditingSection(null);
    setSectionForm({ name: '', color: 'gray', sort_order: sections.length });
    setSectionDialogOpen(true);
  };

  const openEditSection = (section: LLMSection) => {
    setEditingSection(section);
    setSectionForm({ name: section.name, color: section.color, sort_order: section.sort_order });
    setSectionDialogOpen(true);
  };

  const handleSaveSection = async () => {
    setSaving(true);
    const payload = editingSection ? { ...sectionForm, id: editingSection.id } : sectionForm;
    await fetch('/api/llm-sections', {
      method: editingSection ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSectionDialogOpen(false);
    setSaving(false);
    fetchSections();
  };

  const handleDeleteSection = async (id: string) => {
    await fetch(`/api/llm-sections?id=${id}`, { method: 'DELETE' });
    fetchSections();
  };

  const copyPublicUrl = () => {
    const url = `${window.location.origin}/api/llm-rules/public`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const effectiveSections = sections.length > 0
    ? sections
    : [...new Set(rules.map((r) => r.section))].map((name, i) => ({
        id: name,
        name,
        color: 'gray',
        sort_order: i,
      }));

  const groupedRules = effectiveSections.map((section) => ({
    section,
    rules: rules.filter((r) => r.section === section.name),
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">LLM Rules</h1>
            <p className="text-muted-foreground text-sm">
              Manage rules, sections, and generate public endpoints for your AI assistants.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyPublicUrl}>
              {copied ? <Check className="size-4 mr-1" /> : <Copy className="size-4 mr-1" />}
              {copied ? 'Copied!' : 'Public URL'}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/api/llm-rules/public" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4 mr-1" />
                Preview
              </a>
            </Button>
            <Button onClick={openCreateRule}>
              <Plus className="size-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </div>

        <Card className="py-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sections</CardTitle>
              <Button variant="outline" size="sm" onClick={openCreateSection}>
                <Plus className="size-3 mr-1" />
                Add Section
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {effectiveSections.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">No sections yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {effectiveSections.map((section) => (
                  <div key={section.id} className="flex items-center gap-1">
                    <Badge variant="outline" className={COLOR_MAP[section.color] || COLOR_MAP.gray}>
                      {section.name}
                    </Badge>
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => openEditSection(section)}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading rules...</div>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No rules yet. Click &quot;Add Rule&quot; to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedRules.map(({ section, rules: sectionRules }) => (
              <div key={section.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold capitalize">{section.name}</h2>
                  <Badge variant="outline" className={COLOR_MAP[section.color] || COLOR_MAP.gray}>
                    {sectionRules.length} rule{sectionRules.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                {sectionRules.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">No rules in this section.</p>
                ) : (
                  <div className="space-y-2">
                    {sectionRules.map((rule) => (
                      <Card key={rule.id} className="py-4">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{rule.title}</CardTitle>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => openEditRule(rule)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rule.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'New Rule'}</DialogTitle>
            <DialogDescription>
              {editingRule ? 'Update this rule.' : 'Add a new rule for AI assistants.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select value={ruleForm.section} onValueChange={(v) => setRuleForm({ ...ruleForm, section: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {effectiveSections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={ruleForm.title}
                onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                placeholder="Rule title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={ruleForm.content}
                onChange={(e) => setRuleForm({ ...ruleForm, content: e.target.value })}
                placeholder="Rule content / instructions..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Input
                type="number"
                value={ruleForm.sort_order}
                onChange={(e) => setRuleForm({ ...ruleForm, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={saving || !ruleForm.title || !ruleForm.content || !ruleForm.section}>
              <Save className="size-4 mr-2" />
              {saving ? 'Saving...' : editingRule ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'New Section'}</DialogTitle>
            <DialogDescription>
              {editingSection ? 'Update this section.' : 'Add a new section for organizing rules.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                placeholder="e.g. orthography, context, tools"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Select value={sectionForm.color} onValueChange={(v) => setSectionForm({ ...sectionForm, color: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(COLOR_MAP).map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="capitalize">{c}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Input
                type="number"
                value={sectionForm.sort_order}
                onChange={(e) => setSectionForm({ ...sectionForm, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveSection} disabled={saving || !sectionForm.name}>
              <Save className="size-4 mr-2" />
              {saving ? 'Saving...' : editingSection ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
