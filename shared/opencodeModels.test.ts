import { describe, expect, it } from 'vitest';
import { openCodeModelRef, withOpenCodeVariant } from './opencodeModels.ts';

describe('OpenCode model selections', () => {
  it('keeps slash-containing model IDs and separates reasoning variants', () => {
    expect(openCodeModelRef('provider/custom/model#medium')).toEqual({ providerID: 'provider', id: 'custom/model', variant: 'medium' });
    expect(openCodeModelRef('openai/model')).toEqual({ providerID: 'openai', id: 'model' });
    expect(openCodeModelRef('')).toBeNull();
  });
  it('replaces or clears the variant without retaining the old effort', () => {
    expect(withOpenCodeVariant('openai/model#xhigh', 'medium')).toBe('openai/model#medium');
    expect(withOpenCodeVariant('openai/model#medium', '')).toBe('openai/model');
    expect(withOpenCodeVariant('', 'medium')).toBe('');
  });
});
