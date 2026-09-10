"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  FiPhone,
  FiSettings,
  FiAlignLeft,
  FiSave,
  FiHeadphones,
  FiMessageCircle,
  FiAlignRight,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const DEFAULT_COLOR = "#25D366"; // WhatsApp green

const POSITIONS = [
  { value: "bottom-right", label: "Bottom Right", icon: FiAlignRight },
  { value: "bottom-left", label: "Bottom Left", icon: FiAlignLeft },
] as const;

const ICONS = [
  { value: "headset", label: "Headset", icon: FiHeadphones },
  { value: "chat-bubble", label: "Chat Bubble", icon: FiMessageCircle },
  { value: "whatsapp", label: "WhatsApp Style", icon: FaWhatsapp },
] as const;

const ICON_MAP = {
  headset: FiHeadphones,
  "chat-bubble": FiMessageCircle,
  whatsapp: FaWhatsapp,
} as const;

type Position = (typeof POSITIONS)[number]["value"];
type IconKey = (typeof ICONS)[number]["value"];

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background border border-line rounded-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-line bg-surface/40">
        <span className="text-primary shrink-0">{icon}</span>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

/* Segmented selector — the click targets from the mockup. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly { value: T; label: string; icon: any }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-sm border text-sm font-semibold transition ${
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-muted hover:text-foreground hover:border-foreground/20"
            }`}
          >
            <Icon size={15} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SupportPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isEnabled, setIsEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLOR);
  const [widgetPosition, setWidgetPosition] = useState<Position>("bottom-right");
  const [buttonIcon, setButtonIcon] = useState<IconKey>("headset");
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerSubtitle, setHeaderSubtitle] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");

  useEffect(() => {
       fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/support`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(
            r.status === 404
              ? "Support endpoint not found — check that /api/support is mounted and NEXT_PUBLIC_API_URL points at the right server."
              : `Request failed (${r.status})`
          );
        }
        return r.json();
      })
      .then((data) => {
        const s = data.support ?? {};
        setIsEnabled(s.isEnabled ?? true);
        setWhatsappNumber(s.whatsappNumber || "");
        setPrimaryColor(s.primaryColor || DEFAULT_COLOR);
        setWidgetPosition(s.widgetPosition || "bottom-right");
        setButtonIcon(s.buttonIcon || "headset");
        setHeaderTitle(s.headerTitle || "");
        setHeaderSubtitle(s.headerSubtitle || "");
        setGreetingMessage(s.greetingMessage || "");
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const digits = whatsappNumber.replace(/\D/g, "");
    if (isEnabled && !digits) {
      return toast.error("Add a WhatsApp number, or turn the widget off.");
    }
    if (digits && (digits.length < 8 || digits.length > 15)) {
      return toast.error("Include the country code — 8 to 15 digits, no symbols.");
    }

    setSaving(true);
    try {
      const data = await apiFetch("/api/support", {
        method: "PATCH",
        token: getToken()!,
        body: {
          isEnabled,
          whatsappNumber: digits,
          primaryColor,
          widgetPosition,
          buttonIcon,
          headerTitle,
          headerSubtitle,
          greetingMessage,
        },
      });
      const s = data.support;
      setWhatsappNumber(s.whatsappNumber || "");
      toast.success("Support widget updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
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
    "w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  const LauncherIcon = ICON_MAP[buttonIcon];
  const isRight = widgetPosition === "bottom-right";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground italic">Support Widget</h1>
        <p className="text-sm text-muted mt-1">
          The floating chat button that opens WhatsApp for visitors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── Form ── */}
        <div className="space-y-5">
          <Card title="WhatsApp Number" icon={<FiPhone size={17} />}>
            <label className="flex items-center justify-between gap-4 pb-4 border-b border-line/60 cursor-pointer">
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Show the widget
                </span>
                <span className="block text-xs text-muted mt-0.5">
                  Turn off to hide it everywhere without losing these settings.
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                onClick={() => setIsEnabled(!isEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  isEnabled ? "bg-primary" : "bg-line"
                }`}
              >
                <span
                  className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform duration-200 ${
                    isEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Support WhatsApp Number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="923001234567"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className={inputCls}
              />
              <p className="text-xs text-muted mt-1.5">
                Country code + number, no spaces or symbols. E.g. 923001234567 for Pakistan.
              </p>
            </div>
          </Card>

          <Card title="Appearance" icon={<FiSettings size={17} />}>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-11 rounded-sm border border-line cursor-pointer bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className={inputCls}
                />
                {primaryColor.toUpperCase() !== DEFAULT_COLOR && (
                  <button
                    type="button"
                    onClick={() => setPrimaryColor(DEFAULT_COLOR)}
                    className="text-xs text-muted hover:text-foreground underline whitespace-nowrap shrink-0"
                  >
                    Reset to green
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Widget Position
              </label>
              <Segmented
                value={widgetPosition}
                options={POSITIONS}
                onChange={setWidgetPosition}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Button Icon
              </label>
              <Segmented value={buttonIcon} options={ICONS} onChange={setButtonIcon} />
            </div>
          </Card>

          <Card title="Widget Content" icon={<FiAlignLeft size={17} />}>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Header Title
              </label>
              <input
                type="text"
                maxLength={60}
                placeholder="Loomaze Support"
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Header Subtitle
              </label>
              <input
                type="text"
                maxLength={100}
                placeholder="We reply within minutes"
                value={headerSubtitle}
                onChange={(e) => setHeaderSubtitle(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Greeting Message (bubble + chat prompt)
              </label>
              <textarea
                rows={3}
                maxLength={400}
                placeholder="Need help? Describe your issue and we'll assist you on WhatsApp right away."
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                className={inputCls}
              />
              <p className="text-xs text-muted mt-1.5">
                {greetingMessage.length}/400
              </p>
            </div>
          </Card>

         <div className="flex justify-center">
             <button
            onClick={handleSave}
            disabled={saving}
            className=" flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 shadow-sm"
          >
            <FiSave size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
         </div>
        </div>

        {/* ── Live preview ── */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-background border border-line rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-line bg-surface/40">
              <h2 className="text-base font-bold text-foreground">Preview</h2>
              <p className="text-xs text-muted mt-0.5">Updates as you edit</p>
            </div>

            <div className="p-5 bg-surface/40">
              <div className="rounded-xl border border-line bg-background overflow-hidden">
                <div
                  className="px-4 py-3 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <p className="text-sm font-bold leading-tight">
                    {headerTitle || "Header title"}
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {headerSubtitle || "Header subtitle"}
                  </p>
                </div>
                <div className="p-4">
                  <div className="rounded-xl rounded-tl-sm bg-surface px-3 py-2.5 text-xs text-foreground">
                    {greetingMessage || "Your greeting message appears here."}
                  </div>
                </div>
              </div>

              {/* Launcher, in the chosen corner */}
              <div
                className={`mt-4 flex ${isRight ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  <LauncherIcon size={20} />
                </div>
              </div>

              <p className="text-[11px] text-muted mt-3 text-center">
                {isEnabled
                  ? `Shows in the ${isRight ? "bottom right" : "bottom left"} corner`
                  : "Widget is turned off — visitors won't see this"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}