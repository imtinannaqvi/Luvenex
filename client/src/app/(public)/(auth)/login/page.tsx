'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSession } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: { email, password },
            });
            saveSession(data.accessToken, data.user, data.refreshToken);
            router.push(data.user.role === 'admin' ? '/admin' : '/app');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
            <div className="relative w-full max-w-sm">

                <div className="absolute -top-16 -left-16 w-44 h-44 bg-primary/50 rounded-full blur-3xl pointer-events-none" />

                <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-primary/50 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 w-full bg-ink/40 rounded-2xl shadow-3xl p-8 backdrop-blur-xl">
                    <div className="flex justify-center mb-4">
                        <img src="/luvenex-logo-black.png" alt="Luvenex" className="h-12 w-auto" />
                    </div>
                    <p className="text-lg italic text-foreground mb-6 text-center">Welcome back</p>

                    <form onSubmit={handleSubmit} className="space-y-7">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm bg-background
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-line text-sm bg-background
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition"
                                >
                                    {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-sm text-primary">{error}</p>}

                        <div className='flex justify-center'>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-16 py-3.5 rounded-xl bg-primary/40 text-foreground font-semibold text-sm
                           hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : 'Log in'}
                            </button>
                        </div>
                        <p className="text-center text-sm text-foreground italic">
                            Don't have an account?{" "}
                            <a href="/signup" className="text-foreground font-medium hover:underline">
                                Sign up
                            </a>
                        </p>

                        <p className="text-center text-sm text-foreground italic">
                            Forgot password?{' '}
                            <a href="/forgot-password" className="text-foreground font-medium hover:underline">
                                Click Here
                            </a>
                        </p>

                    </form>
                </div>
            </div>
        </div>
    );
}