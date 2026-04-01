"use client";
import { useAuthGuard } from "./hooks/useAuthGuard";

interface AuthGuardProps {
  redirectTo?: string;
}

export default function AuthGuard({ redirectTo }: AuthGuardProps) {
  useAuthGuard(redirectTo);
  return <div className="hidden">AuthGuard</div>;
}
