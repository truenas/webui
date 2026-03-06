/**
 * ESLint rule: no-extra-whitespace-in-line-continuation
 *
 * Prevents accidental extra whitespace in string literals that use line continuation (\).
 * Also prevents multiline template literals inside T() translation markers,
 * because newlines and indentation silently become part of the translated string value.
 *
 * Bad:  'some text \
 *        more text'   → "some text        more text"
 *
 * Good: 'some text\
 *  more text'         → "some text more text"
 *
 * Bad:  T(`line one
 *          line two`) → T("line one\n        line two")
 *
 * Good: T('line one\n'
 *       + 'line two') → T("line one\nline two")
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
      leadingWhitespace:
        'String literal starts with whitespace. Remove the leading space.',
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
        const quote = raw[0];
        const content = raw.slice(1, -1);

        // Check for leading whitespace in translation strings.
        // Only flag strings inside T() calls, as leading whitespace in other contexts
        // (test expectations, variable assignments, object properties) is often intentional.
        // Length threshold avoids false positives on short fragments like ' seconds.'.
        if (/^ /.test(content) && content.length > 20) {
          const parent = node.parent;
          const isTranslationCall = parent?.type === 'CallExpression'
            && parent.callee?.type === 'Identifier'
            && parent.callee.name === 'T';

          if (isTranslationCall) {
            context.report({
              node,
              messageId: 'leadingWhitespace',
              fix(fixer) {
                const fixed = quote + content.replace(/^ +/, '') + quote;
                return fixer.replaceTextRange([node.range[0], node.range[1]], fixed);
              },
            });
            return;
          }
        }

        // Match line continuations with extra whitespace
        const lineContinuationRegex = /( *)\\\r?\n( *)/g;

        let hasViolation = false;
        let match;
        while ((match = lineContinuationRegex.exec(raw)) !== null) {
          const trailingSpaces = match[1].length;
          const leadingSpaces = match[2].length;

          if (trailingSpaces > 0 || leadingSpaces > 1) {
            hasViolation = true;
            break;
          }
        }

        if (hasViolation) {
          context.report({
            node,
            messageId: 'extraWhitespace',
            fix(fixer) {
              const fixed = raw.replace(/( *)\\\r?\n( *)/g, (match, trailing, leading) => {
                return (trailing.length > 0 || leading.length > 1) ? '\\\n ' : match;
              });
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

        // Only flag multiline template literals used in translation markers T()
        // Other multiline template literals (HTML templates, test descriptions, mock data) are intentional.
        const parent = node.parent;
        const isTranslationCall = parent?.type === 'CallExpression'
          && parent.callee?.type === 'Identifier'
          && parent.callee.name === 'T';

        if (!isTranslationCall) {
          return;
        }

        // Convert backtick string to single-quoted string with explicit \n
        context.report({
          node,
          messageId: 'noMultilineTemplateLiteral',
          fix(fixer) {
            // Use the cooked quasi value (interpreted string) and re-escape for single-quoted output.
            const content = node.quasis[0].value.cooked;
            if (content == null) {
              return null;
            }

            const escaped = content
              .replace(/\\/g, '\\\\')
              .replace(/'/g, "\\'")
              .replace(/\0/g, '\\0')
              .replace(/\t/g, '\\t')
              .replace(/\r/g, '\\r')
              .replace(/\x08/g, '\\b')
              .replace(/\f/g, '\\f')
              .replace(/\v/g, '\\v')
              .replace(/ *\n */g, '\\n');

            return fixer.replaceTextRange([node.range[0], node.range[1]], `'${escaped}'`);
          },
        });
      },
    };
  },
};

export default rule;
