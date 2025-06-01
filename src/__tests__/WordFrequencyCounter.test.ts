import {
    Debouncer,
    Editor,
    MarkdownView,
    Workspace,
    WorkspaceLeaf,
} from 'obsidian';
import { EVENT_UPDATE } from '../constants';
import WordFrequencyPlugin from '../main';
import { WordFrequencyCounter } from '../WordFrequencyCounter';

const mockPlugin = {
    registerEvent: jest.fn(),
} as unknown as WordFrequencyPlugin;

const mockDebouncer = jest.fn() as unknown as Debouncer<[editor: Editor], void>;

const counter = new WordFrequencyCounter(mockPlugin, mockDebouncer);

describe('WordFrequencyCounter tests', () => {
    beforeEach(() => {
        counter.lastActiveEditor = undefined;
    });

    describe('calculateWordFrequencies', () => {
        it('should calculate word frequencies', () => {
            const content = 'hello world hello';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([
                ['hello', 2],
                ['world', 1],
            ]);
        });

        it('should calculate word frequencies with punctuation and mixed case', () => {
            const content = 'Hello, world! hello. World?';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([
                ['hello', 2],
                ['world', 2],
            ]);
        });

        it('should calculate word frequencies with numbers and special characters', () => {
            const content = 'word1 word2 123 word1 #$% hello. hello.';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([
                ['word1', 2],
                ['hello', 2],
                ['word2', 1],
                ['123', 1],
            ]);
        });

        it('should calculate word frequencies with periods, colons, and slashes', () => {
            const content = 'test. test:  test/   test.';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([['test', 4]]);
        });

        it('should calculate word frequencies with mixed content', () => {
            const content = '  #$%^&* @(*  @#$  test#@*test  test';

            const result = counter.calculateWordFrequencies(content);

            expect(result).toEqual([
                ['testtest', 1],
                ['test', 1],
            ]);
        });

        it('should return an empty array when given an empty string', () => {
            const result = counter.calculateWordFrequencies('');

            expect(result).toEqual([]);
        });

        it('should calculate word frequencies with Russian and separators', () => {
            const content = 'Привет, мир! Привет. Как дела?';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['привет', 2],
                ['мир', 1],
                ['как', 1],
                ['дела', 1],
            ]);
        });

        it('should calculate word frequencies with Spanish and separators (including accents)', () => {
            const content = 'Hola, mundo! Hola. ¿Qué tal?';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['hola', 2],
                ['mundo', 1],
                ['qué', 1],
                ['tal', 1],
            ]);
        });

        it('should calculate word frequencies with French and separators (including accents and apostrophes)', () => {
            const content = 'Bonjour le monde ! Bonjour. Comment ça va ?';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['bonjour', 2],
                ['le', 1],
                ['monde', 1],
                ['comment', 1],
                ['ça', 1],
                ['va', 1],
            ]);
        });

        it('should handle mixed languages and special characters', () => {
            const content = '你好 world! Привет test? Hola 123.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['你好', 1],
                ['world', 1],
                ['привет', 1],
                ['test', 1],
                ['hola', 1],
                ['123', 1],
            ]);
        });

        it('should handle numbers as words', () => {
            const content = '123 abc 456 def 123';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['123', 2],
                ['abc', 1],
                ['456', 1],
                ['def', 1],
            ]);
        });

        it('should handle leading and trailing special characters and whitespace', () => {
            const content = '  ~!@#$ word1 word2 %^&* ';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['word1', 1],
                ['word2', 1],
            ]);
        });

        it('should handle consecutive special characters as separators', () => {
            const content = 'word1 --- word2 *** word3';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['word1', 1],
                ['word2', 1],
                ['word3', 1],
            ]);
        });

        it('should calculate word frequencies with Korean and punctuation', () => {
            const content =
                '안녕하세요, 세계! 좋은 하루 보내세요. 그리고, 나중에 봐요.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['안녕하세요', 1],
                ['세계', 1],
                ['좋은', 1],
                ['하루', 1],
                ['보내세요', 1],
                ['그리고', 1],
                ['나중에', 1],
                ['봐요', 1],
            ]);
        });

        it('should calculate word frequencies with German and punctuation (including ß)', () => {
            const content =
                'Hallo Welt! Einen schönen Tag wünsche ich. Und, bis später!';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['hallo', 1],
                ['welt', 1],
                ['einen', 1],
                ['schönen', 1],
                ['tag', 1],
                ['wünsche', 1],
                ['ich', 1],
                ['und', 1],
                ['bis', 1],
                ['später', 1],
            ]);
        });

        it('should calculate word frequencies with Swedish and punctuation (including åäö)', () => {
            const content = 'Hej världen! Ha en bra dag. Och, vi ses snart!';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['hej', 1],
                ['världen', 1],
                ['ha', 1],
                ['en', 1],
                ['bra', 1],
                ['dag', 1],
                ['och', 1],
                ['vi', 1],
                ['ses', 1],
                ['snart', 1],
            ]);
        });

        it('should calculate word frequencies with Vietnamese and punctuation (including accented vowels)', () => {
            const content =
                'Chào thế giới! Chúc một ngày tốt lành. Và, hẹn gặp lại sau!';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['chào', 1],
                ['thế', 1],
                ['giới', 1],
                ['chúc', 1],
                ['một', 1],
                ['ngày', 1],
                ['tốt', 1],
                ['lành', 1],
                ['và', 1],
                ['hẹn', 1],
                ['gặp', 1],
                ['lại', 1],
                ['sau', 1],
            ]);
        });

        it('should correctly count Turkish words', () => {
            const content = 'Merhaba dünya! Umarım iyi bir gün geçirirsiniz.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['merhaba', 1],
                ['dünya', 1],
                ['umarım', 1],
                ['iyi', 1],
                ['bir', 1],
                ['gün', 1],
                ['geçirirsiniz', 1],
            ]);
        });

        it('should correctly count Greek words', () => {
            const content = 'Γειά σου κόσμε! Ελπίζω να έχεις μια όμορφη μέρα.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['γειά', 1],
                ['σου', 1],
                ['κόσμε', 1],
                ['ελπίζω', 1],
                ['να', 1],
                ['έχεις', 1],
                ['μια', 1],
                ['όμορφη', 1],
                ['μέρα', 1],
            ]);
        });

        it('should correctly count Finnish words', () => {
            const content = 'Hei maailma! Toivottavasti sinulla on hyvä päivä.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['hei', 1],
                ['maailma', 1],
                ['toivottavasti', 1],
                ['sinulla', 1],
                ['on', 1],
                ['hyvä', 1],
                ['päivä', 1],
            ]);
        });

        it('should correctly count Persian words', () => {
            const content = 'سلام دنیا! امیدوارم روز خوبی داشته باشید.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['سلام', 1],
                ['دنیا', 1],
                ['امیدوارم', 1],
                ['روز', 1],
                ['خوبی', 1],
                ['داشته', 1],
                ['باشید', 1],
            ]);
        });

        it('should correctly count Ukrainian words', () => {
            const content = 'Привіт, світ! Сподіваюся, ти маєш чудовий день.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['привіт', 1],
                ['світ', 1],
                ['сподіваюся', 1],
                ['ти', 1],
                ['маєш', 1],
                ['чудовий', 1],
                ['день', 1],
            ]);
        });

        it('should correctly count Polish words', () => {
            const content =
                'Witaj świecie! Mam nadzieję, że masz piękny dzień.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['witaj', 1],
                ['świecie', 1],
                ['mam', 1],
                ['nadzieję', 1],
                ['że', 1],
                ['masz', 1],
                ['piękny', 1],
                ['dzień', 1],
            ]);
        });

        it('should correctly count Hungarian words', () => {
            const content = 'Helló világ! Remélem, szép napod van.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['helló', 1],
                ['világ', 1],
                ['remélem', 1],
                ['szép', 1],
                ['napod', 1],
                ['van', 1],
            ]);
        });

        it('should correctly count Amharic words', () => {
            const content = 'ሰላም ዓለም! ቀኑ ጥሩ ይሁን።';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['ሰላም', 1],
                ['ዓለም', 1],
                ['ቀኑ', 1],
                ['ጥሩ', 1],
                ['ይሁን', 1],
            ]);
        });

        it('should correctly count duplicate words and separate substrings in English', () => {
            const content = 'useful use usage user used useful useful use';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['useful', 3],
                ['use', 2],
                ['usage', 1],
                ['user', 1],
                ['used', 1],
            ]);
        });

        it('should correctly count duplicate words and separate substrings in Hebrew', () => {
            const content = 'שלום שלום עולם עולם טוב טוב יום יום טוב';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['טוב', 3],
                ['שלום', 2],
                ['עולם', 2],
                ['יום', 2],
            ]);
        });

        it('should correctly count duplicate words and separate substrings in Arabic', () => {
            const content = 'جميل جمال جميل جمال يوم يوم يوم سعيد';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['يوم', 3],
                ['جميل', 2],
                ['جمال', 2],
                ['سعيد', 1],
            ]);
        });

        it('should correctly handle contractions by removing apostrophes in English', () => {
            const content = "It's a great day! That's why it's important.";
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['its', 2],
                ['a', 1],
                ['great', 1],
                ['day', 1],
                ['thats', 1],
                ['why', 1],
                ['important', 1],
            ]);
        });

        it('should correctly remove hyphens from compound words in English', () => {
            const content = 'Well-being and mother-in-law are important.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['wellbeing', 1],
                ['and', 1],
                ['motherinlaw', 1],
                ['are', 1],
                ['important', 1],
            ]);
        });

        it('should correctly count compound words in German', () => {
            const content = 'Autobahn Geschwindigkeitsbegrenzung ist wichtig.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['autobahn', 1],
                ['geschwindigkeitsbegrenzung', 1],
                ['ist', 1],
                ['wichtig', 1],
            ]);
        });

        it('should correctly handle apostrophe removal in French', () => {
            const content =
                "C'est une journée magnifique. L'année commence bien!";
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['cest', 1],
                ['une', 1],
                ['journée', 1],
                ['magnifique', 1],
                ['lannée', 1],
                ['commence', 1],
                ['bien', 1],
            ]);
        });

        it('should count words in Arabic', () => {
            const content = 'أنا أحب اللغة العربية. اللغة العربية جميلة.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['اللغة', 2],
                ['العربية', 2],
                ['أنا', 1],
                ['أحب', 1],
                ['جميلة', 1],
            ]);
        });

        it('should count words in Hebrew', () => {
            const content = 'אני אוהב ללמוד עברית. עברית שפה יפה.';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['עברית', 2],
                ['אני', 1],
                ['אוהב', 1],
                ['ללמוד', 1],
                ['שפה', 1],
                ['יפה', 1],
            ]);
        });

        it('should treat all non-punctuation characters as a single word in Chinese (Mandarin)', () => {
            const content = '你好！世界，你好。你好嗎？123你好';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([['你好世界你好你好嗎123你好', 1]]);
        });

        it('should treat all non-punctuation characters as a single word in Japanese', () => {
            const content =
                'こんにちは、世界！良い一日を。そして、またね123。こんにちは';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['こんにちは世界良い一日をそしてまたね123こんにちは', 1],
            ]);
        });

        it('should split Hindi by spaces', () => {
            const content =
                'नमस्ते दुनिया! आपका दिन शुभ हो। और, जल्द ही मिलते हैं१२३।नमस्ते';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['ह', 2],
                ['नमसत', 1],
                ['दनय', 1],
                ['आपक', 1],
                ['दन', 1],
                ['शभ', 1],
                ['और', 1],
                ['जलद', 1],
                ['मलत', 1],
                ['ह१२३नमसत', 1],
            ]);
        });

        it('should split Thai by spaces', () => {
            const content =
                'สวัสดีชาวโลก! ขอให้มีวันที่ดี แล้วพบกันใหม่นะ๑๒๓สวัสดี';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['สวสดชาวโลก', 1],
                ['ขอใหมวนทด', 1],
                ['แลวพบกนใหมนะ๑๒๓สวสด', 1],
            ]);
        });

        it('should split Tamil by spaces', () => {
            const content =
                'வணக்கம் உலகமே! உங்களுக்கு ஒரு நல்ல நாள் அமையட்டும். பிறகு சந்திப்போம்௧௨௩வணக்கம்';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['வணககம', 1],
                ['உலகம', 1],
                ['உஙகளகக', 1],
                ['ஒர', 1],
                ['நலல', 1],
                ['நள', 1],
                ['அமயடடம', 1],
                ['பறக', 1],
                ['சநதபபம௧௨௩வணககம', 1],
            ]);
        });

        it('should split Burmese by spaces', () => {
            const content =
                'မင်္ဂလာပါကမ္ဘာ! သင်သည်ကောင်းသောနေ့ဖြစ်ပါစေသော။ နောက်မှတွေ့မယ်၁၂၃မင်္ဂလာပါ';
            const result = counter.calculateWordFrequencies(content);
            expect(result).toEqual([
                ['မငဂလပကမဘ', 1],
                ['သငသညကငသနဖစပစသ', 1],
                ['နကမတမယ၁၂၃မငဂလပ', 1],
            ]);
        });
    });

    describe('handleActiveLeafChange', () => {
        it('should not call triggerUpdateContent when leaf is null', () => {
            const counterMock = {
                handleActiveLeafChange: counter.handleActiveLeafChange,
                triggerUpdateContent: jest.fn(),
            };
            const workspace: Workspace = {} as unknown as Workspace;

            counterMock.handleActiveLeafChange(null, workspace);

            expect(mockPlugin.registerEvent).not.toHaveBeenCalled();
            expect(counterMock.triggerUpdateContent).not.toHaveBeenCalled();
        });

        it('should return when leaf view is not an instance of MarkdownView', () => {
            const counterMock = {
                handleActiveLeafChange: counter.handleActiveLeafChange,
                triggerUpdateContent: jest.fn(),
            };
            const workspace: Workspace = {} as unknown as Workspace;
            const leafMock = {
                view: null,
            } as unknown as WorkspaceLeaf;

            counterMock.handleActiveLeafChange(leafMock, workspace);

            expect(mockPlugin.registerEvent).not.toHaveBeenCalled();
            expect(counterMock.triggerUpdateContent).not.toHaveBeenCalled();
        });

        it('should call the debounce method to call triggerUpdateContent', () => {
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest.fn().mockReturnValue(null),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: jest.fn(),
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            counter.handleActiveLeafChange(leafMock, workspace);

            expect(workspace.on).toHaveBeenCalledWith(
                'editor-change',
                expect.any(Function)
            );
            expect(mockPlugin.registerEvent).toHaveBeenCalledWith(mockEvent);
        });

        it('should set lastActiveEditor with a valid MarkdownView', () => {
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: jest.fn(),
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest
                    .fn()
                    .mockReturnValue(markdownViewMock),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            expect(counter.lastActiveEditor).toBe(undefined);

            counter.handleActiveLeafChange(leafMock, workspace);

            expect(counter.lastActiveEditor).not.toBe(undefined);
        });

        it('should not set lastActiveEditor with an invalid MarkdownView', () => {
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: {
                    getValue: jest.fn().mockReturnValue(''),
                },
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest.fn().mockReturnValue(null),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            expect(counter.lastActiveEditor).toBe(undefined);

            counter.handleActiveLeafChange(leafMock, workspace);

            expect(counter.lastActiveEditor).toBe(undefined);
        });

        it('should trigger update content when there are workspace leaves', () => {
            const counterMock = {
                calculateWordFrequencies: counter.calculateWordFrequencies,
                handleActiveLeafChange: counter.handleActiveLeafChange,
                plugin: counter.plugin,
                triggerUpdateContent: jest.fn(),
            };
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: jest.fn(),
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest.fn().mockReturnValue(null),
                getLeavesOfType: jest.fn().mockReturnValue([leafMock]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            counterMock.handleActiveLeafChange(leafMock, workspace);

            expect(counterMock.triggerUpdateContent).toHaveBeenCalled();
        });

        it('should not trigger update content when there are no workspace leaves', () => {
            const counterMock = {
                calculateWordFrequencies: counter.calculateWordFrequencies,
                handleActiveLeafChange: counter.handleActiveLeafChange,
                plugin: counter.plugin,
                triggerUpdateContent: jest.fn(),
            };
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: jest.fn(),
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;
            const mockEvent = jest.fn();
            const workspace: Workspace = {
                getActiveViewOfType: jest.fn().mockReturnValue(null),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                on: jest.fn().mockReturnValue(mockEvent),
            } as unknown as Workspace;
            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            counterMock.handleActiveLeafChange(leafMock, workspace);

            expect(counterMock.triggerUpdateContent).not.toHaveBeenCalled();
        });

        it('should debounce and call triggerUpdateContent after editor-change event', () => {
            const triggerUpdateContentSpy = jest.spyOn(
                counter,
                'triggerUpdateContent'
            );
            const editorMock = {} as Editor;
            const containerElMock = {
                addEventListener: jest.fn(),
            } as unknown as HTMLElement;
            const markdownViewMock = {
                editor: editorMock,
                containerEl: containerElMock,
            } as unknown as MarkdownView;
            const leafMock = {
                view: markdownViewMock,
            } as unknown as WorkspaceLeaf;

            Object.setPrototypeOf(markdownViewMock, MarkdownView.prototype);

            let registeredCallback: ((_: Editor) => void) | undefined;
            const workspace: Workspace = {
                getActiveViewOfType: jest.fn().mockReturnValue(null),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                on: jest.fn().mockImplementation((_event, callback) => {
                    registeredCallback = callback;
                    return 'mock-event';
                }),
            } as unknown as Workspace;

            counter.handleActiveLeafChange(leafMock, workspace);

            if (registeredCallback) {
                registeredCallback(editorMock);
            } else {
                throw new Error('Callback not registered');
            }

            expect(triggerUpdateContentSpy).not.toHaveBeenCalled();
            expect(mockPlugin.registerEvent).toHaveBeenCalledWith('mock-event');
            expect(mockDebouncer).toHaveBeenCalledWith(editorMock);
        });
    });

    describe('triggerUpdateContent', () => {
        it('should not dispatch an event or calculate word frequencies', () => {
            const editor = undefined;
            const counterMock = jest.spyOn(counter, 'calculateWordFrequencies');
            const dispatchEventMock = jest.spyOn(
                window.document,
                'dispatchEvent'
            );

            counter.triggerUpdateContent(editor);

            expect(counter.lastActiveEditor).toBe(undefined);
            expect(counterMock).not.toHaveBeenCalled();
            expect(dispatchEventMock).not.toHaveBeenCalled();

            counterMock.mockRestore();
            dispatchEventMock.mockRestore();
        });

        it('should dispatch an event after calculating word frequencies', () => {
            const counterMock = jest.spyOn(counter, 'calculateWordFrequencies');
            const dispatchEventMock = jest.spyOn(
                window.document,
                'dispatchEvent'
            );
            const expectedValue = 'hello world hello';
            const expectedEvent = new CustomEvent(EVENT_UPDATE, {
                detail: [
                    ['hello', 2],
                    ['world', 1],
                ],
            });
            const editor: Editor = {
                getValue: jest.fn().mockReturnValue(expectedValue),
            } as unknown as Editor;

            counter.triggerUpdateContent(editor);

            expect(counterMock).toHaveBeenCalledWith(expectedValue);
            expect(dispatchEventMock).toHaveBeenCalledWith(expectedEvent);

            counterMock.mockRestore();
            dispatchEventMock.mockRestore();
        });

        it('should call console.error when calculateWordFrequencies throws an error', () => {
            const expectedError = new Error('test error');
            const expectedValue = 'hello world hello';
            const counterMock = {
                calculateWordFrequencies: jest.fn().mockImplementation(() => {
                    throw expectedError;
                }),
                triggerUpdateContent: counter.triggerUpdateContent,
            };
            const editor: Editor = {
                getValue: jest.fn().mockReturnValue(expectedValue),
            } as unknown as Editor;
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            counterMock.triggerUpdateContent(editor);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'error in triggerUpdateContent',
                expectedError
            );

            consoleErrorSpy.mockRestore();
        });

        it('should dispatch an event with last active editor when editor is undefined', () => {
            const counterMock = jest.spyOn(counter, 'calculateWordFrequencies');
            const dispatchEventMock = jest.spyOn(
                window.document,
                'dispatchEvent'
            );
            const expectedValue = 'hello world hello';
            const expectedEvent = new CustomEvent(EVENT_UPDATE, {
                detail: [
                    ['hello', 2],
                    ['world', 1],
                ],
            });
            const editor: Editor = {
                getValue: jest.fn().mockReturnValue(expectedValue),
            } as unknown as Editor;
            const editorSpy = jest.spyOn(editor, 'getValue');

            counter.lastActiveEditor = editor;
            counter.triggerUpdateContent(undefined);

            expect(counterMock).toHaveBeenCalledWith(expectedValue);
            expect(dispatchEventMock).toHaveBeenCalledWith(expectedEvent);
            expect(editorSpy).toHaveBeenCalled();

            counterMock.mockRestore();
            dispatchEventMock.mockRestore();
        });
    });
});
