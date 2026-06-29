module.exports = {
  extends: ['taro/react'],
  rules: {
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      files: ['*.config.js', '*.config.ts', '.eslintrc.js', 'config/**/*.ts'],
      rules: {
        'import/no-commonjs': 'off',
      },
    },
  ],
};
