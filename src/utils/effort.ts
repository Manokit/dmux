/**
 * Reasoning-effort levels shared across the new-pane popup, settings/parsing,
 * and the agent launch command builders.
 *
 * Kept dependency-free on purpose: the standalone newPanePopup process imports
 * this module, and we don't want to drag the tmux/launch graph into the popup.
 */

/**
 * Reasoning effort for the launched agent.
 * 'default' (or undefined) leaves the agent CLI untouched.
 * Currently only Claude Code consumes this.
 */
export type EffortLevel =
  | 'default'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'max'
  | 'ultracode';

/** All selectable effort levels, in cycle order. 'default' = leave the CLI alone. */
export const EFFORT_LEVELS: readonly EffortLevel[] = [
  'default',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
  'ultracode',
] as const;

export function isEffortLevel(value: unknown): value is EffortLevel {
  return typeof value === 'string'
    && (EFFORT_LEVELS as readonly string[]).includes(value);
}

/** Human-facing label for an effort level. */
export function getEffortLabel(level: EffortLevel): string {
  return level === 'default' ? 'Default' : level;
}

/** Step within EFFORT_LEVELS, clamped at both ends (no wraparound). */
export function stepEffortLevel(current: EffortLevel, delta: number): EffortLevel {
  const index = EFFORT_LEVELS.indexOf(current);
  const safeIndex = index === -1 ? 0 : index;
  const next = Math.max(0, Math.min(EFFORT_LEVELS.length - 1, safeIndex + delta));
  return EFFORT_LEVELS[next];
}
