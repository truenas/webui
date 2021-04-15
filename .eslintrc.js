module.exports = {
  "root": true,
  "ignorePatterns": [
    "debian/**/*",
    "docker/**/*",
    "ports/**/*",
    "scripts/**/*",
    "tests/**/*",
    "node_modules/**/*",
  ],
  "overrides": [
    {
      "files": ["*.ts"],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "createDefaultProgram": true
      },
      "extends": [
        "airbnb-typescript/base",
      ],
      "rules": {
        // TODO: Enable later when type information is available
        "@typescript-eslint/dot-notation": "off",
        "@typescript-eslint/no-implied-eval": "off",
        "@typescript-eslint/no-throw-literal": "off",
        "@typescript-eslint/return-await": "off",

        // TODO: Conflicts with ngx-translate-extract
        "prefer-template": "off",

        // TODO: Aibnb rules that are disabled for now as they cannot be fixed automatically
        "max-len": "off",
        "no-underscore-dangle": "off",
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "class-methods-use-this": "off",
        "no-console": "off",
        "eqeqeq": "off",
        "import/prefer-default-export": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-useless-constructor": "off",
        "block-scoped-var": "off",
        "consistent-return": "off",
        "no-plusplus": "off",
        "no-restricted-syntax": "off",
        "guard-for-in": "off",
        "no-param-reassign": "off",
        "import/no-extraneous-dependencies": "off",
        "no-tabs": "off",
        "no-mixed-spaces-and-tabs": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "no-sequences": "off",
        "prefer-destructuring": "off",
        "radix": "off",
        "no-useless-concat": "off",
        "@typescript-eslint/no-loop-func": "off",
        "no-await-in-loop": "off",
        "no-nested-ternary": "off",
        "implicit-arrow-linebreak": "off",
        "@typescript-eslint/no-shadow": "off",
        "no-return-assign": "off",
        "no-restricted-globals": "off",
        "no-case-declarations": "off",
        "no-multi-str": "off",
        "max-classes-per-file": "off",
        "array-callback-return": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "func-names": "off",
        "import/extensions": "off",
        "no-var": "off",
        "vars-on-top": "off",
        "no-useless-escape": "off",
        "no-cond-assign": "off",
        "no-mixed-operators": "off",
        "default-case": "off",
        "no-new-object": "off",
        "no-prototype-builtins": "off",
        "prefer-promise-reject-errors": "off",
        "import/order": "off",
        "no-empty": "off",
        "operator-assignment": "off",
        "no-continue": "off",
        "import/no-cycle": "off",
        "no-multi-assign": "off",
        "no-self-assign": "off",
        "no-async-promise-executor": "off",
        "no-bitwise": "off",
        "no-alert": "off",
        "import/no-duplicates": "off",
        "no-constant-condition": "off",
        "import/no-mutable-exports": "off",
        "@typescript-eslint/no-redeclare": "off",

        // Other overwrites
        "@typescript-eslint/lines-between-class-members": "off",

        // Extra rules
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public" }],
        "@typescript-eslint/no-inferrable-types": "error",
        "@typescript-eslint/ban-tslint-comment": "error",
        "@typescript-eslint/member-delimiter-style": "error",
        "@typescript-eslint/type-annotation-spacing": "error"
      }
    },
    {
      "files": ["*.html"],
      "parser": "@angular-eslint/template-parser",
      "plugins": ["@angular-eslint/template"],
      "rules": {}
    }
  ]
}
