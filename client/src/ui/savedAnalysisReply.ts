import type { LogLine } from '../../../shared/types';

export interface SavedAnalysisReply {
  text: string;
  partial: boolean;
}

/** Read only the latest request's reply, never tool results or an earlier follow-up. */
export function savedAnalysisReply(log: LogLine[]): SavedAnalysisReply | null {
  let start = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].kind === 'manager') {
      start = i + 1;
      break;
    }
  }
  const turn = log.slice(start);
  const reply = turn.findLast((line) => line.kind === 'reply');
  if (reply) return reply.text.trim() ? { text: reply.text, partial: false } : null;

  // Older offices saved only a shortened, decorated text preview, not the full Markdown.
  // Keep the original terminal available and explicitly label this fallback as an excerpt.
  const text = turn.filter((line) => line.kind === 'text')
    .filter((line) => !/^  … \(\d+ more lines\)$/.test(line.text))
    .map((line) => line.text.replace(/^(?:● |  )/, ''))
    .join('\n');
  return text.trim() ? { text, partial: true } : null;
}
