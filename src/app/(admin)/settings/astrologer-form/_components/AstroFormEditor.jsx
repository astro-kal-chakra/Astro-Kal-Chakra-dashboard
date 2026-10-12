"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Lock, Plus, Save, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { cn } from "@/lib/utils";
import { saveAstroForm } from "@/actions/astroForm";

const TYPE_LABELS = {
  text: "Short text",
  textarea: "Long text",
  number: "Number",
  email: "Email",
  phone: "Phone",
  date: "Date",
  select: "Dropdown (pick one)",
  multiselect: "Pick many",
  image: "Photo",
  file: "Document (one file)",
  files: "Documents (several files)",
};
const STEP_HELP = {
  profile: "Shown first, right after OTP login.",
  documents: "Files are private: only admins can open them (5-minute links).",
  bank: "Where payouts go. Keep account details or UPI.",
};
const LIST_TABS = [
  { value: "skills", label: "Skills" },
  { value: "languages", label: "Languages" },
  { value: "categories", label: "Areas you help with" },
];
const LIST_HELP = {
  skills: "What astrologers practise (Vedic, Tarot…). Shown on profiles and website filters.",
  languages: "Languages astrologers can pick.",
  categories: "Topics like Love, Career. Used by the “Areas you help with” field and website categories.",
};
const SOURCE_NAMES = { skills: "Skills", languages: "Languages", categories: "Areas you help with" };

const snapshot = (f) => JSON.stringify({ fields: f.fields, options: f.options, steps: f.steps });

