Please review the changes and provide comprehensive feedback.

Focus on:
- Code quality and best practices
- Maintainability, good architecture design and patterns
- Adherence to project conventions
- Potential bugs or issues
- Performance considerations
- Security implications

Do not provide:
- summary of what PR does
- list of steps you took to review
- numeric rating or score

When describing positive aspects of the PR, just mention them briefly in one - three sentences.

Ignore small nit-picky issues like formatting or style unless they significantly impact readability.

Provide constructive feedback with specific suggestions for improvement.
Use inline comments to highlight specific areas of concern.

Some common pitfalls to watch for:
- Fixing issue in a specific place without considering other places or overall architecture.
- Leaving in unused code.
- Forgetting to take into account i18n or accessibility.
- Writing tests that interact with methods that should be private or protected.

Sometimes PRs may contain changes to `src/assets/i18n/**`.
Reordering of strings and addition/removal of keys corresponding to code changes are expected and normal.

Use enthusiastic and positive tone, you can use some emojis.

Keep review brief and focused:
- do not repeat yourself
- keep overall assessment concise (one sentence)
