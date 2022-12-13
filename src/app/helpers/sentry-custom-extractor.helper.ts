import ErrorStackParser from 'error-stack-parser';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';

const extractApiError = (err: WebsocketError | Job): string | void => {
  if ('trace' in err && err.trace?.formatted) {
    return `${err.trace.class} / ${err.reason}`;
  }

  if ('state' in err && err.error && err.exception) {
    return `${err.state} / ${err.error}`;
  }
};

export const sentryCustomExtractor = (
  errorCandidate: WebsocketError | Job | Error | any,
  defaultExtractor: (error: unknown) => unknown,
): unknown => {
  const defaultExtractorResults = defaultExtractor(errorCandidate);

  if (defaultExtractorResults) {
    return defaultExtractorResults;
  }

  const errorReportValue = extractApiError(errorCandidate as WebsocketError | Job);

  if (errorReportValue) {
    return errorReportValue;
  }

  try {
    const parsedErrorValue = ErrorStackParser.parse(errorCandidate);

    if (parsedErrorValue) {
      return parsedErrorValue;
    }
  } catch {}

  // Nothing was extracted, fallback to default error message.
  return 'iXsystems [sentry] default handled error';
};
