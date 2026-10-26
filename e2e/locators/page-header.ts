/**
 * The page header every routed page renders above its content (`page-header.component.html`).
 */
export const pageHeaderLocators = {
  /**
   * `<h1 tnTestId="page-title" tnTestIdType="text">`: the title the page was given, or failing
   * that its route's `data.title`. A category page's is the category, titlecased.
   */
  title: '[data-test="text-page-title"]',
} as const;
