import { Workspace, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE } from './constants';
import { WordFrequencyView } from './WordFrequencyView';

export class ViewManager {
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

    refreshViews(workspace: Workspace): void {
        workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
            if (leaf.view instanceof WordFrequencyView) {
                leaf.view.updateContent();
            }
        });
    }
}
