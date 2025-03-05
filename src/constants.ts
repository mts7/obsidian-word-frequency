export interface WordFrequencySettings {
    blacklist: string;
}

export const DEFAULT_SETTINGS: WordFrequencySettings = {
    blacklist: 'the,and,to,of,a,in,for,on,is,it,that,with,as,this,by,your,you',
};

export const PLUGIN_NAME = 'Word Frequency';
export const VIEW_TYPE = 'word-frequency-view';
export const EVENT_UPDATE = 'word-frequency-update';
