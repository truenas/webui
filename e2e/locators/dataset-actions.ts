/**
 * The Dataset Details card's header menu, for whichever dataset the tree has selected.
 *
 * The menu holds one item, Promote, and is offered only on a clone that is not a pool's root
 * dataset, to a user with `DATASET_WRITE` (`actionsMenu` in `dataset-details-card.component.ts`).
 * `tn-card` renders its trigger only while the menu has items, so on any other dataset the trigger
 * is absent rather than empty.
 */
export const datasetActionsLocators = {
  /** `[headerMenuTriggerTestId]="'dataset-actions'"`, a `tn-icon-button`, so prefixed `button-`. */
  menu: '[data-test="button-dataset-actions"]',
  /** "Promote", `testId: 'promote-dataset'`. Menu items emit `button-<testId>`. */
  promote: '[data-test="button-promote-dataset"]',
} as const;
