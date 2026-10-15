import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, Btn, Bar, TYPE_TEXT, TYPE_BAR } from '../components/ui';
import { useApp } from '../App';
import { NotFound } from './Connect';

const Back = () => <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-mute hover:text-fg"><ArrowLeft size={16} aria-hidden />Dashboard</Link>;

export function SkillPage() {
  const { skillId } = useParams();
  const { profile } = useApp();
  const skill = profile.skills.find((s) => s.skill_id === skillId);
  if (!skill) return <NotFound />;
  const quests = profile.quests.filter((q) => q.linked_skill.includes(skillId));
  return (
    <div className="mx-auto max-w-2xl">
      <Back />
      <span className={`mb-4 block h-1 w-14 rounded-full ${TYPE_BAR[skill.skill_type]}`} aria-hidden />
      <p className={`text-sm ${TYPE_TEXT[skill.skill_type]}`}>{skill.skill_type} skill</p>
      <h1 className="mt-1 font-display text-4xl font-bold">{skill.skill_title}</h1>
      <p className="mt-4 text-lg text-mute">{skill.skill_intro}</p>
      <h2 className="mb-3 mt-10 font-display text-xl font-semibold">Quests for this skill</h2>
      {quests.length === 0 ? <p className="text-mute">No quests yet for this skill.</p> : quests.map((q) => (
        <Card as={Link} to={`/quests/${q.quest_id}`} key={q.quest_id} className="mb-3 block p-4">
          <div className="flex justify-between gap-4"><span className="font-medium">{q.quest_name}</span><span className="text-sm text-mute">{Math.round(q.progress * 100)}%</span></div>
        </Card>
      ))}
    </div>
  );
}

const TEMPLATES = {
  Learning: { action: 'Log a study session', hint: 'Finish a focused session, then log it here.', delta: 0.1 },
  Webhook: { action: 'Send a test event', hint: 'Events posted to your webhook count toward this quest.', delta: 0.1 },
  Location: { action: 'Check in at this place', hint: 'Check-in reads your device location once and does not store it.', delta: 0.2 },
  Physical: { action: 'Sync a workout', hint: 'Calories and time sync from your connected fitness app.', delta: 0.15 },
};

export function QuestPage() {
  const { questId } = useParams();
  const { profile, addProgress, notify } = useApp();
  const [view, setView] = useState('progress');
  const [busy, setBusy] = useState(false);
  const quest = profile.quests.find((q) => q.quest_id === questId);
  if (!quest) return <NotFound />;
  const tpl = TEMPLATES[quest.quest_type] || TEMPLATES.Learning;
  const done = quest.progress >= 1;

  const run = async () => {
    setBusy(true);
    if (quest.quest_type === 'Location') {
      const ok = await new Promise((res) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(() => res(true), () => res(false), { timeout: 8000 }) : res(false));
      if (!ok) { setBusy(false); return notify('Location access is blocked. Allow it in your browser settings to check in.'); }
    }
    await addProgress(quest.quest_id, tpl.delta);
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Back />
      <p className="text-sm text-gold">{quest.quest_type} quest</p>
      <h1 className="mt-1 font-display text-4xl font-bold">{quest.quest_name}</h1>
      <p className="mt-4 text-lg text-mute">{quest.quest_desc}</p>
      <div className="mt-6"><Bar value={quest.progress} label="Quest progress" /></div>
      <p className="mt-2 text-sm text-mute">{Math.round(quest.progress * 100)}% complete</p>

      <div role="tablist" className="mt-8 inline-flex rounded-lg border border-line p-1">
        {[['progress', 'View progress'], ['play', quest.progress > 0 ? 'Resume quest' : 'Start quest']].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${view === id ? 'bg-ink-800 text-fg' : 'text-mute hover:text-fg'}`}>{label}</button>
        ))}
      </div>

      {view === 'progress' ? (
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['Progress', `${quest.quest_metrics}%`], ['Time allowed', `${Math.round(quest.duration / 60)} h`], ['Measured in', quest.scale], ['Assigned', new Date(quest.allocation_time).toLocaleDateString()]].map(([k, v]) => (
            <Card key={k} className="p-4"><dt className="text-sm text-mute">{k}</dt><dd className="mt-1 font-display text-xl font-semibold capitalize">{v}</dd></Card>
          ))}
        </dl>
      ) : (
        <Card className="mt-6 p-6">
          <p className="text-mute">{tpl.hint}</p>
          <Btn onClick={run} disabled={busy || done} className="mt-4">{done ? 'Quest complete' : busy ? 'Working…' : tpl.action}</Btn>
        </Card>
      )}
    </div>
  );
}
