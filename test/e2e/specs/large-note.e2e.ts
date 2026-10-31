import { browser, expect } from '@wdio/globals';
import { beforeEach, describe, it } from 'mocha';
import { obsidianPage } from 'wdio-obsidian-service';
import {
    appendToNote,
    getWordList,
    PLUGIN_ID,
    showSidebar,
    useCleanState,
    WORD_LIST,
} from '../helpers';

const LARGE_NOTE = 'Large.md';
const DISTINCT_WORDS = 2000;
const REPETITIONS = 100;
const LOAD_LIMIT_MS = 30000;
const REFRESH_LIMIT_MS = 2000;

type CountingPlugin = {
    frequencyCounter: { triggerUpdateContent(): void };
};

function wordFor(index: number): string {
    return `word${String.fromCharCode(97 + (index % 26))}${index}`;
}

function buildLargeNote(): string {
    const line = Array.from({ length: DISTINCT_WORDS }, (_, index) =>
        wordFor(index)
    ).join(' ');

    return Array.from({ length: REPETITIONS }, () => line).join('\n');
}

async function waitForRows(rowCount: number): Promise<void> {
    await browser.waitUntil(
        async () =>
            (await browser.execute(
                (selector) =>
                    document.querySelectorAll(`${selector} .word-frequency-row`)
                        .length,
                WORD_LIST
            )) === rowCount,
        { timeout: LOAD_LIMIT_MS }
    );
}

async function waitUntilObsidianIsIdle(): Promise<void> {
    await browser.executeObsidian(async () => {
        const settleAt = performance.now() + 30000;
        let quietTicks = 0;
        while (quietTicks < 5 && performance.now() < settleAt) {
            const started = performance.now();
            await new Promise((resolve) => setTimeout(resolve, 100));
            quietTicks = performance.now() - started < 150 ? quietTicks + 1 : 0;
        }
    });
}

async function timeRefresh(): Promise<number> {
    return browser.executeObsidian(async ({ app }, pluginId) => {
        const plugin = (
            app as unknown as {
                plugins: { plugins: Record<string, CountingPlugin> };
            }
        ).plugins.plugins[pluginId];
        const started = performance.now();
        plugin.frequencyCounter.triggerUpdateContent();
        await new Promise((resolve) =>
            requestAnimationFrame(() => setTimeout(resolve, 0))
        );

        return performance.now() - started;
    }, PLUGIN_ID);
}

describe('Word Frequency plugin with a large note', () => {
    useCleanState();

    beforeEach(async () => {
        await obsidianPage.write(LARGE_NOTE, buildLargeNote());
        await obsidianPage.openFile(LARGE_NOTE);
        await showSidebar();
        await waitForRows(DISTINCT_WORDS);
    });

    it(`should list all ${DISTINCT_WORDS} words of the note`, async () => {
        const words = await getWordList();

        expect(words).toHaveLength(DISTINCT_WORDS);
        expect(words[0]).toEqual([wordFor(0), REPETITIONS]);
        expect(words[DISTINCT_WORDS - 1]).toEqual([
            wordFor(DISTINCT_WORDS - 1),
            REPETITIONS,
        ]);
    });

    it(`should recount and redraw ${DISTINCT_WORDS} words within ${REFRESH_LIMIT_MS} ms after an edit`, async () => {
        await appendToNote(LARGE_NOTE, ` ${wordFor(1)}`.repeat(REPETITIONS));
        await waitUntilObsidianIsIdle();

        const elapsed = await timeRefresh();

        expect(elapsed).toBeLessThan(REFRESH_LIMIT_MS);
        expect((await getWordList())[0]).toEqual([wordFor(1), REPETITIONS * 2]);
    });
});