export function AstroFormEditor({ initial }) {
  const toast = useToast();
  const { can } = useAdmin();
  const editable = can("settings", "edit");
  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(null); // step key
  const [open, setOpen] = useState(null); // field key with details open
  const [listTab, setListTab] = useState("skills");
  const dirty = useMemo(() => snapshot(form) !== snapshot(saved), [form, saved]);

  const setField = (key, patch) =>
    setForm((f) => ({
      ...f,
      fields: f.fields.map((x) => {
        if (x.key !== key) return x;
        const next = { ...x, ...patch };
        if (!next.visible) next.required = false; // hidden can't be required
        return next;
      }),
    }));
  const move = (key, dir) =>
    setForm((f) => {
      const list = [...f.fields];
      const i = list.findIndex((x) => x.key === key);
      // Swap with the neighbour in the same step
      let j = i + dir;
      while (j >= 0 && j < list.length && list[j].step !== list[i].step) j += dir;
      if (j < 0 || j >= list.length) return f;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...f, fields: list };
    });
  const remove = (key) => setForm((f) => ({ ...f, fields: f.fields.filter((x) => x.key !== key) }));
  const setStepTitle = (step, title) => setForm((f) => ({ ...f, steps: f.steps.map((s) => (s.key === step ? { ...s, title } : s)) }));
  const setOption = (kind, i, patch) => setForm((f) => ({ ...f, options: { ...f.options, [kind]: f.options[kind].map((o, k) => (k === i ? { ...o, ...patch } : o)) } }));
  const addOption = (kind, label) => setForm((f) => ({ ...f, options: { ...f.options, [kind]: [...f.options[kind], { label, active: true }] } }));
  const removeOption = (kind, i) => setForm((f) => ({ ...f, options: { ...f.options, [kind]: f.options[kind].filter((_, k) => k !== i) } }));

  const save = async () => {
    setBusy(true);
    const r = await saveAstroForm({ fields: form.fields, options: form.options, steps: form.steps });
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error", duration: 7000 });
    setSaved(r.data.data);
    setForm(r.data.data);
    toast(r.data.message || "Saved", { description: "New astrologers see the updated form" });
  };

  const addField = (draft) => {
    setForm((f) => ({ ...f, fields: [...f.fields, { ...draft, key: "", custom: true, visible: true }] }));
    setAdding(null);
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      {form.steps.map((step, si) => {
        const fields = form.fields.filter((x) => x.step === step.key);
        const shown = fields.filter((x) => x.visible);
        return (
          <Card key={step.key}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <span className="text-muted">Step {si + 1}.</span>
                  <Input aria-label={`Step ${si + 1} title`} value={step.title} onChange={(e) => setStepTitle(step.key, e.target.value)} disabled={!editable} className="h-8 max-w-64" />
                </span>
              }
              description={`${STEP_HELP[step.key]} ${shown.length} shown, ${shown.filter((x) => x.required).length} required.`}
              action={
                editable && (
                  <Button size="sm" icon={<Plus />} onClick={() => setAdding(step.key)}>
                    Add field
                  </Button>
                )
              }
            />
            <ul className="divide-y divide-border">
              {fields.map((x, i) => {
                const locked = x.key === "name";
                const isOpen = open === x.key;
                return (
                  <li key={x.key || `new-${i}`} className={cn("px-3 py-2.5 sm:px-4", !x.visible && "bg-surface-2/60")}>
                    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
                      <div className="flex shrink-0 flex-col">
                        <button type="button" aria-label={`Move ${x.label} up`} disabled={!editable || i === 0} onClick={() => move(x.key, -1)} className="text-muted hover:text-text disabled:opacity-30">
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button type="button" aria-label={`Move ${x.label} down`} disabled={!editable || i === fields.length - 1} onClick={() => move(x.key, 1)} className="text-muted hover:text-text disabled:opacity-30">
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Input aria-label="Field label" value={x.label} onChange={(e) => setField(x.key, { label: e.target.value })} disabled={!editable} className={cn("h-8", !x.visible && "text-muted")} />
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                          <Badge tone={x.custom ? "accent" : "neutral"}>{x.custom ? "Your field" : "Built-in"}</Badge>
                          <span>{TYPE_LABELS[x.type] || x.type}</span>
                          {x.source && <span>· options: {SOURCE_NAMES[x.source]} list below</span>}
                          {x.custom && x.options?.length > 0 && <span>· {x.options.length} options</span>}
                          {locked && (
                            <span className="inline-flex items-center gap-1">
                              <Lock className="size-3" /> always shown and required
                            </span>
                          )}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted">
                        Shown
                        <Switch checked={x.visible} onChange={(v) => setField(x.key, { visible: v })} disabled={!editable || locked} label={`Show ${x.label}`} />
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted">
                        Required
                        <Switch checked={x.required} onChange={(v) => setField(x.key, { required: v })} disabled={!editable || locked || !x.visible} label={`${x.label} required`} />
                      </label>
                      <button type="button" onClick={() => setOpen(isOpen ? null : x.key)} className="text-muted hover:text-text" aria-label={`More for ${x.label}`}>
                        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                      {x.custom && editable && (
                        <button type="button" onClick={() => remove(x.key)} className="text-muted hover:text-danger" aria-label={`Delete ${x.label}`}>
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Help text (shown under the field)" htmlFor={`help-${x.key}`}>
                          <Input id={`help-${x.key}`} value={x.help || ""} maxLength={200} onChange={(e) => setField(x.key, { help: e.target.value })} disabled={!editable} />
                        </Field>
                        {x.custom && ["select", "multiselect"].includes(x.type) && (
                          <Field label="Options (one per line)" htmlFor={`opts-${x.key}`}>
                            <Textarea id={`opts-${x.key}`} rows={3} value={(x.options || []).join("\n")} onChange={(e) => setField(x.key, { options: e.target.value.split("\n") })} disabled={!editable} />
                          </Field>
                        )}
                        {x.custom && x.type === "files" && (
                          <Field label="Most files" htmlFor={`max-${x.key}`}>
                            <Input id={`max-${x.key}`} type="number" min={1} max={5} value={x.max || 3} onChange={(e) => setField(x.key, { max: Number(e.target.value) })} disabled={!editable} />
                          </Field>
                        )}
                        {!x.custom && (x.min !== undefined || x.max !== undefined) && (
                          <p className="self-end text-xs text-muted">
                            Limits: {x.min !== undefined ? `min ${x.min}` : ""} {x.max !== undefined ? `max ${x.max}` : ""} {x.type === "textarea" || x.type === "text" ? "characters" : ""}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      <Card>
        <CardHeader title="Lists" description="Options astrologers pick from. Renaming changes the name everywhere; turning one off hides it for new picks (astrologers who already chose it keep it)." />
        <div className="-mb-px flex gap-1 overflow-x-auto border-b border-border px-2" role="tablist">
          {LIST_TABS.map((t) => {
            const on = t.value === listTab;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setListTab(t.value)}
                className={cn("inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap", on ? "border-primary text-primary-ink" : "border-transparent text-muted hover:text-text")}
              >
                {t.label}
                <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[11px] leading-none text-muted">{form.options[t.value]?.filter((o) => o.active).length ?? 0}</span>
              </button>
            );
          })}
        </div>
        <CardBody className="space-y-3">
          <p className="text-xs text-muted">{LIST_HELP[listTab]}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {form.options[listTab].map((o, i) => (
              <li key={o.key || `new-${i}`} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
                <Input aria-label="Name" value={o.label} onChange={(e) => setOption(listTab, i, { label: e.target.value })} disabled={!editable} className={cn("h-8", !o.active && "text-muted line-through")} />
                <Switch checked={o.active} onChange={(v) => setOption(listTab, i, { active: v })} disabled={!editable} label={`${o.label} active`} />
                {!o.key && editable && (
                  <button type="button" onClick={() => removeOption(listTab, i)} className="text-muted hover:text-danger" aria-label={`Remove ${o.label}`}>
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {editable && <AddOption kind={listTab} onAdd={(label) => addOption(listTab, label)} existing={form.options[listTab]} />}
        </CardBody>
      </Card>

      {editable && (
        <div className="sticky bottom-0 z-20 -mx-1 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
            <div className="flex gap-2">
              <Button onClick={() => setForm(saved)} disabled={!dirty || busy}>
                Discard
              </Button>
              <Button variant="primary" icon={<Save />} loading={busy} disabled={!dirty} onClick={save}>
                Save form
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddFieldModal step={adding} types={initial.types} onClose={() => setAdding(null)} onAdd={addField} />
    </div>
  );
}

function AddOption({ kind, onAdd, existing }) {
  const [label, setLabel] = useState("");
  const add = (e) => {
    e.preventDefault();
    const v = label.trim();
    if (!v) return;
    if (existing.some((o) => o.label.toLowerCase() === v.toLowerCase())) return;
    onAdd(v);
    setLabel("");
  };
  return (
    <form onSubmit={add} className="flex gap-2">
      <Input aria-label={`New ${kind}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={kind === "languages" ? "e.g. Odia" : kind === "skills" ? "e.g. Reiki Healing" : "e.g. Property"} className="max-w-xs" />
      <Button type="submit" icon={<Plus />} disabled={!label.trim()}>
        Add
      </Button>
    </form>
  );
}

const CUSTOM_TYPES = ["text", "textarea", "number", "email", "phone", "date", "select", "multiselect", "image", "file", "files"];

function AddFieldModal({ step, onClose, onAdd }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [required, setRequired] = useState(false);
  const [help, setHelp] = useState("");
  const [options, setOptions] = useState("");
  const [max, setMax] = useState(3);
  const reset = () => {
    setLabel("");
    setType("text");
    setRequired(false);
    setHelp("");
    setOptions("");
    setMax(3);
  };
  const needsOptions = ["select", "multiselect"].includes(type);
  const opts = options.split("\n").map((o) => o.trim()).filter(Boolean);
  const valid = label.trim() && (!needsOptions || opts.length);
  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onAdd({ step, label: label.trim(), type, required, help: help.trim(), ...(needsOptions ? { options: opts } : {}), ...(type === "files" ? { max } : {}) });
    reset();
  };
  return (
    <Modal
      open={Boolean(step)}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add a field"
      description={step === "documents" ? "Documents are stored privately for admin review." : "Astrologers fill this in during registration."}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="add-field" disabled={!valid}>
            Add field
          </Button>
        </>
      }
    >
      <form id="add-field" onSubmit={submit} className="space-y-4">
        <Field label="Label" htmlFor="af-label">
          <Input id="af-label" value={label} maxLength={100} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Temple / Gurukul" autoFocus />
        </Field>
        <Field label="Type" htmlFor="af-type">
          <Select id="af-type" value={type} onChange={(e) => setType(e.target.value)} options={CUSTOM_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))} />
        </Field>
        {needsOptions && (
          <Field label="Options (one per line)" htmlFor="af-opts">
            <Textarea id="af-opts" rows={4} value={options} onChange={(e) => setOptions(e.target.value)} placeholder={"Option 1\nOption 2"} />
          </Field>
        )}
        {type === "files" && (
          <Field label="Most files" htmlFor="af-max">
            <Input id="af-max" type="number" min={1} max={5} value={max} onChange={(e) => setMax(Number(e.target.value))} />
          </Field>
        )}
        <Field label="Help text (optional)" htmlFor="af-help">
          <Input id="af-help" value={help} maxLength={200} onChange={(e) => setHelp(e.target.value)} />
        </Field>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
          Required
          <Switch checked={required} onChange={setRequired} label="Required" />
        </label>
      </form>
    </Modal>
  );
}
