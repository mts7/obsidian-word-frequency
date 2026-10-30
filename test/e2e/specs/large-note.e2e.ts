import { browser, expect } from '@wdio/globals';
import { describe, it } from 'mocha';
import { obsidianPage } from 'wdio-obsidian-service';
import {
    getWordList,
    SHOW_SIDEBAR_COMMAND,
    useCleanState,
    WORD_LIST,
} from '../helpers';

const LARGE_NOTE = 'Large.md';
const DISTINCT_WORDS = 2000;
const REPETITIONS = 100;
const RESPONSE_LIMIT_MS = 5000;

function wordFor(index: number): string {
    return `word${String.fromCharCode(97 + (index % 26))}${index}`;
}

function buildLargeNote(): string {
    const line = Array.from({ length: DISTINCT_WORDS }, (_, index) =>
        wordFor(index)
    ).join(' ');

    return Array.from({ length: REPETITIONS }, () => line).join('\n');
}

async function timeUntilListed(rowCount: number): Promise<number> {
    return browser.executeObsidian(
        async ({ app }, command, selector, expectedRows, limit) => {
            const started = performance.now();
            (
                app as unknown as {
                    commands: { executeCommandById(_id: string): boolean };
                }
            ).commands.executeCommandById(command);
            while (performance.now() - started < limit * 3) {
                const rows = document.querySelectorAll(
                    `${selector} .word-frequency-row`
                ).length;
                if (rows === expectedRows) {
                    return performance.now() - started;
                }
                await new Promise((resolve) => setTimeout(resolve, 20));
            }

            return Number.POSITIVE_INFINITY;
        },
        SHOW_SIDEBAR_COMMAND,
        WORD_LIST,
        rowCount,
        RESPONSE_LIMIT_MS
    );
}

describe('Word Frequency plugin with a large note', () => {
    useCleanState();

    it(`should list ${DISTINCT_WORDS} words within ${RESPONSE_LIMIT_MS} ms`, async () => {
        await obsidianPage.write(LARGE_NOTE, buildLargeNote());
        await obsidianPage.openFile(LARGE_NOTE);

        const elapsed = await timeUntilListed(DISTINCT_WORDS);

        expect(elapsed).toBeLessThan(RESPONSE_LIMIT_MS);
        expect((await getWordList())[0]).toEqual([wordFor(0), REPETITIONS]);
    });
});
