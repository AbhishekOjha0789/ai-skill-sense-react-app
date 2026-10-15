import { Link } from 'react-router-dom';
import { Activity, Webhook, ChevronRight } from 'lucide-react';
import { Card, Bar, Ring, TYPE_TEXT, TYPE_BAR } from '../components/ui';
import { useApp } from '../App';

export const XP_PER_LEVEL = 400;

export default function Dashboard() {
  const { profile: p } = useApp();
  const level = Math.floor(p.total_xp / XP_PER_LEVEL) + 1;
  const into = p.total_xp % XP_PER_LEVEL;
  const active = p.quests.filter((q) => q.progress < 1);

  return (
    <div className="space-y-10">
      <Card className="flex flex-wrap items-center gap-6 p-6">
        <Ring level={level} pct={into / XP_PER_LEVEL} />
        <div>
          <h1 className="font-display text-4xl font-bold">{p.username}</h1>
          <p className="mt-1 text-mute">{p.total_xp} XP total</p>
          <p className="text-sm text-gold">{XP_PER_LEVEL - into} XP to level {level + 1}</p>
        </div>
      </Card>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Active quests</h2>
        {active.length === 0 ? <p className="text-mute">No active quests. New quests appear as your skills change.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((q) => (
              <Card as={Link} to={`/quests/${q.quest_id}`} key={q.quest_id} className="block p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-semibold">{q.quest_name}</h3><p className="text-sm text-mute">{q.quest_type} quest</p></div>
                  <ChevronRight size={18} className="mt-1 shrink-0 text-mute" aria-hidden />
                </div>
                <div className="mt-4"><Bar value={q.progress} label={`${q.quest_name} progress`} /></div>
                <p className="mt-2 text-sm text-mute">{Math.round(q.progress * 100)}% complete</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Skills</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {p.skills.map((s) => (
            <Card as={Link} to={`/skills/${s.skill_id}`} key={s.skill_id} className="block p-5">
              <span className={`mb-3 block h-1 w-10 rounded-full ${TYPE_BAR[s.skill_type]}`} aria-hidden />
              <h3 className="font-semibold">{s.skill_title}</h3>
              <p className={`text-sm ${TYPE_TEXT[s.skill_type]}`}>{s.skill_type}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card as={Link} to="/connect" className="flex items-center gap-4 p-5">
          <Activity className="text-fit" aria-hidden />
          <div><h3 className="font-semibold">Fitness app</h3><p className="text-sm text-mute">{p.fitness_connected ? 'Connected' : 'Not connected. Connect to track workouts.'}</p></div>
        </Card>
        <Card as={Link} to="/connect" className="flex items-center gap-4 p-5">
          <Webhook className="text-tech" aria-hidden />
          <div><h3 className="font-semibold">Webhook</h3><p className="text-sm text-mute">{p.webhook_connected ? 'Connected. View your endpoint.' : 'Not connected'}</p></div>
        </Card>
      </section>
    </div>
  );
}
