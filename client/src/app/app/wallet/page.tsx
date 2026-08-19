"use client";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useState, useEffect } from "react";
import { FiCheckCircle } from "react-icons/fi";
import Link from "next/link";

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  const [cnicNumber, setCnicNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);

  const u = getUser();
  const isInfluencer = u?.role === 'influencer';

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const calls: Promise<any>[] = [apiFetch("/api/wallet", { token: getToken()! })];
      if (isInfluencer) {
        calls.push(apiFetch("/api/kyc/me", { token: getToken()! }));
        calls.push(apiFetch("/api/payouts", { token: getToken()! }));
      }
      const results = await Promise.all(calls);
      setWallet(results[0].wallet);
      if (isInfluencer) {
        setKyc(results[1].kyc);
        setPayouts(results[2].payouts || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(u);
    load();
  }, []);

  const money = (minor: number) => `PKR ${(minor / 100).toLocaleString("en-PK")}`;

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositing(true);
    try {
      await apiFetch("/api/wallet/deposit", {
        method: "POST",
        token: getToken()!,
        body: { amountMinor: Number(depositAmount) * 100 },
      });
      setDepositAmount("");
      load();
      toast.success("Deposit successful");
    } catch (err: any) {
      toast(err.message);
    } finally {
      setDepositing(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnicFront || !cnicBack) {
      setError("Please upload both front and back images of your CNIC");
      return;
    }
    setSubmittingKyc(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("cnicNumber", cnicNumber);
      formData.append("fullName", fullName);
      formData.append("cnicFront", cnicFront);
      formData.append("cnicBack", cnicBack);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Something went wrong");

      setCnicNumber("");
      setFullName("");
      setCnicFront(null);
      setCnicBack(null);
      load();
      toast.success("KYC submitted successfully");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestingPayout(true);
    try {
      await apiFetch("/api/payouts", {
        method: "POST",
        token: getToken()!,
        body: {
          amountMinor: Number(payoutAmount) * 100,
          method,
          accountDetails: { accountTitle, accountNumber, bankName },
        },
      });
      setShowPayoutForm(false);
      setPayoutAmount(""); setAccountTitle(""); setAccountNumber(""); setBankName("");
      load();
      toast.success("Payout requested successfully");
    } catch (err: any) {
      toast(err.message);
    } finally {
      setRequestingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="w-6 h-6 border-2 border-t-primary border-primary/20 rounded-full animate-spin"></div>
      </div>
    );
  }

  const fileInputClass =
    "w-full text-xs file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-ink file:text-paper file:text-xs file:font-semibold file:cursor-pointer cursor-pointer";

  return (
    <div className="max-w-5xl  px-4 sm:px-6 py-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between gap-2.5 pb-4 border-b border-line/60">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-primary rounded-full" />
          <h1 className="text-xl font-bold text-foreground italic">
            {isInfluencer ? "Wallet & Payouts" : "Wallet"}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-xl p-3.5">
          {error}
        </div>
      )}

      {/* Balance Cards */}
      <div className={`grid grid-cols-1 text-center ${wallet?.escrowMinor > 0 ? 'sm:grid-cols-2' : ''} gap-4`}>
        <div className="bg-background border border-line rounded-sm p-5 shadow-2xs transition hover:border-primary/40">
          <div className="text-xs font-semibold text-foreground mb-1.5">Available Balance</div>
          <div className="text-xl sm:text-2xl font-bold text-foreground italic">{money(wallet?.balanceMinor || 0)}</div>
        </div>
        {wallet?.escrowMinor > 0 && (
          <div className="bg-background border border-line rounded-sm p-5 shadow-2xs transition hover:border-primary/40">
            <div className="text-xs font-semibold text-foreground mb-1.5">In Escrow</div>
            <div className="text-xl sm:text-2xl font-bold text-foreground italic">{money(wallet.escrowMinor)}</div>
          </div>
        )}
      </div>

      {/* Brand: Test Deposit */}
      {!isInfluencer && (
        <div className="bg-background border border-line rounded-sm p-5 sm:p-6 shadow-2xs">
          <h2 className="text-sm font-bold  text-foreground mb-3.5">Add Funds</h2>
          <form onSubmit={handleDeposit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              placeholder="Amount in PKR"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
            <button
              type="submit"
              disabled={depositing}
              className="px-6 py-2.5 rounded-sm bg-surface text-foreground text-xs font-semibold hover:bg-primary transition duration-150 active:scale-95 disabled:opacity-40 shrink-0 shadow-2xs"
            >
              {depositing ? "Adding..." : "Deposit"}
            </button>
          </form>
        </div>
      )}

      {isInfluencer && (
        <div className="bg-background border border-line rounded-sm p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-lg font-bold  text-foreground">Identity Verification</h2>
          {kyc?.status === "verified" ? (
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-sm p-3.5">
              <FiCheckCircle size={16} className="shrink-0" />
              <span>Verified — you can withdraw your earnings.</span>
            </div>
          ) : kyc?.status === "pending" ? (
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-sm p-3.5">
              <span>Your KYC application is under review.</span>
            </div>
          ) : kyc?.status === "rejected" ? (
            <div className="space-y-4">
              <p className="text-xs text-primary font-medium bg-primary/10 border border-primary/20 rounded-sm p-3">
                Rejected: {kyc.rejectionReason}
              </p>
              <form onSubmit={handleKycSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Enter Name</label>
                  <input
                    type="text"
                    placeholder="Full name (as on CNIC)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">CNIC Number</label>
                  <input
                    type="text"
                    placeholder="Add number"
                    value={cnicNumber}
                    onChange={(e) => setCnicNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">CNIC Front</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCnicFront(e.target.files?.[0] || null)}
                      required
                      className={fileInputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">CNIC Back</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCnicBack(e.target.files?.[0] || null)}
                      required
                      className={fileInputClass}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingKyc}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-sm bg-primary text-paper text-xs font-semibold hover:bg-primary-dark transition duration-150 active:scale-95 disabled:opacity-40 shadow-2xs"
                  >
                    {submittingKyc ? "Submitting..." : "Resubmit"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <p className="text-xs text-muted">You must verify your identity before withdrawing earnings.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Full Name</label>
                  <input
                    type="text"
                    placeholder="Full name (as on CNIC)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">CNIC Number</label>
                  <input
                    type="text"
                    placeholder="CNIC number"
                    value={cnicNumber}
                    onChange={(e) => setCnicNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">CNIC Front</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCnicFront(e.target.files?.[0] || null)}
                    required
                    className={fileInputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">CNIC Back</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCnicBack(e.target.files?.[0] || null)}
                    required
                    className={fileInputClass}
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-sm bg-primary text-paper text-xs font-semibold hover:bg-primary-dark transition duration-150 active:scale-95 disabled:opacity-40 shadow-2xs"
                >
                  {submittingKyc ? "Submitting..." : "Submit for verification"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Influencer: Payout Request */}
      {isInfluencer && kyc?.status === "verified" && (
        <div className="bg-background border border-line rounded-sm p-5 sm:p-6 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Request a Payout</h2>
            <button
              onClick={() => setShowPayoutForm(!showPayoutForm)}
              className="text-xs font-semibold text-primary hover:underline transition"
            >
              {showPayoutForm ? "Cancel" : "+ New Request"}
            </button>
          </div>
          {showPayoutForm && (
            <form onSubmit={handlePayoutRequest} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Amount (PKR)</label>
                  <input
                    type="number"
                    placeholder="Amount (PKR)"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">Easypaisa</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Account Title</label>
                  <input
                    type="text"
                    placeholder="Account Title"
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Account Number / IBAN</label>
                  <input
                    type="text"
                    placeholder="Account Number / IBAN"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
              </div>
              {method === "bank_transfer" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Bank Name</label>
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-sm border border-line text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>
              )}
              <div className="pt-2 ">
                <button
                  type="submit"
                  disabled={requestingPayout}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-sm bg-primary text-paper text-xs font-semibold hover:bg-primary-dark transition duration-150 active:scale-95 disabled:opacity-40 shadow-2xs"
                >
                  {requestingPayout ? "Requesting..." : "Submit Request"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Influencer: Payout History */}
      {isInfluencer && payouts.length > 0 && (
        <div className="bg-background border border-line rounded-sm p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Recent Payouts</h2>
            <Link href="/app/wallet/withdrawals" className="text-xs font-semibold text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-line/50">
            {payouts.slice(0, 5).map((p) => (
              <div key={p._id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-bold text-foreground truncate">{money(p.amountMinor)}</p>
                  <p className="text-[11px] text-muted capitalize truncate mt-0.5">{p.method.replace("_", " ")}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                  p.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
                  p.status === "rejected" ? "bg-primary/10 text-primary border border-primary/20" : "bg-amber-50 text-amber-700 border border-amber-200/60"
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}