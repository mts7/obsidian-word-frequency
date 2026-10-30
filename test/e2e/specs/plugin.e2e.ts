import { $, browser, expect } from '@wdio/globals';
import { describe, it } from 'mocha';
import { obsidianPage } from 'wdio-obsidian-service';
import {
    activateNote,
    appendToNote,
    DEFAULT_SETTINGS,
    EDIT_DEBOUNCE_MS,
    expectSavedSettings,
    expectWordList,
    FILTER,
    FRUIT_COUNTS,
    FRUIT_NOTE,
    getSettings,
    openNoteInNewTab,
    openNoteInSameTab,
    openSettingsTab,
    openSidebarForFruit,
    RIBBON_ICON,
    searchSettings,
    SETTINGS,
    SETTINGS_BLACKLIST,
    SETTINGS_THRESHOLD,
    SHOW_SIDEBAR_COMMAND,
    switchToMainWindow,
    TAB_HEADER,
    THRESHOLD_DISPLAY,
    updateSettings,
    typeInFilter,
    useCleanState,
    VEGETABLES_COUNTS,
    VEGETABLES_NOTE,
    VIEW,
    WORD_BUTTON,
} from '../helpers';

describe('Word Frequency plugin in Obsidian', () => {
    useCleanState();

    describe('loading', () => {
        it('should enable the plugin and register the sidebar command', async () => {
            const state = await browser.executeObsidian(
                ({ app, plugins }, command) => ({
                    loaded: plugins.wordFrequency !== undefined,
                    hasCommand:
                        (
                            app as unknown as {
                                commands: { commands: Record<string, unknown> };
                            }
                        ).commands.commands[command] !== undefined,
                }),
                SHOW_SIDEBAR_COMMAND
            );

            expect(state).toEqual({ loaded: true, hasCommand: true });
        });

        it('should add a ribbon icon that opens the sidebar', async () => {
            await obsidianPage.openFile(FRUIT_NOTE);

            await $(RIBBON_ICON).click();

            await expect($(VIEW)).toExist();
        });

        it('should render the ribbon icon', async () => {
            await expect(
                $(`${RIBBON_ICON} svg.lucide-file-chart-column-increasing`)
            ).toExist();
        });
    });

    describe('sidebar', () => {
        it('should list words from the active note that meet the threshold, excluding the blacklist', async () => {
            await openSidebarForFruit();

            await expect($(`${VIEW} h4`)).toHaveText('Word frequency');
            await expect($(THRESHOLD_DISPLAY)).toHaveText(
                'Current frequency threshold is 3.'
            );
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

        it('should show the counts of the note in the tab that becomes active', async () => {
            await openSidebarForFruit();

            await openNoteInNewTab(VEGETABLES_NOTE);
            await expectWordList(VEGETABLES_COUNTS);

            await activateNote(FRUIT_NOTE);
            await expectWordList(FRUIT_COUNTS);
        });

        it('should keep showing the active note when an edit to the previous note settles', async () => {
            await openSidebarForFruit();
            await appendToNote(FRUIT_NOTE, '\nApple.\n');

            await openNoteInNewTab(VEGETABLES_NOTE);
            await expectWordList(VEGETABLES_COUNTS);
            await browser.pause(EDIT_DEBOUNCE_MS + 500);

            await expectWordList(VEGETABLES_COUNTS);
        });

        it('should show the counts of a note opened in the same tab', async () => {
            await openSidebarForFruit();

            await openNoteInSameTab(VEGETABLES_NOTE);

            await expectWordList(VEGETABLES_COUNTS);
        });

        it('should render the sidebar tab icon and the blacklist button icon', async () => {
            await openSidebarForFruit();

            await expect(
                $(`${TAB_HEADER} svg.lucide-file-chart-column-increasing`)
            ).toExist();
            await expect($(`${WORD_BUTTON} svg.lucide-eye-off`)).toExist();
        });

        it('should label each blacklist button with its word', async () => {
            await openSidebarForFruit();

            await expect($(WORD_BUTTON)).toHaveAttribute(
                'aria-label',
                expect.stringContaining('apple')
            );
        });

        it('should show only words matching the filter', async () => {
            await openSidebarForFruit();

            await typeInFilter('BAN');

            await expectWordList([['banana', 4]]);
        });

        it('should keep applying the filter after the note is edited', async () => {
            await openSidebarForFruit();
            await typeInFilter('BAN');
            await expectWordList([['banana', 4]]);

            await appendToNote(FRUIT_NOTE, '\nBanana banana.\n');

            await expectWordList([['banana', 6]]);
            await expect($(FILTER)).toHaveValue('BAN');
        });

        it('should blacklist a word with its button and save the setting', async () => {
            await openSidebarForFruit();

            await $(WORD_BUTTON).click();

            await expectWordList([['banana', 4]]);
            const blacklist = `${DEFAULT_SETTINGS.blacklist},apple`;
            expect((await getSettings()).blacklist).toBe(blacklist);
            await expectSavedSettings({ blacklist });
        });

        it('should blacklist a word when the blacklist is empty', async () => {
            await updateSettings({ blacklist: '' });
            await obsidianPage.openFile(FRUIT_NOTE);
            await browser.executeObsidianCommand(SHOW_SIDEBAR_COMMAND);
            await expectWordList(FRUIT_COUNTS);

            await $(WORD_BUTTON).click();

            await expectWordList([['banana', 4]]);
            await expectSavedSettings({ blacklist: 'apple' });
        });
    });

    describe('settings tab', () => {
        it('should render the blacklist and threshold settings with current values', async () => {
            await openSettingsTab();

            await expect(
                $(SETTINGS).$('.setting-item-name=Blacklist')
            ).toExist();
            await expect(
                $(SETTINGS).$('.setting-item-name=Word frequency threshold')
            ).toExist();
            await expect($(SETTINGS_BLACKLIST)).toHaveValue(
                DEFAULT_SETTINGS.blacklist
            );
            await expect($(SETTINGS_THRESHOLD)).toHaveValue('3');
            await expect($(SETTINGS_THRESHOLD)).toHaveAttribute(
                'placeholder',
                '3'
            );
        });

        it('should save a changed blacklist', async () => {
            await openSettingsTab();

            await $(SETTINGS_BLACKLIST).setValue('apple,banana');

            await expectSavedSettings({ blacklist: 'apple,banana' });
            expect((await getSettings()).blacklist).toBe('apple,banana');
        });

        it('should apply a changed blacklist to an open sidebar', async () => {
            await openSidebarForFruit();
            await openSettingsTab();

            await $(SETTINGS_BLACKLIST).setValue('apple');

            await expectWordList([['banana', 4]]);
        });

        it('should save a changed threshold and refresh an open sidebar', async () => {
            await openSidebarForFruit();
            await openSettingsTab();

            await $(SETTINGS_THRESHOLD).setValue('2');

            await expectWordList([
                ['apple', 5],
                ['banana', 4],
                ['cherry', 2],
            ]);
            expect((await getSettings()).threshold).toBe(2);
            await expectSavedSettings({ threshold: 2 });
        });

        it('should show the changed threshold in an open sidebar', async () => {
            await openSidebarForFruit();
            await openSettingsTab();

            await $(SETTINGS_THRESHOLD).setValue('2');

            await switchToMainWindow();
            await expect($(THRESHOLD_DISPLAY)).toHaveText(
                'Current frequency threshold is 2.'
            );
        });

        it('should ignore a threshold that is not a number', async () => {
            await openSettingsTab();

            await $(SETTINGS_THRESHOLD).setValue('abc');
            await browser.pause(500);

            expect((await getSettings()).threshold).toBe(3);
        });

        it('should be found by settings search', async function () {
            await openSettingsTab();
            const hasSearch = await browser.executeObsidian(
                ({ app }) =>
                    (
                        app as unknown as {
                            setting: { searchComponent?: unknown };
                        }
                    ).setting.searchComponent !== undefined
            );
            if (!hasSearch) {
                this.skip();
            }

            const control = await searchSettings('Spellcheck');
            const blacklist = await searchSettings('Blacklist');
            const threshold = await searchSettings('Word frequency threshold');

            expect(control).toContain('Spellcheck');
            expect(blacklist).toContain('Blacklist');
            expect(threshold).toContain('Word frequency threshold');
        });
    });
});
