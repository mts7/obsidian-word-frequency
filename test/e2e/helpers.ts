import { $, browser, expect } from '@wdio/globals';
import { readFileSync } from 'fs';
import { afterEach, beforeEach } from 'mocha';
import { obsidianPage } from 'wdio-obsidian-service';

export const PLUGIN_ID = 'word-frequency';
export const VIEW_TYPE = 'word-frequency-view';
export const SHOW_SIDEBAR_COMMAND = `${PLUGIN_ID}:word-frequency-show-sidebar`;
export const DEFAULT_SETTINGS = {
    blacklist: 'the,and,to,of,a,in,for,on,is,it,that,with,as,this,by,your,you',
    threshold: 3,
};
export const FRUIT_NOTE = 'Fruit.md';
export const VEGETABLES_NOTE = 'Vegetables.md';
export const FRUIT_COUNTS: WordCount[] = [
    ['apple', 5],
    ['banana', 4],
];
export const VEGETABLES_COUNTS: WordCount[] = [
    ['carrot', 5],
    ['potato', 4],
];
export const VIEW = `.workspace-leaf-content[data-type="${VIEW_TYPE}"]`;
export const TAB_HEADER = `.workspace-tab-header[data-type="${VIEW_TYPE}"]`;
export const RIBBON_ICON =
    '.side-dock-ribbon-action[aria-label="Show word frequency sidebar"]';
export const WORD_LIST = `${VIEW} .word-frequency-word-list`;
export const WORD_BUTTON = `${WORD_LIST} .word-frequency-row button`;
export const FILTER = `${VIEW} input.word-frequency-filter`;
export const THRESHOLD_DISPLAY = `${VIEW} .word-frequency-threshold-display`;
export const SETTINGS = '.mod-settings';
export const SETTINGS_BLACKLIST = `${SETTINGS} textarea.word-frequency-setting-blacklist`;
export const SETTINGS_THRESHOLD = `${SETTINGS} .vertical-tab-content input[type="text"]`;

const FIXTURES = [FRUIT_NOTE, VEGETABLES_NOTE].map((note) => ({
    note,
    content: readFileSync(`test/e2e/vaults/simple/${note}`, 'utf-8'),
}));

export const EDIT_DEBOUNCE_MS = 3000;

let hasPendingEdit = false;

export type Settings = typeof DEFAULT_SETTINGS;
export type WordCount = [string, number];
type SettingModal = {
    close(): void;
    open(): void;
    openTabById(_tabId: string): void;
};

export async function switchToMainWindow(): Promise<void> {
    await browser.switchToWindow(await obsidianPage.getMainWindowHandle());
}

export async function getWordList(): Promise<WordCount[]> {
    await switchToMainWindow();
    const rows = await browser.execute((selector) => {
        const rowElements = document.querySelectorAll(
            `${selector} .word-frequency-row`
        );

        return Array.from(rowElements).map((row): [string, number] => {
            const spans = row.querySelectorAll(
                '.word-frequency-count-container span'
            );

            return [spans[0]?.textContent ?? '', Number(spans[1]?.textContent)];
        });
    }, WORD_LIST);

    return rows as WordCount[];
}

export async function expectWordList(
    expected: WordCount[],
    timeout?: number
): Promise<void> {
    let actual: WordCount[] = [];
    await browser
        .waitUntil(
            async () => {
                actual = await getWordList();

                return JSON.stringify(actual) === JSON.stringify(expected);
            },
            { timeout }
        )
        .catch(() => {
            throw new Error(
                `word list was ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`
            );
        });
}

export async function getSettings(): Promise<Settings> {
    await switchToMainWindow();

    return browser.executeObsidian(({ plugins }) => ({
        ...plugins.wordFrequency.settings,
    }));
}

export async function getSavedSettings(): Promise<Settings | null> {
    await switchToMainWindow();

    return browser.executeObsidian(async ({ app }, pluginId) => {
        const file = `${app.vault.configDir}/plugins/${pluginId}/data.json`;
        if (!(await app.vault.adapter.exists(file))) {
            return null;
        }

        return JSON.parse(await app.vault.adapter.read(file));
    }, PLUGIN_ID);
}

export async function expectSavedSettings(
    expected: Partial<Settings>
): Promise<void> {
    let actual: Settings | null = null;
    await browser
        .waitUntil(async () => {
            actual = await getSavedSettings();

            return Object.entries(expected).every(
                ([key, value]) => actual?.[key as keyof Settings] === value
            );
        })
        .catch(() => {
            throw new Error(
                `data.json was ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`
            );
        });
}

export async function updateSettings(
    settings: Partial<Settings>
): Promise<void> {
    await switchToMainWindow();
    await browser.executeObsidian(async ({ plugins }, changes) => {
        Object.assign(plugins.wordFrequency.settings, changes);
        await plugins.wordFrequency.saveSettings();
    }, settings);
}

export async function showSidebar(): Promise<void> {
    await switchToMainWindow();
    await browser.executeObsidianCommand(SHOW_SIDEBAR_COMMAND);
    await $(VIEW).waitForExist();
}

export async function waitForNoteToLoad(note: string): Promise<void> {
    await switchToMainWindow();
    await browser.waitUntil(
        () =>
            browser.executeObsidian(({ app, obsidian }, path) => {
                const view = app.workspace.getActiveViewOfType(
                    obsidian.MarkdownView
                );

                return (
                    view?.file?.path === path && view.editor.getValue() !== ''
                );
            }, note),
        { timeoutMsg: `${note} did not finish loading` }
    );
}

export async function typeInFilter(text: string): Promise<void> {
    await $(FILTER).click();
    await browser.keys(text.split(''));
}

