import {
  Component,
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { Pencil, Zap } from "lucide-react";
import { apiCall, getAuthToken, setAuthToken } from "./services/api";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
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

const PROFILE_FIELDS = [
  "age",
  "gender",
  "interests",
  "summary",
  "occupation",
  "experience",
  "education_status",
  "education_summary",
];

export const isProfileComplete = (profile) =>
  Number.isInteger(Number(profile?.age)) &&
  Number(profile.age) > 0 &&
  Boolean(profile?.gender?.trim()) &&
  Array.isArray(profile?.interests) &&
  profile.interests.some((interest) => interest.trim()) &&
  ["summary", "occupation", "experience", "education_status"].every(
    (field) => Boolean(profile?.[field]?.trim()),
  );

const hasProfileData = (profile) =>
  PROFILE_FIELDS.some((field) => {
    const value = profile?.[field];
    return Array.isArray(value)
      ? value.some((entry) => entry.trim())
      : value !== null && value !== undefined && String(value).trim() !== "";
  });

const loadUserData = async (userId) => {
  const [dashboard, userProfile] = await Promise.all([
    apiCall(`/api/users/${userId}/dashboard`),
    apiCall(`/api/users/${userId}/profile`),
  ]);
  if (!dashboard.success) return { success: false, error: dashboard.error };
  if (!userProfile.success) return { success: false, error: userProfile.error };
  const {
    age,
    gender,
    interests,
    summary,
    occupation,
    experience,
    education_status,
    education_summary,
  } = userProfile.data;
  return {
    success: true,
    data: {
      ...dashboard.data,
      age,
      gender,
      interests,
      summary,
      occupation,
      experience,
      education_status,
      education_summary,
    },
  };
};

function Provider({ children }) {
  const [profile, setProfile] = useState(read);
  const [toast, setToast] = useState("");
  const profileRequestVersion = useRef(0);
  const commit = useCallback((p) => {
    setProfile(p);
    write(p);
  }, []);
  const notify = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const refreshProfile = useCallback(async (userId = profile?.user_id) => {
    if (!userId) return null;
    const requestVersion = ++profileRequestVersion.current;
    const result = await loadUserData(userId);
    if (!result.success) return result.error;
    if (requestVersion !== profileRequestVersion.current) return null;
    const localXp = profile?.user_id === userId ? profile.total_xp || 0 : 0;
    const loadedProfile = {
      ...result.data,
      total_xp: Math.max(result.data.total_xp || 0, localXp),
    };
    commit(loadedProfile);
    return null;
  }, [commit, profile?.total_xp, profile?.user_id]);

  const signIn = async (form, signup) => {
    if (signup) {
      const registration = await apiCall("/auth/register", "POST", form);
      if (!registration.success) return registration.error;
    }
    const auth = await apiCall("/auth/login", "POST", {
      email: form.email,
      password: form.password,
    });
    if (!auth.success) return auth.error;
    setAuthToken(auth.data.access_token);

    const me = await apiCall("/auth/me");
    if (!me.success) {
      setAuthToken(null);
      return me.error;
    }
    const dashboard = await loadUserData(me.data.user_id);
    if (!dashboard.success) {
      setAuthToken(null);
      return dashboard.error;
    }
    commit(dashboard.data);
    return null;
  };

  const addProgress = async (id, delta) => {
    const r = await apiCall(
      `/api/users/${profile.user_id}/quests/${id}/progress`,
      "POST",
      { delta },
    );
    if (!r.success) {
      notify(`${r.error}. Progress was not saved.`);
      return false;
    }
    const quests = profile.quests.map((q) => {
      if (q.quest_id !== id) return q;
      return {
        ...q,
        progress: r.data.progress,
        status: r.data.status,
      };
    });
    const finished = r.data.completed;
    commit({
      ...profile,
      quests,
      total_xp: profile.total_xp + (finished ? 150 : 25),
    });
    notify(finished ? "Quest complete. +150 XP" : "Progress saved. +25 XP");
    return true;
  };

  const signOut = () => {
    setAuthToken(null);
    commit(null);
  };

  useEffect(() => {
    if (!profile?.user_id || !getAuthToken()) return;
    let active = true;
    const requestVersion = ++profileRequestVersion.current;
    loadUserData(profile.user_id).then((result) => {
      if (!active || requestVersion !== profileRequestVersion.current) return;
      if (!result.success) {
        notify(`Could not refresh your dashboard: ${result.error}`);
        return;
      }
      commit({
        ...result.data,
        total_xp: Math.max(
          result.data.total_xp || 0,
          profile.total_xp || 0,
        ),
      });
    });
    return () => {
      active = false;
    };
  }, [commit, notify, profile?.total_xp, profile?.user_id]);

  return (
    <Ctx.Provider
      value={{
        profile,
        signIn,
        signOut,
        addProgress,
        refreshProfile,
        notify,
        saveProfile: async (data) => {
          ++profileRequestVersion.current;
          const method = hasProfileData(profile) ? "PUT" : "POST";
          const result = await apiCall(
            `/api/users/${profile.user_id}/profile`,
            method,
            data,
          );
          if (!result.success) return result.error;
          const savedProfile = { ...profile, ...data };
          if (!isProfileComplete(savedProfile)) {
            return "The backend accepted the save, but the submitted profile is still incomplete.";
          }
          ++profileRequestVersion.current;
          commit(savedProfile);
          return null;
        },
      }}
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
            {isProfileComplete(profile) && (
              <>
                <Link
                  to="/profile"
                  className="hidden text-mute hover:text-fg sm:block"
                >
                  Profile
                </Link>
                <Link
                  to="/profile/edit"
                  state={{ openEditor: true }}
                  className="hidden items-center gap-1.5 text-mute hover:text-fg sm:flex"
                >
                  <Pencil size={14} aria-hidden />
                  Edit profile
                </Link>
              </>
            )}
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

const CompleteProfileGuard = ({ children }) => {
  const { profile } = useApp();
  if (!profile) return <Navigate to="/auth" replace />;
  return isProfileComplete(profile) ? (
    children
  ) : (
    <Navigate to="/profile" replace />
  );
};

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
              path="/profile"
              element={
                <Guard>
                  <Profile />
                </Guard>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <Guard>
                  <Profile />
                </Guard>
              }
            />
            <Route
              path="/dashboard"
              element={
                <CompleteProfileGuard>
                  <Dashboard />
                </CompleteProfileGuard>
              }
            />
            <Route
              path="/skills/:skillId"
              element={
                <CompleteProfileGuard>
                  <SkillPage />
                </CompleteProfileGuard>
              }
            />
            <Route
              path="/quests/:questId"
              element={
                <CompleteProfileGuard>
                  <QuestPage />
                </CompleteProfileGuard>
              }
            />
            <Route
              path="/connect"
              element={
                <CompleteProfileGuard>
                  <Connect />
                </CompleteProfileGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Boundary>
      </main>
    </Provider>
  );
}
