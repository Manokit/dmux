# Effort selector (fork addition)

A per-pane **reasoning-effort** picker in the new-agent popup, so you can set Claude's
effort *before* the terminal launches instead of typing `/effort` afterward.

This is a fork addition maintained in `Manokit/dmux` on top of upstream
`standardagents/dmux`. It lives entirely on the `feat/effort-selector` branch.

- **Branch:** `feat/effort-selector`
- **Fork (origin):** https://github.com/Manokit/dmux
- **Upstream:** https://github.com/standardagents/dmux
- **First built/verified against:** Claude Code `2.1.174`, dmux `5.9.0`

---

## How to use it

1. Hit **New Agent** (or attach a sibling agent).
2. In the prompt popup, press **Tab** to move focus to the `Effort:` row (sits under
   "Goal mode").
3. Use **←/→** to pick a level. **Enter** submits, **Esc** returns focus to the prompt.

```
[ ] Goal mode
  Effort: ◂ high ▸        (Tab to change)
```

Field cycle with **Tab / Shift+Tab**:
- Git options off (the default): `prompt → effort → prompt`
- Git options on: `prompt → effort → baseBranch → branchName → prompt`

The chosen level is **per-pane and not persisted** — every new pane starts at `Default`.
Effort applies to **Claude only**; other agents ignore it.

---

## What each level does

The level is turned into Claude CLI flags at launch time:

| Level       | Flags added to the `claude` command            | Notes |
|-------------|------------------------------------------------|-------|
| `Default`   | *(none)*                                        | Unchanged from stock dmux. |
| `low`       | `--effort low`                                  | |
| `medium`    | `--effort medium`                               | |
| `high`      | `--effort high`                                 | |
| `xhigh`     | `--effort xhigh`                                | |
| `max`       | `--effort max`                                  | |
| `ultracode` | `--settings '{"ultracode":true}'`               | See caveat below. |

### ⚠️ Why `ultracode` is special

`claude --effort ultracode` is **rejected** by the CLI (`Warning: Unknown --effort value
'ultracode' — ignoring it`). Ultracode is not an `--effort` value; it's a *setting* that
means "xhigh effort plus standing dynamic-workflow orchestration," and it must be enabled
another way.

We enable it per-session with `--settings '{"ultracode":true}'`, which is scoped to that
one pane only (no global state is written). This is the single most likely thing to break
if the Claude CLI changes — **re-verify it after Claude updates** (see below).

Example of what actually gets run for `ultracode` + plan mode:

```
claude --permission-mode plan --settings '{"ultracode":true}' "$DMUX_PROMPT_CONTENT"
```

---

## Where the code lives

Effort threads through the same plumbing as the existing "Goal mode" toggle. To change
behavior, these are the files in order of the data flow:

**Shared definitions**
- `src/utils/effort.ts` — **new, dependency-free** module: the `EffortLevel` type,
  `EFFORT_LEVELS` (cycle order), `isEffortLevel`, `getEffortLabel`, `stepEffortLevel`.
  Kept import-light on purpose so the standalone popup process doesn't drag in the
  tmux/launch graph. `src/utils/agentLaunch.ts` re-exports these for existing importers.

**Command construction (the actual flags)**
- `src/utils/agentLaunch.ts`
  - `buildClaudeEffortFlags(effort)` — the level → flags mapping (the table above).
  - `buildInitialPromptCommand()` / `buildAgentCommand()` take an optional `effort` and
    append the flags **only when `agent === 'claude'`** (used by the new-pane bootstrap path).
  - `launchAgentInPane()` — the attach path; injects the same flags into its inline
    `claude …` command.

**The popup (UI)**
- `src/components/popups/newPanePopup.tsx` — the `Effort:` row, focus handling, ←/→
  stepping, and putting `effort` in the result payload. The prompt text input is
  `disabled` while the effort row is focused so arrow keys don't move the cursor.
- `src/components/popups/newPaneFieldNavigation.ts` — Tab/Shift+Tab cycle, now
  git-options-aware and including the `effort` field.

