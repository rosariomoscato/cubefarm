import { describe, expect, it } from 'vitest';
import type { LogLine } from '../../../shared/types';
import { savedAnalysisReply } from './savedAnalysisReply';

const line = (kind: LogLine['kind'], text: string): LogLine => ({ id: 1, t: 1, kind, text });

describe('saved analysis replies', () => {
  it('keeps full Markdown, including more than 30 lines and code indentation', () => {
    const text = '# Result\n\n```ts\n    const x = 1;\n```\n' + 'More\n'.repeat(50);
    expect(savedAnalysisReply([line('manager', 'Read'), line('text', 'preview'), line('reply', text), line('done', 'Finished')]))
      .toEqual({ text, partial: false });
  });
  it('never shows a previous request or a tool result as the latest reply', () => {
    expect(savedAnalysisReply([line('reply', 'Old'), line('manager', 'Follow up'), line('result', 'Tool output')])).toBeNull();
    expect(savedAnalysisReply([])).toBeNull();
  });
  it('selects the latest full reply and rejects whitespace-only results', () => {
    expect(savedAnalysisReply([line('reply', 'First'), line('reply', 'Last')])).toEqual({ text: 'Last', partial: false });
    expect(savedAnalysisReply([line('reply', '  ')])).toBeNull();
  });
  it('labels legacy previews as excerpts, removing only the log decoration', () => {
    expect(savedAnalysisReply([line('manager', 'Read'), line('text', '● ## Title'), line('text', '  '),
      line('text', '      code'), line('text', '  … (8 more lines)'), line('done', 'Finished')]))
      .toEqual({ text: '## Title\n\n    code', partial: true });
  });
});
