import { WordFrequencySettings } from './types';

export const DEFAULT_SETTINGS: WordFrequencySettings = {
    blacklist: 'the,and,to,of,a,in,for,on,is,it,that,with,as,this,by,your,you',
    minimumShare: 0,
    pageSize: 15,
    threshold: 3,
};

export const ELEMENT_CLASSES = {
    containerButton: 'word-frequency-button-container',
    containerContent: 'word-frequency-sidebar-content',
    containerCount: 'word-frequency-count-container',
    containerFilter: 'word-frequency-filter-container',
    containerRow: 'word-frequency-row',
    containerThreshold: 'word-frequency-threshold-display',
    containerWordList: 'word-frequency-word-list',
    filter: 'word-frequency-filter',
    settingBlacklist: 'word-frequency-setting-blacklist',
    settingInfoItem: 'word-frequency-setting-item-info',
    settingItem: 'word-frequency-setting-item',
    showMore: 'word-frequency-show-more',
};

export const COMMAND_ID_SHOW_SIDEBAR = 'word-frequency-show-sidebar';
export const EVENT_UPDATE = 'word-frequency-update';
export const FREQUENCY_ICON = 'file-chart-column-increasing';
export const MINIMUM_SHARE_LIMITS = { max: 100, min: 0, step: 10 };
export const PAGE_SIZE_OPTIONS = [15, 50, 100];
export const PLUGIN_NAME = 'Word frequency';
export const SETTINGS_DESCRIPTIONS = {
    blacklist: 'Comma-separated list of words to exclude.',
    minimumShare:
        'Only list words used at least this percentage as often as the most frequent word. 0 lists every word.',
    pageSize: 'Number of words to list before the Show more button.',
    threshold: 'Only show words that appear at least this many times.',
};
export const SETTINGS_NAMES = {
    blacklist: 'Blacklist',
    minimumShare: 'Minimum share of top word',
    pageSize: 'Words at a time',
    threshold: 'Word frequency threshold',
};
export const SHOW_MORE_TEXT = 'Show more';
export const VIEW_TYPE = 'word-frequency-view';
