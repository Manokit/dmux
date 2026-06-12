import { describe, expect, it } from 'vitest';
import {
  getNextNewPaneField,
  getPreviousNewPaneField,
} from '../src/components/popups/newPaneFieldNavigation.js';

describe('new pane field navigation', () => {
  describe('with git options enabled', () => {
    it('cycles forward prompt -> effort -> base -> branch -> prompt', () => {
      expect(getNextNewPaneField('prompt', true)).toBe('effort');
      expect(getNextNewPaneField('effort', true)).toBe('baseBranch');
      expect(getNextNewPaneField('baseBranch', true)).toBe('branchName');
      expect(getNextNewPaneField('branchName', true)).toBe('prompt');
    });

    it('cycles backward prompt <- effort <- base <- branch <- prompt', () => {
      expect(getPreviousNewPaneField('prompt', true)).toBe('branchName');
      expect(getPreviousNewPaneField('branchName', true)).toBe('baseBranch');
      expect(getPreviousNewPaneField('baseBranch', true)).toBe('effort');
      expect(getPreviousNewPaneField('effort', true)).toBe('prompt');
    });
  });

  describe('with git options disabled', () => {
    it('cycles only between prompt and effort', () => {
      expect(getNextNewPaneField('prompt', false)).toBe('effort');
      expect(getNextNewPaneField('effort', false)).toBe('prompt');
      expect(getPreviousNewPaneField('prompt', false)).toBe('effort');
      expect(getPreviousNewPaneField('effort', false)).toBe('prompt');
    });

    it('falls back to prompt when current field is not in the active order', () => {
      expect(getNextNewPaneField('baseBranch', false)).toBe('prompt');
      expect(getPreviousNewPaneField('branchName', false)).toBe('prompt');
    });
  });
});
