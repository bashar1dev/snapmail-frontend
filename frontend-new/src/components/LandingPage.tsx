import { Sparkles, ShieldCheck, Timer, Rocket } from 'lucide-react';

type Props = {
  onGenerate: () => void;
  loading: boolean;
};

export function LandingPage({ onGenerate, loading }: Props) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="glass card-hover grid gap-8 p-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            <Sparkles className="h-4 w-4" />
            Disposable in seconds
          </div>
          <h1 className="font-display text-4xl font-bold text-slate-900">
            Anonymous email in one tap.
          </h1>
          <p className="text-lg text-slate-600">
            Create a temporary inbox instantly. No signup, no spam. Perfect for signups and verifications.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:from-primary-600 hover:to-primary-700 disabled:opacity-70"
            >
              {loading ? 'Generating...' : 'Generate email'}
            </button>
          </div>
        </div>
        <div className="grid gap-4 rounded-2xl bg-white/80 p-6 shadow-soft">
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Auto-expire" desc="Inbox deleted when the timer ends." />
          <Feature icon={<Timer className="h-5 w-5" />} title="10-minute timer" desc="Refresh adds another 10 minutes." />
          <Feature icon={<Rocket className="h-5 w-5" />} title="Instant delivery" desc="Emails appear within seconds." />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="rounded-lg bg-primary-50 p-2 text-primary-600">{icon}</div>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-600">{desc}</div>
      </div>
    </div>
  );
}
