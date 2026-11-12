/**
 * Whether `dataset` falls in the scope a list was opened for: the scoped dataset itself, or, with
 * `includeChildren`, any dataset below it. Path-aware, so `tank/ab` is not inside `tank/a`.
 */
export function isInDatasetScope(dataset: string | undefined, scope: string, includeChildren: boolean): boolean {
  if (!dataset) {
    return false;
  }
  return dataset === scope || (includeChildren && dataset.startsWith(`${scope}/`));
}
