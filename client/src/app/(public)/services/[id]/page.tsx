"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useParams, useRouter } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(0);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const user = getUser();

  useEffect(() => {
    apiFetch(`/api/services/${id}`)
      .then((data) => setService(data.service))
      .catch((err) => setError(err.message || "Service not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return router.push("/login");
    setSubmitting(true);
    try {
      await apiFetch("/api/service-requests", {
        method: "POST",
        token: getToken()!,
        body: {
          title,
          description,
          category: service.category,
          budgetMinMinor: budgetMin ? Number(budgetMin) * 100 : undefined,
          budgetMaxMinor: budgetMax ? Number(budgetMax) * 100 : undefined,
          deadline,
          serviceId: service._id,
        },
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Word/Docs paste artifact cleanup — normalize non-breaking spaces.
  const cleanHtml = (html?: string) => {
    if (!html) return "";
    return html
      .replace(/-(\s*)(<br\s*\/?>\s*)+/gi, "-")
      .replace(/&nbsp;/gi, " ")
      .replace(/\u00A0/g, " ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-transparent border-t-red-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
        <div className="bg-surface backdrop-blur-xl border border-border-color p-8 rounded-3xl max-w-sm w-full shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-800/50 text-red-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-foreground font-bold text-base">Service Unavailable</p>
          <p className="text-muted text-xs mt-1.5 leading-relaxed">
            {error || "The requested service could not be found."}
          </p>
          <button
            onClick={() => router.push("/services")}
            className="mt-6 w-full py-3 rounded-xl bg-red-600 text-foreground font-semibold text-xs tracking-wide uppercase transition hover:bg-red-700 active:scale-95 shadow-lg shadow-red-600/30 cursor-pointer"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  const sections: { title: string; description: string }[] = Array.isArray(service.sections)
    ? service.sections
    : [];
  const active = sections[activeSection] || sections[0];

  return (
    <div className="bg-background text-foreground min-h-screen selection:bg-red-600 selection:text-white relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="group relative w-full h-[400px] md:h-[500px] overflow-hidden flex items-center justify-center bg-card">
        {service.videos?.[0] ? (
          <video
            src={`${process.env.NEXT_PUBLIC_API_URL}${service.videos[0]}`}
            className="absolute inset-0 w-full h-full object-cover scale-110 transition-transform duration-[2500ms] ease-out group-hover:translate-x-6"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 transition-transform duration-[2500ms] ease-out group-hover:translate-x-6"
            style={{
              backgroundImage: `url(${process.env.NEXT_PUBLIC_API_URL}${service.coverImage})`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="relative z-10 flex items-center justify-center gap-6 px-4 max-w-5xl w-full">
          <div className="flex-1 h-px bg-red-600 hidden sm:block"></div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-center leading-tight drop-shadow-lg">
            {service.category}
          </h1>
          <div className="flex-1 h-px bg-red-600 hidden sm:block"></div>
        </div>
      </div>

      {/* Title + short description intro */}
      {/* <section className="pt-14 pb-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground italic break-words">
            {service.title}
          </h2>
          {service.shortDescription && (
            <p className="mt-3 text-base sm:text-lg text-muted leading-relaxed max-w-3xl">
              {service.shortDescription}
            </p>
          )}
        </div>
      </section> */}

      {/* ── Tabbed sections: left list + right content ── */}
      {sections.length > 0 && (
        <section className="pb-16 px-4 mt-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* LEFT — clickable section titles */}
          <div className="lg:col-span-4">
  <div className="lg:sticky lg:top-24 divide-y divide-border-color border-y border-border-color">
    {sections.map((sec, i) => {
      const isActive = i === activeSection;
      return (
        <button
          key={i}
          onClick={() => setActiveSection(i)}
          className="w-full text-left py-5 flex items-center justify-between gap-3 group transition-all duration-300 min-w-0 cursor-pointer"
        >
          <span
            className={`min-w-0 flex-1 text-base sm:text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 transform ${
              isActive 
                ? "text-red-500 translate-x-1.5" 
                : "text-foreground opacity-75 group-hover:opacity-100 group-hover:text-red-500 group-hover:translate-x-1.5"
            }`}
          >
            {sec.title || `Section ${i + 1}`}
          </span>
          <FiChevronRight
            size={20}
            className={`shrink-0 transition-all duration-300 transform ${
              isActive 
                ? "text-red-500 translate-x-1.5" 
                : "text-muted opacity-60 group-hover:opacity-100 group-hover:text-red-500 group-hover:translate-x-1.5"
            }`}
          />
        </button>
      );
    })}
  </div>
</div>

            {/* RIGHT — active section content */}
            <div className="lg:col-span-8 min-w-0">
              {active ? (
                <div key={activeSection} className="animate-[fadeInScale_0.3s_ease-out_forwards]">
                  <div
                    className="service-fulldesc text-foreground text-sm sm:text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: cleanHtml(active.description) }}
                  />
                </div>
              ) : (
                <p className="text-muted text-sm">Select a section to view its details.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <style jsx global>{`
        .service-fulldesc {
          word-break: normal;
          overflow-wrap: break-word;
          white-space: normal;
          max-width: 100%;
        }
        .service-fulldesc h1,
        .service-fulldesc h2,
        .service-fulldesc h3,
        .service-fulldesc strong,
        .service-fulldesc b {
          color: var(--foreground);
          font-weight: 700;
        }
        .service-fulldesc h2 {
          font-size: 1.5rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .service-fulldesc p {
          color: var(--muted);
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.8;
        }
        .service-fulldesc img {
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          margin-top: 1rem;
          margin-bottom: 1rem;
          max-width: 100%;
          height: auto;
        }
        .service-fulldesc a {
          color: #ef4444;
          text-decoration: none;
        }
        .service-fulldesc a:hover {
          text-decoration: underline;
        }
        .service-fulldesc ul,
        .service-fulldesc ol {
          color: var(--muted);
          padding-left: 1.25rem;
          margin-top: 0.5rem;
        }
      `}</style>

  {/* Request Section */}
<section className="py-16 px-4 bg-transparent">
  <div className="max-w-4xl mx-auto p-6 sm:p-10 relative overflow-hidden">
    <div className="max-w-xl mx-auto text-center space-y-2 mb-8">
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">Interested in working together?</h2>
      <p className="text-foreground text-sm leading-relaxed">
        Submit your project brief today. Our team will get back to you shortly.
      </p>
    </div>

    {submitted ? (
      <div className="max-w-xl mx-auto bg-[#141414] border border-neutral-800 rounded-2xl p-6 text-center space-y-3 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-600 text-foreground flex items-center justify-center mx-auto shadow-lg shadow-red-600/40">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-bold text-foreground">Request Submitted!</p>
        <p className="text-xs text-foreground leading-relaxed">
          We received your brief and will be in touch with a matched creator shortly.
        </p>
      </div>
    ) : (
      <form onSubmit={handleRequest} className="w-full space-y-4 relative">
        {/* Top Row: Project Title & Target Deadline (Side-by-side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <input
            type="text"
            placeholder="Project Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-4 rounded-lg border border-neutral-800 bg-background text-foreground text-lg placeholder:text-neutral-500 focus:outline-none focus:border-red-600 transition-all"
          />
          <input
            type="date"
            placeholder="Target Deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-neutral-800 bg-background text-foreground text-lg placeholder:text-neutral-500 focus:outline-none focus:border-red-600 transition-all"
          />
        </div>

        {/* Budget Row: Min Budget & Max Budget (Side-by-side) */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <input
            type="number"
            placeholder="Min Budget (PKR)"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-neutral-800 bg-background text-foreground text-lg placeholder:text-neutral-500 focus:outline-none focus:border-red-600 transition-all"
          />
          <input
            type="number"
            placeholder="Max Budget (PKR)"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-neutral-800 bg-background text-foreground text-lg placeholder:text-neutral-500 focus:outline-none focus:border-red-600 transition-all"
          />
        </div>

        {/* Requirements & Deliverables (Taller Textarea matching the Message box style) */}
        <div className="text-left">
          <textarea
            placeholder="Requirements & Deliverables"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
            className="w-full px-4 py-3 rounded-lg border border-neutral-800 bg-background text-foreground text-lg placeholder:text-neutral-500 focus:outline-none focus:border-red-600 transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 rounded-sm bg-red-600 text-foreground font-bold text-md   hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-600/30 cursor-pointer"
        >
          {submitting ? "Submitting..." : "Submit Now"}
        </button>
      </form>
    )}
  </div>
</section>
    </div>
  );
}