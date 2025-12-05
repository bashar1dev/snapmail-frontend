import { Mail, RefreshCcw, Loader2 } from 'lucide-react';
import { EmailSummary } from '../types';

type Props = {
  emails: EmailSummary[];
  loading: boolean;
  onRefresh: () => void;
  onSelect: (id: string) => void;
};

export function EmailList({ emails, loading, onRefresh, onSelect }: Props) {
  return (
    <div className="glass card-hover p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Mail className="h-4 w-4 text-primary-600" />
          Inbox
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {emails.length}
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh
        </button>
      </div>
      {emails.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
          Inbox empty. Send an email to your address to see it here.
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <button
              key={email.id}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-primary-200 hover:bg-primary-50/40"
              onClick={() => onSelect(email.id)}
              data-testid={`email-item-${email.id}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{email.subject}</span>
                <span className="text-xs text-slate-500">
                  {new Date(email.received_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-600">{email.sender}</div>
              <div className="text-xs text-slate-500 line-clamp-2">{email.preview}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
