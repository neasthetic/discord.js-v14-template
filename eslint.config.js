import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
    { ignores: ["build/**", "node_modules/**"] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-empty-object-type": "off"
        }
    }
)
