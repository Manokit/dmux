/**
 * Implements the cyclic Tab/Shift+Tab behavior for the 'new pane' dialog.
 *
 * The prompt and effort fields always exist. The base-branch and branch-name
 * fields only participate when git options are enabled, so navigation is
 * parameterized by `gitOptionsEnabled`:
 *   - enabled:  prompt -> effort -> baseBranch -> branchName -> prompt
 *   - disabled: prompt -> effort -> prompt
 */

export type NewPaneField = 'prompt' | 'effort' | 'baseBranch' | 'branchName';

const FIELD_ORDER_WITH_GIT: readonly NewPaneField[] = [
  'prompt',
  'effort',
  'baseBranch',
  'branchName',
];

const FIELD_ORDER_PROMPT_ONLY: readonly NewPaneField[] = ['prompt', 'effort'];

function fieldOrder(gitOptionsEnabled: boolean): readonly NewPaneField[] {
  return gitOptionsEnabled ? FIELD_ORDER_WITH_GIT : FIELD_ORDER_PROMPT_ONLY;
}

export function getNextNewPaneField(
  current: NewPaneField,
  gitOptionsEnabled: boolean = true
): NewPaneField {
  const order = fieldOrder(gitOptionsEnabled);
  const index = order.indexOf(current);
  if (index === -1) return order[0];
  return order[(index + 1) % order.length];
}

export function getPreviousNewPaneField(
  current: NewPaneField,
  gitOptionsEnabled: boolean = true
): NewPaneField {
  const order = fieldOrder(gitOptionsEnabled);
  const index = order.indexOf(current);
  if (index === -1) return order[0];
  return order[(index - 1 + order.length) % order.length];
}
