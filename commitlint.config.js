export default {
  plugins: ['commitlint-plugin-jira-rules'],
  extends: ['jira'],
  rules: {
    'jira-commit-message-separator': [2, 'always', ': '],
    'jira-task-id-project-key': [2, 'always', 'NAS'],
    'jira-task-id-max-length': [2, 'always', 10]
  },
};
