import { useEffect, useState } from "react";

// Use the same base URL variable your services/api.js already uses
const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const AGENT = (import.meta.env.VITE_AGENT_URL || "").replace(/\/$/, "");

const STAMP = "skillsense.wake";
const FRESH_MS = 8 * 60 * 1000; // both services idle out after ~15 min
const DEADLINE_MS = 120_000;
const SLOW_AFTER_MS = 15_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ping(url, { noCors = false } = {}) {
  const end = Date.now() + DEADLINE_MS;
  while (Date.now() < end) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const res = await fetch(`${url}/`, {
        cache: "no-store",
        signal: ctrl.signal,
        ...(noCors ? { mode: "no-cors" } : {}),
      });
      // no-cors responses are opaque, so any completed request counts
      if (noCors || res.ok) return true;
    } catch {
      /* still asleep or network hiccup, retry */
    } finally {
      clearTimeout(timer);
    }
    await sleep(5_000);
  }
  return false;
}

let inflight = null; // one wake-up per page load (also covers StrictMode double effects)

function wakeAll() {
  if (inflight) return inflight;
  try {
    const last = Number(sessionStorage.getItem(STAMP));
    if (last && Date.now() - last < FRESH_MS) return (inflight = Promise.resolve(true));
  } catch {
    /* storage unavailable */
  }
  inflight = Promise.all([
    API ? ping(API) : true,
    AGENT ? ping(AGENT, { noCors: true }) : true,
  ]).then(([backendOk, agentOk]) => {
    if (backendOk && agentOk) {
      try {
        sessionStorage.setItem(STAMP, String(Date.now()));
      } catch {
        /* ignore */
      }
    }
    return backendOk && agentOk;
  });
  return inflight;
}

export function useWakeUp() {
  const [status, setStatus] = useState("waking"); // waking | ready | failed
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("waking");
    setSlow(false);
    const slowTimer = setTimeout(() => active && setSlow(true), SLOW_AFTER_MS);
    wakeAll().then((ok) => {
      if (!active) return;
      clearTimeout(slowTimer);
      setStatus(ok ? "ready" : "failed");
    });
    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [attempt]);

  const retry = () => {
    inflight = null;
    setAttempt((n) => n + 1);
  };

  return { status, slow, retry };
}