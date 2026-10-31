import { $, browser, expect } from '@wdio/globals';
import { describe, it } from 'mocha';
import { obsidianPage } from 'wdio-obsidian-service';
import {
    activateNote,
    appendToNote,
    EDIT_DEBOUNCE_MS,
    expectWordList,
    FRUIT_COUNTS,
    FRUIT_NOTE,
    getRecordedUpdates,
    getSettings,
    openNoteInNewTab,
    openNoteInNewWindow,
    openSidebarForFruit,
    PLUGIN_ID,
    RIBBON_ICON,
    SHOW_SIDEBAR_COMMAND,
    showSidebar,
    startErrorCapture,
    startRecordingUpdates,
    switchToMainWindow,
    THRESHOLD_DISPLAY,
    updateSettings,
    useCleanState,
    VEGETABLES_COUNTS,
    VEGETABLES_NOTE,
    VIEW,
    VIEW_TYPE,
} from '../helpers';

async function countSidebars(): Promise<number> {
    await switchToMainWindow();

    return browser.executeObsidian(
        ({ app }, viewType) => app.workspace.getLeavesOfType(viewType).length,
        VIEW_TYPE
    );
}

async function hasSidebarCommand(): Promise<boolean> {
    return browser.executeObsidian(
        ({ app }, command) =>
            (
                app as unknown as {
                    commands: { commands: Record<string, unknown> };
                }
            ).commands.commands[command] !== undefined,
        SHOW_SIDEBAR_COMMAND
    );
}

describe('Word Frequency plugin lifecycle', () => {
    useCleanState();

    it('should reuse the open sidebar when the command runs again', async () => {
        await openSidebarForFruit();

        await browser.executeObsidianCommand(SHOW_SIDEBAR_COMMAND);
        await browser.executeObsidianCommand(SHOW_SIDEBAR_COMMAND);

        expect(await countSidebars()).toBe(1);
        await expectWordList(FRUIT_COUNTS);
    });

    it('should show a single updating list after the sidebar is closed and reopened', async () => {
        await openSidebarForFruit();
        await browser.executeObsidian(({ app }, viewType) => {
            app.workspace.detachLeavesOfType(viewType);
        }, VIEW_TYPE);
        await expect($(VIEW)).not.toExist();

        await activateNote(FRUIT_NOTE);
        await showSidebar();
        await expectWordList(FRUIT_COUNTS);
        await appendToNote(FRUIT_NOTE, '\nApple.\n');

        await expectWordList([
            ['apple', 6],
            ['banana', 4],
        ]);
        expect(await countSidebars()).toBe(1);
    });

    it('should update once per edit no matter how often notes were switched', async () => {
        await openSidebarForFruit();
        await openNoteInNewTab(VEGETABLES_NOTE);
        for (let switches = 0; switches < 5; switches++) {
            await activateNote(FRUIT_NOTE);
            await activateNote(VEGETABLES_NOTE);
        }
        await activateNote(FRUIT_NOTE);
        await expectWordList(FRUIT_COUNTS);
        await startRecordingUpdates();

        await appendToNote(FRUIT_NOTE, '\nApple.\n');
        await browser.pause(EDIT_DEBOUNCE_MS + 1000);

        expect(await getRecordedUpdates()).toHaveLength(1);
    });

    it('should update the sidebar for a note edited in a pop-out window', async () => {
        await openSidebarForFruit();

        await openNoteInNewWindow(VEGETABLES_NOTE);
        await activateNote(VEGETABLES_NOTE);
        await expectWordList(VEGETABLES_COUNTS);
        await appendToNote(VEGETABLES_NOTE, '\nPotato potato.\n');

        await expectWordList([
            ['potato', 6],
            ['carrot', 5],
        ]);
    });

    it('should remove its sidebar, ribbon icon and command when disabled and restore them when enabled', async () => {
        await openSidebarForFruit();

        await obsidianPage.disablePlugin(PLUGIN_ID);

        await expect($(VIEW)).not.toExist();
        await expect($(RIBBON_ICON)).not.toExist();
        expect(await hasSidebarCommand()).toBe(false);

        await obsidianPage.enablePlugin(PLUGIN_ID);
        await startErrorCapture();
        await activateNote(FRUIT_NOTE);
        await showSidebar();

        await expect($(RIBBON_ICON)).toExist();
        expect(await hasSidebarCommand()).toBe(true);
        await expectWordList(FRUIT_COUNTS);
    });

    it('should restore saved settings and the open sidebar after Obsidian restarts', async () => {
        await updateSettings({ threshold: 2 });
        await obsidianPage.openFile(FRUIT_NOTE);
        await showSidebar();
        await expectWordList([
            ['apple', 5],
            ['banana', 4],
            ['cherry', 2],
        ]);

        await browser.executeObsidian(async ({ app }) => {
            await app.workspace.requestSaveLayout.run();
        });
        await browser.reloadObsidian();
        await startErrorCapture();

        const restoredNote = await browser.executeObsidian(
            ({ app, obsidian }) => {
                const view = app.workspace.getMostRecentLeaf()?.view;

                return view instanceof obsidian.MarkdownView
                    ? view.file?.path
                    : undefined;
            }
        );
        expect(restoredNote).toBe(FRUIT_NOTE);

        expect((await getSettings()).threshold).toBe(2);
        await $(VIEW).waitForExist();
        await expect($(THRESHOLD_DISPLAY)).toHaveText(
            'Current frequency threshold is 2.'
        );
        await expectWordList([
            ['apple', 5],
            ['banana', 4],
            ['cherry', 2],
        ]);

        await browser.executeObsidian(({ app }, viewType) => {
            app.workspace.detachLeavesOfType(viewType);
        }, VIEW_TYPE);
        await showSidebar();

        await expectWordList([
            ['apple', 5],
            ['banana', 4],
            ['cherry', 2],
        ]);
    });
});
