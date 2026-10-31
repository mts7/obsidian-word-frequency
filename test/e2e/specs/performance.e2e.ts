import { $, browser, expect } from '@wdio/globals';
import { beforeEach, describe, it } from 'mocha';
import {
    activateNote,
    appendToNote,
    closeRightSidebar,
    EDIT_DEBOUNCE_MS,
    expectWordList,
    FRUIT_COUNTS,
    FRUIT_NOTE,
    getRecordedUpdates,
    openNoteInNewTab,
    openNoteInSameTab,
    openSidebarForFruit,
    showSidebar,
    startRecordingUpdates,
    switchToMainWindow,
    useCleanState,
    VEGETABLES_COUNTS,
    VEGETABLES_NOTE,
    VIEW,
    VIEW_TYPE,
} from '../helpers';

const SETTLE_MS = 1000;
const ADDED_POTATOES: [string, number][] = [
    ['potato', 6],
    ['carrot', 5],
];

async function getUpdateCount(): Promise<number> {
    await browser.pause(SETTLE_MS);

    return (await getRecordedUpdates()).length;
}

async function editVegetablesAndWait(): Promise<void> {
    await appendToNote(VEGETABLES_NOTE, '\nPotato potato.\n');
    await browser.pause(EDIT_DEBOUNCE_MS);
}

async function coverSidebar(): Promise<void> {
    await switchToMainWindow();
    await browser.executeObsidian(async ({ app }, viewType) => {
        const sidebar = app.workspace.getLeavesOfType(viewType)[0];
        const tabs = sidebar.parent as unknown as Parameters<
            typeof app.workspace.createLeafInParent
        >[0];
        const cover = app.workspace.createLeafInParent(tabs, 0);
        await cover.setViewState({ type: 'outline', active: true });
        await app.workspace.revealLeaf(cover);
    }, VIEW_TYPE);
}

async function uncoverSidebar(): Promise<void> {
    await switchToMainWindow();
    await browser.executeObsidian(async ({ app }) => {
        app.workspace.detachLeavesOfType('outline');
    });
}

describe('Word Frequency plugin updates', () => {
    useCleanState();

    describe('switching notes', () => {
        beforeEach(async () => {
            await openSidebarForFruit();
            await openNoteInNewTab(VEGETABLES_NOTE);
            await expectWordList(VEGETABLES_COUNTS);
        });

        it('should count a note once when switching to its tab', async () => {
            await startRecordingUpdates();

            await activateNote(FRUIT_NOTE);

            await expectWordList(FRUIT_COUNTS);
            expect(await getUpdateCount()).toBe(1);
        });

        it('should count a note once when opening it in the same tab', async () => {
            await activateNote(FRUIT_NOTE);
            await expectWordList(FRUIT_COUNTS);
            await startRecordingUpdates();

            await openNoteInSameTab(VEGETABLES_NOTE);

            await expectWordList(VEGETABLES_COUNTS);
            expect(await getUpdateCount()).toBe(1);
        });
    });

    describe('with the right sidebar collapsed', () => {
        beforeEach(async () => {
            await openSidebarForFruit();
            await openNoteInNewTab(VEGETABLES_NOTE);
            await expectWordList(VEGETABLES_COUNTS);
            await closeRightSidebar();
            await expect($(VIEW)).not.toBeDisplayed();
            await startRecordingUpdates();
        });

        it('should not count notes while the sidebar cannot be seen', async () => {
            await editVegetablesAndWait();
            await activateNote(FRUIT_NOTE);

            expect(await getUpdateCount()).toBe(0);
        });

        it('should show current counts once the sidebar is expanded', async () => {
            await editVegetablesAndWait();

            await showSidebar();

            await expectWordList(ADDED_POTATOES);
        });
    });

    describe('with another tab in front of the sidebar', () => {
        beforeEach(async () => {
            await openSidebarForFruit();
            await openNoteInNewTab(VEGETABLES_NOTE);
            await expectWordList(VEGETABLES_COUNTS);
            await coverSidebar();
            await activateNote(VEGETABLES_NOTE);
            await expect($(VIEW)).not.toBeDisplayed();
            await startRecordingUpdates();
        });

        it('should not count notes while the sidebar cannot be seen', async () => {
            await editVegetablesAndWait();
            await activateNote(FRUIT_NOTE);

            expect(await getUpdateCount()).toBe(0);
        });

        it('should show current counts once the sidebar is in front again', async () => {
            await editVegetablesAndWait();

            await uncoverSidebar();

            await expectWordList(ADDED_POTATOES);
        });
    });
});
