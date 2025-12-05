import { X, Info, Timer, Shield, Zap, RefreshCcw } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function HelpModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Info className="h-5 w-5 text-primary-600" />
            How to use SnapMail
          </div>
          <button
            aria-label="Close help"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4 text-sm text-slate-700">
          <ol className="space-y-2 rounded-xl bg-slate-50 p-4">
            <li className="flex gap-2"><span className="font-bold">1.</span> Generate a temporary email address.</li>
            <li className="flex gap-2"><span className="font-bold">2.</span> Copy it and use for signups/verification.</li>
            <li className="flex gap-2"><span className="font-bold">3.</span> Check incoming messages below.</li>
          </ol>
          <div className="grid grid-cols-2 gap-3">
            <Feature icon={<Timer className="h-5 w-5" />} title="10-minute timer" />
            <Feature icon={<RefreshCcw className="h-5 w-5" />} title="Refresh adds 10 min" />
            <Feature icon={<Zap className="h-5 w-5" />} title="Instant delivery" />
            <Feature icon={<Shield className="h-5 w-5" />} title="Auto-delete on expiry" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-3 text-slate-800 shadow-soft">
      <div className="rounded-md bg-primary-50 p-2 text-primary-600">{icon}</div>
      <span className="text-sm font-semibold">{title}</span>
    </div>
  );
}
