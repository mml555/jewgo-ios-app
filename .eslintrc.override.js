module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Relax unused vars rule - only error on unused vars that aren't prefixed with _
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
    // Relax shadow warnings for common patterns
    '@typescript-eslint/no-shadow': [
      'warn',
      {
        ignoreOnInitialization: true,
        allow: ['error', 'data', 'item', 'index'],
      },
    ],
    'no-catch-shadow': 'off', // Deprecated rule for IE 8
    // Relax exhaustive-deps to warnings
    'react-hooks/exhaustive-deps': 'warn',
    // Relax inline styles to warnings
    'react-native/no-inline-styles': 'warn',
    // Relax unstable nested components to warnings
    'react/no-unstable-nested-components': 'warn',
  },
};
