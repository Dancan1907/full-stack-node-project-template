module.exports = {
  extends: ["@repo/eslint-config"],
  parserOptions: {
    // Tell ESLint to use TypeScript configs from both packages
    project: ["./backend/tsconfig.json", "./frontend/tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  // Ignore config files and build outputs
  ignorePatterns: [
    ".eslintrc.js",
    "*.config.js",
    "*.config.ts",
    "node_modules/",
    "dist/",
    ".next/",
    "pnpm-lock.yaml",
  ],
  // Overrides for specific files if needed
  overrides: [
    {
      files: ["backend/**/*.ts"],
      env: { node: true },
    },
    {
      files: ["frontend/**/*.ts", "frontend/**/*.tsx"],
      env: { browser: true, node: true },
      rules: {
        "react/react-in-jsx-scope": "off",
      },
    },
  ],
};
