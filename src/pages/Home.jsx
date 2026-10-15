import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Btn, Card, Bar } from '../components/ui';
import { useApp } from '../App';

export default function Home() {
  const { profile } = useApp();
  if (profile) return <Navigate to="/dashboard" replace />;
  return (
    <section className="relative isolate grid items-center gap-12 py-12 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
      <motion.div aria-hidden initial={{ opacity: 0, scaleY: 0.2 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}
        className="pointer-events-none absolute -top-32 left-1/4 -z-10 h-[32rem] w-80 origin-top -rotate-12 bg-gradient-to-b from-gold/25 to-transparent blur-3xl" />
      <div>
        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">Turn what you're learning into quests you can finish.</h1>
        <p className="mt-6 max-w-lg text-lg text-mute">AI Skill Sense maps your skills, assigns quests, and checks them off from your fitness, location and webhook data.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Btn as={Link} to="/auth?mode=signup">Create your character</Btn>
          <Btn as={Link} to="/auth" variant="ghost">Sign in</Btn>
        </div>
      </div>
      <Card className="p-6">
        <p className="text-sm text-tech">Technical quest</p>
        <h2 className="mt-1 font-display text-2xl font-bold">Build the RPG dashboard</h2>
        <p className="mt-2 text-sm text-mute">Create responsive components that match the UI spec.</p>
        <div className="mt-6"><Bar value={0.65} label="Example quest progress" /></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-mute">65% complete</span><span className="font-semibold text-gold">+150 XP</span></div>
      </Card>
    </section>
  );
}
