module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.stryker-tmp/'],
    testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['cobertura', 'html', 'text', 'text-summary'],
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 80,
            lines: 90,
            statements: 90,
        },
    },
};
