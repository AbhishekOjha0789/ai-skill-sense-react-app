import { Component, createContext, useContext, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { Zap } from "lucide-react";
import { apiCall } from "./services/api";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard, { XP_PER_LEVEL } from "./pages/Dashboard";
import { SkillPage, QuestPage } from "./pages/Detail";
import Connect, { NotFound } from "./pages/Connect";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const KEY = "skillsense.session";
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};
const write = (v) => {
  try {
    v
      ? localStorage.setItem(KEY, JSON.stringify(v))
      : localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
};

function Provider({ children }) {
  const [profile, setProfile] = useState(read);
  const [toast, setToast] = useState("");
  const commit = (p) => {
    setProfile(p);
    write(p);
  };
  const notify = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 3500);
  };

  const signIn = async (form, signup) => {
    const auth = await apiCall(
      signup ? "/auth/register" : "/auth/login",
      "POST",
      form,
    );
    if (!auth.success) return auth.error;
    const me = await apiCall("/me");
    if (!me.success) return me.error;
    commit({
      ...me.data,
      email: form.email,
      username: form.username || me.data.username,
    });
    return null;
  };

  const addProgress = async (id, delta) => {
    const r = await apiCall(`/quests/${id}/progress`, "POST", { delta });
    if (!r.success) return notify(`${r.error}. Progress was not saved.`);
    let finished = false;
    const quests = profile.quests.map((q) => {
      if (q.quest_id !== id) return q;
      const progress = Math.min(1, q.progress + delta);
      finished = progress >= 1 && q.progress < 1;
      return { ...q, progress, quest_metrics: Math.round(progress * 100) };
    });
    if (finished) apiCall(`/quality/nudge`, "POST", { quest_id: id });
    commit({
      ...profile,
      quests,
      total_xp: profile.total_xp + (finished ? 150 : 25),
    });
    notify(finished ? "Quest complete. +150 XP" : "Progress saved. +25 XP");
  };

  const toggleFitness = async () => {
    const r = await apiCall("/integrations/fitness", "POST", {
      connect: !profile.fitness_connected,
    });
    if (!r.success) return notify(r.error);
    commit({ ...profile, fitness_connected: !profile.fitness_connected });
  };

  const signOut = () => commit(null);
  return (
    <Ctx.Provider
      value={{ profile, signIn, signOut, addProgress, toggleFitness, notify }}
    >
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4"
      >
        {toast && (
          <p className="rounded-lg border border-line bg-ink-800 px-4 py-3 text-sm shadow-xl">
            {toast}
          </p>
        )}
      </div>
    </Ctx.Provider>
  );
}

function Header() {
  const { profile, signOut } = useApp();
  const level = profile ? Math.floor(profile.total_xp / XP_PER_LEVEL) + 1 : 0;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-lg font-bold"
        >
          <span className="grid size-8 place-content-center rounded-lg bg-gold text-ink-950">
            <Zap size={18} aria-hidden />
          </span>
          AI Skill Sense
        </Link>
        {profile && (
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/connect"
              className="hidden text-mute hover:text-fg sm:block"
            >
              Connections
            </Link>
            <span className="rounded-full border border-line px-3 py-1 text-gold">
              Level {level}
            </span>
            <button onClick={signOut} className="text-mute hover:text-fg">
              Sign out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}

const Guard = ({ children }) =>
  useApp().profile ? children : <Navigate to="/auth" replace />;

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="py-24 text-center">
        <h1 className="font-display text-3xl font-bold">
          Something went wrong
        </h1>
        <button
          onClick={() => location.assign("/")}
          className="mt-4 text-gold underline"
        >
          Reload the app
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function App() {
  return (
    <Provider>
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Boundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <Guard>
                  <Dashboard />
                </Guard>
              }
            />
            <Route
              path="/skills/:skillId"
              element={
                <Guard>
                  <SkillPage />
                </Guard>
              }
            />
            <Route
              path="/quests/:questId"
              element={
                <Guard>
                  <QuestPage />
                </Guard>
              }
            />
            <Route
              path="/connect"
              element={
                <Guard>
                  <Connect />
                </Guard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Boundary>
      </main>
    </Provider>
  );
}
