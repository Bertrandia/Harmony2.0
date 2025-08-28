"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../app/context/AuthContext";
import { LoginForm } from "../components/login-form.jsx";

export default function Home() {
  const { currentUser, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && currentUser) {
      // Redirect logged-in users away from / to a dashboard or last visited
      router.replace("/dashboard");
    }
  }, [authLoading, currentUser]);

  if (authLoading) return null;

  return <LoginForm />;
}
