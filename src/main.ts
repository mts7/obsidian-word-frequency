import {App, Plugin, MarkdownView, Notice, WorkspaceLeaf} from 'obsidian';

const manifest = {
  id: 'word-frequency',
  name: 'Word Frequency',
  description: 'A plugin to count word frequency in the current note',
  version: '1.0.11',
  author: 'Mike Rodarte',
  minAppVersion: '0.13.0',
};

export default class WordFrequencyPlugin extends Plugin {
  private blacklist: string[];

  constructor(app: App) {
    super(app, manifest);
    this.blacklist = [
      'the', 'and', 'to', 'of', 'a', 'in', 'for', 'on', 'is', 'it', 'that', 'with', 'as', 'this', 'by'
    ];
  }

  onload() {
    console.log('Word Frequency Plugin loaded');
    this.addCommand({
      id: 'count-words',
      name: 'Count Word Frequency',
      callback: () => this.countWordFrequency(),
    });

    this.addCommand({
      id: 'toggle-sidebar',
      name: 'Toggle Word Frequency Sidebar',
      callback: () => this.toggleSidebar(),
    });

    // Listen for when the active note is changed (open a new note)
    //this.app.workspace.on('active-leaf-change', this.onNoteFocusChange.bind(this));
  }

  onNoteFocusChange() {
    console.log('Note focus changed, updating word count...');
    const activeLeaf = this.app.workspace.getLeavesOfType('markdown')[0];

    // Ensure that we only update if the note has gained focus and the view is a MarkdownView
    if (activeLeaf && activeLeaf.view instanceof MarkdownView) {
      console.log('Note focus obtained, updating word count...');
      this.countWordFrequency();
    }
  }

  onunload() {
    console.log('Word Frequency Plugin unloaded');
  }

  private countWordFrequency() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice('No active markdown view!');
      return;
    }

    const content = activeView.editor.getValue();
    const wordCounts = this.getWordCounts(content);

    this.showWordCountsInSidebar(wordCounts);
  }

  private getWordCounts(content: string): Record<string, number> {
    const wordCounts: Record<string, number> = {};
    const words = content.split(/\s+/).map(word => word.toLowerCase().replace(/[^\w\s]/g, ''));

    for (const word of words) {
      if (this.blacklist.includes(word) || word.length === 0) {
        continue;
      }
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }

    return wordCounts;
  }

  private showWordCountsInSidebar(wordCounts: Record<string, number>) {
    const wordCountList = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);

    const content = wordCountList.map(([word, count]) => `<div>${word}: ${count}</div>`).join('');

    const sidebarContent = `
      <div>
        <h3>Word Frequency</h3>
        <div style="max-height: 300px; overflow-y: scroll;">
          ${content}
        </div>
      </div>
    `;

    this.openOrUpdateSidebar(sidebarContent);
  }

  private openOrUpdateSidebar(content: string) {
    // Check if the sidebar already exists
    let sidebar: WorkspaceLeaf | null = this.app.workspace.getLeavesOfType('word-frequency-sidebar')[0] || null;

    if (!sidebar) {
      console.log("Sidebar not found, creating new sidebar.");
      sidebar = this.app.workspace.getRightLeaf(false);

      if (!sidebar) {
        console.log("Failed to get a valid sidebar leaf!");
        new Notice('Unable to open sidebar!');
        return;
      }

      sidebar.setViewState({
        type: 'word-frequency-sidebar', // Use a unique view type
        active: true,
      });
    } else {
      console.log("Sidebar found, updating content.");
    }

    // Ensure we have a view to update
    const view = sidebar.getViewState();
    if (view) {
      const container = sidebar.view.containerEl;
      container.empty(); // Clear previous content

      // Create a new div and set its innerHTML
      const contentDiv = container.createEl('div');
      contentDiv.innerHTML = content; // Render HTML instead of displaying raw tags
    }
  }

  private toggleSidebar() {
    const sidebar = this.app.workspace.getLeavesOfType('word-frequency-sidebar')[0];
    if (sidebar) {
      console.log('should be detaching the sidebar');
      this.app.workspace.detachLeavesOfType('word-frequency-sidebar');
    } else {
      console.log('should be counting word frequency');
      this.countWordFrequency(); // Show word counts if no sidebar
    }
  }
}
