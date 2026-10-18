import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Btn, Card } from "../components/ui";
import { isProfileComplete, useApp } from "../App";

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-mute">{label}</span>
      <input
        required
        className="w-full rounded-lg border border-line bg-ink-950 px-3 py-2.5 text-sm outline-none focus:border-gold"
        {...props}
      />
    </label>
  );
}

export default function Auth() {
  const { profile, signIn } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const signup = params.get("mode") === "signup";
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (profile) {
    return (
      <Navigate
        to={isProfileComplete(profile) ? "/dashboard" : "/profile"}
        replace
      />
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = await signIn(form, signup);
    setBusy(false);
    if (err) setError(err);
    else navigate("/dashboard");
  };

  return (
    <Card className="mx-auto mt-8 max-w-md p-8">
      <h1 className="font-display text-3xl font-bold">
        {signup ? "Create your character" : "Welcome back"}
      </h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {signup && (
          <Field
            label="Username"
            autoComplete="username"
            value={form.username}
            onChange={set("username")}
          />
        )}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
        />
        <Field
          label="Password"
          type="password"
          minLength={8}
          autoComplete={signup ? "new-password" : "current-password"}
          value={form.password}
          onChange={set("password")}
        />
        {error && (
          <p role="alert" className="text-sm text-fit">
            {error}. Check your connection and try again.
          </p>
        )}
        <Btn type="submit" disabled={busy} className="w-full">
          {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
        </Btn>
      </form>
      <button
        onClick={() => setParams(signup ? {} : { mode: "signup" })}
        className="mt-6 text-sm text-mute underline-offset-4 hover:text-fg hover:underline"
      >
        {signup
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </Card>
  );
}
