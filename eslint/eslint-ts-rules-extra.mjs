import airbnbBestPractices from "eslint-config-airbnb-base/rules/best-practices";
import airbnbStyle from "eslint-config-airbnb-base/rules/style";
import airbnbVariables from "eslint-config-airbnb-base/rules/variables";

/**
 * Extra rules enabled by us.
 */
export const extraRules = {
  // RxJS
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

  // Angular
  "@angular-eslint/use-lifecycle-interface": ["error"],
  "@angular-eslint/sort-lifecycle-methods": ["error"],
  "@angular-eslint/use-component-selector": ["error"],
  "@angular-eslint/use-component-view-encapsulation": ["error"],
  "@angular-eslint/component-max-inline-declarations": ["error"],
  "@angular-eslint/contextual-decorator": ["error"],
  "@angular-eslint/contextual-lifecycle": ["error"],
  "@angular-eslint/component-selector": ["error", {
    "type": "element",
    "prefix": "ix",
    "style": "kebab-case"
  }],
  "@angular-eslint/prefer-standalone": "error",
  "@angular-eslint/prefer-on-push-component-change-detection": "error",

  // Angular file naming
  "angular-file-naming/component-filename-suffix": "error",
  "angular-file-naming/directive-filename-suffix": "error",
  "angular-file-naming/module-filename-suffix": "error",
  "angular-file-naming/pipe-filename-suffix": "error",
  "angular-file-naming/service-filename-suffix": ["error", {
    "suffixes": ["service", "effects", "store", "guard", "pipe"]
  }],

  // Stylistic
  "@stylistic/ts/function-call-spacing": ["error", "never"],
  "@stylistic/ts/no-extra-semi": ["error"],
  "@stylistic/js/generator-star-spacing": ["error", {before: false, after: true}],
  "@stylistic/js/no-confusing-arrow": ["error", {
    allowParens: true,
  }],
  "@stylistic/js/computed-property-spacing": ["error", "never"],
  "@stylistic/js/function-call-argument-newline": ["error", "consistent"],
  "@stylistic/ts/func-call-spacing": ["error", "never"],
  "@stylistic/js/function-paren-newline": ["error", "multiline-arguments"],
  "@stylistic/js/implicit-arrow-linebreak": ["error", "beside"],
  "@stylistic/ts/padding-line-between-statements": ["error"],
  "@stylistic/ts/max-len": ["error", 120, 2, {
    ignoreUrls: true,
    ignoreComments: false,
    ignoreRegExpLiterals: true,
    ignoreStrings: true, // TODO: Consider enabling later.
    ignoreTemplateLiterals: true,
  }],
  "@stylistic/js/nonblock-statement-body-position": ["error", "beside", {overrides: {}}],
  "@stylistic/js/one-var-declaration-per-line": ["error", "always"],
  "@stylistic/ts/object-curly-newline": ["error", {
    ObjectExpression: {minProperties: 4, multiline: true, consistent: true},
    ObjectPattern: {minProperties: 4, multiline: true, consistent: true},
    ImportDeclaration: {minProperties: 4, multiline: true, consistent: true},
    ExportDeclaration: {minProperties: 4, multiline: true, consistent: true},
  }],
  "@stylistic/ts/object-property-newline": ["error", {
    allowAllPropertiesOnSameLine: true,
  }],
  "@stylistic/ts/space-before-function-paren": ["error", {
    anonymous: "always",
    named: "never",
    asyncArrow: "always"
  }],
  "@stylistic/js/switch-colon-spacing": ["error", {after: true, before: false}],
  "@stylistic/js/template-tag-spacing": ["error", "never"],

  // Eslint
  "id-denylist": ["error", "res"],
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
  "id-length": ["error", {
    exceptions: ["a", "b", "x", "y", "_", "i", "n", "T"],
    properties: "never",
  }],
  "no-console": ["error", {allow: ["warn", "error", "info"]}],
  "no-empty": ["error", {"allowEmptyCatch": true}],
  "no-object-constructor": ["error"],
  "object-shorthand": ["error"],
  "prefer-object-spread": ["error"],
  "no-array-constructor": ["error"],
  "consistent-return": "error",
  "eqeqeq": ["error", "always", {null: "ignore"}],
  "grouped-accessor-pairs": "error",
  "guard-for-in": "error",
  "max-classes-per-file": ["error", 1],
  "no-alert": "error",
  "no-caller": "error",
  "no-constructor-return": "error",
  "no-div-regex": "error",
  "no-else-return": ["error", {allowElseIf: false}],
  "no-extra-bind": "error",
  "no-labels": "error",
  "no-iterator": "error",
  "no-lone-blocks": "error",
  "no-proto": "error",
  "no-restricted-properties": airbnbBestPractices.rules["no-restricted-properties"],
  "no-return-assign": ["error", "always"],
  "no-script-url": "error",
  "no-sequences": "error",
  "no-useless-concat": "error",
  "no-void": "error",
  "prefer-promise-reject-errors": ["error", {allowEmptyReject: true}],
  "prefer-regex-literals": ["error"],
  "wrap-iife": ["error", "outside", {functionPrototypeMethods: false}],
  "yoda": "error",
  "no-inner-declarations": "error",
  "no-promise-executor-return": "error",
  "no-template-curly-in-string": "error",
  "no-unreachable-loop": "error",
  "no-restricted-exports": ["error", {
    restrictedNamedExports: ["default", "then"],
  }],
  "no-useless-computed-key": "error",
  "no-useless-rename": ["error", {
    ignoreDestructuring: false,
    ignoreImport: false,
    ignoreExport: false,
  }],
  "prefer-arrow-callback": ["error", {
    allowNamedFunctions: false,
    allowUnboundThis: true,
  }],
  "prefer-const": ["error", {
    destructuring: "any",
    ignoreReadBeforeAssign: true,
  }],
  "prefer-numeric-literals": "error",
  "prefer-spread": "error",
  "symbol-description": "error",
  "strict": ["error", "never"],
  "linebreak-style": ["error", "unix"],
  "new-cap": ["error", {
    newIsCap: true,
    newIsCapExceptions: [],
    capIsNew: false,
    capIsNewExceptions: ["Immutable.Map", "Immutable.Set", "Immutable.List"],
  }],
  "no-multi-assign": ["error"],
  "no-restricted-syntax": ["error",{
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
      message: 'For type safety reasons prefer `controls.name` over `get("name")`',
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
      message: "For email validation, it is prefer to use the `emailValidator` validator.",
    },
    {
      message: "Do not import default from lodash-es. Use a namespace import (* as) instead.",
      selector: 'ImportDeclaration[source.value="lodash-es"] ImportDefaultSpecifier',
    },
  ],
  "no-tabs": "error",
  "no-unneeded-ternary": ["error", {defaultAssignment: false}],
  "one-var": ["error", "never"],
  "unicode-bom": ["error", "never"],
  "no-restricted-globals": [
    "error",
    ...airbnbVariables.rules["no-restricted-globals"].slice(1),
    {
      "name": "window",
      "message": "Use the injected window service instead. Search for @Inject(WINDOW)."
    }
  ],
  "func-name-matching": "error",

  // Typescript eslint
  "@typescript-eslint/array-type": "error",
  "@typescript-eslint/explicit-member-accessibility": ["error", {accessibility: "no-public"}],
  "@typescript-eslint/no-inferrable-types": "error",
  "@typescript-eslint/ban-tslint-comment": "error",
  "@typescript-eslint/ban-ts-comment": "error",
  "@typescript-eslint/explicit-function-return-type": ["error", {allowExpressions: true}],
  "@typescript-eslint/consistent-type-assertions": ["error"],
  "@typescript-eslint/no-unnecessary-boolean-literal-compare": ["error"],
  "@typescript-eslint/prefer-includes": ["error"],
  "@typescript-eslint/prefer-for-of": ["error"],
  "@typescript-eslint/prefer-as-const": ["error"],
  "@typescript-eslint/consistent-generic-constructors": ["error"],
  "@typescript-eslint/no-empty-object-type": "error",
  "@typescript-eslint/no-unsafe-function-type": "error",
  "@typescript-eslint/no-wrapper-object-types": "error",
  "@typescript-eslint/no-restricted-types": [
    "error",
    {
      "types": {
        UntypedFormBuilder: "Prefer normal typed FormBuilder.",
        SimpleChanges: "Prefer typed IxSimpleChanges<this>.",
      }
    },
  ],
  "@typescript-eslint/consistent-indexed-object-style": "error",
  "@typescript-eslint/naming-convention": [
    "error",
    {
      selector: ["typeLike"],
      format: ["StrictPascalCase"],
      filter: {
        // Allow two letter combinations at the start, like VDev
        regex: "^[A-Z][A-Z]",
        match: false,
      }
    },
    {
      selector: ["typeLike"],
      format: ["PascalCase"],
    },
    {
      selector: ["enumMember"],
      format: ["StrictPascalCase"],
    },
    {
      selector: "function",
      format: ["strictCamelCase"],
    },
    {
      selector: ["classMethod", "objectLiteralMethod", "typeMethod"],
      format: ["strictCamelCase"],
    },
    {
      selector: ["classProperty"],
      format: ["strictCamelCase", "StrictPascalCase", "UPPER_CASE"],
      leadingUnderscore: "allow", // TODO: Remove later
    },
    {
      selector: ["variable", "parameter"],
      modifiers: ["unused"],
      format: ["strictCamelCase"],
      leadingUnderscore: "allow",
    },
    {
      selector: ["variable", "parameter"],
      format: ["strictCamelCase"]
    },
  ],
  "@typescript-eslint/switch-exhaustiveness-check": "error",
  "@typescript-eslint/only-throw-error": ["error"],
  "@typescript-eslint/no-confusing-void-expression": ["error", {
    ignoreArrowShorthand: true,
  }],
  "@typescript-eslint/no-use-before-define": ["error", "nofunc"],
  "@typescript-eslint/default-param-last": ["error"],
  "@typescript-eslint/no-shadow": ["error"],

  // Eslint-plugin-import
  "import/no-default-export": "error",
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
  "import/first": "error",
  "import/newline-after-import": "error",
  "import/no-absolute-path": "error",
  "import/no-dynamic-require": "error",
  "import/no-named-default": "error",
  "import/no-useless-path-segments": ["error", {commonjs: true}],
  "import/no-import-module-exports": ["error", {
    exceptions: [],
  }],
  "import/no-relative-packages": "error",

  // Unused imports
  "unused-imports/no-unused-imports": "error",
  "unused-imports/no-unused-vars": ["error", {
    vars: "local",
    args: "after-used",
    argsIgnorePattern: "^_$",
    ignoreRestSiblings: true,
  }],

  // SonarJS
  "sonarjs/cognitive-complexity": ["error", 40],

  // Unicorn
  "unicorn/filename-case": ["error", {case: "kebabCase"}],
  "unicorn/prefer-array-find": ["error"],
};
