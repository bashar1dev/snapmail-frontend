import { useEffect, useState } from 'react';
import { getEmails, refreshMailbox } from '../api';
import { EmailSummary, Mailbox } from '../types';
import { EmailList } from './EmailList';
import { MailboxCard } from './MailboxCard';
import { HelpModal } from './HelpModal';
import { Toaster, toast } from 'sonner';

type Props = {
  mailbox: Mailbox;
  onSelectEmail: (id: string) => void;
  onDelete: () => Promise<void>;
  onRefreshMailbox: () => void;
};

export function InboxView({ mailbox, onSelectEmail, onDelete, onRefreshMailbox }: Props) {
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const res = await getEmails(mailbox.email);
      setEmails(res.emails);
    } catch (e) {
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
    const id = setInterval(loadEmails, 7000);
    return () => clearInterval(id);
  }, [mailbox.email]);

  const handleRefreshTimer = async () => {
    try {
      await refreshMailbox(mailbox.email);
      onRefreshMailbox();
      toast.success('Mailbox extended by 10 minutes');
    } catch {
      toast.error('Failed to refresh mailbox');
    }
  };

  const handleDelete = async () => {
    await onDelete();
  };

  return (
    <div className="space-y-4">
      <Toaster richColors position="top-right" />
      <MailboxCard
        email={mailbox.email}
        expiresAt={mailbox.expires_at}
        onRefresh={handleRefreshTimer}
        onDelete={handleDelete}
      />
      <div className="flex justify-end">
        <button
          onClick={() => setHelpOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Help
        </button>
      </div>
      <EmailList emails={emails} loading={loading} onRefresh={loadEmails} onSelect={onSelectEmail} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
