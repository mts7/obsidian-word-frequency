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
                threshold: 3,
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

    describe.skip('blacklist', () => {
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

    describe.skip('threshold', () => {
        beforeEach(() => {
            containerEl = document.createElement('div');
        });

        it('should display the threshold setting input field with the correct initial value', () => {
            settingTab.display();
            const thresholdInput = containerEl.querySelector('input');
            if (thresholdInput === null) {
                throw new Error('Input element for threshold is not found.');
            }

            expect(thresholdInput).toBeTruthy();
            expect(thresholdInput.value).toBe('3');
        });

        it('should update the threshold setting when the input value is changed', async () => {
            settingTab.display();
            const thresholdInput = containerEl.querySelector('input') as HTMLInputElement;
            if (thresholdInput === null) {
                throw new Error('Input element for threshold is not found.');
            }

            thresholdInput.value = '5';
            thresholdInput.dispatchEvent(new Event('input'));

            await settingTab.plugin.saveSettings();

            expect(plugin.settings.threshold).toBe(5);
        });

        it('should not update the threshold setting if the input value is invalid', async () => {
            settingTab.display();
            const thresholdInput = containerEl.querySelector('input') as HTMLInputElement;
            if (thresholdInput === null) {
                throw new Error('Input element for threshold is not found.');
            }

            thresholdInput.value = 'invalid';
            thresholdInput.dispatchEvent(new Event('input'));

            await settingTab.plugin.saveSettings();

            expect(plugin.settings.threshold).toBe(3);
        });

        it('should call updateContent on views when threshold is changed', async () => {
            settingTab.display();
            const updateContentMock = jest.fn();
            const fakeView = {
                updateContent: updateContentMock,
            };
            plugin.app.workspace = {
                getLeavesOfType: jest.fn().mockReturnValue([{ view: fakeView }]),
            } as any;

            const thresholdInput = containerEl.querySelector('input') as HTMLInputElement;
            if (thresholdInput === null) {
                throw new Error('Input element for threshold is not found.');
            }

            thresholdInput.value = '5';
            thresholdInput.dispatchEvent(new Event('input'));

            await settingTab.plugin.saveSettings();

            expect(updateContentMock).toHaveBeenCalled();
        });
    });
});
