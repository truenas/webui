/**
 * ESLint rule: no-extra-whitespace-in-line-continuation
 *
 * Prevents accidental extra whitespace in string literals that use line continuation (\).
 * Also prevents multiline template literals (backticks) without expressions,
 * because newlines and indentation silently become part of the string value.
 *
 * Bad:  'some text \
 *        more text'   → "some text        more text"
 *
 * Good: 'some text\
 *  more text'         → "some text more text"
 *
 * Bad:  `line one
 *        line two`    → "line one\n        line two"
 *
 * Good: 'line one\n' +
 *       'line two'    → "line one\nline two"
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow extra whitespace around line continuations in string literals and multiline template literals',
    },
    fixable: 'code',
    messages: {
      extraWhitespace:
        'Line continuation in string has extra whitespace. '
        + 'Move the space to the start of the next line (at most one space) and remove trailing spaces before the backslash.',
      noMultilineTemplateLiteral:
        'Multiline template literal without expressions embeds newlines and indentation into the string value. '
        + 'Use a regular string with explicit \\n instead.',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Literal(node) {
        if (typeof node.value !== 'string') {
          return;
        }

        const raw = sourceCode.getText(node);

        // Match line continuations: optional spaces before \, then newline, then optional spaces
        const lineContinuationRegex = /( +)\\\r?\n( *)/g;
        const excessiveIndentRegex = /\\\r?\n( {2,})/g;

        // Case 1: Trailing space(s) before backslash
        if (lineContinuationRegex.test(raw)) {
          lineContinuationRegex.lastIndex = 0;
          const match = lineContinuationRegex.exec(raw);
          const trailingSpaces = match[1];
          const leadingSpaces = match[2];
          const totalSpaces = trailingSpaces.length + leadingSpaces.length;

          if (totalSpaces > 1) {
            context.report({
              node,
              messageId: 'extraWhitespace',
              fix(fixer) {
                const fixed = raw.replace(/( +)\\\r?\n( *)/g, '\\\n ');
                return fixer.replaceTextRange([node.range[0], node.range[1]], fixed);
              },
            });
            return;
          }
        }

        // Case 2: No trailing space before \, but excessive indent on continuation line
        if (excessiveIndentRegex.test(raw)) {
          context.report({
            node,
            messageId: 'extraWhitespace',
            fix(fixer) {
              const fixed = raw.replace(/\\\r?\n( {2,})/g, '\\\n ');
              return fixer.replaceTextRange([node.range[0], node.range[1]], fixed);
            },
          });
        }
      },

      TemplateLiteral(node) {
        // Only flag template literals that have no expressions (plain strings in backticks)
        if (node.expressions.length > 0) {
          return;
        }

        const raw = sourceCode.getText(node);

        // Only flag if it contains actual newlines
        if (!/\n/.test(raw)) {
          return;
        }

        // Convert backtick string to single-quoted string with explicit \n
        context.report({
          node,
          messageId: 'noMultilineTemplateLiteral',
          fix(fixer) {
            // Get the string content (strip backticks)
            const content = raw.slice(1, -1);

            // Replace actual newlines (and any surrounding indentation) with \n
            // Trim trailing spaces before newline, replace newline + leading spaces with \n
            const fixed = content
              .replace(/ *\r?\n */g, '\\n');

            // Escape single quotes in the content
            const escaped = fixed.replace(/'/g, "\\'");

            return fixer.replaceTextRange([node.range[0], node.range[1]], `'${escaped}'`);
          },
        });
      },
    };
  },
};

export default rule;
