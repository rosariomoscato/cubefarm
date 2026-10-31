import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { italianGuide, type GuideSection } from '../../../shared/italianGuide';
import { languageOf } from '../../../shared/i18n';
import { useStore } from '../store';

/** Explicit rich help copy only. Slots retain the original keycaps/buttons; English remains the original JSX. */
export function GuideParagraph({ section, children }: { section: GuideSection; children: ReactNode }) {
  const language = useStore((s) => languageOf(s.settings.language));
  if (language !== 'it') return <p>{children}</p>;
  const slots = Children.toArray(children).filter(isValidElement);
  const parts = italianGuide[section].split(/\{(\d+)\}/g);
  // A changed guide structure must not leave broken controls in the translated paragraph.
  const indexes = parts.filter((_, i) => i % 2 === 1).map(Number);
  if (indexes.length !== slots.length || new Set(indexes).size !== slots.length || indexes.some((i) => !slots[i])) return <p>{children}</p>;
  return <p>{parts.map((part, i) => <Fragment key={i}>{i % 2 ? slots[Number(part)] : part}</Fragment>)}</p>;
}
