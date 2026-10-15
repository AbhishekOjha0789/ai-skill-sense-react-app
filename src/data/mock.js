export const MOCK_PROFILE = {
  user_id: 'usr_001', username: 'ShadowKnight', email: 'knight@skillsense.app',
  total_xp: 1450, fitness_connected: false, webhook_connected: true,
  skills: [
    { skill_id: 'sk_tech_01', skill_type: 'Technical', skill_title: 'React architecture', skill_intro: 'Structure state, routing and components so a large frontend stays easy to change.' },
    { skill_id: 'sk_fit_01', skill_type: 'Fitness', skill_title: 'Aerobic base', skill_intro: 'Build steady endurance with regular low-intensity cardio.' },
    { skill_id: 'sk_fin_01', skill_type: 'Finance', skill_title: 'Budget tracking', skill_intro: 'Know where your money goes each week and adjust early.' },
  ],
  quests: [
    { quest_id: 'qst_01', linked_skill: ['sk_tech_01'], quest_name: 'Build the RPG dashboard', quest_desc: 'Create responsive components that match the UI spec.', quest_type: 'Learning', scale: 'seconds', progress: 0.65, quest_metrics: 65, allocation_time: '2026-10-10T09:00:00Z', duration: 120 },
    { quest_id: 'qst_02', linked_skill: ['sk_fit_01'], quest_name: 'Burn 2,000 calories this week', quest_desc: 'Log cardio sessions until you reach the weekly target.', quest_type: 'Physical', scale: 'calories', progress: 0.3, quest_metrics: 30, allocation_time: '2026-10-12T06:30:00Z', duration: 10080 },
    { quest_id: 'qst_03', linked_skill: ['sk_fin_01'], quest_name: 'Log expenses for 5 days', quest_desc: 'Send one expense event per day through your webhook.', quest_type: 'Webhook', scale: 'others', progress: 0, quest_metrics: 0, allocation_time: '2026-10-14T08:00:00Z', duration: 7200 },
  ],
};
