import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "./store";
import { Logo } from "./components";
export function SignIn() {
  const { authenticate } = useStore(),
    navigate = useNavigate(), location = useLocation();
  const [mode, setMode] = useState<"login" | "register">(() => new URLSearchParams(location.search).get("auth") === "login" ? "login" : "register"),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authenticate(mode, username, password);
      const query = new URLSearchParams(location.search);
      query.delete("auth");
      navigate(location.pathname.startsWith("/app/") ? `${location.pathname}${query.size ? "?" + query : ""}${location.hash}` : "/app/today");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <Logo />
      <main>
        <span className="section-kicker">YOUR ADLER ACCOUNT</span>
        <h1>
          {mode === "register"
            ? "Create an account to save your goal."
            : "Welcome back."}
        </h1>
        <p>
          Save your goal, plan and conversations in one place.
        </p>
        <div className="auth-tabs">
          <button
            className={mode === "register" ? "selected" : ""}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
          <button
            className={mode === "login" ? "selected" : ""}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            Username
            <input
              autoComplete="username"
              required
              minLength={3}
              maxLength={80}
              pattern="[a-zA-Z0-9_.@\-]+"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              required
              minLength={10}
              maxLength={200}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <p className="field-hint">
            Use at least 10 characters. Keep your password somewhere safe; email
            recovery is not configured.
          </p>
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy
              ? "Opening…"
              : mode === "register"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
        <Link to="/">Back to Adler</Link>
      </main>
    </div>
  );
}
