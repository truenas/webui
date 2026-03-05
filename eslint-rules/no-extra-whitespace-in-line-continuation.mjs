/**
 * ESLint rule: no-extra-whitespace-in-line-continuation
 *
 * Prevents accidental extra whitespace in string literals that use line continuation (\).
 * When indentation follows a line continuation, those spaces become part of the string,
 * leading to formatting artifacts (e.g., in help text tooltips).
 *
 * Bad:  'some text \
 *        more text'   → "some text        more text"
 *
 * Good: 'some text\
 *  more text'         → "some text more text"
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow extra whitespace around line continuations in string literals',
    },
    fixable: 'code',
    messages: {
      extraWhitespace:
        'Line continuation in string has extra whitespace. '
        + 'Move the space to the start of the next line (at most one space) and remove trailing spaces before the backslash.',
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
    };
  },
};

export default rule;
