import { TextComponent } from 'obsidian';

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
    setIcon: jest.fn(),
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
        const blacklistTextArea = document.createElement('textarea');
        const thresholdInput = document.createElement('input');
        containerEl.appendChild(settingEl);

        return {
            setName: jest.fn().mockReturnThis(),
            setDesc: jest.fn().mockReturnThis(),
            addText: jest.fn().mockImplementation((callback: any) => {
                console.log('implementing addText', this);
                callback({
                    setPlaceholder: jest.fn(),
                    setValue: function (value: string) {
                        console.log('setting value to input', value);
                        settingEl.appendChild(thresholdInput);
                        thresholdInput.value = value;
                        return this;
                    },
                    onChange: jest.fn(),
                });
            }),
            addTextArea: jest.fn().mockImplementation((callback: any) => {
                callback({
                    setValue: function (value: string) {
                        blacklistTextArea.classList.add('word-frequency-setting-blacklist');
                        settingEl.appendChild(blacklistTextArea);
                        blacklistTextArea.value = value;
                        return this;
                    },
                    onChange: function (handler: (value: string) => void) {
                        blacklistTextArea.addEventListener('change', (event) => {
                            handler((event.target as HTMLTextAreaElement).value);
                        });
                        return this;
                    },
                    inputEl: blacklistTextArea,
                });
            }),
        };
    }),
};