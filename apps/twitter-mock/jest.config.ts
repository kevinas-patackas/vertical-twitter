/* eslint-disable */
export default {
  displayName: 'twitter-mock',
  preset: '../../jest.preset.js',
  collectCoverageFrom: ['src/**/*.{js,ts}'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/twitter-mock',
};
