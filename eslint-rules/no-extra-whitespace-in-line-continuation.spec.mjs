if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

import { RuleTester } from 'eslint';
import ruleModule from './no-extra-whitespace-in-line-continuation.mjs';
const rule = ruleModule.default || ruleModule;

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
    // Multiline template literal outside T() is valid (HTML templates, test descriptions, etc.)
    {
      code: '`some text\nmore text`',
    },
    // Multiline template literal in non-T() function call is valid
    {
      code: 'createHost(`<div>\n  <span>test</span>\n</div>`)',
    },
    // Leading whitespace outside T() is valid (test expectations, variable assignments, etc.)
    {
      code: "expect(el.textContent).toContain(' Yes  Help:  Encryption Root means that dataset has its own encryption settings')",
    },
    {
      code: "({ key: ' Yes  Help:  Encryption Root means that dataset has its own encryption settings' })",
    },
    {
      code: "const x = ' When the UPS Mode is set to slave'",
    },
    // Double-quoted strings with valid line continuation
    {
      code: '"some text\\\n more text"',
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
    // Multiline template literal inside T() → converted to single-quoted string with \n
    {
      code: 'T(`some text\nmore text`)',
      output: "T('some text\\nmore text')",
      errors: [{ messageId: 'noMultilineTemplateLiteral' }],
    },
    // Multiline template literal inside T() with indentation → indentation stripped
    {
      code: 'T(`line one\n        line two\n        line three`)',
      output: "T('line one\\nline two\\nline three')",
      errors: [{ messageId: 'noMultilineTemplateLiteral' }],
    },
    // Template literal inside T() with single quotes in content → escaped
    {
      code: "T(`it's a test\nline two`)",
      output: "T('it\\'s a test\\nline two')",
      errors: [{ messageId: 'noMultilineTemplateLiteral' }],
    },
    // Template literal inside T() with escape sequences → preserved (not double-escaped)
    {
      code: 'T(`tab\\there\nnext line`)',
      output: "T('tab\\there\\nnext line')",
      errors: [{ messageId: 'noMultilineTemplateLiteral' }],
    },
    // Multiple line continuations: first valid, second has trailing space before backslash
    {
      code: "'line one\\\n line two \\\n line three'",
      output: "'line one\\\n line two\\\n line three'",
      errors: [{ messageId: 'extraWhitespace' }],
    },
    // Double-quoted string with extra whitespace in line continuation
    {
      code: '"some text \\\n    more text"',
      output: '"some text\\\n more text"',
      errors: [{ messageId: 'extraWhitespace' }],
    },
    // Template literal inside T() with literal backslashes → properly escaped
    {
      code: 'T(`path\\\\to\\\\file\nline2`)',
      output: "T('path\\\\to\\\\file\\nline2')",
      errors: [{ messageId: 'noMultilineTemplateLiteral' }],
    },
    // Leading whitespace in T() translation string
    {
      code: "T(' When the UPS Mode is set to slave')",
      output: "T('When the UPS Mode is set to slave')",
      errors: [{ messageId: 'leadingWhitespace' }],
    },
  ],
});

console.log('All tests passed.');
