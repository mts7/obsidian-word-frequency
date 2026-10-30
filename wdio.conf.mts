import * as path from 'path';
import { env } from 'process';
import {
    obsidianBetaAvailable,
    parseObsidianVersions,
} from 'wdio-obsidian-service';

const cacheDir = path.resolve('.obsidian-cache');

let defaultVersions = 'earliest/earliest latest/latest';
if (await obsidianBetaAvailable({ cacheDir })) {
    defaultVersions += ' latest-beta/latest';
}
const versions = await parseObsidianVersions(
    env.OBSIDIAN_VERSIONS ?? defaultVersions,
    { cacheDir }
);
if (env.CI) {
    console.log('obsidian-cache-key:', JSON.stringify(versions));
}

export const config: WebdriverIO.Config = {
    runner: 'local',
    framework: 'mocha',
    specs: ['./test/e2e/specs/*.e2e.ts'],
    maxInstances: Number(env.WDIO_MAX_INSTANCES || 2),
    capabilities: [
        ...versions.map(([appVersion, installerVersion]) => ({
            browserName: 'obsidian',
            'wdio:obsidianOptions': {
                appVersion,
                installerVersion,
                plugins: ['./.e2e-plugin'],
                vault: 'test/e2e/vaults/simple',
            },
        })),
        ...versions.map(([appVersion, installerVersion]) => ({
            browserName: 'obsidian',
            'wdio:specs': ['./test/e2e/specs/mobile/*.e2e.ts'],
            'wdio:exclude': ['./test/e2e/specs/*.e2e.ts'],
            'wdio:obsidianOptions': {
                appVersion,
                installerVersion,
                emulateMobile: true,
                plugins: ['./.e2e-plugin'],
                vault: 'test/e2e/vaults/simple',
            },
            'goog:chromeOptions': {
                mobileEmulation: {
                    deviceMetrics: { width: 390, height: 844 },
                },
            },
        })),
    ],
    services: ['obsidian'],
    reporters: ['obsidian'],
    mochaOpts: {
        timeout: 60 * 1000,
    },
    waitforInterval: 250,
    waitforTimeout: 10 * 1000,
    logLevel: 'warn',
    cacheDir,
    injectGlobals: false,
};
