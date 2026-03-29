// Re-exports the canonical auth context so all @/context/AuthContext imports
// use the single AuthProvider mounted in _app.tsx (from lib/auth-context).
export { AuthProvider, useAuth } from "@/lib/auth-context";
