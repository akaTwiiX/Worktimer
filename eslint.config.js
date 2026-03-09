import antfu from '@antfu/eslint-config';

export default antfu({
  rules: {
    'style/semi': ['error', 'always'],
    'no-console': 'off',
    'node/prefer-global/process': 'off',
    'no-new': 'off',
    'curly': 'off',
    'style/eol-last': 'warn',
    'style/brace-style': ['error', '1tbs'],
    'style/function-paren-newline': ['error', 'multiline-arguments'],
    'style/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'comma',
          requireLast: true,
        },
        singleline: {
          delimiter: 'comma',
          requireLast: true,
        },
        overrides: {
          interface: {
            multiline: {
              delimiter: 'semi',
              requireLast: true,
            },
          },
        },
      },
    ],
  },
});