**Plumbing (popup result → launch)**
- `src/types.ts` — `NewPaneInput.effort`.
- `src/services/PopupManager.ts` — `normalizeNewPaneInput()` validates/parses `effort`
  (`default` and unknown values are dropped).
- `src/hooks/usePaneCreation.ts` → `src/utils/paneCreation.ts` → the bootstrap config
  (`src/utils/paneBootstrapConfig.ts`) → `src/utils/paneBootstrapRunner.ts` (new-pane path).
- `src/hooks/useInputHandling.ts` → `src/utils/attachAgent.ts` → `launchAgentInPane`
  (attach-sibling-agent path).

**Not touched on purpose (non-goals):** persistence/metadata, resume/reopen, a default-effort
setting, and any non-Claude agent.

---

## Build, test, run

```bash
pnpm install            # once
pnpm test               # full vitest suite
pnpm build              # full build (hooks docs + frontend + tsc) → dist/
# or, for a quick TS-only rebuild after editing src:
npx tsc
```

The global `dmux` command is `npm link`ed to this clone, so a rebuild of `dist/` is picked
up automatically. **Restart any running dmux session** to load a new build.

Effort-specific tests:
- `__tests__/agentLaunch.test.ts` — `buildClaudeEffortFlags` + builder injection (incl. the
  exact `ultracode` settings string).
- `__tests__/newPaneFieldNavigation.test.ts` — Tab cycle with git options on/off.
- `__tests__/popupManager.newPanePopup.test.ts` — `effort` parse/validation.
- `__tests__/newPanePopup.test.tsx` — Tab focuses the row, ←/→ steps, payload carries `effort`.

> Note: `__tests__/integration/paneLifecycle.test.ts` is real-git/tmux and can time out (5s)
> under concurrent load. If it fails in a full run, re-run it in isolation
> (`npx vitest --run __tests__/integration/paneLifecycle.test.ts`) before suspecting a regression.

---

## Re-verify after a Claude Code update

The `--effort` levels and the `ultracode` mechanism are Claude-CLI behavior and could change.
After upgrading Claude, confirm:

```bash
# 1) Which levels the --effort flag accepts (watch the warning text):
claude --effort bogus -p "hi" < /dev/null
#    -> "...Valid values: low, medium, high, xhigh, max."

# 2) ultracode must still NOT be a valid --effort value:
claude --effort ultracode -p "reply OK" < /dev/null
#    -> warns + ignores  (if this STOPS warning, --effort ultracode now works;
#       consider switching ultracode to the flag in buildClaudeEffortFlags)

# 3) The settings override must still be accepted (no warning):
claude --settings '{"ultracode":true}' -p "reply OK" < /dev/null
```

Then spot-check the compiled command builder:

```bash
node --input-type=module -e "
import { buildClaudeEffortFlags } from './dist/utils/agentLaunch.js';
console.log(buildClaudeEffortFlags('xhigh'));      // --effort xhigh
console.log(buildClaudeEffortFlags('ultracode'));  // --settings '{\"ultracode\":true}'
"
```

If the level list changes, update `EFFORT_LEVELS` in `src/utils/effort.ts` and
`buildClaudeEffortFlags` / `CLAUDE_EFFORT_FLAG_LEVELS` in `src/utils/agentLaunch.ts`,
then update the tests.

---

## Keep the fork up to date with upstream

```bash
git fetch upstream
git checkout feat/effort-selector
git rebase upstream/main        # or: git merge upstream/main
# resolve conflicts (most likely only README.md / paneCreation.ts / agentLaunch.ts)
pnpm install                    # if upstream changed deps
pnpm build                      # rebuild dist/ so the linked dmux is current
git push --force-with-lease origin feat/effort-selector   # only if you rebased
```

Conflict tips:
- `src/utils/effort.ts` and `EFFORT_SELECTOR.md` are new files — they never conflict.
- The effort additions mirror the existing `goalMode` code paths. If upstream refactors
  pane creation or the popup, follow wherever `goalMode` went and add `effort` beside it.
- If upstream adds its own effort/model support, prefer theirs and retire this branch.

---

## Revert / uninstall

```bash
npm rm -g dmux        # drop the linked build
npm install -g dmux   # reinstall the published version from npm
```
