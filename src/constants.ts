export interface WordFrequencySettings {
    blacklist: string;
    threshold: number;
}

export const DEFAULT_SETTINGS: WordFrequencySettings = {
    blacklist: 'the,and,to,of,a,in,for,on,is,it,that,with,as,this,by,your,you',
    threshold: 3,
};

export const ELEMENT_CLASSES = {
    containerButton: 'word-frequency-button-container',
    containerContent: 'word-frequency-sidebar-content',
    containerCount: 'word-frequency-count-container',
    containerRow: 'word-frequency-row',
    containerThreshold: 'word-frequency-threshold-display',
    containerWordList: 'word-frequency-word-list',
    filter: 'word-frequency-filter',
};

export const EVENT_UPDATE = 'word-frequency-update';
export const FREQUENCY_ICON = 'file-chart-column-increasing';
export const PLUGIN_NAME = 'Word frequency';
export const VIEW_TYPE = 'word-frequency-view';
