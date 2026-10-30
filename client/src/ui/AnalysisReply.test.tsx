import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnalysisReply, TerminalDetails } from './AnalysisReply';
import { translate } from '../../../shared/i18n';

vi.mock('../i18n', () => ({ T: ({ children }: { children: string }) => children, useT: () => (text: string) => text }));

describe('analysis result presentation', () => {
  it('renders headings, lists, fenced code and tables without raw Markdown markers', () => {
    const html = renderToStaticMarkup(<AnalysisReply reply={{ partial: false, text: '# Overview\n\n- One\n- Two\n\n```ts\nconst x = 1;\n```\n\n| A | B |\n|---|---|\n| x | y |' }} />);
    expect(html).toContain('<h1>Overview</h1>');
    expect(html).toContain('<li>One</li>');
    expect(html).toContain('<code class="language-ts">');
    expect(html).toContain('<table>');
    expect(html).not.toContain('# Overview');
    expect(html).not.toContain('Saved log excerpt');
  });
  it('escapes raw HTML, disables unsafe links and never embeds remote images', () => {
    const html = renderToStaticMarkup(<AnalysisReply reply={{ partial: false, text: '<script>alert(1)</script>\n\n[x](javascript:alert)\n\n![image](https://example.com/track.png)' }} />);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });
  it('labels old previews explicitly, with English and Italian UI strings', () => {
    expect(renderToStaticMarkup(<AnalysisReply reply={{ partial: true, text: 'Preview' }} />)).toContain('Saved log excerpt');
    expect(translate('it', 'Analysis result')).toBe('Risultato dell’analisi');
    expect(translate('en', 'Analysis result')).toBe('Analysis result');
    expect(translate('it', 'Terminal and technical log')).toBe('Terminale e log tecnico');
  });
  it('leaves a live terminal unchanged and does not mount a collapsed technical terminal', () => {
    expect(renderToStaticMarkup(<TerminalDetails collapsed={false}><div>Live</div></TerminalDetails>)).toBe('<div>Live</div>');
    const html = renderToStaticMarkup(<TerminalDetails collapsed><div>Technical terminal</div></TerminalDetails>);
    expect(html).toContain('<details');
    expect(html).not.toContain(' open');
    expect(html).not.toContain('<div>Technical terminal</div>');
  });
});
