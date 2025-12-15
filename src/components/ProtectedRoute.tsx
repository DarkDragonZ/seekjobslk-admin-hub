import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const [user, loading] = useAuthState(auth);

    if (loading) return <p>Loading...</p>;
    if (!user) return <Navigate to="/admin/login" />;

    return children;
}
