import { App } from 'obsidian';
import WordFrequencyPlugin from '../main';
import { WordFrequencySettingTab } from '../WordFrequencySettingTab';

const createMockContainerEl = () => {
    const mockContainerEl = document.createElement('div');
    mockContainerEl.empty = function() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
    };
    return mockContainerEl;
};

describe('WordFrequencySettingTab', () => {
    let app: App;
    let plugin: WordFrequencyPlugin;
    let settingTab: WordFrequencySettingTab;
    let containerEl: HTMLElement;

    beforeEach(() => {
        app = {} as App;
        plugin = {
            settings: {
                blacklist: 'example, words, to, exclude',
            },
            saveSettings: jest.fn(),
        } as unknown as WordFrequencyPlugin;

        containerEl = createMockContainerEl();
        settingTab = new WordFrequencySettingTab(app, plugin);
        settingTab.containerEl = containerEl;
    });

    test('constructor initializes correctly', () => {
        expect(settingTab.plugin).toBe(plugin);
    });

    test('display method creates the text area correctly', () => {
        settingTab.display();

        const textArea = containerEl.querySelector('textarea.word-frequency-setting-blacklist') as HTMLTextAreaElement;
        expect(textArea).toBeTruthy();
        expect(textArea.value).toBe(plugin.settings.blacklist);
    });

    test('onChange event updates plugin settings and calls saveSettings', async () => {
        settingTab.display();

        const textArea = containerEl.querySelector('textarea.word-frequency-setting-blacklist') as HTMLTextAreaElement;
        const newValue = 'new, blacklist, words';

        textArea.value = newValue;
        textArea.dispatchEvent(new Event('change'));

        await new Promise(process.nextTick);

        expect(plugin.settings.blacklist).toBe(newValue);
        expect(plugin.saveSettings).toHaveBeenCalled();
    });
});
