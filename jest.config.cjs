module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/__mocks__/obsidianDom.ts'],
    modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.stryker-tmp/'],
    testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['cobertura', 'html', 'text', 'text-summary'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/__tests__/**',
    ],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 80,
            lines: 90,
            statements: 90,
        },
    },
};
