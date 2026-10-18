import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, ExternalLink } from "lucide-react";
import { Card, Btn } from "../components/ui";
import { useApp } from "../App";
import { apiCall } from "../services/api";

export function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="font-display text-4xl font-bold">Page not found</h1>
      <p className="mt-3 text-mute">This page doesn't exist or was moved.</p>
      <Btn as={Link} to="/" className="mt-6">
        Go home
      </Btn>
    </div>
  );
}

export default function Connect() {
  const { refreshProfile, notify } = useApp();
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [health, setHealth] = useState({ connected: false });
  const [pairing, setPairing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiCall("/api/webhooks/me"),
      apiCall("/api/health-connect/status"),
    ]).then(([webhookResult, healthResult]) => {
      if (!active) return;
      if (webhookResult.success) {
        setWebhookConfigured(webhookResult.data.configured);
      } else {
        notify(`Could not load webhook status: ${webhookResult.error}`);
      }
      if (healthResult.success) {
        setHealth(healthResult.data);
      } else {
        notify(`Could not load Health Connect status: ${healthResult.error}`);
      }
    });
    return () => {
      active = false;
    };
  }, [notify]);

  useEffect(() => {
    if (!pairing) return undefined;
    let active = true;
    const interval = window.setInterval(async () => {
      const result = await apiCall("/api/health-connect/status");
      if (!active) return;
      if (!result.success) {
        notify(`Could not check Health Connect status: ${result.error}`);
        setPairing(null);
        return;
      }
      if (result.data.connected) {
        setHealth(result.data);
        setPairing(null);
        await refreshDashboard();
        notify("Google Health Connect paired successfully");
      }
    }, 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [pairing, notify, refreshProfile]);

  const copy = async (value, successMessage) => {
    try {
      await navigator.clipboard.writeText(value);
      notify(successMessage);
    } catch {
      notify("Copy failed. Select the value and copy it manually.");
    }
  };

  const refreshDashboard = async () => {
    const error = await refreshProfile();
    if (error) notify(`Connection changed, but dashboard refresh failed: ${error}`);
  };

  const updateWebhook = async () => {
    setBusy(true);
    const result = await apiCall("/api/webhooks/me", "PUT");
    if (!result.success) {
      notify(result.error);
    } else {
      setWebhookUrl(result.data.webhook_url);
      setWebhookConfigured(true);
      await refreshDashboard();
      notify("Webhook endpoint created. Copy and save this URL.");
    }
    setBusy(false);
  };

  const revokeWebhook = async () => {
    setBusy(true);
    const result = await apiCall("/api/webhooks/me", "DELETE");
    if (!result.success) {
      notify(result.error);
    } else {
      setWebhookConfigured(false);
      setWebhookUrl("");
      await refreshDashboard();
      notify("Webhook endpoint revoked");
    }
    setBusy(false);
  };

  const startPairing = async () => {
    setBusy(true);
    const result = await apiCall("/api/health-connect/pairings", "POST", {});
    if (!result.success) {
      notify(result.error);
    } else {
      setPairing(result.data);
      notify("Pairing code created. Open the Android companion app.");
    }
    setBusy(false);
  };

  const disconnectHealth = async () => {
    setBusy(true);
    const result = await apiCall("/api/health-connect/devices/me", "DELETE");
    if (!result.success) {
      notify(result.error);
    } else {
      setHealth({ connected: false });
      setPairing(null);
      await refreshDashboard();
      notify("Google Health Connect disconnected");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl font-bold">Connections</h1>
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold">
          Google Health Connect
        </h2>
        <p className="mt-1 text-mute">
          {health.connected
            ? `Connected${health.last_sync_at ? ` · Last sync ${new Date(health.last_sync_at).toLocaleString()}` : ""}. Health activities can update matching active quests.`
            : "Connect the Android companion to sync permitted steps, workouts, calories, distance, and heart-rate activity."}
        </p>
        {health.connected ? (
          <Btn
            variant="ghost"
            disabled={busy}
            className="mt-4"
            onClick={disconnectHealth}
          >
            Disconnect
          </Btn>
        ) : (
          <>
            <Btn
              disabled={busy}
              className="mt-4"
              onClick={startPairing}
            >
              {busy ? "Please wait…" : "Connect Android companion"}
            </Btn>
            {pairing && (
              <div className="mt-4 space-y-3 rounded-lg border border-line bg-ink-950 p-4">
                <p className="text-sm text-mute">
                  Open the companion app and allow the Health Connect
                  permissions you want to sync. This pairing code expires{" "}
                  {new Date(pairing.expires_at).toLocaleTimeString()}.
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-line p-3">
                  <code className="min-w-0 flex-1 break-all text-sm text-tech">
                    {pairing.pairing_code}
                  </code>
                  <button
                    onClick={() =>
                      copy(pairing.pairing_code, "Pairing code copied")
                    }
                    aria-label="Copy Health Connect pairing code"
                    className="rounded-md p-2 text-mute hover:bg-ink-800 hover:text-fg"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <a
                  href={pairing.app_link}
                  className="inline-flex items-center gap-2 text-sm text-gold hover:underline"
                >
                  Open Android companion
                  <ExternalLink size={14} aria-hidden />
                </a>
              </div>
            )}
          </>
        )}
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold">Activity webhook</h2>
        <p className="mt-1 text-mute">
          Send JSON events to your private, per-user URL. Keep the endpoint
          private; anyone with the URL can submit events for your account.
        </p>
        {webhookConfigured && !webhookUrl && (
          <p className="mt-3 text-sm text-mute">
            Your endpoint is active, but its secret URL is only shown when
            created. Rotate it to reveal a new URL.
          </p>
        )}
        {webhookUrl && (
          <>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-ink-950 p-3">
              <code className="min-w-0 flex-1 break-all text-sm text-tech">
                {webhookUrl}
              </code>
              <button
                onClick={() => copy(webhookUrl, "Webhook URL copied")}
                aria-label="Copy webhook URL"
                className="rounded-md p-2 text-mute hover:bg-ink-800 hover:text-fg"
              >
                <Copy size={16} />
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-ink-950 p-3 text-xs text-mute">
              {JSON.stringify(
                {
                  activity_type: "routine_activity",
                  log_desc: "Completed a workout",
                  event_id: "provider-event-123",
                },
                null,
                2,
              )}
            </pre>
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Btn disabled={busy} onClick={updateWebhook}>
            {webhookConfigured ? "Rotate webhook URL" : "Create webhook URL"}
          </Btn>
          {webhookConfigured && (
            <Btn variant="ghost" disabled={busy} onClick={revokeWebhook}>
              Revoke
            </Btn>
          )}
        </div>
      </Card>
    </div>
  );
}