export async function openSidebarForFruit(): Promise<void> {
    await obsidianPage.openFile(FRUIT_NOTE);
    await waitForNoteToLoad(FRUIT_NOTE);
    await showSidebar();
    await expectWordList(FRUIT_COUNTS);
}

async function openNote(
    note: string,
    target: 'tab' | 'window' | false
): Promise<void> {
    await switchToMainWindow();
    await browser.executeObsidian(
        async ({ app }, path, pane) => {
            await app.workspace.openLinkText(path, '', pane);
        },
        note,
        target
    );
}

export async function openNoteInNewTab(note: string): Promise<void> {
    await openNote(note, 'tab');
}

export async function openNoteInSameTab(note: string): Promise<void> {
    await openNote(note, false);
}

export async function openNoteInNewWindow(note: string): Promise<void> {
    await openNote(note, 'window');
}

export async function activateNote(note: string): Promise<void> {
    await switchToMainWindow();
    await browser.executeObsidian(({ app, obsidian }, path) => {
        const leaf = app.workspace
            .getLeavesOfType('markdown')
            .find(
                (candidate) =>
                    candidate.view instanceof obsidian.MarkdownView &&
                    candidate.view.file?.path === path
            );
        if (leaf === undefined) {
            throw new Error(`${path} is not open`);
        }
        app.workspace.setActiveLeaf(leaf, { focus: true });
    }, note);
}

export async function appendToNote(note: string, text: string): Promise<void> {
    hasPendingEdit = true;
    await switchToMainWindow();
    await browser.executeObsidian(
        ({ app, obsidian }, path, addition) => {
            const leaf = app.workspace
                .getLeavesOfType('markdown')
                .find(
                    (candidate) =>
                        candidate.view instanceof obsidian.MarkdownView &&
                        candidate.view.file?.path === path
                );
            if (!(leaf?.view instanceof obsidian.MarkdownView)) {
                throw new Error(`${path} is not open`);
            }
            const editor = leaf.view.editor;
            editor.replaceRange(
                addition,
                editor.offsetToPos(editor.getValue().length)
            );
        },
        note,
        text
    );
}

export async function openSettingsTab(): Promise<void> {
    await switchToMainWindow();
    const handlesBefore = await browser.getWindowHandles();
    await browser.executeObsidian(({ app }, pluginId) => {
        const setting = (app as unknown as { setting: SettingModal }).setting;
        setting.open();
        setting.openTabById(pluginId);
    }, PLUGIN_ID);
    await browser.pause(500);
    const newHandle = (await browser.getWindowHandles()).find(
        (handle) => !handlesBefore.includes(handle)
    );
    if (newHandle !== undefined) {
        await browser.switchToWindow(newHandle);
    }
    await $(SETTINGS_BLACKLIST).waitForExist();
}

export async function closeRightSidebar(): Promise<void> {
    await switchToMainWindow();
    await browser.executeObsidian(async ({ app }) => {
        app.workspace.rightSplit.collapse();
        await new Promise((resolve) => setTimeout(resolve, 600));
    });
}

export async function closeSettings(): Promise<void> {
    await switchToMainWindow();
    await browser.executeObsidian(({ app }) => {
        (app as unknown as { setting: SettingModal }).setting.close();
    });
}

export async function searchSettings(query: string): Promise<string> {
    await switchToMainWindow();

    return browser.executeObsidian(async ({ app }, text) => {
        const setting = (
            app as unknown as {
                setting: {
                    searchComponent: {
                        inputEl: HTMLInputElement;
                        setValue(_value: string): void;
                    };
                    searchResultsEl: HTMLElement;
                };
            }
        ).setting;
        setting.searchComponent.setValue(text);
        setting.searchComponent.inputEl.dispatchEvent(new Event('input'));
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return setting.searchResultsEl.innerText;
    }, query);
}

export async function startErrorCapture(): Promise<void> {
    await switchToMainWindow();
    await browser.execute(() => {
        if (window.wordFrequencyErrors === undefined) {
            const errors: string[] = [];
            window.wordFrequencyErrors = errors;
            const originalError = console.error.bind(console);
            console.error = (...args: unknown[]) => {
                errors.push(args.map(String).join(' '));
                originalError(...args);
            };
            window.addEventListener('error', (event) => {
                errors.push(String(event.message));
            });
            window.addEventListener('unhandledrejection', (event) => {
                errors.push(String(event.reason));
            });
        }
        window.wordFrequencyErrors.length = 0;
    });
}

export async function expectNoErrors(): Promise<void> {
    await switchToMainWindow();
    const errors = await browser.execute(() => [
        ...(window.wordFrequencyErrors ?? []),
    ]);

    expect(errors).toEqual([]);
}

export async function resetState(): Promise<void> {
    await switchToMainWindow();
    for (const { note, content } of FIXTURES) {
        await obsidianPage.write(note, content);
    }
    await browser.executeObsidian(async ({ app }) => {
        app.workspace.rightSplit.collapse();
        await new Promise((resolve) => setTimeout(resolve, 600));
        app.workspace.detachLeavesOfType('markdown');
    });
    await obsidianPage.disablePlugin(PLUGIN_ID);
    await obsidianPage.enablePlugin(PLUGIN_ID);
    await browser.executeObsidian(async ({ plugins }, defaults) => {
        plugins.wordFrequency.settings = { ...defaults };
        await plugins.wordFrequency.saveSettings();
    }, DEFAULT_SETTINGS);
    await startErrorCapture();
}

export function useCleanState(): void {
    beforeEach(async () => {
        await resetState();
    });

    afterEach(async () => {
        await closeSettings();
        if (hasPendingEdit) {
            await browser.pause(EDIT_DEBOUNCE_MS + 500);
            hasPendingEdit = false;
        }
        await expectNoErrors();
    });
}
