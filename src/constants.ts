export interface WordFrequencySettings {
    blacklist: string;
    threshold: number;
}

export const DEFAULT_SETTINGS: WordFrequencySettings = {
    blacklist: 'the,and,to,of,a,in,for,on,is,it,that,with,as,this,by,your,you',
    threshold: 3,
};

export const EVENT_UPDATE = 'word-frequency-update';
export const FREQUENCY_ICON = 'file-chart-column-increasing';
export const PLUGIN_NAME = 'Word Frequency';
export const VIEW_TYPE = 'word-frequency-view';
