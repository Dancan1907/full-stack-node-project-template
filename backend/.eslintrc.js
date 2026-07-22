module.exports = {
  extends: ["@repo/eslint-config"],
  // Remove the top-level parserOptions
  env: {
    node: true,
    jest: true,
  },
  overrides: [
    {
      // Only apply TypeScript rules to your source files
      files: ["src/**/*.ts", "prisma/**/*.ts"],
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
      },
    },
  ],
};
