import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Briefcase, Lock, Mail } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/", { replace: true });
        } catch (err: any) {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-primary font-bold text-2xl tracking-tight"
                    >
                        <Briefcase className="w-8 h-8" />
                        <span>SeekJobsLk</span>
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Admin Dashboard Login
                    </p>
                </div>

                {/* Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
                    <h1 className="text-xl font-semibold mb-6 text-foreground">
                        Sign in to Admin
                    </h1>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                            <input
                                type="email"
                                placeholder="Admin email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                                required
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                        )}

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-2.5 rounded-lg bg-[hsl(var(--button-bg))] text-[hsl(var(--button-foreground))] font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Login"}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} SeekJobsLk · Admin Panel
                </p>
            </div>
        </div>
    );
}
