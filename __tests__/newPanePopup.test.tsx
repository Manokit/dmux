import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import stripAnsi from 'strip-ansi';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { NewPanePopupApp } from '../src/components/popups/newPanePopup.js';

const ESC = String.fromCharCode(27);
const TAB = '\t';
const ENTER = '\r';
const ARROW_RIGHT = '[C';
const ARROW_LEFT = '[D';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function type(stdin: { write: (value: string) => void }, value: string) {
  stdin.write(value);
  await sleep(10);
}

async function press(stdin: { write: (value: string) => void }, value: string) {
  stdin.write(value);
  await sleep(10);
}

async function pressEscape(stdin: { write: (value: string) => void }) {
  stdin.write(ESC);
  await sleep(10);
}

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('NewPanePopupApp', () => {
  it('requires a second escape press to clear a non-empty prompt', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmux-new-pane-popup-'));
    tempDirs.push(tempDir);
    const resultFile = path.join(tempDir, 'result.json');

    const { stdin, lastFrame, unmount } = render(
      <NewPanePopupApp resultFile={resultFile} />
    );

    await sleep(60);
    expect(stripAnsi(lastFrame() ?? '')).toContain('[ ] Goal mode');
    await type(stdin, 'ship it');
    expect(stripAnsi(lastFrame() ?? '')).toContain('> ship it');

    await pressEscape(stdin);

    const armedFrame = stripAnsi(lastFrame() ?? '');
    expect(armedFrame).toContain('> ship it');
    expect(armedFrame).toContain('Press Esc again to clear the prompt.');
    expect(fs.existsSync(resultFile)).toBe(false);

    await pressEscape(stdin);

    const clearedFrame = stripAnsi(lastFrame() ?? '');
    expect(clearedFrame).not.toContain('ship it');
    expect(clearedFrame).not.toContain('Press Esc again to clear the prompt.');
    expect(fs.existsSync(resultFile)).toBe(false);

    unmount();
  });

  it('starts the effort row at Default and focuses it on Tab', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmux-new-pane-popup-'));
    tempDirs.push(tempDir);
    const resultFile = path.join(tempDir, 'result.json');

    const { stdin, lastFrame, unmount } = render(
      <NewPanePopupApp resultFile={resultFile} />
    );

    await sleep(60);
    const initial = stripAnsi(lastFrame() ?? '');
    expect(initial).toContain('Effort:');
    expect(initial).toContain('Default');
    expect(initial).toContain('(Tab to change)');

    await press(stdin, TAB);
    const focused = stripAnsi(lastFrame() ?? '');
    expect(focused).toContain('▶ Effort:');
    expect(focused).toContain('(←/→ to change)');

    unmount();
  });

  it('steps the effort level with the arrow keys', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmux-new-pane-popup-'));
    tempDirs.push(tempDir);
    const resultFile = path.join(tempDir, 'result.json');

    const { stdin, lastFrame, unmount } = render(
      <NewPanePopupApp resultFile={resultFile} />
    );

    await sleep(60);
    await press(stdin, TAB);
    await press(stdin, ARROW_RIGHT);
    expect(stripAnsi(lastFrame() ?? '')).toContain('low');
    await press(stdin, ARROW_RIGHT);
    expect(stripAnsi(lastFrame() ?? '')).toContain('medium');
    await press(stdin, ARROW_LEFT);
    expect(stripAnsi(lastFrame() ?? '')).toContain('low');

    unmount();
  });

  it('writes the selected effort into the result payload', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmux-new-pane-popup-'));
    tempDirs.push(tempDir);
    const resultFile = path.join(tempDir, 'result.json');

    const { stdin, unmount } = render(
      <NewPanePopupApp resultFile={resultFile} />
    );

    await sleep(60);
    await type(stdin, 'ship it');
    await press(stdin, TAB);
    await press(stdin, ARROW_RIGHT); // low
    await press(stdin, ARROW_RIGHT); // medium
    await press(stdin, ENTER);
    await sleep(20);

    const parsed = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({
      prompt: 'ship it',
      goalMode: false,
      effort: 'medium',
    });

    unmount();
  });
});
