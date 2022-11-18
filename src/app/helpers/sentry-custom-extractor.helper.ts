export const sentryCustomExtractor = (
  errorCandidate: unknown,
  defaultExtractor: (error: unknown) => unknown,
): unknown => {
  const defaultExtractorResults = defaultExtractor(errorCandidate);

  if (defaultExtractorResults) {
    return defaultExtractorResults;
  }

  const error = errorCandidate as Error;

  if (error.message) {
    return error.message;
  }

  if (error.name) {
    return error.name;
  }

  // Nothing was extracted, fallback to default error message.
  return 'iXsystems [sentry] default handled error';
};
