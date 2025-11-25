"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the reset link");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col justify-center flex-1">
      <form onSubmit={handleReset} className="max-w-md mx-auto">
        <h1>Reset Password</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}