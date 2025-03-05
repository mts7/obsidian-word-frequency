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
    ItemView: jest.fn(),
    CustomEvent: jest.fn(),
    Setting: jest.fn().mockImplementation((containerEl: HTMLElement) => {
        const settingEl = document.createElement('div');
        const textArea = document.createElement('textarea');
        textArea.classList.add('word-frequency-setting-blacklist');
        settingEl.appendChild(textArea);
        containerEl.appendChild(settingEl);

        return {
            setName: jest.fn().mockReturnThis(),
            setDesc: jest.fn().mockReturnThis(),
            addTextArea: jest.fn().mockImplementation((callback) => {
                callback({
                    setValue: function (value: string) {
                        textArea.value = value;
                        return this;
                    },
                    onChange: function (handler: (value: string) => void) {
                        textArea.addEventListener('change', (event) => {
                            handler((event.target as HTMLTextAreaElement).value);
                        });
                        return this;
                    },
                    inputEl: textArea,
                });
                return {
                    inputEl: textArea,
                };
            }),
        };
    }),
};