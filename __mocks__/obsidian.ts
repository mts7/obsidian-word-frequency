class MockMarkdownView {
    editor = {
        getValue: jest.fn(),
    };
    containerEl = {
        addEventListener: jest.fn(),
    };
    getViewType = jest.fn();
    getViewData = jest.fn();
    onunload = jest.fn();
    getDisplayText = jest.fn();
    constructor() { }
}

module.exports = {
    App: jest.fn(),
    Plugin: jest.fn(),
    MarkdownView: MockMarkdownView,
    WorkspaceLeaf: jest.fn(),
    Editor: jest.fn(),
    PluginSettingTab: jest.fn(),
    Setting: jest.fn(),
    ItemView: jest.fn(),
    CustomEvent: jest.fn(),
};