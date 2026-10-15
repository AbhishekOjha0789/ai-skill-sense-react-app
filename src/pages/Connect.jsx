import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy } from "lucide-react";
import { Card, Btn } from "../components/ui";
import { useApp } from "../App";
import { API_BASE_URL } from "../services/api";

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
  const { profile, toggleFitness, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const url = `${API_BASE_URL}/webhook/trigger`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify("Webhook URL copied");
    } catch {
      notify("Copy failed. Select the URL and copy it manually.");
    }
  };
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl font-bold">Connections</h1>
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold">Fitness app</h2>
        <p className="mt-1 text-mute">
          {profile.fitness_connected
            ? "Connected. Workouts count toward Physical quests."
            : "Connect to count workouts toward Physical quests."}
        </p>
        <Btn
          variant={profile.fitness_connected ? "ghost" : "primary"}
          disabled={busy}
          className="mt-4"
          onClick={async () => {
            setBusy(true);
            await toggleFitness();
            setBusy(false);
          }}
        >
          {profile.fitness_connected ? "Disconnect" : "Connect fitness app"}
        </Btn>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold">Webhook</h2>
        <p className="mt-1 text-mute">
          Send POST requests to this URL to report progress from other services.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-ink-950 p-3">
          <code className="min-w-0 flex-1 break-all text-sm text-tech">
            {url}
          </code>
          <button
            onClick={copy}
            aria-label="Copy webhook URL"
            className="rounded-md p-2 text-mute hover:bg-ink-800 hover:text-fg"
          >
            <Copy size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}
