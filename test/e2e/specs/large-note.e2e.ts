import { browser, expect } from '@wdio/globals';
import { beforeEach, describe, it } from 'mocha';
import { obsidianPage } from 'wdio-obsidian-service';
import {
    appendToNote,
    getRecordedUpdates,
    getWordList,
    showSidebar,
    startRecordingUpdates,
    useCleanState,
    WORD_LIST,
} from '../helpers';

const LARGE_NOTE = 'Large.md';
const DISTINCT_WORDS = 2000;
const REPETITIONS = 100;
const LOAD_LIMIT_MS = 30000;
const FREEZE_LIMIT_MS = 2000;

function createWord(index: number): string {
    return `word${String.fromCharCode(97 + (index % 26))}${index}`;
}

function buildLargeNote(): string {
    const line = Array.from({ length: DISTINCT_WORDS }, (_, index) =>
        createWord(index)
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

async function startWatchingLongTasks(): Promise<void> {
    await browser.execute(() => {
        const tasks: { start: number; duration: number }[] = [];
        window.wordFrequencyLongTasks = tasks;
        new PerformanceObserver((list) =>
            list.getEntries().forEach((entry) =>
                tasks.push({
                    start: entry.startTime,
                    duration: entry.duration,
                })
            )
        ).observe({ entryTypes: ['longtask'] });
    });
}

async function getFreezeDuringUpdate(): Promise<number> {
    await browser.waitUntil(
        async () => (await getRecordedUpdates()).length > 0,
        {
            timeout: LOAD_LIMIT_MS,
        }
    );
    await browser.pause(500);
    const [updatedAt] = await getRecordedUpdates();

    return browser.execute(
        (time) =>
            (window.wordFrequencyLongTasks ?? []).find(
                (task) =>
                    task.start <= time && time <= task.start + task.duration
            )?.duration ?? 0,
        updatedAt
    );
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
        expect(words[0]).toEqual([createWord(0), REPETITIONS]);
        expect(words[DISTINCT_WORDS - 1]).toEqual([
            createWord(DISTINCT_WORDS - 1),
            REPETITIONS,
        ]);
    });

    it(`should not freeze Obsidian for ${FREEZE_LIMIT_MS} ms or more while recounting after an edit`, async () => {
        await startRecordingUpdates();
        await startWatchingLongTasks();

        await appendToNote(LARGE_NOTE, ` ${createWord(1)}`.repeat(REPETITIONS));

        expect(await getFreezeDuringUpdate()).toBeLessThan(FREEZE_LIMIT_MS);
        expect((await getWordList())[0]).toEqual([
            createWord(1),
            REPETITIONS * 2,
        ]);
    });
});
