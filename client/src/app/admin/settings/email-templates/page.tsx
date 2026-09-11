"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { FiMail, FiSend, FiX } from "react-icons/fi";

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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground ">Email Templates</h1>
       
      </div>

      {active && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* ── Fields ── */}
          <div className="bg-background border border-line rounded-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-line bg-surface/40">
              <div className="w-10 h-10 rounded-sm bg-surface flex items-center justify-center text-foreground shrink-0">
                <FiMail size={17} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold italic text-foreground">Email content</h2>
                <p className="text-xs text-foreground/60 mt-0.5">{active.description}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Subject line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Body (HTML)
                </label>
                <textarea
                  rows={14}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  spellCheck={false}
                  className={inputCls + " font-mono text-xs leading-relaxed resize-y"}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Available values</p>
                <div className="flex flex-wrap gap-1.5">
                  {active.vars.map((v) => (
                    <span
                      key={v.key}
                      title={`${v.label} — e.g. ${v.sample}`}
                      className="px-2.5 py-1 rounded-sm border border-line bg-surface/40 text-[11px] font-mono text-primary"
                    >
                      {`{{${v.key}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-line bg-surface/30 flex items-center justify-center gap-2">
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
                className="px-6 py-2.5 rounded-sm bg-surface text-foreground text-sm font-semibold hover:opacity-90 hover:bg-primary transition "
              >
                {saving ? "Saving..." : dirty ? "Save changes" : "Saved"}
              </button>
            </div>
          </div>
          {/* ── Preview ── */}
          <div className="bg-background border border-line rounded-sm overflow-hidden lg:sticky lg:top-6">
            <div className="px-6 py-4 border-b border-line bg-surface/40">
              <h2 className="text-sm font-bold text-foreground">Preview</h2>
              <p className="text-[11px] text-foreground mt-0.5">
                Sample data · updates as you type
              </p>
            </div>

            <div className="px-6 py-3 border-b border-line">
              <p className="text-[14px] text-foreground">Subject</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 break-words">
                {render(subject, sampleData) || (
                  <span className="text-foreground">No subject</span>
                )}
              </p>
            </div>

            <div className="p-4 bg-surface/20">
              {/* An iframe keeps the email's CSS out of the admin UI */}
              <iframe
                title="Email preview"
                srcDoc={previewShell(styleBodyHtml(render(body, sampleData)), logoUrl)}
                className="w-full h-[560px] rounded-sm border border-line bg-background"
                sandbox=""
              />
            </div>
          </div>

        </div>
      )}

      {/* ── Send test dialog ── */}
      {testOpen && active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background backdrop-blur-sm"
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
            
            </div>

            <div className="px-5 py-4 border-t border-line bg-surface/30 flex justify-end gap-2">
              <button
                onClick={() => setTestOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-foreground hover:bg-surface transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTest}
                disabled={testing || !testTo.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-surface text-foreground text-sm font-semibold hover:bg-primary transition "
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