class FakeComponent {
    registerEvent = jest.fn();
    registerDomEvent = jest.fn(
        (target: EventTarget, type: string, listener: EventListener) =>
            target.addEventListener(type, listener)
    );
}

class FakePlugin extends FakeComponent {
    app: unknown;
    manifest: unknown;
    addCommand = jest.fn();
    addRibbonIcon = jest.fn();
    addSettingTab = jest.fn();
    registerView = jest.fn();
    loadData = jest.fn().mockResolvedValue(null);
    saveData = jest.fn().mockResolvedValue(undefined);

    constructor(app: unknown, manifest: unknown) {
        super();
        this.app = app;
        this.manifest = manifest;
    }
}

class FakeItemView extends FakeComponent {
    leaf: unknown;
    containerEl = document.createElement('div');
    contentEl = document.createElement('div');

    constructor(leaf: unknown) {
        super();
        this.leaf = leaf;
    }
}

function createDebouncer(
    callback: (...args: unknown[]) => unknown,
    timeout = 0,
    resetTimer = false
) {
    let pendingArguments: unknown[] | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const runPending = () => {
        clearTimeout(timer);
        timer = undefined;
        if (pendingArguments === undefined) {
            return undefined;
        }
        const args = pendingArguments;
        pendingArguments = undefined;

        return callback(...args);
    };
    const debouncer = Object.assign(
        (...args: unknown[]) => {
            pendingArguments = args;
            if (timer === undefined || resetTimer) {
                clearTimeout(timer);
                timer = setTimeout(runPending, timeout);
            }

            return debouncer;
        },
        {
            cancel: () => {
                clearTimeout(timer);
                timer = undefined;
                pendingArguments = undefined;

                return debouncer;
            },
            run: runPending,
        }
    );

    return debouncer;
}

module.exports = {
    debounce: jest.fn(createDebouncer),
    setIcon: jest.fn(),
    App: jest.fn(),
    Component: FakeComponent,
    Plugin: FakePlugin,
    MarkdownView: jest.fn(),
    WorkspaceLeaf: jest.fn(),
    Editor: jest.fn(),
    PluginSettingTab: jest.fn(),
    ItemView: FakeItemView,
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
                            handler(
                                (event.target as HTMLTextAreaElement).value
                            );
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
