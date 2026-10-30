import { $, expect } from '@wdio/globals';
import { describe, it } from 'mocha';
import { obsidianPage } from 'wdio-obsidian-service';
import {
    appendToNote,
    closeRightSidebar,
    DEFAULT_SETTINGS,
    expectSavedSettings,
    expectWordList,
    FILTER,
    FRUIT_NOTE,
    openSettingsTab,
    openSidebarForFruit,
    SETTINGS_BLACKLIST,
    SETTINGS_THRESHOLD,
    showSidebar,
    typeInFilter,
    useCleanState,
    WORD_BUTTON,
} from '../../helpers';

describe('Word Frequency plugin on mobile', () => {
    useCleanState();

    it('should run with the mobile layout', async () => {
        expect((await obsidianPage.getPlatform()).isMobile).toBe(true);
    });

    it('should list words from the active note', async () => {
        await openSidebarForFruit();
    });

    it('should update the counts after the note is edited', async () => {
        await openSidebarForFruit();

        await appendToNote(FRUIT_NOTE, '\nCherry cherry cherry.\n');

        await expectWordList([
            ['apple', 5],
            ['cherry', 5],
            ['banana', 4],
        ]);
    });

    it('should show the sidebar again after the drawer was closed', async () => {
        await openSidebarForFruit();
        await closeRightSidebar();

        await showSidebar();

        await expect($(FILTER)).toBeClickable();
    });

    it('should show only words matching the filter', async () => {
        await openSidebarForFruit();

        await typeInFilter('BAN');

        await expectWordList([['banana', 4]]);
    });

    it('should blacklist a word with its button', async () => {
        await openSidebarForFruit();

        await $(WORD_BUTTON).click();

        await expectWordList([['banana', 4]]);
        await expectSavedSettings({
            blacklist: `${DEFAULT_SETTINGS.blacklist},apple`,
        });
    });

    it('should render the settings and save a changed threshold', async () => {
        await openSettingsTab();
        await expect($(SETTINGS_BLACKLIST)).toHaveValue(
            DEFAULT_SETTINGS.blacklist
        );

        await $(SETTINGS_THRESHOLD).setValue('2');

        await expectSavedSettings({ threshold: 2 });
    });
});
