import { $, browser, expect } from '@wdio/globals';
import { beforeEach, describe, it } from 'mocha';
import { obsidianPage } from 'wdio-obsidian-service';
import {
    appendToNote,
    getRecordedUpdates,
    getWordList,
    PAGE_SIZE,
    SHOW_MORE,
    showSidebar,
    startRecordingUpdates,
    typeInFilter,
    updateSettings,
    useCleanState,
    VIEW,
    WORD_LIST,
} from '../helpers';

const LARGE_NOTE = 'Large.md';
const DISTINCT_WORDS = 2000;
const REPETITIONS = 100;
const LOAD_LIMIT_MS = 30000;
const FREEZE_LIMIT_MS = 2000;
const LARGEST_PAGE_SIZE = 100;
const SHOW_MORE_CLICKS = 5;

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

async function revealBottomOfSidebar(): Promise<void> {
    await browser.execute((selector) => {
        const content = document.querySelector(selector);
        if (content !== null) {
            content.scrollTop = content.scrollHeight;
        }
    }, `${VIEW} .view-content`);
}

async function getLongestTask(): Promise<number> {
    await browser.pause(500);

    return browser.execute(() =>
        Math.max(
            0,
            ...(window.wordFrequencyLongTasks ?? []).map(
                (task) => task.duration
            )
        )
    );
}

describe('Word Frequency plugin with a large note', () => {
    useCleanState();

    beforeEach(async () => {
        await obsidianPage.write(LARGE_NOTE, buildLargeNote());
        await obsidianPage.openFile(LARGE_NOTE);
        await showSidebar();
        await waitForRows(PAGE_SIZE);
    });

    it(`should list the first page of ${DISTINCT_WORDS} words with show more`, async () => {
        const words = await getWordList();

        expect(words).toHaveLength(PAGE_SIZE);
        expect(words[0]).toEqual([createWord(0), REPETITIONS]);
        await expect($(SHOW_MORE)).toExist();
    });

    it('should find the last word of the note with the filter', async () => {
        const lastWord = createWord(DISTINCT_WORDS - 1);

        await typeInFilter(lastWord);

        await waitForRows(1);
        expect(await getWordList()).toEqual([[lastWord, REPETITIONS]]);
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

    it(`should not freeze for ${FREEZE_LIMIT_MS} ms or more showing ${LARGEST_PAGE_SIZE} words per click`, async () => {
        await updateSettings({ pageSize: LARGEST_PAGE_SIZE });
        await waitForRows(LARGEST_PAGE_SIZE);
        await startWatchingLongTasks();

        for (let pages = 2; pages <= SHOW_MORE_CLICKS + 1; pages++) {
            await revealBottomOfSidebar();
            await $(SHOW_MORE).click();
            await waitForRows(pages * LARGEST_PAGE_SIZE);
        }

        expect(await getLongestTask()).toBeLessThan(FREEZE_LIMIT_MS);
    });
});
