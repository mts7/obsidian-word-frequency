import { App, PluginManifest, WorkspaceLeaf } from 'obsidian';
import {
    COMMAND_ID_SHOW_SIDEBAR,
    DEFAULT_SETTINGS,
    FREQUENCY_ICON,
    PLUGIN_NAME,
    VIEW_TYPE,
} from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencySettingTab } from '../WordFrequencySettingTab';
import { WordFrequencyView } from '../WordFrequencyView';
import { createNote, FakeWorkspace, recordUpdates } from './fakes/workspace';

const MANIFEST: PluginManifest = {
    id: 'word-frequency',
    name: 'Word Frequency',
    version: '1.3.1',
    minAppVersion: '0.15.0',
    description: 'A plugin to count word frequencies.',
    author: 'Mike Rodarte',
    authorUrl: 'https://example.com',
};
const SIDEBAR_TITLE = `Show ${PLUGIN_NAME.toLowerCase()} sidebar`;
const EDIT_DELAY_MS = 3000;

function createSidebarLeaf(): WorkspaceLeaf {
    return { setViewState: jest.fn() } as unknown as WorkspaceLeaf;
}

function getListedWords(view: WordFrequencyView): string[] {
    return Array.from(
        view.contentEl.querySelectorAll('.word-frequency-row span:first-child')
    ).map((word) => word.textContent ?? '');
}

describe('WordFrequencyPlugin', () => {
    let workspace: FakeWorkspace;
    let plugin: WordFrequencyPlugin;
    let updates: ReturnType<typeof recordUpdates>;

    beforeEach(() => {
        workspace = new FakeWorkspace();
        plugin = new WordFrequencyPlugin(
            { workspace: workspace.getWorkspace() } as App,
            MANIFEST
        );
        updates = recordUpdates();
    });

    afterEach(() => {
        updates.stop();
        jest.useRealTimers();
    });

    describe('onload', () => {
        it('should add the sidebar view, ribbon icon, command and settings to Obsidian', async () => {
            await plugin.onload();

            expect(plugin.registerView).toHaveBeenCalledWith(
                VIEW_TYPE,
                expect.any(Function)
            );
            expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
                FREQUENCY_ICON,
                SIDEBAR_TITLE,
                expect.any(Function)
            );
            expect(plugin.addCommand).toHaveBeenCalledWith({
                id: COMMAND_ID_SHOW_SIDEBAR,
                name: SIDEBAR_TITLE,
                callback: expect.any(Function),
            });
            expect(plugin.addSettingTab).toHaveBeenCalledWith(
                expect.any(WordFrequencySettingTab)
            );
        });

        it.each([
            [
                'ribbon icon',
                (target: WordFrequencyPlugin) =>
                    (target.addRibbonIcon as jest.Mock).mock.calls[0][2](),
            ],
            [
                'command',
                (target: WordFrequencyPlugin) =>
                    (
                        target.addCommand as jest.Mock
                    ).mock.calls[0][0].callback(),
            ],
        ])('should show the sidebar from the %s', async (_, runAction) => {
            const leaf = createSidebarLeaf();
            workspace.rightLeaf = leaf;
            await plugin.onload();

            await runAction(plugin);
            await Promise.resolve();

            expect(workspace.revealedLeaves).toEqual([leaf]);
        });

        it('should create the sidebar view for Obsidian', async () => {
            await plugin.onload();

            const createView = (plugin.registerView as jest.Mock).mock
                .calls[0][1];

            expect(createView({} as WorkspaceLeaf)).toBeInstanceOf(
                WordFrequencyView
            );
        });

        it('should use an injected view factory', async () => {
            const view = {} as WordFrequencyView;
            plugin = new WordFrequencyPlugin(
                { workspace: workspace.getWorkspace() } as App,
                MANIFEST,
                { createView: () => view }
            );
            await plugin.onload();

            const createView = (plugin.registerView as jest.Mock).mock
                .calls[0][1];

            expect(createView({} as WorkspaceLeaf)).toBe(view);
        });

        it('should count a note when it becomes active while the sidebar is open', async () => {
            workspace.openSidebar();
            await plugin.onload();

            workspace.activateNote(createNote('apple banana apple'));

            expect(updates.counts.at(-1)).toEqual([
                ['apple', 2],
                ['banana', 1],
            ]);
        });
    });

    describe('onunload', () => {
        it('should not count a note edited just before the plugin unloads', async () => {
            jest.useFakeTimers();
            workspace.openSidebar();
            await plugin.onload();
            workspace.activateNote(createNote('apple'));
            updates.counts.length = 0;
            workspace.editNote();

            plugin.onunload();
            jest.advanceTimersByTime(EDIT_DELAY_MS);

            expect(updates.counts).toEqual([]);
        });
    });

    describe('activateView', () => {
        it('should open the sidebar view in the right sidebar and reveal it', async () => {
            const leaf = createSidebarLeaf();
            workspace.rightLeaf = leaf;

            await plugin.activateView();

            expect(leaf.setViewState).toHaveBeenCalledWith({
                type: VIEW_TYPE,
                active: true,
            });
            expect(workspace.revealedLeaves).toEqual([leaf]);
        });

        it('should not count the note again after revealing the sidebar', async () => {
            workspace.openSidebar(createSidebarLeaf());
            workspace.activateNote(createNote('apple'));
            await plugin.onload();
            updates.counts.length = 0;

            await plugin.activateView();

            expect(updates.counts).toEqual([]);
        });

        it('should do nothing when Obsidian has no sidebar leaf', async () => {
            await plugin.activateView();

            expect(workspace.revealedLeaves).toEqual([]);
        });
    });

    describe('saveSettings', () => {
        it('should save the settings', async () => {
            await plugin.saveSettings();

            expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
        });

        it('should apply saved settings to the open sidebar', async () => {
            const leaf = {} as WorkspaceLeaf;
            const view = new WordFrequencyView(leaf, plugin);
            Object.assign(leaf, { view });
            workspace.openSidebar(leaf);
            workspace.activateNote(
                createNote('apple apple apple banana banana banana')
            );
            await plugin.onload();
            await view.onOpen();
            expect(getListedWords(view)).toEqual(['apple', 'banana']);

            plugin.settings.blacklist = 'apple';
            await plugin.saveSettings();

            expect(getListedWords(view)).toEqual(['banana']);
        });
    });

    describe('loadSettings', () => {
        it('should use the default settings when nothing is saved', async () => {
            await plugin.onload();

            expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
        });

        it('should merge saved settings with the default settings', async () => {
            const settings = { threshold: 15 };
            (plugin.loadData as jest.Mock).mockResolvedValue(settings);

            await plugin.onload();

            expect(plugin.settings).toEqual({
                ...DEFAULT_SETTINGS,
                ...settings,
            });
        });
    });
});
