"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { saveProfile, saveFacts } from "@/app/actions/profile";
import type { Project } from "@/lib/types";

type Skill = { name: string; evidence: string[] };
type Facts = { skills: Skill[]; projects: Project[] };

type Profile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  links: { github: string; linkedin: string; website: string };
  education: { school: string; program: string; expectedGraduation: string };
  summaries: { oneLine: string; short: string; long: string };
  availability: string;
  answers: Array<{ id: string; question: string; answer: string }>;
};
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  if (!value) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 shrink-0"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function Field({ label, value, onChange, multiline }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-start gap-1">
        {multiline ? (
          <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
        ) : (
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        )}
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function ProfileTab({ profile, setProfile }: {
  profile: Profile;
  setProfile: (p: Profile) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const set = (patch: Partial<Profile>) => setProfile({ ...profile, ...patch });
  const setLinks = (patch: Partial<Profile["links"]>) =>
    setProfile({ ...profile, links: { ...profile.links, ...patch } });
  const setEducation = (patch: Partial<Profile["education"]>) =>
    setProfile({ ...profile, education: { ...profile.education, ...patch } });
  const setSummaries = (patch: Partial<Profile["summaries"]>) =>
    setProfile({ ...profile, summaries: { ...profile.summaries, ...patch } });

  const onSave = async () => {
    setSaving(true);
    await saveProfile(profile);
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={profile.name} onChange={(v) => set({ name: v })} />
        <Field label="Email" value={profile.email} onChange={(v) => set({ email: v })} />
        <Field label="Phone" value={profile.phone} onChange={(v) => set({ phone: v })} />
        <Field label="Location" value={profile.location} onChange={(v) => set({ location: v })} />
        <Field label="Timezone" value={profile.timezone} onChange={(v) => set({ timezone: v })} />
        <Field label="Availability" value={profile.availability} onChange={(v) => set({ availability: v })} />
        <Field label="GitHub" value={profile.links.github} onChange={(v) => setLinks({ github: v })} />
        <Field label="LinkedIn" value={profile.links.linkedin} onChange={(v) => setLinks({ linkedin: v })} />
        <Field label="Website" value={profile.links.website} onChange={(v) => setLinks({ website: v })} />
        <Field label="School" value={profile.education.school} onChange={(v) => setEducation({ school: v })} />
        <Field label="Program" value={profile.education.program} onChange={(v) => setEducation({ program: v })} />
        <Field label="Expected graduation" value={profile.education.expectedGraduation} onChange={(v) => setEducation({ expectedGraduation: v })} />
      </div>
      <Field label="One line" value={profile.summaries.oneLine} onChange={(v) => setSummaries({ oneLine: v })} />
      <Field label="Short summary" value={profile.summaries.short} onChange={(v) => setSummaries({ short: v })} multiline />
      <Field label="Long summary" value={profile.summaries.long} onChange={(v) => setSummaries({ long: v })} multiline />
      <Button className="w-fit" onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

function SkillsTab({ facts, setFacts }: { facts: Facts; setFacts: (f: Facts) => void }) {
  const [newSkill, setNewSkill] = React.useState("");
  const projectIds = facts.projects.map((p) => p.id);

  const addSkill = () => {
    const name = newSkill.trim();
    if (!name) return;
    setFacts({ ...facts, skills: [...facts.skills, { name, evidence: [] }] });
    setNewSkill("");
  };

  const removeSkill = (name: string) => {
    setFacts({ ...facts, skills: facts.skills.filter((s: { name: string }) => s.name !== name) });
  };

  const setEvidence = (name: string, evidence: string[]) => {
    setFacts({
      ...facts,
      skills: facts.skills.map((s: { name: string; evidence: string[] }) => (s.name === name ? { ...s, evidence } : s)),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input placeholder="Add a skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} />
        <Button onClick={addSkill}>Add</Button>
      </div>
      {facts.skills.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No skills yet</EmptyTitle>
            <EmptyDescription>Add skills you have and which projects prove them.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        facts.skills.map((skill: { name: string; evidence: string[] }) => (
          <Card key={skill.name}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{skill.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeSkill(skill.name)}>Remove</Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Evidence (project ids)</Label>
                <Select value={skill.evidence.join(",")} onValueChange={(v: string | null) => setEvidence(skill.name, v ? v.split(",").filter(Boolean) : [])}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Select projects" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectIds.map((id: string) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1">
                  {skill.evidence.map((id: string) => (
                    <Badge key={id} variant="secondary">{id}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ProjectsTab({ facts, setFacts }: { facts: Facts; setFacts: (f: Facts) => void }) {
  const emptyProject: Project = { id: "", summary: "", tech: [], link: "", bullets: [] };
  const [editing, setEditing] = React.useState<Project | null>(null);

  const addProject = () => { setEditing({ ...emptyProject }); };
  const removeProject = (id: string) => {
    setFacts({ ...facts, projects: facts.projects.filter((p) => p.id !== id) });
  };
  const saveProject = () => {
    if (!editing) return;
    const exists = facts.projects.some((p) => p.id === editing.id);
    setFacts({
      ...facts,
      projects: exists
        ? facts.projects.map((p) => (p.id === editing.id ? editing : p))
        : [...facts.projects, editing],
    });
    setEditing(null);
  };

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{facts.projects.some((p) => p.id === editing.id) ? "Edit project" : "New project"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">ID</Label>
              <Input value={editing.id} onChange={(e) => setEditing({ ...editing, id: e.target.value })} placeholder="my-project" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Link</Label>
              <Input value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Summary</Label>
            <Textarea value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} rows={3} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Tech (comma separated)</Label>
            <Input value={editing.tech.join(", ")} onChange={(e) => setEditing({ ...editing, tech: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Bullets (one per line)</Label>
            <Textarea value={editing.bullets.join("\n")} onChange={(e) => setEditing({ ...editing, bullets: e.target.value.split("\n") })} rows={4} />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveProject} disabled={!editing.id.trim()}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button className="w-fit" onClick={addProject}>Add project</Button>
      {facts.projects.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>Add projects with tech links and resume bullets.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        facts.projects.map((project: Project) => (
          <Card key={project.id}>
            <CardContent className="flex flex-col gap-2 pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{project.id}</p>
                  {project.link && <p className="text-xs text-muted-foreground truncate">{project.link}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ ...project })}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => removeProject(project.id)}>Remove</Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{project.summary}</p>
              <div className="flex flex-wrap gap-1">
                {project.tech.map((t: string) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
              {project.bullets.filter(Boolean).length > 0 && (
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {project.bullets.filter(Boolean).map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

const PRESET_QUESTIONS = ["Availability", "Time zone", "Where are you located?", "Expected stipend or rate", "Link to your work"];

function AnswersTab({ profile, setProfile }: {
  profile: Profile;
  setProfile: (p: Profile) => void;
}) {
  const [newQ, setNewQ] = React.useState("");

  const addPreset = (q: string) => {
    if (profile.answers.some((a) => a.question === q)) return;
    setProfile({ ...profile, answers: [...profile.answers, { id: crypto.randomUUID(), question: q, answer: "" }] });
  };

  const addCustom = () => {
    const q = newQ.trim();
    if (!q) return;
    setProfile({ ...profile, answers: [...profile.answers, { id: crypto.randomUUID(), question: q, answer: "" }] });
    setNewQ("");
  };

  const remove = (id: string) => {
    setProfile({ ...profile, answers: profile.answers.filter((a) => a.id !== id) });
  };

  const setAnswer = (id: string, answer: string) => {
    setProfile({ ...profile, answers: profile.answers.map((a) => (a.id === id ? { ...a, answer } : a)) });
  };

  const setQuestion = (id: string, question: string) => {
    setProfile({ ...profile, answers: profile.answers.map((a) => (a.id === id ? { ...a, question } : a)) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1">
        {PRESET_QUESTIONS.filter((q) => !profile.answers.some((a) => a.question === q)).map((q) => (
          <Button key={q} variant="outline" size="sm" onClick={() => addPreset(q)}>+ {q}</Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Custom question..." value={newQ} onChange={(e) => setNewQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()} />
        <Button onClick={addCustom}>Add</Button>
      </div>
      {profile.answers.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No answers yet</EmptyTitle>
            <EmptyDescription>Add questions and write answers you can reuse in applications.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        profile.answers.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Question</Label>
                  <Input value={a.question} onChange={(e) => setQuestion(a.id, e.target.value)} />
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>Remove</Button>
              </div>
              <Field label="Answer" value={a.answer} onChange={(v) => setAnswer(a.id, v)} multiline />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export function FactsClient({ initialProfile, initialFacts }: {
  initialProfile: Profile;
  initialFacts: Facts;
}) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [facts, setFacts] = React.useState(initialFacts);
  const [tab, setTab] = React.useState("profile");

  React.useEffect(() => {
    if (tab === "profile") saveProfile(profile);
  }, [profile, tab]);

  React.useEffect(() => {
    if (tab === "skills" || tab === "projects") saveFacts(facts);
  }, [facts, tab]);

  return (
    <>
      <PageHeader>
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/facts">Facts</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profile Vault</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">Do not store ID numbers, passwords or bank details here.</p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="answers">Answers</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileTab profile={profile} setProfile={setProfile} />
          </TabsContent>
          <TabsContent value="skills">
            <SkillsTab facts={facts} setFacts={setFacts} />
          </TabsContent>
          <TabsContent value="projects">
            <ProjectsTab facts={facts} setFacts={setFacts} />
          </TabsContent>
          <TabsContent value="answers">
            <AnswersTab profile={profile} setProfile={setProfile} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
