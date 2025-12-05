import { useEffect, useState } from 'react';
import { getEmail, deleteMailbox } from '../api';
import { EmailDetailData } from '../types';
import { EmailDetail } from './EmailDetail';
import { toast, Toaster } from 'sonner';

type Props = {
  emailId: string;
  onBack: () => void;
  mailboxEmail: string;
};

export function EmailDetailView({ emailId, onBack, mailboxEmail }: Props) {
  const [email, setEmail] = useState<EmailDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getEmail(emailId);
        setEmail(res);
      } catch {
        toast.error('Failed to load email');
      } finally {
        setLoading(false);
      }
    })();
  }, [emailId]);

  const handleDelete = async () => {
    try {
      await deleteMailbox(mailboxEmail);
      toast.success('Mailbox deleted');
      onBack();
    } catch {
      toast.error('Failed to delete mailbox');
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-4">Loading...</div>;
  }

  if (!email) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        Could not load this email.
      </div>
    );
  }

  return (
    <div>
      <Toaster richColors position="top-right" />
      <EmailDetail email={email} onBack={onBack} onDelete={handleDelete} />
    </div>
  );
}
