const { rules: airbnbSharedRules } = require('eslint-config-airbnb-typescript/lib/shared');
const { rules: airbnbVariableRules } = require('eslint-config-airbnb-base/rules/variables');
const stylistic = require('@stylistic/eslint-plugin');

module.exports = {
  "root": true,
  "ignorePatterns": [
    "debian/**/*",
    "docker/**/*",
    "ports/**/*",
    "scripts/**/*.js",
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
        "project": true,
      },
      "extends": [
        'airbnb-base',
        "airbnb-typescript/base",
        "plugin:@angular-eslint/recommended",
        "plugin:@typescript-eslint/strict-type-checked",
        "plugin:@typescript-eslint/stylistic-type-checked",
        "plugin:rxjs/recommended",
        "plugin:sonarjs/recommended-legacy",
        "plugin:@stylistic/disable-legacy"
      ],
      "plugins": [
        "rxjs",
        "rxjs-angular",
        "unicorn",
        "angular-file-naming",
        "@shopify",
        "unused-imports",
        "sonarjs",
        "import",
        "@stylistic"
      ],
      "rules": {
        // Consciously altered
        "prefer-template": "off",
        "no-underscore-dangle": "off",
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
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/dot-notation": ["error", { allowIndexSignaturePropertyAccess: true }],
        "sonarjs/prefer-single-boolean-return": ["off"],
        "no-plusplus": "off",
        "@typescript-eslint/prefer-nullish-coalescing": ["off"],
        "@typescript-eslint/no-extraneous-class": ["off"],
        "@typescript-eslint/no-confusing-void-expression": ["error", {
          ignoreArrowShorthand: true,
        }],
        "@typescript-eslint/no-throw-literal": ["off"],
        "@typescript-eslint/only-throw-error": ["error"],
        "sonarjs/no-empty-test-file": ["off"],
        "sonarjs/new-cap": ["off"],
        "sonarjs/no-ignored-exceptions": ["off"],
        "sonarjs/array-callback-without-return": "off",
        "sonarjs/os-command": "off",
        "sonarjs/sonar-prefer-optional-chain": "off",
        "@typescript-eslint/member-ordering": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "sonarjs/no-misused-promises": "off",
        "sonarjs/function-return-type": "off",
        "@typescript-eslint/no-unnecessary-type-parameters": "off",
        "no-multi-str": "off",
        "@typescript-eslint/prefer-reduce-type-parameter": ["off"],

        // TODO: Airbnb rules that are disabled for now as they cannot be fixed automatically
        "no-restricted-syntax": ["error",
          // TODO: Partially implemented. ForOfStatement is allowed for now.
          {
            selector: "ForInStatement",
            message: "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array."
          },
          {
            selector: "LabeledStatement",
            message: "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand."
          },
          {
            selector: "WithStatement",
            message: "`with` is disallowed in strict mode because it makes code impossible to predict and optimize."
          },
          {
            selector: 'MemberExpression[property.name="get"][object.name="form"], MemberExpression[property.name="get"] > MemberExpression[property.name="form"]',
            message: "For type safety reasons prefer `controls.name` over `get('name')`",
          },
          {
            selector: 'Identifier[name="mdDialog"]:has(Identifier[name="MatDialog"])',
            message: "For consistency reasons prefer `matDialog` over `mdDialog`",
          },
          {
            selector: 'Identifier[name="dialog"]:has(Identifier[name="MatDialog"])',
            message: "For consistency reasons prefer `dialog` for `DialogService`",
          },
          {
            selector: 'MemberExpression[property.name="email"][object.name="Validators"]',
            message: 'For email validation, it is prefer to use the `emailValidator` validator.',
          },
          {
            message: "Do not import default from lodash-es. Use a namespace import (* as) instead.",
            selector: 'ImportDeclaration[source.value="lodash-es"] ImportDefaultSpecifier',
          },
        ],
        "no-param-reassign": "off",
        "no-await-in-loop": "off",

        // Other temporary disables
        "sonarjs/prefer-nullish-coalescing": ["off"],
        "sonarjs/deprecation": ["off"],
        "@typescript-eslint/no-deprecated": ["off"],
        "rxjs/no-implicit-any-catch": ["off"],
        "rxjs/no-nested-subscribe": ["off"],
        "@typescript-eslint/no-base-to-string": ["off"],
        "@typescript-eslint/class-literal-property-style": ["off"],
        "@typescript-eslint/no-unnecessary-condition": ["off"],
        "@typescript-eslint/no-invalid-void-type": ["off"],
        "@typescript-eslint/no-dynamic-delete": ["off"],
        "sonarjs/no-selector-parameter": ["off"],
        "sonarjs/concise-regex": ["off"],
        "sonarjs/regex-complexity": ["off"],
        "sonarjs/no-nested-functions": ["off"],
        "sonarjs/sonar-prefer-regexp-exec": ["off"],
        "@typescript-eslint/prefer-regexp-exec": ["off"],
        "sonarjs/empty-string-repetition": ["off"],
        "sonarjs/anchor-precedence": ["off"],
        "sonarjs/single-char-in-character-classes": ["off"],
        "sonarjs/duplicates-in-character-class": ["off"],
        "sonarjs/slow-regex": ["off"],
        "sonarjs/no-base-to-string": ["off"],
        "sonarjs/link-with-target-blank": ["off"],
        "sonarjs/reduce-initial-value": "off",

        // Other overwrites
        ...(stylistic.configs.customize({
          semi: true,
          jsx: false,
          braceStyle: '1tbs',
          arrowParens: 'always',
          quoteProps: 'as-needed'
        })).rules,
        "@stylistic/quotes": ["error", "single", { avoidEscape: true }],
        "@typescript-eslint/lines-between-class-members": "off",
        "@typescript-eslint/restrict-plus-operands": ["error", { allowAny: true }],
        "no-restricted-globals": [
          "error",
          ...airbnbVariableRules['no-restricted-globals'].slice(1),
          {
            "name": "window",
            "message": "Use the injected window service instead. Search for @Inject(WINDOW)."
          }
        ],
        "sonarjs/no-duplicate-string": ["off"],
        "sonarjs/no-clear-text-protocols": ["off"],
        "sonarjs/todo-tag": ["off"],
        "sonarjs/no-hardcoded-ip": ["off"],
        "sonarjs/no-hardcoded-credentials": ["off"],
        "sonarjs/pseudo-random": ["off"],
        "sonarjs/cognitive-complexity": ["error", 40],

        // Extra rules
        "@angular-eslint/use-lifecycle-interface": ["error"],
        "@angular-eslint/sort-lifecycle-methods": ["error"],
        "@angular-eslint/use-component-selector": ["error"],
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public" }],
        "@typescript-eslint/no-inferrable-types": "error",
        "@typescript-eslint/ban-tslint-comment": "error",
        "@typescript-eslint/ban-ts-comment": "error",
        "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
        "@typescript-eslint/consistent-type-assertions": ["error"],
        "@typescript-eslint/no-unnecessary-boolean-literal-compare": ["error"],
        "@typescript-eslint/prefer-includes": ["error"],
        "@typescript-eslint/prefer-for-of": ["error"],
        "@typescript-eslint/prefer-as-const": ["error"],
        "@typescript-eslint/consistent-generic-constructors": ["error"],
        "@angular-eslint/use-component-view-encapsulation": ["error"],
        "@typescript-eslint/no-unused-vars": "off",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": ["error", {
          vars: "local",
          args: "after-used",
          argsIgnorePattern: "^_$",
          ignoreRestSiblings: true,
        }],
        "id-denylist": ["error", "res"],
        "@typescript-eslint/no-empty-object-type": "error",
        "@typescript-eslint/no-unsafe-function-type": "error",
        "@typescript-eslint/no-wrapper-object-types": "error",
        "@typescript-eslint/no-restricted-types": [
          "error",
          {
            "types": {
              UntypedFormBuilder: 'Prefer normal typed FormBuilder.',
              SimpleChanges: 'Prefer typed IxSimpleChanges<this>.',
            }
          },
        ],
        "unicorn/filename-case": ["error", { case: "kebabCase" }],
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
          "paths": [
            {
              "name": "@ngneat/spectator",
              "importNames": ["createComponentFactory", "createHostFactory", "createRoutingFactory", "mockProvider"],
              "message": "Use imports from @ngneat/spectator/jest instead."
            },
            {
              "name": "@angular/material/icon",
              "importNames": ["MatIconModule"],
              "message": "Use IxIconComponent instead."
            },
            {
              "name": "@angular/core",
              "importNames": ["Output"],
              "message": "Use signal output() instead."
            },
            {
              "name": "@angular/common",
              "importNames": ["NgIf"],
              "message": "Use built-in control flow syntax instead"
            },
            {
              "name": "@angular/common",
              "importNames": ["CommonModule"],
              "message": "Import individual constituents instead."
            },
            {
              "name": "lodash-es",
              "importNames": ["chain"],
              "message": "Use standalone methods to get results instead of using 'chain' for chaining."
            },
            {
              "name": "lodash",
              "importNames": ["chain"],
              "message": "Use standalone methods to get results instead of using 'chain' for chaining."
            }
          ],
          "patterns": [{
            "group": ["../**"],
            "message": "Use alias 'app' to replace part '../' of the path."
          }],
        }],
        "@shopify/typescript-prefer-singular-enums": "error",
        "@shopify/typescript-prefer-pascal-case-enums": "error",
        "@shopify/prefer-early-return": ["error", {maximumStatements: 3}],
        "import/no-default-export": "error",
        "@typescript-eslint/consistent-indexed-object-style": "error",
        "@angular-eslint/prefer-on-push-component-change-detection": "error",
        "default-case": "off",
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "@angular-eslint/prefer-standalone": "error",

        // RxJS rules
        "rxjs/no-unsafe-takeuntil": ["error", {
          "alias": ["untilDestroyed"]
        }],
        "rxjs-angular/prefer-takeuntil": ["error", {
          "alias": ["untilDestroyed"],
          "checkComplete": false,
          "checkDecorators": ["Component"],
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
          "suffixes": ["service", "effects", "store", "guard", "pipe"]
        }],
      }
    },
    {
      "files": ["**/*.spec.ts"],
      "plugins": ["jest"],
      "extends": ["plugin:jest/recommended", "plugin:jest/style"],
      "rules": {
        "jest/no-large-snapshots": ["error"],
        "jest/prefer-equality-matcher": ["error"],
        "jest/prefer-lowercase-title": ["error", { "ignore": ["describe"] }],
        "@typescript-eslint/consistent-indexed-object-style": "error",
        "jest/expect-expect": [
          "error",
          {
            "assertFunctionNames": ["expect", "expectObservable"],
          }
        ]
      }
    },
    {
      "files": ["*.html"],
      "extends": ["plugin:@angular-eslint/template/recommended"],
      "plugins": ["angular-test-ids"],
      "rules": {
        "@angular-eslint/template/attributes-order": ["error"],
        "@angular-eslint/template/no-duplicate-attributes": ['error'],
        "@angular-eslint/template/no-interpolation-in-attributes": ['error'],
        "angular-test-ids/require-test-id": ["error", {
          "attribute": "ixTest",
          "addElements": ["a", "mat-row", "mat-slider", "table"]
        }],
        "@angular-eslint/template/prefer-control-flow": ['error'],
        "@angular-eslint/template/no-positive-tabindex": ["error"],

        // TODO: To be enabled later
        '@angular-eslint/template/no-negated-async': ['off'],
      }
    }
  ]
}
