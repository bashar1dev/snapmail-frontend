import { useEffect, useMemo, useState } from 'react';
import { createMailbox, deleteMailbox, getMailbox } from './api';
import { LandingPage } from './components/LandingPage';
import { InboxView } from './components/InboxView';
import { EmailDetailView } from './components/EmailDetailView';
import { Mailbox } from './types';
import { Toaster, toast } from 'sonner';

type ViewState =
  | { screen: 'landing' }
  | { screen: 'inbox'; mailbox: Mailbox }
  | { screen: 'email'; mailbox: Mailbox; emailId: string };

export default function App() {
  const [view, setView] = useState<ViewState>({ screen: 'landing' });
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Hydrate mailbox from storage
  useEffect(() => {
    const storedEmail = localStorage.getItem('snapmail_email');
    const expires = localStorage.getItem('snapmail_expires');
    if (storedEmail && expires) {
      setView({
        screen: 'inbox',
        mailbox: {
          email: storedEmail,
          created_at: new Date().toISOString(),
          expires_at: expires
        }
      });
    }
  }, []);

  // Refresh mailbox details (remaining time)
  useEffect(() => {
    if (view.screen !== 'inbox' && view.screen !== 'email') return;
    const email = view.mailbox.email;
    const interval = setInterval(async () => {
      try {
        const mb = await getMailbox(email);
        setView((prev) => {
          if (prev.screen === 'inbox') return { screen: 'inbox', mailbox: mb };
          if (prev.screen === 'email') return { screen: 'email', mailbox: mb, emailId: prev.emailId };
          return prev;
        });
        localStorage.setItem('snapmail_email', mb.email);
        localStorage.setItem('snapmail_expires', mb.expires_at);
      } catch {
        // ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [view]);

  const handleGenerate = async () => {
    setLoadingCreate(true);
    try {
      const mb = await createMailbox();
      localStorage.setItem('snapmail_email', mb.email);
      localStorage.setItem('snapmail_expires', mb.expires_at);
      setView({ screen: 'inbox', mailbox: mb });
      toast.success('Inbox created');
    } catch (e) {
      toast.error('Failed to create mailbox');
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleSelectEmail = (id: string) => {
    if (view.screen === 'inbox') {
      setView({ screen: 'email', mailbox: view.mailbox, emailId: id });
    }
  };

  const handleBack = () => {
    if (view.screen === 'email') {
      setView({ screen: 'inbox', mailbox: view.mailbox });
    }
  };

  const handleDeleteMailbox = async () => {
    if (view.screen === 'landing') return;
    const email = view.mailbox.email;
    try {
      await deleteMailbox(email);
      localStorage.removeItem('snapmail_email');
      localStorage.removeItem('snapmail_expires');
      toast.success('Mailbox deleted');
      setView({ screen: 'landing' });
    } catch {
      toast.error('Failed to delete mailbox');
    }
  };

  const handleRefreshMailbox = async () => {
    // mailbox refresh handled inside InboxView via API
    if (view.screen === 'inbox') {
      const mb = await getMailbox(view.mailbox.email);
      setView({ screen: 'inbox', mailbox: mb });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <Toaster richColors position="top-right" />
      <header className="mx-auto flex max-w-5xl items-center justify-between px-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white grid place-items-center font-display text-lg">
            S
          </div>
          <div>
            <div className="font-display text-xl font-bold text-slate-900">SnapMail</div>
            <div className="text-xs text-slate-500">Disposable email, instantly</div>
          </div>
        </div>
        {view.screen !== 'landing' && (
          <button
            onClick={handleDeleteMailbox}
            className="text-xs font-semibold text-rose-700 hover:text-rose-800"
          >
            Reset
          </button>
        )}
      </header>

      {view.screen === 'landing' && (
        <LandingPage onGenerate={handleGenerate} loading={loadingCreate} />
      )}

      {view.screen === 'inbox' && (
        <div className="mx-auto max-w-5xl space-y-4">
          <InboxView
            mailbox={view.mailbox}
            onSelectEmail={handleSelectEmail}
            onDelete={handleDeleteMailbox}
            onRefreshMailbox={handleRefreshMailbox}
          />
        </div>
      )}

      {view.screen === 'email' && (
        <div className="mx-auto max-w-5xl space-y-4 px-2">
          <EmailDetailView emailId={view.emailId} mailboxEmail={view.mailbox.email} onBack={handleBack} />
        </div>
      )}
    </div>
  );
}
