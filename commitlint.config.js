/**
 * Custom commitlint configuration for JIRA-style commit messages.
 * Enforces format: NAS-12345: commit message
 *
 * Replaces deprecated commitlint-config-jira and commitlint-plugin-jira-rules packages
 * with custom rules using commitlint's built-in functionality.
 */

// Custom parser to extract JIRA ticket from commit message
const parserPreset = {
  parserOpts: {
    headerPattern: /^(NAS-\d+):\s(.+)$/,
    headerCorrespondence: ['type', 'subject'],
  },
};

export default {
  parserPreset,
  rules: {
    // Enforce that the commit message matches the pattern: NAS-<number>: <message>
    'header-match-team-pattern': [
      2,
      'always',
      'Commit message must match format: NAS-<issue-number>: <description>\nExample: NAS-12345: Add new feature'
    ],

    // Ensure the header is not too long
    'header-max-length': [2, 'always', 120],

    // Ensure there is a subject (message after the colon)
    'subject-empty': [2, 'never'],

    // Ensure subject doesn't end with a period
    'subject-full-stop': [2, 'never', '.'],

    // Type (which contains the JIRA ticket) should not be empty
    'type-empty': [2, 'never'],

    // Type should match NAS-<digits> pattern (1-6 digits for task ID under 10 chars total)
    'type-enum': [0], // Disable enum check
    'type-case': [0], // Disable case check
  },
  plugins: [
    {
      rules: {
        'header-match-team-pattern': (parsed) => {
          const { header } = parsed;
          const pattern = /^NAS-\d{1,6}:\s.+$/;

          if (!pattern.test(header)) {
            return [
              false,
              'Commit message must match format: NAS-<issue-number>: <description>\n' +
              'Example: NAS-12345: Add new feature\n' +
              'Your message: ' + header
            ];
          }

          return [true];
        },
      },
    },
  ],
};
