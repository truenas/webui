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
  ],
});

console.log('All tests passed (3 valid, 5 invalid).');
