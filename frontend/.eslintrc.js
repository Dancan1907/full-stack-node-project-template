module.exports = {
  extends: ["@repo/eslint-config"],
  env: {
    browser: true,
    node: true,
  },
  overrides: [
    {
      files: ["src/**/*.ts", "src/**/*.tsx"],
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        "react/react-in-jsx-scope": "off",
        "@next/next/no-html-link-for-pages": "error",
      },
    },
  ],
};
