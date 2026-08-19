/**
 * Maximum length of the concise summary line shown before "Show More"/"View More".
 * The rest of the message stays available behind the toggle.
 */
export const maxAlertSummaryLength = 120;

/**
 * Cutting the message at its first sentence is only worth it when that sentence
 * actually carries the point. Shorter leading sentences are merged with the next one.
 */
const minAlertSummaryLength = 40;

/**
 * A sentence terminator that is not part of a version number ("25.04.") or an
 * initialism ("U.S."), so those don't cut the summary short.
 */
const sentenceEnd = /(?<![A-Z0-9])[.!?](?=\s|$)/g;

const htmlTag = /<[^>]*>/g;
const whitespace = /\s+/g;

/**
 * Alert messages are rendered with innerHTML and occasionally carry markup.
 * Summaries are truncated, so the tags are dropped rather than risking a cut tag.
 * Entities are left alone - the summary is bound with innerHTML too.
 */
export function stripAlertMarkup(message: string): string {
  return (message || '').replace(htmlTag, ' ').replace(whitespace, ' ').trim();
}

function truncateAtWordBoundary(text: string, maxLength: number): string {
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, '');
}

/**
 * Reduces an alert message to a single concise line: its first sentence, or a
 * word-boundary truncation when even that is too long.
 */
export function getAlertSummary(message: string): string {
  const text = stripAlertMarkup(message);
  if (!text) {
    return '';
  }

  let summary = text;
  sentenceEnd.lastIndex = 0;
  let match = sentenceEnd.exec(text);
  while (match) {
    const sentenceLength = match.index + 1;
    if (sentenceLength >= minAlertSummaryLength) {
      summary = text.slice(0, sentenceLength);
      break;
    }
    match = sentenceEnd.exec(text);
  }

  if (summary.length <= maxAlertSummaryLength) {
    return summary;
  }

  return `${truncateAtWordBoundary(summary, maxAlertSummaryLength)}…`;
}

/**
 * True when the summary leaves something out, i.e. the full message is worth expanding.
 */
export function hasAlertDetails(message: string): boolean {
  return getAlertSummary(message) !== stripAlertMarkup(message);
}
