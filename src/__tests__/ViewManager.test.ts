import { App, PluginManifest, Workspace, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE } from '../constants';
import WordFrequencyPlugin from '../main';
import { ViewManager } from '../ViewManager';
import { WordFrequencyView } from '../WordFrequencyView';
import { createNote, FakeWorkspace } from './fakes/workspace';

describe('ViewManager', () => {
    let viewManager: ViewManager;
    let workspace: Workspace;

    beforeEach(() => {
        workspace = {
            getLeavesOfType: jest.fn(),
            getRightLeaf: jest.fn(),
        } as unknown as Workspace;
        viewManager = new ViewManager();
    });

    it('should get or create a leaf', () => {
        const mockLeaf = {} as WorkspaceLeaf;

        (workspace.getLeavesOfType as jest.Mock).mockReturnValueOnce([
            mockLeaf,
        ]);
        const leaf = viewManager.getOrCreateLeaf(workspace, VIEW_TYPE);

        expect(leaf).toBe(mockLeaf);

        (workspace.getLeavesOfType as jest.Mock).mockReturnValueOnce([]);
        (workspace.getRightLeaf as jest.Mock).mockReturnValueOnce(mockLeaf);
        const newLeaf = viewManager.getOrCreateLeaf(workspace, VIEW_TYPE);

        expect(newLeaf).toBe(mockLeaf);
        expect(workspace.getRightLeaf).toHaveBeenCalledWith(false);
    });

    it('should set view state', async () => {
        const mockLeaf = {
            setViewState: jest.fn().mockResolvedValue(undefined),
        } as unknown as WorkspaceLeaf;

        await viewManager.setViewState(mockLeaf, VIEW_TYPE);

        expect(mockLeaf.setViewState).toHaveBeenCalledWith({
            type: VIEW_TYPE,
            active: true,
        });
    });

    describe('refreshViews', () => {
        it('should apply current settings to every open sidebar and ignore other panes', async () => {
            const fakeWorkspace = new FakeWorkspace();
            fakeWorkspace.activateNote(createNote('apple apple apple pear'));
            const plugin = new WordFrequencyPlugin(
                { workspace: fakeWorkspace.getWorkspace() } as App,
                { id: 'word-frequency' } as PluginManifest
            );
            const sidebars = [1, 2].map(
                () => new WordFrequencyView({} as WorkspaceLeaf, plugin)
            );
            await Promise.all(sidebars.map((sidebar) => sidebar.onOpen()));
            sidebars.forEach((sidebar) =>
                fakeWorkspace.openSidebar({
                    view: sidebar,
                } as unknown as WorkspaceLeaf)
            );
            fakeWorkspace.openSidebar({ view: {} } as WorkspaceLeaf);
            plugin.settings.threshold = 1;

            viewManager.refreshViews(fakeWorkspace.getWorkspace());

            sidebars.forEach((sidebar) =>
                expect(
                    Array.from(
                        sidebar.contentEl.querySelectorAll(
                            '.word-frequency-row span:first-child'
                        )
                    ).map((word) => word.textContent)
                ).toEqual(['apple', 'pear'])
            );
            await Promise.all(sidebars.map((sidebar) => sidebar.onClose()));
        });
    });
});
