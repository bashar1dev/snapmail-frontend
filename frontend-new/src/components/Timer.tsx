import { useEffect, useState } from 'react';

type Props = {
  expiresAt: string;
  onExpire?: () => void;
};

export function Timer({ expiresAt, onExpire }: Props) {
  const [remaining, setRemaining] = useState<number>(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0 && prev !== 0 && onExpire) onExpire();
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire]);

  useEffect(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    setRemaining(Math.max(0, Math.floor(diff / 1000)));
  }, [expiresAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  let tone = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (remaining <= 60) tone = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
  else if (remaining <= 180) tone = 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${tone}`}
      data-testid="timer-badge"
    >
      <span>{formatted}</span>
    </div>
  );
}
