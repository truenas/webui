// Element-poll budget shared by NavigateAndHighlightService and
// UiSearchDirectivesService. ~5s is enough for a freshly-routed page to
// hydrate and reveal the target without leaving the user waiting.
export const elementPollIntervalMs = 100;
export const elementMaxPollAttempts = 50;
