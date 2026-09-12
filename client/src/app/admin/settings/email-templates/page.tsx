"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { FiSend, FiX } from "react-icons/fi";

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

const BRAND = {
  ink: "#0d0d0d",
  red: "#B90808",
  paper: "#ffffff",
  text: "#1a1a1a",
  muted: "#8a8a8a",
  border: "#e6e6e6",
};

/** Mirrors renderTemplate() on the server — same regex, same fallback. */
const render = (str: string, data: Record<string, string>) =>
  String(str || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => data[k] ?? "");

/** Mirrors styleBodyHtml() in server/config/emailLayout.js. */
const styleBodyHtml = (html: string) =>
  String(html || "")
    .replace(/<p>/g, `<p style="margin:0 0 14px;">`)
    .replace(/<a /g, `<a style="color:${BRAND.red};text-decoration:underline;" `)
    .replace(/<strong>/g, `<strong style="font-weight:600;color:${BRAND.ink};">`)
    .replace(
      /<h([1-3])>/g,
      (_: string, n: string) =>
        `<h${n} style="margin:0 0 12px;font-size:${[22, 19, 17][Number(n) - 1]}px;color:${BRAND.ink};">`
    );

/** Mirrors wrapEmail() in server/config/emailLayout.js — the shared shell. */
const previewShell = (html: string, logoUrl: string | null, platformName = "Luvenex") => {
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${platformName}" width="140" style="display:block;border:0;max-width:140px;height:auto;" />`
    : `<span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:26px;font-weight:700;color:${BRAND.paper};letter-spacing:0.5px;">${platformName}</span>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:20px 10px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${BRAND.paper};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">
        <tr><td align="center" style="background:${BRAND.ink};padding:26px 24px;">${logoBlock}</td></tr>
        <tr><td style="height:3px;background:${BRAND.red};line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:32px 32px 28px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${BRAND.text};">
          ${html}
        </td></tr>
        <tr><td style="background:${BRAND.ink};padding:22px 32px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <p style="margin:0 0 6px;font-size:12px;color:${BRAND.paper};font-weight:600;">${platformName}</p>
          <p style="margin:0;font-size:11px;line-height:1.6;color:${BRAND.muted};">
            You received this because of activity on your account.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

export default function EmailTemplatesPage() {
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeKey, setActiveKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testOpen, setTestOpen] = useState(false);

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

    // The shell shows the real platform logo, same as the sent email does.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/branding`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.branding?.logo) {
          setLogoUrl(`${process.env.NEXT_PUBLIC_API_URL}${d.branding.logo}`);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    setSubject(active.subject);
    setBody(active.body);
  }, [activeKey, templates]);

  const sampleData = Object.fromEntries(
    (active?.vars || []).map((v) => [v.key, v.sample])
  ) as Record<string, string>;

  const dirty = active !== null && (subject !== active.subject || body !== active.body);

  /** Drops {{variable}} in at the cursor of whichever field was last focused. */
  const insertVar = (key: string) => {
    const token = `{{${key}}}`;
    const isSubject = lastFocused.current === "subject";
    const el = isSubject ? subjectRef.current : bodyRef.current;
    if (!el) return;

    const value = isSubject ? subject : body;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    const next = value.slice(0, start) + token + value.slice(end);

    if (isSubject) setSubject(next);
    else setBody(next);

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
        body: { subject, body },
      });
      toast.success("Template saved");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Sends whatever is currently in the fields, saved or not.
  const handleTest = async () => {
    if (!active) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo.trim())) {
      return toast.error("Enter a valid email address to test with.");
    }

    setTesting(true);
    try {
      const d = await apiFetch(`/api/email-templates/${active.key}/test`, {
        method: "POST",
        token: getToken()!,
        body: { to: testTo.trim(), subject, body },
      });
      toast.success(d.message);
      setTestOpen(false);
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
    "w-full px-3.5 py-2.5 rounded-sm border border-line bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  return (
    <div className="max-w-6xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
      </div>

      {active && (
        <>
          {/* Applies to both tabs, so it sits above them */}
          <div className="mb-5 max-w-sm">
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Which email
            </label>
            <select
              value={activeKey}
              onChange={(e) => setActiveKey(e.target.value)}
              className={inputCls + " cursor-pointer"}
            >
              {templates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-foreground/50 mt-1.5">{active.description}</p>
          </div>

          {/* ── Editor / Preview ── */}
          <div className="flex items-center gap-6  mb-6">
            {(["editor", "preview"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative pb-3 text-sm font-semibold capitalize transition ${
                  tab === t ? "text-primary" : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {t}
                {tab === t && (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {tab === "editor" ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
              {/* ── Fields ── */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Email Subject
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
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <label className="text-xs font-semibold text-foreground">Body (HTML)</label>
                    <span className="text-[11px] text-foreground/35">
                      {body.length.toLocaleString()} characters
                    </span>
                  </div>
                  {/* Framed as one block so the editor reads as a code pane
                      rather than a large empty field. */}
                  <div className="rounded-sm border border-line bg-surface/30 focus-within:border-primary transition overflow-hidden">
                    <textarea
                      ref={bodyRef}
                      rows={11}
                      value={body}
                      onFocus={() => (lastFocused.current = "body")}
                      onChange={(e) => setBody(e.target.value)}
                      spellCheck={false}
                      className="w-full px-4 py-3.5 bg-transparent text-foreground font-mono text-xs leading-[1.7] resize-y focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setTestOpen(true)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-sm border border-line text-sm font-semibold text-foreground hover:bg-surface transition"
                  >
                    <FiSend size={14} />
                    Send test
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    className={`px-6 py-2.5 rounded-sm text-sm font-semibold transition ${
                      dirty
                        ? "bg-primary text-white hover:opacity-90"
                        : "border border-line text-foreground/40 cursor-default"
                    }`}
                  >
                    {saving ? "Saving..." : dirty ? "Save changes" : "No changes"}
                  </button>
                </div>
              </div>

             
              <div className="rounded-sm border border-line border-l-2 bg-surface/40 p-5 lg:sticky lg:top-6">
                <p className="text-sm font-bold text-foreground">Available Variables</p>
                <p className="text-xs text-foreground/60 mt-1.5 leading-relaxed">
                  Click one to drop it into whichever field you last had selected. Each is replaced
                  with real data when the email sends.
                </p>

                <div className="mt-4 space-y-1.5">
                  {active.vars.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVar(v.key)}
                      className="w-full text-left px-3 py-2 rounded-sm border border-line bg-background hover:border-primary hover:bg-primary/5 transition group"
                    >
                      <span className="block font-mono text-[11px] text-primary">
                        {`{{${v.key}}}`}
                      </span>
                      <span className="block text-[11px] text-foreground/50 mt-0.5 truncate">
                        {v.label} — {v.sample}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Preview ── */
            <div className="max-w-2xl">
              <div className="rounded-sm border border-line overflow-hidden">
                <div className="px-5 py-3 border-b border-line bg-surface/40">
                  <p className="text-[11px] text-foreground/50">Subject</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 break-words">
                    {render(subject, sampleData) || (
                      <span className="text-foreground/30">No subject</span>
                    )}
                  </p>
                </div>

                <div className="p-4 bg-surface/20">
                  {/* An iframe keeps the email's CSS out of the admin UI */}
                  <iframe
                    title="Email preview"
                    srcDoc={previewShell(styleBodyHtml(render(body, sampleData)), logoUrl)}
                    className="w-full h-[620px] rounded-sm border border-line bg-white"
                    sandbox=""
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Send test dialog ── */}
      {testOpen && active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setTestOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-background border border-line rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground">Send a test</h3>
                <p className="text-[11px] text-foreground/50 mt-0.5 truncate">{active.name}</p>
              </div>
              <button
                onClick={() => setTestOpen(false)}
                className="w-8 h-8 shrink-0 rounded-lg text-foreground/50 hover:text-foreground hover:bg-surface flex items-center justify-center transition"
                aria-label="Close"
              >
                <FiX size={17} />
              </button>
            </div>

            <div className="px-5 py-5">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoFocus
                placeholder="you@example.com"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTest();
                  if (e.key === "Escape") setTestOpen(false);
                }}
                className={inputCls}
              />
              <p className="text-[11px] text-foreground/50 mt-2">
                Sends what&apos;s in the fields right now, saved or not.
              </p>
            </div>

            <div className="px-5 py-4 border-t border-line bg-surface/30 flex justify-end gap-2">
              <button
                onClick={() => setTestOpen(false)}
                className="px-4 py-2.5 rounded-sm border border-line text-sm font-semibold text-foreground hover:bg-surface transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTest}
                disabled={testing || !testTo.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-surface text-foreground text-sm font-semibold hover:bg-primary hover:text-white transition disabled:opacity-40"
              >
                <FiSend size={14} />
                {testing ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}