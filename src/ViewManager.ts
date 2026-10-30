import { Workspace, WorkspaceLeaf } from 'obsidian';
import WordFrequencyPlugin from './main';

export class ViewManager {
    private plugin: WordFrequencyPlugin;

    constructor(plugin: WordFrequencyPlugin) {
        this.plugin = plugin;
    }

    getOrCreateLeaf(
        workspace: Workspace,
        viewType: string
    ): WorkspaceLeaf | null {
        const leaves = workspace.getLeavesOfType(viewType);
        if (leaves.length > 0) {
            return leaves[0];
        }

        return workspace.getRightLeaf(false);
    }

    async setViewState(leaf: WorkspaceLeaf, viewType: string): Promise<void> {
        await leaf.setViewState({
            type: viewType,
            active: true,
        });
    }

    updateContent(): void {
        this.plugin.frequencyCounter.triggerUpdateContent();
    }
}
