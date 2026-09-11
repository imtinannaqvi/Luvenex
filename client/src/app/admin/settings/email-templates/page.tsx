"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { FiMail, FiRotateCcw, FiSend, FiEye, FiCode } from "react-icons/fi";

type Variable = { key: string; label: string; sample: string };

type Template = {
  key: string;
  name: string;
  description: string;
  vars: Variable[];
  subject: string;
  body: string;
  isActive: boolean;
  isCustomised: boolean;
  updatedAt: string | null;
};

/** Mirrors renderTemplate() on the server — same regex, same fallback. */
const render = (str: string, data: Record<string, string>) =>
  String(str || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => data[k] ?? "");

// Wraps the body so the preview looks like an email, not a bare fragment.
const previewShell = (html: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; padding:24px; font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         font-size:15px; line-height:1.6; color:#1a1a1a; background:#ffffff; }
  a { color:#B90808; }
  p { margin:0 0 14px; }
  strong { font-weight:600; }
</style></head><body>${html}</body></html>`;

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeKey, setActiveKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSource, setShowSource] = useState(false);

  // Local edits, kept separate so Cancel/Reset can fall back to the server copy.
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isActive, setIsActive] = useState(true);

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastFocused = useRef<"subject" | "body">("body");

  const active = templates.find((t) => t.key === activeKey) || null;

  const load = () =>
    apiFetch("/api/email-templates", { token: getToken()! })
      .then((d: any) => {
        const list: Template[] = d.templates || [];
        setTemplates(list);
        setActiveKey((prev) => prev || list[0]?.key || "");
      })
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  // Pull the selected template into the editor whenever the selection changes.
  useEffect(() => {
    if (!active) return;
    setSubject(active.subject);
    setBody(active.body);
    setIsActive(active.isActive);
    setShowSource(false);
  }, [activeKey, templates]);

  const sampleData = Object.fromEntries(
    (active?.vars || []).map((v) => [v.key, v.sample])
  ) as Record<string, string>;

  const dirty =
    active !== null &&
    (subject !== active.subject || body !== active.body || isActive !== active.isActive);

  /** Drops {{variable}} in at the cursor of whichever field was last focused. */
  const insertVar = (key: string) => {
    const token = `{{${key}}}`;

    if (lastFocused.current === "subject") {
      const el = subjectRef.current;
      if (!el) return;
      const start = el.selectionStart ?? subject.length;
      const end = el.selectionEnd ?? start;
      const next = subject.slice(0, start) + token + subject.slice(end);
      setSubject(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
      return;
    }

    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? start;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleSave = async () => {
    if (!active) return;
    if (!subject.trim()) return toast.error("Subject can't be empty.");
    if (!body.trim()) return toast.error("Body can't be empty.");

    setSaving(true);
    try {
      await apiFetch(`/api/email-templates/${active.key}`, {
        method: "PATCH",
        token: getToken()!,
        body: { subject, body, isActive },
      });
      toast.success("Template saved");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!active) return;
    if (!confirm("Discard your changes and restore the original wording?")) return;
    try {
      await apiFetch(`/api/email-templates/${active.key}/reset`, {
        method: "POST",
        token: getToken()!,
      });
      toast.success("Template reset");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleTest = async () => {
    if (!active) return;
    setTesting(true);
    try {
      const d = await apiFetch(`/api/email-templates/${active.key}/test`, {
        method: "POST",
        token: getToken()!,
      });
      toast.info(d.message);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-line bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Email Templates</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Wording for automatic emails. Edit on the left, see the result on the right.
        </p>
      </div>

      {/* Template picker */}
      <div className="flex flex-wrap items-center gap-2 mb-5 p-1.5 bg-surface border border-line rounded-sm overflow-x-auto">
        {templates.map((t) => {
          const selected = t.key === activeKey;
          return (
            <button
              key={t.key}
              onClick={() => setActiveKey(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-sm transition whitespace-nowrap shrink-0 ${
                selected
                  ? "bg-background text-foreground shadow-sm border border-line"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {t.name}
              {!t.isActive && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-white/10 text-muted">
                  OFF
                </span>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* ── Editor ── */}
          <div className="bg-background border border-line rounded-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-line bg-surface/40">
              <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center text-white shrink-0">
                <FiMail size={17} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold italic text-foreground">{active.name}</h2>
                <p className="text-xs text-foreground/60 mt-0.5">{active.description}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <label className="flex items-center justify-between gap-4 p-4 rounded-sm border border-line bg-surface/30 cursor-pointer">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    Send this email
                  </span>
                  <span className="block text-xs text-foreground/60 mt-0.5">
                    Turn off to stop it sending without losing the wording.
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                    isActive ? "bg-primary" : "bg-line"
                  }`}
                >
                  <span
                    className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform duration-200 ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Subject line
                </label>
                <input
                  ref={subjectRef}
                  type="text"
                  value={subject}
                  onFocus={() => (lastFocused.current = "subject")}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold text-foreground">Body (HTML)</label>
                  <span className="text-[11px] text-foreground/40">
                    {body.length.toLocaleString()} chars
                  </span>
                </div>
                <textarea
                  ref={bodyRef}
                  rows={14}
                  value={body}
                  onFocus={() => (lastFocused.current = "body")}
                  onChange={(e) => setBody(e.target.value)}
                  spellCheck={false}
                  className={inputCls + " font-mono text-xs leading-relaxed resize-y"}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Click to insert a value
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {active.vars.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVar(v.key)}
                      title={`${v.label} — e.g. ${v.sample}`}
                      className="px-2.5 py-1 rounded-sm border border-line bg-surface/40 text-[11px] font-mono text-primary hover:border-primary hover:bg-primary/5 transition"
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-foreground/50 mt-2">
                  Anything in double braces is swapped for real data when the email sends.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-line bg-surface/30 flex flex-wrap items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
              >
                {saving ? "Saving..." : dirty ? "Save changes" : "Saved"}
              </button>

              <button
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-foreground hover:bg-surface transition disabled:opacity-50"
              >
                <FiSend size={14} />
                {testing ? "Sending..." : "Send test"}
              </button>

              {active.isCustomised && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 ml-auto px-3 py-2.5 text-xs font-semibold text-foreground/50 hover:text-primary transition"
                >
                  <FiRotateCcw size={13} />
                  Reset to original
                </button>
              )}
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="bg-background border border-line rounded-sm overflow-hidden lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-line bg-surface/40">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-foreground">Preview</h2>
                <p className="text-[11px] text-foreground/50 mt-0.5">
                  Filled with sample data · updates as you type
                </p>
              </div>
              <button
                onClick={() => setShowSource((s) => !s)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-line text-[11px] font-semibold text-foreground/60 hover:text-foreground transition shrink-0"
              >
                {showSource ? <FiEye size={12} /> : <FiCode size={12} />}
                {showSource ? "Rendered" : "Source"}
              </button>
            </div>

            {/* Fake inbox header */}
            <div className="px-6 py-3 border-b border-line">
              <p className="text-[11px] text-foreground/40">Subject</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 break-words">
                {render(subject, sampleData) || (
                  <span className="text-foreground/30">No subject</span>
                )}
              </p>
            </div>

            <div className="p-4 bg-surface/20">
              {showSource ? (
                <pre className="text-[11px] font-mono text-foreground/70 whitespace-pre-wrap break-words max-h-[520px] overflow-y-auto">
                  {render(body, sampleData)}
                </pre>
              ) : (
                /* An iframe keeps the email's CSS from leaking into the admin UI */
                <iframe
                  title="Email preview"
                  srcDoc={previewShell(render(body, sampleData))}
                  className="w-full h-[520px] rounded-sm border border-line bg-white"
                  sandbox=""
                />
              )}
            </div>

            <div className="px-6 py-3 border-t border-line">
              <p className="text-[11px] text-foreground/50">
                No mail service is connected yet — sending is logged to the server terminal.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}