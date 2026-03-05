if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

import { RuleTester } from 'eslint';
import rule from './no-extra-whitespace-in-line-continuation.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2020 },
});

ruleTester.run('no-extra-whitespace-in-line-continuation', rule, {
  valid: [
    // Single space after line continuation is valid
    {
      code: "'some text\\\n more text'",
    },
    // No line continuation at all
    {
      code: "'simple string'",
    },
    // Line continuation with no leading space (zero spaces is fine when total <= 1)
    {
      code: "'text\\\nmore'",
    },
    // Single-line template literal is valid (no newlines)
    {
      code: '`simple template`',
    },
    // Template literal with expressions is valid (even if multiline)
    {
      code: '`hello ${name}\nworld`',
    },
    // Short fragment with leading space is valid (intentional)
    {
      code: "' seconds.'",
    },
  ],
  invalid: [
    // Trailing spaces before backslash
    {
      code: "'some text \\\n more text'",
      output: "'some text\\\n more text'",
      errors: [{ messageId: 'extraWhitespace' }],
    },
    // Excessive indent after line continuation
    {
      code: "'some text\\\n    more text'",
      output: "'some text\\\n more text'",
      errors: [{ messageId: 'extraWhitespace' }],
    },
    // Both trailing spaces and excessive indent
    {
      code: "'some text  \\\n   more text'",
      output: "'some text\\\n more text'",
      errors: [{ messageId: 'extraWhitespace' }],
    },
    // Windows line endings: trailing spaces before backslash
    {
      code: "'some text \\\r\n more text'",
      output: "'some text\\\n more text'",
      errors: [{ messageId: 'extraWhitespace' }],
    },
    // Windows line endings: excessive indent
    {
      code: "'text\\\r\n    more'",
      output: "'text\\\n more'",
      errors: [{ messageId: 'extraWhitespace' }],
    },
    // Multiline template literal → converted to single-quoted string with \n
    {
      code: '`some text\nmore text`',
      output: "'some text\\nmore text'",
      errors: [{ messageId: 'noMultilineTemplateLiteral' }],
    },
    // Multiline template literal with indentation → indentation stripped
    {
      code: '`line one\n        line two\n        line three`',
      output: "'line one\\nline two\\nline three'",
      errors: [{ messageId: 'noMultilineTemplateLiteral' }],
    },
    // Template literal with single quotes in content → escaped
    {
      code: "`it's a test\nline two`",
      output: "'it\\'s a test\\nline two'",
      errors: [{ messageId: 'noMultilineTemplateLiteral' }],
    },
    // Template literal with backslashes in content → escaped
    {
      code: '`path\\to\\file\nline two`',
      output: "'path\\\\to\\\\file\\nline two'",
      errors: [{ messageId: 'noMultilineTemplateLiteral' }],
    },
    // Multiple line continuations: first valid, second has trailing space before backslash
    {
      code: "'line one\\\n line two \\\n line three'",
      output: "'line one\\\n line two\\\n line three'",
      errors: [{ messageId: 'extraWhitespace' }],
    },
    // Leading whitespace in string literal (long string)
    {
      code: "' When the UPS Mode is set to slave'",
      output: "'When the UPS Mode is set to slave'",
      errors: [{ messageId: 'leadingWhitespace' }],
    },
  ],
});

console.log('All tests passed.');
