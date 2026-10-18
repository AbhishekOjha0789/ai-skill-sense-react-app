import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Plus,
  Pencil,
  Mail,
  ArrowUpRight,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Btn, Card } from "../components/ui";
import { isProfileComplete, useApp } from "../App";

const inputClass =
  "w-full rounded-xl border border-line bg-ink-950 px-3.5 py-3 text-sm outline-none transition placeholder:text-mute/60 focus:border-gold focus:ring-2 focus:ring-gold/15";
const interestSuggestions = [
  "Technology",
  "Design",
  "Fitness",
  "Reading",
  "Finance",
  "Music",
  "Writing",
  "Travel",
  "Gaming",
  "Cooking",
  "Science",
  "Business",
];
const genderSuggestions = [
  "Woman",
  "Man",
  "Non-binary",
  "Prefer not to say",
];
const steps = [
  { title: "Your story", subtitle: "A little about you" },
  { title: "Your interests", subtitle: "What gets you curious?" },
  { title: "Your background", subtitle: "Shape your learning path" },
];
const requiredFields = [
  "age",
  "gender",
  "summary",
  "interests",
  "occupation",
  "experience",
  "education_status",
];

const formFromProfile = (profile) => ({
  age: profile?.age == null ? "" : String(profile.age),
  gender: profile?.gender ?? "",
  summary: profile?.summary ?? "",
  interests: Array.isArray(profile?.interests) ? profile.interests : [],
  occupation: profile?.occupation ?? "",
  experience: profile?.experience ?? "",
  education_status: profile?.education_status ?? "",
  education_summary: profile?.education_summary ?? "",
});

const readDraft = (profile) => {
  try {
    const raw = localStorage.getItem(`skillsense.profile-draft.${profile.user_id}`);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== "object") return null;
    return {
      ...formFromProfile(profile),
      ...draft,
      interests: Array.isArray(draft.interests)
        ? draft.interests.filter((interest) => typeof interest === "string")
        : formFromProfile(profile).interests,
    };
  } catch {
    return null;
  }
};

function ProfileOverview() {
    const { profile } = useApp();
    if (!profile) return <Navigate to="/auth" replace />;

    const initials = (profile.username || "Player")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
    const details = [
      ["Age", profile.age ? `${profile.age} years` : null],
      ["Gender", profile.gender],
      ["Current role", profile.occupation],
      ["Experience", profile.experience],
      ["Education", profile.education_status],
      ["Education details", profile.education_summary],
    ].filter(([, value]) => value);

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              <Sparkles size={14} aria-hidden />
              Character profile
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Your profile
            </h1>
            <p className="mt-2 text-sm text-mute">
              Your story, interests, and learning background in one place.
            </p>
          </div>
          <Btn as={Link} to="/profile/edit" state={{ openEditor: true }}>
            <Pencil size={15} aria-hidden />
            Edit profile
          </Btn>
        </div>

        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full bg-gold/10 blur-3xl"
          />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="grid size-20 shrink-0 place-items-center rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/20 to-gold/5 font-display text-3xl font-bold text-gold shadow-[0_0_42px_rgba(242,184,75,0.08)]">
              {initials || <UserRound size={30} aria-hidden />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-3xl font-bold">{profile.username}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-mute">
                <Mail size={14} aria-hidden />
                <span className="truncate">{profile.email}</span>
              </p>
              {profile.occupation && (
                <p className="mt-3 inline-flex items-center rounded-full border border-fit/25 bg-fit/5 px-3 py-1 text-sm text-fit">
                  {profile.occupation}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-line bg-ink-950/70 px-5 py-3 text-center">
              <p className="font-display text-2xl font-bold text-gold">
                {profile.total_xp || 0}
              </p>
              <p className="text-xs text-mute">total XP</p>
            </div>
          </div>
          {profile.summary && (
            <p className="relative mt-7 max-w-3xl border-l-2 border-gold/60 pl-4 text-base leading-7 text-fg/90">
              “{profile.summary}”
            </p>
          )}
        </Card>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-mute">
                  About you
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold">
                  Background
                </h2>
              </div>
              <span className="grid size-10 place-items-center rounded-xl border border-line bg-ink-950 text-gold">
                <UserRound size={18} aria-hidden />
              </span>
            </div>
            <dl className="mt-5 divide-y divide-line">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[150px_1fr] sm:gap-4"
                >
                  <dt className="text-sm text-mute">{label}</dt>
                  <dd className="whitespace-pre-wrap text-sm leading-6 text-fg">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Curiosity map
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold">
                  Interests
                </h2>
              </div>
              <span className="grid size-10 place-items-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                <Sparkles size={18} aria-hidden />
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(profile.interests || []).map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-gold/25 bg-gold/5 px-3 py-1.5 text-sm text-gold"
                >
                  {interest}
                </span>
              ))}
            </div>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-mute transition hover:text-gold"
            >
              Explore your quests
              <ArrowUpRight size={15} aria-hidden />
            </Link>
          </Card>
        </div>
      </div>
    );
  }

