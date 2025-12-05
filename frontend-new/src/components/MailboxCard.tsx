import { Copy, RefreshCcw, Trash2 } from 'lucide-react';
import { Timer } from './Timer';

type Props = {
  email: string;
  expiresAt: string;
  onRefresh: () => void;
  onDelete: () => void;
};

export function MailboxCard({ email, expiresAt, onRefresh, onDelete }: Props) {
  const copyEmail = () => {
    navigator.clipboard.writeText(email).catch(() => {});
  };

  return (
    <div className="glass card-hover flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary-600">Your inbox</div>
        <Timer expiresAt={expiresAt} />
      </div>
      <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-3 py-2 font-mono text-sm text-slate-900">
        {email}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={copyEmail}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          data-testid="copy-email-btn"
        >
          <Copy className="h-4 w-4" />
          Copy
        </button>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
          data-testid="refresh-inbox-btn"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh (+10m)
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          data-testid="delete-mailbox-btn"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
