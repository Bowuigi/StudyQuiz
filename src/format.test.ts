import { describe, expect, it } from 'vitest';

import { formatDisplayName } from './format.ts';

describe('formatDisplayName', () => {
  it('replaces dashes and underscores and uppercases the first letter of each word', () => {
    expect(formatDisplayName('data-mining-2')).toBe('Data Mining 2');
    expect(formatDisplayName('bi_casos')).toBe('Bi Casos');
  });

  it('keeps the uppercase letters the name already has', () => {
    expect(formatDisplayName('NASA')).toBe('NASA');
  });

  it('keeps digits and collapses repeated spaces', () => {
    expect(formatDisplayName('ayd2-p2')).toBe('Ayd2 P2');
    expect(formatDisplayName('a  b__c')).toBe('A B C');
  });
});
