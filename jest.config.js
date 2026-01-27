/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@wulin-master/core$': '<rootDir>/packages/@wulin-master/core/src',
    '^@wulin-master/slickgrid$': '<rootDir>/packages/@wulin-master/slickgrid/src',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
