import { NoteTracker } from '../NoteTracker';
import { createNote, FakeWorkspace } from './fakes/workspace';

describe('NoteTracker', () => {
    let workspace: FakeWorkspace;
    let tracker: NoteTracker;

    beforeEach(() => {
        workspace = new FakeWorkspace();
        tracker = new NoteTracker(workspace.getWorkspace());
    });

    it('should find the active note', () => {
        const fruit = createNote('apple');
        workspace.activateNote(fruit);

        expect(tracker.findCurrentNote()).toBe(fruit);
    });

    it('should keep finding the last active note while another pane is active', () => {
        const fruit = createNote('apple');
        workspace.activateNote(fruit);
        tracker.findCurrentNote();

        workspace.activateSidebar();

        expect(tracker.findCurrentNote()).toBe(fruit);
    });

    it('should find a remembered note while another pane is active', () => {
        const fruit = createNote('apple');
        workspace.openNote(fruit);
        tracker.rememberNote(fruit);

        expect(tracker.findCurrentNote()).toBe(fruit);
    });

    it('should find the most recent note after the remembered note closes', () => {
        const fruit = createNote('apple');
        const vegetables = createNote('carrot');
        workspace.openNote(fruit);
        tracker.rememberNote(fruit);
        workspace.openNote(vegetables);
        workspace.mostRecentNote = vegetables;

        workspace.closeNote(fruit);

        expect(tracker.findCurrentNote()).toBe(vegetables);
    });

    it('should not find a remembered note whose pane now shows something else', () => {
        const fruit = createNote('apple');
        workspace.openNote(fruit);
        tracker.rememberNote(fruit);

        Object.assign(fruit.leaf, { view: {} });

        expect(tracker.findCurrentNote()).toBeUndefined();
    });

    it('should find nothing when no note is open', () => {
        expect(tracker.findCurrentNote()).toBeUndefined();
    });
});
