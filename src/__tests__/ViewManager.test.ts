import { Workspace, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE } from '../constants';
import { ViewManager } from '../ViewManager';

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
});