function Profile() {
  const { profile } = useApp();
  const location = useLocation();
  if (!profile) return <Navigate to="/auth" replace />;
  const complete = isProfileComplete(profile);
  const editing =
    location.pathname.endsWith("/edit") && location.state?.openEditor === true;
  if (!complete || editing) return <ProfileEditor />;
  return <ProfileOverview />;
}

const hasValue = (form, field) => {
  if (field === "interests") {
    return Array.isArray(form.interests) &&
      form.interests.some((interest) => interest.trim());
  }
  if (field === "age") {
    const age = Number(form.age);
    return Number.isInteger(age) && age >= 1 && age <= 120;
  }
  return Boolean(form[field]?.trim());
};

function Field({ label, hint, optional = false, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
        <span>{label}</span>
        {optional ? (
          <span className="text-xs font-normal text-mute">Optional</span>
        ) : (
          <span className="text-xs font-normal text-gold">Required</span>
        )}
      </span>
      {children}
      {hint && <span className="mt-2 block text-xs leading-5 text-mute">{hint}</span>}
    </label>
  );
}

function StepContent({
  step,
  form,
  update,
  addInterest,
  removeInterest,
  customInterest,
  setCustomInterest,
}) {
  if (step === 0) {
    return (
      <motion.div
        key="story"
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -14 }}
        transition={{ duration: 0.18 }}
        className="space-y-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Age">
            <input
              className={inputClass}
              type="number"
              min="1"
              max="120"
              step="1"
              required
              value={form.age}
              onChange={(event) => update("age", event.target.value)}
              placeholder="Your age"
              autoComplete="off"
            />
          </Field>
          <Field label="Gender">
            <input
              className={inputClass}
              required
              maxLength={50}
              value={form.gender}
              onChange={(event) => update("gender", event.target.value)}
              placeholder="Choose or type your own"
              autoComplete="sex"
            />
          </Field>
        </div>
        <div className="-mt-3 flex flex-wrap gap-2">
          {genderSuggestions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => update("gender", option)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                form.gender === option
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-line text-mute hover:border-gold/60 hover:text-fg"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <Field
          label="Your introduction"
          hint={`${form.summary.length}/500 characters. What are you hoping to learn or accomplish?`}
        >
          <textarea
            className={`${inputClass} min-h-32 resize-y`}
            required
            maxLength={500}
            value={form.summary}
            onChange={(event) => update("summary", event.target.value)}
            placeholder="I’m here to build better habits, learn new skills, and make progress one quest at a time…"
          />
        </Field>
      </motion.div>
    );
  }

  if (step === 1) {
    return (
      <motion.div
        key="interests"
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -14 }}
        transition={{ duration: 0.18 }}
        className="space-y-6"
      >
        <Field
          label="Pick what you’re into"
          hint="Choose a few or add your own. You can change these any time."
        >
          <div className="flex flex-wrap gap-2">
            {interestSuggestions.map((interest) => {
              const selected = form.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    selected
                      ? removeInterest(interest)
                      : addInterest(interest)
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition duration-200 ${
                    selected
                      ? "border-gold bg-gold/10 text-gold shadow-[0_0_18px_rgba(244,195,92,0.08)]"
                      : "border-line bg-ink-950/60 text-mute hover:-translate-y-0.5 hover:border-gold/50 hover:text-fg"
                  }`}
                >
                  {selected && <Check size={14} aria-hidden />}
                  {interest}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="flex flex-wrap gap-2">
          {form.interests
            .filter(
              (interest) =>
                !interestSuggestions.includes(interest) && interest.trim(),
            )
            .map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-sm text-gold"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  aria-label={`Remove ${interest}`}
                  className="rounded-full p-0.5 hover:bg-gold/15"
                >
                  <X size={13} aria-hidden />
                </button>
              </span>
            ))}
        </div>
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={customInterest}
            onChange={(event) => setCustomInterest(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addInterest(customInterest);
                setCustomInterest("");
              }
            }}
            placeholder="Add a custom interest"
            aria-label="Add a custom interest"
          />
          <Btn
            type="button"
            variant="ghost"
            aria-label="Add interest"
            onClick={() => {
              addInterest(customInterest);
              setCustomInterest("");
            }}
          >
            <Plus size={17} aria-hidden />
            Add
          </Btn>
        </div>
        <Field label="Current role">
          <input
            className={inputClass}
            required
            maxLength={255}
            value={form.occupation}
            onChange={(event) => update("occupation", event.target.value)}
            placeholder="e.g. Student, product designer, exploring"
          />
        </Field>
        <Field
          label="Experience so far"
          hint="A few words are enough—even “just getting started” works."
        >
          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            required
            maxLength={2000}
            value={form.experience}
            onChange={(event) => update("experience", event.target.value)}
            placeholder="What have you tried? What would you like to get better at?"
          />
        </Field>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="background"
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -14 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <Field
        label="Education status"
        hint="Choose the closest match, or type your own."
      >
        <input
          className={inputClass}
          list="education-status-options"
          required
          maxLength={100}
          value={form.education_status}
          onChange={(event) => update("education_status", event.target.value)}
          placeholder="e.g. Undergraduate, graduate, self-taught"
        />
        <datalist id="education-status-options">
          {[
            "High school",
            "Undergraduate",
            "Graduate",
            "Postgraduate",
            "Self-taught",
            "Prefer not to say",
          ].map((status) => (
            <option value={status} key={status} />
          ))}
        </datalist>
      </Field>
      <Field
        label="Education details"
        optional
        hint={`${form.education_summary.length}/500 characters. Share a subject, course, or anything that helps personalize your quests.`}
      >
        <textarea
          className={`${inputClass} min-h-36 resize-y`}
          maxLength={500}
          value={form.education_summary}
          onChange={(event) => update("education_summary", event.target.value)}
          placeholder="Optional—skip if you’d rather not share."
        />
      </Field>
      <div className="rounded-xl border border-fit/20 bg-fit/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-fit">
          <Sparkles size={16} aria-hidden />
          Your profile, your call
        </p>
        <p className="mt-2 text-sm leading-6 text-mute">
          Education details are optional. The rest helps your agent understand
          your goals and recommend a useful next quest.
        </p>
      </div>
    </motion.div>
  );
}

function ProfileEditor() {
  const { profile, saveProfile, notify } = useApp();
  const navigate = useNavigate();
  const userId = profile?.user_id;
  const draftKey = userId ? `skillsense.profile-draft.${userId}` : "";
  const initialDraft = profile ? readDraft(profile) : null;
  const [form, setForm] = useState(() =>
    initialDraft ?? formFromProfile(profile),
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftSaved, setDraftSaved] = useState(Boolean(initialDraft));
  const [customInterest, setCustomInterest] = useState("");
  const dirty = useRef(Boolean(initialDraft));

  useEffect(() => {
    if (!profile) return;
    const savedDraft = readDraft(profile);
    if (savedDraft) {
      dirty.current = true;
      setForm(savedDraft);
      setDraftSaved(true);
    } else if (!dirty.current) {
      setForm(formFromProfile(profile));
    }
  }, [profile]);

  useEffect(() => {
    if (!dirty.current || !draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
      setDraftSaved(true);
    } catch {
      setError("Your browser could not save a local draft. Keep this page open until you submit.");
    }
  }, [draftKey, form]);

  if (!profile) return <Navigate to="/auth" replace />;

  const complete = isProfileComplete(profile);
  const doneCount = requiredFields.filter((field) => hasValue(form, field)).length;
  const completion = Math.round((doneCount / requiredFields.length) * 100);
  const set = (field, value) => {
    dirty.current = true;
    setForm((current) => ({ ...current, [field]: value }));
  };
  const update = (field, value) => {
    set(field, value);
    setError("");
  };
  const addInterest = (value) => {
    const interest = value.trim().replace(/,$/, "");
    if (!interest || form.interests.some((item) => item.toLowerCase() === interest.toLowerCase())) {
      return;
    }
    update("interests", [...form.interests, interest]);
  };
  const removeInterest = (value) =>
    update(
      "interests",
      form.interests.filter((interest) => interest !== value),
    );

  const stepFields = [
    ["age", "gender", "summary"],
    ["interests", "occupation", "experience"],
    ["education_status"],
  ];
  const validateStep = (index) => {
    const missing = stepFields[index].filter((field) => !hasValue(form, field));
    if (missing.length) {
      setError(
        index === 0
          ? "Add your age, gender, and a short introduction to continue."
          : index === 1
            ? "Choose at least one interest and add your current role and experience."
            : "Add your education status to finish your profile.",
      );
      return false;
    }
    setError("");
    return true;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validateStep(2)) return;
    if (!requiredFields.every((field) => hasValue(form, field))) {
      setError("Some required details are missing. Review the steps before saving.");
      setStep(stepFields.findIndex((fields) => fields.some((field) => !hasValue(form, field))));
      return;
    }
    setBusy(true);
    const data = {
      age: Number(form.age),
      gender: form.gender.trim(),
      interests: form.interests.map((interest) => interest.trim()).filter(Boolean),
      summary: form.summary.trim(),
      occupation: form.occupation.trim(),
      experience: form.experience.trim(),
      education_status: form.education_status.trim(),
      education_summary: form.education_summary.trim() || null,
    };
    const errorMessage = await saveProfile(data);
    setBusy(false);
    if (errorMessage) {
      setError(errorMessage);
      return;
    }
    let draftCleanupFailed = false;
    try {
      localStorage.removeItem(draftKey);
    } catch {
      draftCleanupFailed = true;
    }
    dirty.current = false;
    setDraftSaved(false);
    notify(
      draftCleanupFailed
        ? "Profile saved. Your browser could not clear the local draft."
        : "Profile saved. Your quests are ready.",
    );
    navigate("/dashboard", { replace: true });
  };

  const initials = (profile.username || "Player")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <Sparkles size={14} aria-hidden />
            {complete ? "Character profile" : "Your adventure starts here"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {complete ? "Make it yours." : "Build your character."}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-mute">
            A few details help us make your skills, quests, and progress feel
            like they belong to you.
          </p>
        </div>
        {complete && (
          <Btn type="button" variant="ghost" onClick={() => navigate("/dashboard")}>
            Back to dashboard
          </Btn>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="overflow-hidden">
          <div className="border-b border-line p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  Step {step + 1} <span className="text-mute">of {steps.length}</span>
                </p>
                <p className="mt-1 text-xs text-mute">{steps[step].subtitle}</p>
              </div>
              {draftSaved && (
                <span className="inline-flex items-center gap-1.5 text-xs text-fit">
                  <Check size={14} aria-hidden />
                  Draft saved
                </span>
              )}
            </div>
            <div className="mt-5 flex gap-2" aria-label={`Step ${step + 1} of ${steps.length}`}>
              {steps.map((item, index) => (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => index < step && setStep(index)}
                  aria-current={index === step ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${item.title}`}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index <= step ? "bg-gold" : "bg-ink-700"
                  }`}
                />
              ))}
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">
              {steps[step].title}
            </h2>
          </div>

          <form onSubmit={submit} className="p-5 sm:p-7">
            <AnimatePresence mode="wait">
              <StepContent
                step={step}
                form={form}
                update={update}
                addInterest={addInterest}
                removeInterest={removeInterest}
                customInterest={customInterest}
                setCustomInterest={setCustomInterest}
              />
            </AnimatePresence>

            {error && (
              <p role="alert" className="mt-5 rounded-lg border border-fit/30 bg-fit/5 px-3.5 py-3 text-sm text-fit">
                {error}
              </p>
            )}

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
              <Btn
                type="button"
                variant="ghost"
                disabled={step === 0 || busy}
                onClick={() => {
                  setError("");
                  setStep((current) => Math.max(0, current - 1));
                }}
              >
                <ArrowLeft size={16} aria-hidden />
                Back
              </Btn>
              {step < steps.length - 1 ? (
                <Btn
                  type="button"
                  onClick={() => {
                    if (validateStep(step)) setStep((current) => current + 1);
                  }}
                >
                  Continue
                  <ArrowRight size={16} aria-hidden />
                </Btn>
              ) : (
                <Btn type="submit" disabled={busy}>
                  {busy ? "Saving your profile…" : complete ? "Save changes" : "Save & start"}
                  {!busy && <Sparkles size={16} aria-hidden />}
                </Btn>
              )}
            </div>
          </form>
        </Card>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <Card className="overflow-hidden p-5">
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-gold/30 bg-gold/10 font-display text-lg font-bold text-gold">
                {initials || <UserRound size={20} aria-hidden />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{profile.username}</p>
                <p className="truncate text-xs text-mute">
                  {form.occupation || "Your role will show here"}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-mute">Profile progress</span>
              <span className="font-semibold text-gold">{completion}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Profile completion"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-2 overflow-hidden rounded-full bg-ink-800"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold"
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["age", "Age & gender", <UserRound size={15} key="user" />],
                ["interests", "Interests", <Sparkles size={15} key="sparkles" />],
                ["occupation", "Experience", <BriefcaseBusiness size={15} key="work" />],
                ["education_status", "Background", <GraduationCap size={15} key="education" />],
              ].map(([field, label, icon]) => {
                const ready =
                  field === "age"
                    ? hasValue(form, "age") && hasValue(form, "gender")
                    : field === "occupation"
                      ? hasValue(form, "occupation") && hasValue(form, "experience")
                      : hasValue(form, field);
                return (
                  <div key={field} className="flex items-center gap-2.5 text-sm">
                    <span className={ready ? "text-fit" : "text-mute"} aria-hidden>
                      {ready ? <Check size={15} /> : icon}
                    </span>
                    <span className={ready ? "text-fg" : "text-mute"}>{label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-mute">
              Your interests
            </p>
            <div className="mt-3 flex min-h-10 flex-wrap content-start gap-2">
              {form.interests.length ? (
                form.interests.map((interest) => (
                  <motion.span
                    layout
                    key={interest}
                    className="rounded-full border border-gold/25 bg-gold/5 px-2.5 py-1 text-xs text-gold"
                  >
                    {interest}
                  </motion.span>
                ))
              ) : (
                <p className="text-sm text-mute">Your picks will appear here.</p>
              )}
            </div>
            {form.summary && (
              <p className="mt-4 border-t border-line pt-4 text-sm leading-6 text-mute">
                “{form.summary}”
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default Profile;
