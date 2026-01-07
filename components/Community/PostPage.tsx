'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import ReportModal, { type ReportTargetType } from './ReportModal';
import CoinTagChips from './CoinTagChips';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PostPage({ slug }: { slug: string }) {
  const { data: postData, error: postErr, mutate: mutatePost } = useSWR(`/api/community/posts/${slug}`, fetcher);
  const { data: voteData, mutate: mutateVote } = useSWR(`/api/community/posts/${slug}/vote`, fetcher);

  const post = postData?.post ?? null;
  const voted = Boolean(voteData?.voted);

  const postId = post?._id ? String(post._id) : post?.id ? String(post.id) : post?._id;

  const commentsUrl = useMemo(() => {
    if (!post?._id) return null;
    return `/api/community/comments?postId=${encodeURIComponent(String(post._id))}&limit=100`;
  }, [post?._id]);

  const { data: commentsData, error: commentsErr, mutate: mutateComments } = useSWR(commentsUrl, fetcher);
  const comments = Array.isArray(commentsData?.comments) ? commentsData.comments : [];

  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [voting, setVoting] = useState(false);
  const [reportOk, setReportOk] = useState<string | null>(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: ReportTargetType; id: string; label?: string } | null>(
    null
  );

  async function toggleVote() {
    setVoting(true);
    try {
      const res = await fetch(`/api/community/posts/${slug}/vote`, {
        method: voted ? 'DELETE' : 'POST',
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok || !json?.success) {
        // Likely not logged in
        return;
      }
      mutateVote();
      mutatePost();
    } finally {
      setVoting(false);
    }
  }

  function openReport(type: ReportTargetType, id: string, label?: string) {
    if (!id) return;
    setReportOk(null);
    setReportTarget({ type, id, label });
    setReportModalOpen(true);
  }

  async function submitComment() {
    if (!post?._id) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: String(post._id), body: commentBody }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok || !json?.success) {
        setSubmitError(json?.error || 'Failed to comment.');
        return;
      }
      setCommentBody('');
      mutateComments();
      mutatePost();
    } catch {
      setSubmitError('Failed to comment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-terminal-text">
      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType={reportTarget?.type ?? 'post'}
        targetId={reportTarget?.id ?? ''}
        contextLabel={reportTarget?.label}
        onReported={() => setReportOk('Thanks — report submitted.')}
      />

      <div className="flex items-center justify-between">
        <Link href="/community" className="text-sm text-gray-400 hover:text-terminal-accent">
          ← Back
        </Link>
        <Link href="/community/new" className="text-sm text-terminal-accent hover:underline">
          + New post
        </Link>
      </div>

      {postErr ? (
        <div className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-red-300">
          Failed to load post.
        </div>
      ) : !post ? (
        <div className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-5">
            <div className="text-xs text-gray-400">
              <span className="text-terminal-accent">{post.category}</span>
              <span className="mx-2">•</span>
              <span>{post.authorEmail}</span>
              <span className="mx-2">•</span>
              <span>{post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold">{post.title}</h1>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-400">
                💬 {post.commentsCount ?? 0} • ⬆️ {post.upvotesCount ?? 0}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVote}
                  disabled={voting}
                  className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                    voted
                      ? 'border-terminal-accent text-terminal-accent'
                      : 'border-terminal-border text-gray-200 hover:border-terminal-accent hover:text-terminal-accent'
                  }`}
                >
                  {voted ? 'Upvoted' : 'Upvote'}
                </button>
                <button
                  type="button"
                  onClick={() => openReport('post', String(post._id), post.title)}
                  className="rounded-md border border-terminal-border px-3 py-2 text-xs text-gray-200 hover:border-terminal-accent hover:text-terminal-accent disabled:opacity-60"
                  title="Report spam or scams"
                >
                  Report
                </button>
              </div>
            </div>

            {reportOk ? <div className="mt-3 text-xs text-green-300">{reportOk}</div> : null}

            {Array.isArray(post.coinTags) && post.coinTags.length ? <CoinTagChips tags={post.coinTags} /> : null}

            <div className="prose prose-invert mt-4 max-w-none whitespace-pre-wrap text-sm text-gray-200">
              {post.body}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-5">
            <h2 className="text-lg font-semibold">Comments</h2>

            {commentsErr ? (
              <div className="mt-3 text-sm text-red-300">Failed to load comments.</div>
            ) : commentsUrl && !commentsData ? (
              <div className="mt-3 text-sm text-gray-400">Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="mt-3 text-sm text-gray-400">No comments yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {comments.map((c: any) => (
                  <div key={c._id} className="rounded-md border border-terminal-border bg-terminal-bg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs text-gray-400">
                        <span>{c.authorEmail}</span>
                        <span className="mx-2">•</span>
                        <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openReport('comment', String(c._id), 'Comment')}
                        className="shrink-0 rounded-md border border-terminal-border px-2 py-1 text-[11px] text-gray-200 hover:border-terminal-accent hover:text-terminal-accent disabled:opacity-60"
                        title="Report spam or scams"
                      >
                        Report
                      </button>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-gray-200">{c.body}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <label className="text-xs text-gray-400">Add a comment (login required)</label>
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                className="mt-1 h-28 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
                placeholder="Write a reply…"
                maxLength={10000}
              />
              {submitError ? <div className="mt-2 text-sm text-red-300">{submitError}</div> : null}
              <button
                type="button"
                onClick={submitComment}
                disabled={submitting}
                className="mt-3 rounded-md bg-terminal-accent px-4 py-2 text-sm font-semibold text-terminal-bg disabled:opacity-60"
              >
                {submitting ? 'Posting…' : 'Post comment'}
              </button>
              <div className="mt-2 text-xs text-gray-500">
                Keep it civil. Report spam/scams.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
