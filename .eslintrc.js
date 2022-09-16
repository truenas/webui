const { rules: airbnbRules } = require('eslint-config-airbnb-typescript/lib/shared');

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
        "createDefaultProgram": true,
        "tsconfigRootDir": __dirname,
        "project": ["./tsconfig.json"],
      },
      "extends": [
        "airbnb-typescript/base",
        "plugin:@angular-eslint/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:rxjs/recommended"
      ],
      "plugins": [
        "rxjs",
        "rxjs-angular",
        "unicorn",
        "angular-file-naming",
        "@shopify"
      ],
      "rules": {
        // TODO: Conflicts with ngx-translate-extract
        "prefer-template": "off",

        // Consciously altered
        "class-methods-use-this": "off",
        "import/prefer-default-export": "off",
        "no-continue": "off",
        "prefer-destructuring": "off",
        "operator-assignment": "off",
        "no-return-assign": "off",
        "no-empty": ["error", { "allowEmptyCatch": true }],
        "arrow-body-style": "off",
        "no-bitwise": "off",
        "max-len": ["error", 120, 2, {
          "ignoreUrls": true,
          "ignoreComments": false,
          "ignoreRegExpLiterals": true,
          "ignoreStrings": true, // TODO: Consider enabling later.
          "ignoreTemplateLiterals": true
        }],
        "radix": "off",
        "no-console": ["error", { allow: ["warn", "error", "info"] }],
        "import/order": ["error", {
          "groups": ["builtin", "external", ["internal", "parent", "sibling", "index"]],
          "pathGroups": [
            {
              "pattern": "app/**",
              "group": "parent",
              "position": "before",
            }
          ],
          "pathGroupsExcludedImportTypes": ["builtin", "internal"],
          "newlines-between": "never",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": false
          }
         }],
        "import/no-duplicates": ["error", {"considerQueryString": true}],
        "import/extensions": ["error", "ignorePackages", {
          "js": "never",
          "jsx": "never",
          "ts": "never",
          "tsx": "never"
        }],
        "@typescript-eslint/no-use-before-define": ["error", "nofunc"],
        "no-prototype-builtins": "off",
        "no-trailing-spaces": ["error"],
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: ['typeLike'],
            format: ['StrictPascalCase'],
            filter: {
              // Allow two letter combinations at the start, like VDev
              regex: '^[A-Z][A-Z]',
              match: false,
            }
          },
          {
            selector: ['typeLike'],
            format: ['PascalCase'],
          },
          {
            selector: ['enumMember'],
            format: ['StrictPascalCase'],
          },
          {
            selector: 'function',
            format: ['strictCamelCase'],
          },
          {
            selector: ['classMethod', 'objectLiteralMethod', 'typeMethod'],
            format: ['strictCamelCase'],
          },
          {
            selector: ['classProperty'],
            format: ['strictCamelCase', 'StrictPascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow', // TODO: Remove later
          },
          {
            selector: ['variable', 'parameter'],
            modifiers: ['unused'],
            format: ['strictCamelCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: ['variable', 'parameter'],
            format: ['strictCamelCase']
          },
        ],
        "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true, allowAny: true }],

        // TODO: Aibnb rules that are disabled for now as they cannot be fixed automatically
        "no-underscore-dangle": "off",
        "consistent-return": "off",
        "no-plusplus": "off",
        "no-restricted-syntax": "off",
        "guard-for-in": "off",
        "no-param-reassign": "off",
        "@typescript-eslint/no-loop-func": "off",
        "no-await-in-loop": "off",
        "@typescript-eslint/no-shadow": "off",
        "no-case-declarations": "off",
        "no-multi-str": "off",
        "no-mixed-operators": ["error", {
          groups: [
            // TODO: Some operators from default config not implemented.
            ["&", "|", "^", "~", "<<", ">>", ">>>"],
            ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
            ["&&", "||"],
            ["in", "instanceof"]
          ],
          allowSamePrecedence: true
        }],
        "default-case": "off",
        "no-async-promise-executor": "off",
        "@typescript-eslint/member-ordering": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/prefer-regexp-exec": "off",

        // Other temporary disables
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/dot-notation": ["off", { allowIndexSignaturePropertyAccess: true }],
        "rxjs/no-implicit-any-catch": ["off"],
        "rxjs/no-nested-subscribe": ["off"],

        // Other overwrites
        "@typescript-eslint/lines-between-class-members": "off",
        "@typescript-eslint/indent": ["error", 2, {
          ...airbnbRules['@typescript-eslint/indent'][2],
          ignoredNodes: [
            ...airbnbRules['@typescript-eslint/indent'][2]['ignoredNodes'],
            "PropertyDefinition[decorators]",
          ]
        }],
        "@typescript-eslint/restrict-plus-operands": ["error", { allowAny: true }],

        // Extra rules
        "@angular-eslint/use-lifecycle-interface": ["error"],
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public" }],
        "@typescript-eslint/no-inferrable-types": "error",
        "@typescript-eslint/ban-tslint-comment": "error",
        "@typescript-eslint/member-delimiter-style": "error",
        "@typescript-eslint/type-annotation-spacing": "error",
        "@typescript-eslint/ban-ts-comment": "error",
        "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
        "@typescript-eslint/consistent-type-assertions": ["error"],
        "@typescript-eslint/no-implicit-any-catch": ["error"],
        "@typescript-eslint/no-unnecessary-boolean-literal-compare": ["error"],
        "@typescript-eslint/prefer-includes": ["error"],
        "@typescript-eslint/prefer-for-of": ["error"],
        "@typescript-eslint/prefer-as-const": ["error"],
        "@angular-eslint/use-component-view-encapsulation": ["error"],
        "@typescript-eslint/no-unused-vars": "off",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": ["error", {
          vars: "local",
          args: "after-used",
          argsIgnorePattern: "^_$",
          ignoreRestSiblings: true,
        }],
        "@typescript-eslint/ban-types": ["error"],
        "unicorn/filename-case": ["error", { case: "kebabCase"}],
        "unicorn/prefer-array-find": ["error"],
        "@angular-eslint/component-selector": ["error", {
          "type": "element",
          "prefix": "ix",
          "style": "kebab-case"
        }],
        "@angular-eslint/component-max-inline-declarations": ["error"],
        "@angular-eslint/contextual-decorator": ["error"],
        "@angular-eslint/contextual-lifecycle": ["error"],
        "no-restricted-imports": ["error", {
          "paths": [{
            "name": "@ngneat/spectator",
            "importNames": ["createComponentFactory", "createHostFactory", "createRoutingFactory", "mockProvider"],
            "message": "Use imports from @ngneat/spectator/jest instead."
          }, {
            "name": "@angular/material/icon",
            "importNames": ["MatIconModule"],
            "message": "Use IxIconModule instead."
          }],
          "patterns": [{
            "group": [ "../**"],
            "message": "Use alias 'app' to replace part '../' of the path."
          }],
        }],
        "@shopify/typescript/prefer-singular-enums": "error",
        "@shopify/prefer-early-return": ["error", { maximumStatements: 3 }],

        // RxJS rules
        "rxjs/no-unsafe-takeuntil": ["error", {
          "alias": ["untilDestroyed"]
        }],
        "rxjs-angular/prefer-takeuntil": ["error", {
          "alias": ["untilDestroyed"],
          "checkComplete": false,
          "checkDecorators": ["Component"], // default
          "checkDestroy": false
        }],
        "rxjs/finnish": ["error", {
          "parameters": true,
          "properties": false, // TODO: Should be true, hard to implement now.
          "variables": true,
          "functions": false,
          "methods": false,
        }],
        "rxjs/prefer-observer": ["error"],
        "id-length": ["error", {
          exceptions: ['a', 'b', 'x', 'y', '_', 'i', 'n'],
          properties: 'never',
        }],

        // File Naming
        "angular-file-naming/component-filename-suffix": "error",
        "angular-file-naming/directive-filename-suffix": "error",
        "angular-file-naming/module-filename-suffix": "error",
        "angular-file-naming/pipe-filename-suffix": "error",
        "angular-file-naming/service-filename-suffix": ["error", {
          "suffixes": ["service", "effects", "store", "guard"]
        }],
      }
    },
    {
      "files": ["*.html"],
      "parser": "@angular-eslint/template-parser",
      "plugins": [
        "@angular-eslint/template",
        "unused-imports",
      ],
      "rules": {}
    }
  ]
}
