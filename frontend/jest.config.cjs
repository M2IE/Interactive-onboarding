module.exports = {
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
    '^@interactive-onboarding/shared$':
      '<rootDir>/packages/shared/src/index.ts',
    '^@interactive-onboarding/shared/(.*)$':
      '<rootDir>/packages/shared/src/$1',
    '^@interactive-onboarding/ui$': '<rootDir>/packages/ui/src/index.tsx',
    '^@interactive-onboarding/ui/(.*)$': '<rootDir>/packages/ui/src/$1',
    '^@interactive-onboarding/onboarding-sdk$':
      '<rootDir>/packages/onboarding-sdk/src/index.tsx',
    '^@interactive-onboarding/onboarding-sdk/(.*)$':
      '<rootDir>/packages/onboarding-sdk/src/$1',
  },
  roots: ['<rootDir>/apps', '<rootDir>/packages'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
}
