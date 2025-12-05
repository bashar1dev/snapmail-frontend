import { EmailDetail, EmailSummary, Mailbox } from './types';

const DEFAULT_API_BASE = 'https://starfish-app-e9kns.ondigitalocean.app';

const getApiBase = () => {
  const cfg = (window as any).__SNAPMAIL_CONFIG;
  return (import.meta.env.VITE_API_BASE as string) ||
    (cfg && cfg.backendUrl) ||
    DEFAULT_API_BASE;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBase().replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function createMailbox(duration: number = 10): Promise<Mailbox> {
  return request<Mailbox>('/api/mailbox/create', {
    method: 'POST',
    body: JSON.stringify({ duration })
  });
}

export async function getMailbox(email: string): Promise<Mailbox> {
  return request<Mailbox>(`/api/mailbox/${encodeURIComponent(email)}`);
}

export async function refreshMailbox(email: string): Promise<{ success: boolean }> {
  return request(`/api/mailbox/${encodeURIComponent(email)}/refresh`, { method: 'POST' });
}

export async function deleteMailbox(email: string): Promise<{ success: boolean }> {
  return request(`/api/mailbox/${encodeURIComponent(email)}`, { method: 'DELETE' });
}

export async function getEmails(email: string): Promise<{ emails: EmailSummary[] }> {
  return request(`/api/mailbox/${encodeURIComponent(email)}/emails`);
}

export async function getEmail(id: string): Promise<EmailDetail> {
  return request(`/api/email/${encodeURIComponent(id)}`);
}
