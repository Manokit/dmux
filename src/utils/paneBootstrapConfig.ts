import type { DmuxPane } from '../types.js';
import type { AgentName, EffortLevel, PermissionMode } from './agentLaunch.js';

export const DMUX_BOOTSTRAP_PANE_TITLE_PREFIX = 'dmux-bootstrap:';

export interface PaneBootstrapConfig {
  version: 1;
  projectRoot: string;
  worktreePath: string;
  branchName: string;
  slug: string;
  prompt: string;
  agent?: AgentName;
  permissionMode?: PermissionMode;
  goalMode?: boolean;
  // Reasoning effort for the launched agent (Claude only); undefined = CLI default.
  effort?: EffortLevel;
  pane: DmuxPane;
  tmuxTitle: string;
  existingWorktree: boolean;
  resolvedStartPoint?: string;
  isHooksEditingSession: boolean;
  metadata: {
    agent?: AgentName;
    permissionMode?: PermissionMode;
    goalMode?: boolean;
    displayName?: string;
    branchName?: string;
    mergeTargetChain?: DmuxPane['mergeTargetChain'];
  };
  hookExtraEnv?: Record<string, string>;
}
