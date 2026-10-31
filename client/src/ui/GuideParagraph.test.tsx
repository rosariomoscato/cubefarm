import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { parseSync } from 'rolldown/utils';
import { italianGuide } from '../../../shared/italianGuide';
import { GuideParagraph } from './GuideParagraph';
const language = vi.hoisted(() => ({ value: 'en' }));
vi.mock('../store', () => ({ useStore: (select: (s: { settings: { language: string } }) => unknown) => select({ settings: { language: language.value } }) }));

describe('explicit rich guide paragraphs', () => {
  it('uses each original keycap or control exactly once in every Italian paragraph', () => {
    const ast = parseSync('Overlays.tsx', readFileSync(new URL('./Overlays.tsx', import.meta.url), 'utf8'));
    expect(ast.errors).toEqual([]);
    const seen = new Set<string>();
    type Node = { type?: string; [key: string]: unknown };
    function visit(n: Node) {
      if (n.type === 'JSXElement') {
        const opening = n.openingElement as Node;
        if ((opening.name as Node).name === 'GuideParagraph') {
          const attr = (opening.attributes as Node[]).find((a) => (a.name as Node)?.name === 'section')!;
          const section = (attr.value as Node).value as keyof typeof italianGuide;
          const slots = (n.children as Node[]).filter((child) => child.type === 'JSXElement').length;
          const indexes = [...italianGuide[section].matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])).sort((a, b) => a - b);
          expect(indexes, section).toEqual(Array.from({ length: slots }, (_, i) => i));
          expect(seen.has(section), section).toBe(false);
          seen.add(section);
        }
      }
      for (const value of Object.values(n)) {
        if (Array.isArray(value)) for (const item of value) { if (item && typeof item === 'object') visit(item); }
        else if (value && typeof value === 'object') visit(value as Node);
      }
    }
    visit(ast.program as unknown as Node);
    expect([...seen].sort()).toEqual(Object.keys(italianGuide).sort());
  });

  it('keeps English JSX intact, renders slots as elements and falls back safely if their structure changes', () => {
    const children = <>Original <kbd>Settings $&amp; {'{name}'}</kbd> text <button>Click</button>.</>;
    // The component takes direct children rather than flattening arbitrary React components or fragments.
    try {
      language.value = 'en';
      expect(renderToStaticMarkup(<GuideParagraph section="journal">{children}</GuideParagraph>)).toBe(`<p>${renderToStaticMarkup(children)}</p>`);
      language.value = 'it';
      const text = renderToStaticMarkup(<GuideParagraph section="journal">Original <kbd>{'Settings $& {name}'}</kbd> text <button>Click</button>.</GuideParagraph>);
      expect(text).toContain('Non è un video registrato');
      expect(text).toContain('<kbd>Settings $&amp; {name}</kbd>');
      expect(text).toContain('<button>Click</button>');
      expect(renderToStaticMarkup(<GuideParagraph section="journal">New layout</GuideParagraph>)).toBe('<p>New layout</p>');
    } finally { language.value = 'en'; }
  });
});
