"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getToken,getUser } from "@/lib/auth";
import { useParams, useRouter } from "next/navigation";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* <div className="absolute inset-0 rounded-full border-2 border-red-600/20 animate-pulse" /> */}
          <div className="w-8 h-8 border-2 border-transparent border-t-red-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
        <div className="bg-surface backdrop-blur-xl border border-b-red-50 p-8 rounded-3xl max-w-sm w-full shadow-2xl shadow-red-950/20">
          <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-800/50 text-red-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-foreground font-bold text-base">Service Unavailable</p>
          <p className="text-foreground text-xs mt-1.5 leading-relaxed">
            {error || "The requested service could not be found."}
          </p>
          <button
            onClick={() => router.push("/services")}
            className="mt-6 w-full py-3 rounded-xl bg-red-600 text-foreground font-semibold text-xs tracking-wide uppercase transition hover:bg-red-700 active:scale-95 shadow-lg shadow-red-600/30"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen selection:bg-red-600 selection:text-foreground relative overflow-x-hidden">
     {/* Hero Section with Cover Video, Overlay, and Title */}
      <div className="group relative w-full h-[400px] md:h-[500px] overflow-hidden flex items-center justify-center bg-foreground">
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

        {/* Gradient overlay — darker at bottom for text, lighter/clear at top so video shows through */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Title with lines */}
        <div className="relative z-10 flex items-center justify-center gap-6 px-4 max-w-5xl w-full">
          <div className="flex-1 h-px bg-red-600 hidden sm:block"></div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight text-center leading-tight drop-shadow-lg">
            {service.category}
          </h1>
          <div className="flex-1 h-px bg-red-600 hidden sm:block"></div>
        </div>
      </div>

      {/* Title (left) + Short Description (middle) row */}
      <section className="pt-12 pb-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 border-b border-border-color pb-8">
          <h2 className="text-xl italic sm:text-2xl font-extrabold text-foreground shrink-0 sm:w-56 whitespace-nowrap">
            Title: {service.title}
          </h2>
        </div>
      </section>
      <div className="text-center items-center">
        <p className="text-lg text-foreground leading-relaxed">
          {service.shortDescription}
        </p>
      </div>

      {/* Full Description (rich text, images embedded inline) */}
      {service.description && (
        <section className="py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
              
              <span className="text-[15px] font-bold uppercase tracking-[0.2em] text-foreground">Overview</span>
              <span className="flex-1 h-px bg-surface" />
            </div>
            <div
              className="service-fulldesc text-foreground text-sm sm:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: service.description }}
            />
          </div>
          <style jsx global>{`
            .service-fulldesc {
              word-break: normal;
              overflow-wrap: break-word;
            }
            .service-fulldesc h1,
            .service-fulldesc h2,
            .service-fulldesc h3,
            .service-fulldesc strong,
            .service-fulldesc b {
              color: #ffffff;
              font-weight: 700;
            }
            .service-fulldesc h2 {
              font-size: 1.125rem;
              margin-top: 1.5rem;
              margin-bottom: 0.5rem;
            }
            .service-fulldesc p {
              color: #a1a1aa;
              margin-top: 0.75rem;
              margin-bottom: 0.75rem;
              line-height: 1.8;
            }
            .service-fulldesc img {
              border-radius: 1rem;
              border: 1px solid rgba(63, 63, 70, 0.6);
              margin-top: 1rem;
              max-width: 80%;
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
              color: #a1a1aa;
              padding-left: 1.25rem;
              margin-top: 0.5rem;
            }
          `}</style>
        </section>
      )}

     

      {/* Request Section (always visible) */}
      <section className="py-16 px-4 bg-foreground">
        <div className="max-w-2xl mx-auto rounded-xl p-6 sm:p-10 bg-surface backdrop-blur-xl border border-border-color shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-lg blur-3xl pointer-events-none" />


          <div className="max-w-md mx-auto text-center space-y-2 mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">Interested in working together?</h2>
            <p className="text-foreground text-sm leading-relaxed">
              Submit your project brief today. Our team will get back to you shortly.
            </p>
          </div>

          {/* Conditional display: Success message OR Form */}
          {submitted ? (
            <div className="max-w-md mx-auto bg-scroll border border-red-800/40 rounded-2xl p-6 text-center space-y-3 shadow-xl">
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
            <form onSubmit={handleRequest} className="max-w-md mx-auto space-y-4 relative">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Brand identity redesign"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border-color bg-surface text-foreground text-sm placeholder:text-foreground focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Requirements &amp; Deliverables</label>
                <textarea
                  placeholder="Detail your goals and requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border-color bg-surface text-foreground text-sm placeholder:text-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Min Budget (PKR)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-color bg-surface text-foreground text-sm placeholder:text-foreground focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Max Budget (PKR)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-color bg-surface text-foreground text-sm placeholder:text-foreground focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Target Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border-color bg-surface text-foreground text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-red-400 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-600/30"
              >
                {submitting ? "Submitting..." : "Submit Project Brief"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}