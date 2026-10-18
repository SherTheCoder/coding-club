import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { signIn, changePassword } from '../lib/backend';

export default function AuthForm({
  changing = false,
  onSaved,
}: {
  changing?: boolean;
  onSaved: () => Promise<void> | void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className="question-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        if (changing && nextPassword !== confirmation) {
          setError('Passwords do not match.');
          return;
        }
        setBusy(true);
        try {
          if (changing) await changePassword(password, nextPassword);
          else await signIn(email, password);
          setPassword('');
          setNextPassword('');
          setConfirmation('');
          await onSaved();
        } catch (error) {
          setError((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {!changing && (
        <label>
          Email
          <input
            autoFocus
            required
            type="email"
            autoComplete="username"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
      )}
      <label>
        {changing ? 'Current password' : 'Password'}
        <input
          autoFocus={changing}
          required
          type="password"
          autoComplete="current-password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {changing && (
        <>
          <label>
            New password
            <input
              required
              type="password"
              minLength={12}
              autoComplete="new-password"
              name="new-password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
            />
          </label>
          <label>
            Confirm password
            <input
              required
              type="password"
              minLength={12}
              autoComplete="new-password"
              name="confirm-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
        </>
      )}
      <p className="field-hint">
        {changing
          ? 'At least 12 characters.'
          : 'Stay signed in on this device.'}
      </p>
      <button className="button primary full" disabled={busy}>
        {busy ? 'Please wait…' : changing ? 'Save password' : 'Sign in'}
        <ArrowUpRight size={17} />
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!changing && (
        <p className="field-hint">Need a password? Ask Sher Amir.</p>
      )}
    </form>
  );
}
