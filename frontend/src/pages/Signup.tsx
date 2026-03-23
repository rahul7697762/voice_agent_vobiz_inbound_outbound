import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [step, setStep]             = useState<1 | 2>(1);
  const [fullName, setFullName]     = useState("");
  const [orgName, setOrgName]       = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: "", color: "bg-white/10", width: "w-0" };
    if (password.length < 6)   return { label: "Weak",   color: "bg-red-500",    width: "w-1/4" };
    if (password.length < 10)  return { label: "Fair",   color: "bg-yellow-400", width: "w-2/4" };
    if (!/[!@#$%^&*]/.test(password)) return { label: "Good", color: "bg-blue-400", width: "w-3/4" };
    return { label: "Strong", color: "bg-emerald-400", width: "w-full" };
  };

  const { label: strLabel, color: strColor, width: strWidth } = passwordStrength();

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !orgName.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, org_name: orgName, email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Signup failed");
      }
      navigate("/login?registered=1", { state: { message: "Account created! Sign in to continue." } });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a1a]">

      {/* ── Ambient orbs ─────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-600/25 blur-[120px]" />
        <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[250px] w-[250px] rounded-full bg-purple-700/15 blur-[90px]" />
      </div>

      {/* ── Grid overlay ─────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Glass card ───────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md mx-4 py-8">
        <div
          className="rounded-3xl border border-white/10 p-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
          }}
        >
          {/* Logo + heading */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#grad2)" />
                <path d="M8 12.5c0-1 .7-1.8 1.6-2 .2-.9 1-1.5 1.9-1.5s1.7.6 1.9 1.5c.9.2 1.6 1 1.6 2 0 1.1-.9 2-2 2h-3c-1.1 0-2-.9-2-2z" fill="white" fillOpacity=".9"/>
                <defs>
                  <linearGradient id="grad2" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1"/>
                    <stop offset="1" stopColor="#8B5CF6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-white/50">Start your InboundAI workspace today</p>
          </div>

          {/* ── Step indicator ──────────────────────────────────────── */}
          <div className="mb-7 flex items-center gap-2">
            {[1, 2].map(n => (
              <div key={n} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    step === n
                      ? "bg-violet-500 text-white shadow-lg shadow-violet-500/40"
                      : step > n
                      ? "bg-emerald-500/80 text-white"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {step > n ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : n}
                </div>
                <span className={`text-xs transition-colors ${step === n ? "text-white/70" : "text-white/30"}`}>
                  {n === 1 ? "Your details" : "Set password"}
                </span>
                {n < 2 && <div className={`flex-1 h-px transition-colors ${step > n ? "bg-emerald-500/50" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Name + Org ──────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider">Organization / Company</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="Bitlance Tech Hub"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg,#7C3AED 0%,#6366F1 100%)",
                  boxShadow: "0 0 30px rgba(124,58,237,0.3)",
                }}
              >
                Continue →
              </button>
            </form>
          )}

          {/* ── Step 2: Email + Password ─────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                    {showPass
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strColor} ${strWidth}`} />
                    </div>
                    <p className={`text-xs ${strColor.replace("bg-", "text-")}`}>{strLabel}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border py-3 pl-10 pr-11 text-sm text-white placeholder:text-white/25 outline-none transition focus:ring-2 focus:ring-violet-500/20 bg-white/5 ${
                      confirm && confirm !== password
                        ? "border-red-500/40 focus:border-red-500/60"
                        : confirm && confirm === password
                        ? "border-emerald-500/40 focus:border-emerald-500/60"
                        : "border-white/10 focus:border-violet-400/50"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                    {showConfirm
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                  {confirm && confirm === password && (
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                  style={{
                    background: "linear-gradient(135deg,#7C3AED 0%,#6366F1 100%)",
                    boxShadow: "0 0 30px rgba(124,58,237,0.3)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12"/>
                      </svg>
                      Creating account...
                    </span>
                  ) : "Create account"}
                </button>
              </div>
            </form>
          )}

          {/* Sign in link */}
          <p className="mt-6 text-center text-xs text-white/30">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-400/80 hover:text-violet-300 transition font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] text-white/20">
          By signing up you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
}
