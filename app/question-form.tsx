'use client';
import { useState } from 'react';
import { ArrowUpRight, Link, Bell, LoaderCircle } from 'lucide-react';
import { TOPICS, titleFromLink, sessionLabel } from '../lib/club.mjs';
import type { Claim, Problem } from './types';
export default function QuestionForm({
  date,
  slot,
  claim,
  suggestion,
  onSave,
  onRelease,
}: {
  date: string;
  slot: number;
  claim?: Claim;
  suggestion?: Problem;
  onSave: (data: any) => Promise<void>;
  onRelease?: () => Promise<void>;
}) {
  const initial = claim || suggestion;
  const [url, setUrl] = useState(initial?.url || '');
  const [title, setTitle] = useState(initial?.title || '');
  const [prep, setPrep] = useState(initial?.prep || '');
  const [practice, setPractice] = useState(initial?.practice || '');
  const [difficulty, setDifficulty] = useState(initial?.difficulty || 'Medium');
  const [topic, setTopic] = useState(initial?.topic || 'Graphs');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmRelease, setConfirmRelease] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ url, title, prep, practice, difficulty, topic, slot });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="question-form">
      <p className="form-kicker">
        SPOT 0{slot} <span>·</span> {sessionLabel(date, true)} <span>·</span>{' '}
        6–8 PM IST
      </p>
      <label>
        LeetCode question <span className="required">*</span>
        <div className="input-icon">
          <Link size={17} />
          <input
            autoFocus
            required
            type="url"
            placeholder="https://leetcode.com/problems/..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (!claim) setTitle(titleFromLink(e.target.value));
            }}
          />
        </div>
      </label>
      <label>
        Problem title
        <input
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Filled from your link"
        />
      </label>
      <div className="form-row">
        <label>
          Topic
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Difficulty
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {['Easy', 'Medium', 'Hard'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Preparation <span className="optional">optional</span>
        <textarea
          rows={3}
          maxLength={2000}
          value={prep}
          onChange={(e) => setPrep(e.target.value)}
          placeholder="e.g. Know BFS, queues, and how a visited set works."
        />
      </label>
      <label>
        Related practice <span className="optional">optional</span>
        <input
          type="url"
          value={practice}
          onChange={(e) => setPractice(e.target.value)}
          placeholder="Another LeetCode problem link"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-note">
        <Bell size={15} />
        <span>Notifies all members.</span>
      </div>
      <button className="button primary full" disabled={busy}>
        {busy ? <LoaderCircle size={18} className="spin" /> : null}
        {claim ? 'Save' : 'Add question'}
        <ArrowUpRight size={18} />
      </button>
      {onRelease &&
        (!confirmRelease ? (
          <button
            disabled={busy}
            type="button"
            className="text-button danger"
            onClick={() => setConfirmRelease(true)}
          >
            Release spot
          </button>
        ) : (
          <div className="release-confirm">
            <span>Release this spot?</span>
            <button
              disabled={busy}
              type="button"
              className="text-button danger"
              onClick={async () => {
                setBusy(true);
                try {
                  await onRelease();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Yes, release it
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setConfirmRelease(false)}
            >
              Keep it
            </button>
          </div>
        ))}
    </form>
  );
}
