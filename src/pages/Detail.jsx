import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { Card, Btn, Bar, TYPE_TEXT, TYPE_BAR } from "../components/ui";
import { useApp } from "../App";
import { NotFound } from "./Connect";
import { apiCall } from "../services/api";

const Back = () => (
  <Link
    to="/dashboard"
    className="mb-6 inline-flex items-center gap-2 text-sm text-mute hover:text-fg"
  >
    <ArrowLeft size={16} aria-hidden />
    Dashboard
  </Link>
);

export function SkillPage() {
  const { skillId } = useParams();
  const { profile } = useApp();
  const skill = profile.skills.find((s) => s.skill_id === skillId);
  if (!skill) return <NotFound />;
  const quests = profile.quests.filter((q) => q.linked_skill.includes(skillId));
  return (
    <div className="mx-auto max-w-2xl">
      <Back />
      <span
        className={`mb-4 block h-1 w-14 rounded-full ${TYPE_BAR[skill.skill_type]}`}
        aria-hidden
      />
      <p className={`text-sm ${TYPE_TEXT[skill.skill_type]}`}>
        {skill.skill_type} skill
      </p>
      <h1 className="mt-1 font-display text-4xl font-bold">
        {skill.skill_title}
      </h1>
      <p className="mt-4 text-lg text-mute">{skill.skill_intro}</p>
      <h2 className="mb-3 mt-10 font-display text-xl font-semibold">
        Quests for this skill
      </h2>
      {quests.length === 0 ? (
        <p className="text-mute">No quests yet for this skill.</p>
      ) : (
        quests.map((q) => (
          <Card
            as={Link}
            to={`/quests/${q.quest_id}`}
            key={q.quest_id}
            className="mb-3 block p-4"
          >
            <div className="flex justify-between gap-4">
              <span className="font-medium">{q.quest_name}</span>
              <span className="text-sm text-mute">
                {Math.round(q.progress * 100)}%
              </span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

const TEMPLATES = {
  Learning: { label: "Focused learning session", icon: BookOpen },
  Webhook: { label: "Activity webhook", icon: Activity },
  Location: { label: "GPS check-in", icon: MapPin },
  Physical: { label: "Health Connect activity", icon: Activity },
};

const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

export function QuestPage() {
  const { questId } = useParams();
  const { profile, addProgress, notify, refreshProfile } = useApp();
  const quest = profile.quests.find((q) => q.quest_id === questId);
  const [view, setView] = useState("progress");
  const [busy, setBusy] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [integration, setIntegration] = useState(null);
  const [locationFix, setLocationFix] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [payload, setPayload] = useState("");
  const elapsedBeforeStart = useRef(0);
  const startedAt = useRef(null);
  const integrationEndpoint =
    quest?.quest_type === "Webhook"
      ? "/api/webhooks/me"
      : quest?.quest_type === "Physical"
        ? "/api/health-connect/status"
        : null;

  useEffect(() => {
    if (!integrationEndpoint) {
      setIntegration(null);
      return undefined;
    }
    let active = true;
    setIntegration({ loading: true });
    apiCall(integrationEndpoint).then((result) => {
      if (!active) return;
      setIntegration(
        result.success
          ? { loading: false, data: result.data }
          : { loading: false, error: result.error },
      );
    });
    return () => {
      active = false;
    };
  }, [integrationEndpoint]);

  useEffect(() => {
    if (!running) return undefined;
    const updateElapsed = () => {
      if (startedAt.current !== null) {
        setElapsedMs(
          elapsedBeforeStart.current + Date.now() - startedAt.current,
        );
      }
    };
    const pauseWhenHidden = () => {
      if (document.visibilityState !== "hidden" || startedAt.current === null) {
        return;
      }
      elapsedBeforeStart.current += Date.now() - startedAt.current;
      startedAt.current = null;
      setElapsedMs(elapsedBeforeStart.current);
      setRunning(false);
    };
    const interval = window.setInterval(updateElapsed, 250);
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", pauseWhenHidden);
    };
  }, [running]);

  if (!quest) return <NotFound />;

  const tpl = TEMPLATES[quest.quest_type];
  const progress = Math.min(1, Math.max(0, Number(quest.progress) || 0));
  const done =
    progress >= 1 ||
    quest.status === "failed" ||
    quest.status === "completed";
  const target = Number(quest.quest_metrics);
  const learningTarget =
    quest.quest_type === "Learning" &&
    quest.scale?.toLowerCase() === "seconds" &&
    Number.isFinite(target) &&
    target > 0
      ? target
      : null;
  const checkInTarget =
    quest.quest_type === "Location" &&
    quest.scale?.toLowerCase() === "others" &&
    Number.isFinite(target) &&
    target > 0
      ? target
      : null;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const skillTitle = profile.skills.find((skill) =>
    quest.linked_skill.includes(skill.skill_id),
  )?.skill_title;
  const searchQuery = encodeURIComponent(
    [quest.quest_name, skillTitle].filter(Boolean).join(" "),
  );

  const startLearning = () => {
    if (!learningTarget || done || busy) return;
    startedAt.current = Date.now();
    setRunning(true);
  };

  const pauseLearning = () => {
    if (startedAt.current === null) return;
    elapsedBeforeStart.current += Date.now() - startedAt.current;
    startedAt.current = null;
    setElapsedMs(elapsedBeforeStart.current);
    setRunning(false);
  };

  const saveLearningSession = async () => {
    if (!learningTarget || busy) return;
    const totalMs =
      startedAt.current === null
        ? elapsedBeforeStart.current
        : elapsedBeforeStart.current + Date.now() - startedAt.current;
    startedAt.current = null;
    elapsedBeforeStart.current = totalMs;
    setElapsedMs(totalMs);
    setRunning(false);
    const seconds = Math.floor(totalMs / 1000);
    const delta = Math.min(seconds / learningTarget, 1 - progress);
    if (delta <= 0) return;
    setBusy(true);
    const saved = await addProgress(quest.quest_id, delta);
    setBusy(false);
    if (saved) {
      elapsedBeforeStart.current = 0;
      setElapsedMs(0);
    }
  };

  const getLocationFix = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("This browser does not provide GPS location access.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationFix({ accuracy: coords.accuracy });
        setBusy(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Allow it in your browser settings to continue."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Your device could not determine a location. Try again where GPS is available."
              : "GPS timed out. Check your device location settings and try again.";
        setLocationError(message);
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const confirmLocationCheckIn = async () => {
    if (!checkInTarget || !locationFix || done || busy) return;
    setBusy(true);
    const delta = Math.min(1 / checkInTarget, 1 - progress);
    const saved = await addProgress(quest.quest_id, delta);
    setBusy(false);
    if (saved) setLocationFix(null);
  };

  const refreshIntegration = async () => {
    if (!integrationEndpoint || busy) return;
    setBusy(true);
    const [statusResult, refreshError] = await Promise.all([
      apiCall(integrationEndpoint),
      refreshProfile(),
    ]);
    if (statusResult.success) {
      setIntegration({ loading: false, data: statusResult.data });
    } else {
      setIntegration({ loading: false, error: statusResult.error });
    }
    if (refreshError) {
      notify(`Could not refresh quest progress: ${refreshError}`);
    } else if (!statusResult.success) {
      notify(`Could not refresh connection status: ${statusResult.error}`);
    } else {
      notify("Quest data refreshed from the connected service.");
    }
    setBusy(false);
  };

  const createWebhookPayload = async () => {
    const event = {
      activity_type: "quest_activity",
      log_desc: `Completed activity for quest "${quest.quest_name}"`,
      event_id:
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    const formatted = JSON.stringify(event, null, 2);
    setPayload(formatted);
    try {
      await navigator.clipboard.writeText(formatted);
      notify("Event payload copied. Use it with your real activity source.");
    } catch {
      notify("Payload created. Select and copy it manually.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Back />
      <p className="text-sm text-gold">{quest.quest_type} quest</p>
      <h1 className="mt-1 font-display text-4xl font-bold">
        {quest.quest_name}
      </h1>
      <p className="mt-4 text-lg text-mute">{quest.quest_desc}</p>
      <div className="mt-6">
        <Bar value={quest.progress} label="Quest progress" />
      </div>
      <p className="mt-2 text-sm text-mute">
        {Math.round(quest.progress * 100)}% complete
      </p>

      <div
        role="tablist"
        className="mt-8 inline-flex rounded-lg border border-line p-1"
      >
        {[
          ["progress", "View progress"],
          ["play", quest.progress > 0 ? "Resume quest" : "Start quest"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${view === id ? "bg-ink-800 text-fg" : "text-mute hover:text-fg"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "progress" ? (
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Progress", `${Math.round(quest.progress * 100)}%`],
            ["Time allowed", `${Math.round(quest.duration / 60)} h`],
            ["Measured in", quest.scale],
            ["Assigned", new Date(quest.allocation_time).toLocaleDateString()],
          ].map(([k, v]) => (
            <Card key={k} className="p-4">
              <dt className="text-sm text-mute">{k}</dt>
              <dd className="mt-1 font-display text-xl font-semibold capitalize">
                {v}
              </dd>
            </Card>
          ))}
        </dl>
      ) : (
        <Card className="mt-6 p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-content-center rounded-lg bg-ink-800 text-gold">
              {tpl ? <tpl.icon size={19} aria-hidden /> : <Activity size={19} />}
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold">
                {tpl?.label || "Quest activity"}
              </h2>
              <p className="mt-1 text-sm text-mute">
                {quest.status === "failed"
                  ? "This quest has expired."
                  : done
                    ? "This quest is complete."
                    : "Use the activity flow below to make progress that matches this quest."}
              </p>
            </div>
          </div>

          {quest.quest_type === "Learning" && (
            <div className="mt-5">
              <p className="text-sm text-mute">
                Learn with focused web resources, then save the time you actually
                spent. The timer pauses automatically when you leave this tab.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`https://www.google.com/search?q=${searchQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-ink-800"
                >
                  Search the web <ExternalLink size={14} aria-hidden />
                </a>
                <a
                  href={`https://www.youtube.com/results?search_query=${searchQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-ink-800"
                >
                  Find video lessons <ExternalLink size={14} aria-hidden />
                </a>
              </div>
              {learningTarget ? (
                <>
                  <div className="mt-5 rounded-lg border border-line bg-ink-950 p-4">
                    <div className="flex items-center gap-2 text-mute">
                      <Clock3 size={16} aria-hidden />
                      <span className="text-sm">This learning session</span>
                    </div>
                    <p
                      role="timer"
                      aria-live="off"
                      className="mt-2 font-display text-4xl font-bold tabular-nums"
                    >
                      {formatTime(elapsedSeconds)}
                    </p>
                    <p className="mt-1 text-xs text-mute">
                      Goal: {Math.round(learningTarget)} seconds · Estimated
                      total:{" "}
                      {Math.min(
                        Math.round(learningTarget),
                        Math.round(progress * learningTarget) + elapsedSeconds,
                      )}{" "}
                      seconds
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Btn
                      disabled={busy || done}
                      onClick={running ? pauseLearning : startLearning}
                    >
                      {running ? "Pause session" : "Start learning"}
                    </Btn>
                    <Btn
                      variant="ghost"
                      disabled={busy || done || elapsedSeconds < 1}
                      onClick={saveLearningSession}
                    >
                      {busy ? "Saving…" : "Save session time"}
                    </Btn>
                  </div>
                  <p className="mt-3 text-xs text-mute">
                    Only seconds recorded by this timer are added to quest
                    progress.
                  </p>
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-line bg-ink-950 p-4 text-sm text-mute">
                  This quest is not configured with a positive seconds target,
                  so timed progress cannot be recorded.
                </p>
              )}
            </div>
          )}

          {quest.quest_type === "Webhook" && (
            <div className="mt-5">
              <p className="text-sm text-mute">
                Connect a real activity source and send its events to your
                private webhook. This page never sends a test event.
              </p>
              <div className="mt-4 rounded-lg border border-line bg-ink-950 p-4">
                <p className="text-sm font-medium">Connection status</p>
                {integration?.loading ? (
                  <p className="mt-1 text-sm text-mute">
                    Checking webhook…
                  </p>
                ) : integration?.error ? (
                  <p className="mt-1 text-sm text-red-300">
                    {integration.error}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-mute">
                    {integration?.data?.configured
                      ? "Webhook is active."
                      : "No webhook is configured yet."}
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Btn as={Link} to="/connect">
                  Manage webhook <ArrowRight size={15} aria-hidden />
                </Btn>
                <Btn
                  variant="ghost"
                  disabled={busy}
                  onClick={refreshIntegration}
                >
                  <RefreshCw size={15} aria-hidden />
                  Refresh quest progress
                </Btn>
                <Btn
                  variant="ghost"
                  disabled={busy}
                  onClick={createWebhookPayload}
                >
                  <Copy size={15} aria-hidden />
                  Copy event payload
                </Btn>
              </div>
              {payload && (
                <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-ink-950 p-4 text-xs text-mute">
                  {payload}
                </pre>
              )}
              <p className="mt-4 rounded-lg border border-line p-4 text-sm text-mute">
                Incoming webhook events are currently recorded as activity
                logs, but the backend does not associate them with quest
                progress. Progress shown above reflects the server; this
                frontend does not award progress from a copied or simulated
                event.
              </p>
            </div>
          )}

          {quest.quest_type === "Physical" && (
            <div className="mt-5">
              <p className="text-sm text-mute">
                Physical progress is measured from real records synced by the
                Android companion through Google Health Connect. This quest
                target is {quest.quest_metrics} {quest.scale}.
              </p>
              <div className="mt-4 rounded-lg border border-line bg-ink-950 p-4">
                <p className="text-sm font-medium">Health Connect status</p>
                {integration?.loading ? (
                  <p className="mt-1 text-sm text-mute">
                    Checking connection…
                  </p>
                ) : integration?.error ? (
                  <p className="mt-1 text-sm text-red-300">
                    {integration.error}
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-mute">
                      {integration?.data?.connected
                        ? "Connected. Synced physical activity can update this quest."
                        : "Not connected. Pair the Android companion to sync activity."}
                    </p>
                    {integration?.data?.last_sync_at && (
                      <p className="mt-1 text-xs text-mute">
                        Last sync:{" "}
                        {new Date(
                          integration.data.last_sync_at,
                        ).toLocaleString()}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Btn as={Link} to="/connect">
                  Connect Health Connect <ArrowRight size={15} aria-hidden />
                </Btn>
                <Btn
                  variant="ghost"
                  disabled={busy}
                  onClick={refreshIntegration}
                >
                  <RefreshCw size={15} aria-hidden />
                  Refresh synced progress
                </Btn>
              </div>
              <p className="mt-3 text-xs text-mute">
                Progress is calculated from synced health records, not from a
                manual check-in.
              </p>
            </div>
          )}

          {quest.quest_type === "Location" && (
            <div className="mt-5">
              <p className="text-sm text-mute">
                Get a current GPS fix, then confirm that this location meets
                the quest. Your coordinates are only used in this page and are
                not sent to the server.
              </p>
              <p className="mt-3 rounded-lg border border-line bg-ink-950 p-4 text-sm text-mute">
                This quest does not include a target location, so GPS can
                confirm your current position but cannot verify that it is the
                intended destination.
              </p>
              {checkInTarget ? (
                <>
                  <p className="mt-3 text-xs text-mute">
                    Check-ins recorded: {Math.min(
                      Math.round(progress * checkInTarget),
                      Math.round(checkInTarget),
                    )}{" "}
                    of {checkInTarget}
                  </p>
                  {locationFix && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-ink-950 p-4 text-sm text-mute">
                      <Check size={16} className="mt-0.5 text-fit" aria-hidden />
                      GPS fix acquired (accuracy about{" "}
                      {Math.round(locationFix.accuracy)} m). Confirm only if
                      this location fulfils the quest.
                    </div>
                  )}
                  {locationError && (
                    <p role="alert" className="mt-3 text-sm text-red-300">
                      {locationError}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {!locationFix ? (
                      <Btn
                        disabled={busy || done}
                        onClick={getLocationFix}
                      >
                        <MapPin size={15} aria-hidden />
                        {busy ? "Getting GPS fix…" : "Get GPS check-in"}
                      </Btn>
                    ) : (
                      <Btn
                        disabled={busy || done}
                        onClick={confirmLocationCheckIn}
                      >
                        {busy ? "Saving…" : "Confirm this check-in"}
                      </Btn>
                    )}
                    {locationFix && (
                      <Btn
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setLocationFix(null)}
                      >
                        Discard GPS fix
                      </Btn>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-line bg-ink-950 p-4 text-sm text-mute">
                  This quest does not have a positive check-in target, so GPS
                  progress cannot be recorded.
                </p>
              )}
            </div>
          )}

          {!tpl && (
            <p className="mt-5 text-sm text-mute">
              This quest type has no supported activity template.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
