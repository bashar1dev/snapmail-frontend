import { ArrowLeft, Trash2 } from 'lucide-react';
import { EmailDetail as EmailDetailType } from '../types';

type Props = {
  email: EmailDetailType;
  onBack: () => void;
  onDelete?: () => void;
};

export function EmailDetail({ email, onBack, onDelete }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          data-testid="back-to-inbox-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete mailbox
          </button>
        )}
      </div>

      <div className="glass card-hover p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary-600">Email</div>
        <h2 className="mt-1 text-xl font-bold text-slate-900" data-testid="email-subject">
          {email.subject}
        </h2>
        <div className="text-sm text-slate-600" data-testid="email-sender">
          From: {email.sender}
        </div>
        <div className="text-xs text-slate-500">
          {new Date(email.received_at).toLocaleString()}
        </div>
        <div className="prose prose-sm mt-4 max-w-none text-slate-800" data-testid="email-body">
          {email.body_html ? (
            <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm">{email.body}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
