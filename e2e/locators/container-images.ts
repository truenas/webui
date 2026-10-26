/**
 * Apps > Configuration > Manage Container Images (`/apps/manage-container-images`): the image list,
 * its Pull Image side panel and the delete dialog.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/**
 * `docker-image-<id>`, as `toUniqueRowTag` writes it. Exported for the controls `tn-table` draws on
 * the row (`locators/table.ts`).
 */
export function containerImageRowTag(id: string): string {
  return legacyKebabTestSegment(`docker-image-${id}`);
}

export const containerImagesLocators = {
  /** `<tn-menu-item testId="container-images">` in the installed apps page's Configuration menu. */
  menuItem: '[data-test="button-container-images"]',

  pullImage: '[data-test="button-pull-image"]',

  /**
   * The Batch Operations toolbar's Delete, drawn only while at least one row is ticked. It emits the
   * same `button-delete` as the delete dialog's own Delete and stays in the page behind the dialog,
   * so this bare id is only for before the dialog opens.
   */
  batchDelete: '[data-test="button-delete"]',

  /**
   * One image, by its id (`sha256:…`). The row tag is `toUniqueRowTag('docker-image-<id>')`, which
   * kebabs through lodash, while the Delete button is `[id, 'delete']` through the library's
   * normalizer, so the two spell the id differently.
   */
  image: (id: string): { tags: string; delete: string } => {
    const rowTag = containerImageRowTag(id);
    return {
      tags: `[data-test="text-tags-${rowTag}-row-text"]`,
      delete: `[data-test="button-${kebabTestSegment(id)}-delete"]`,
    };
  },
} as const;

/** The Pull Image side panel, built by `ix-form-renderer` from `pull-image.form-config.ts`. */
export const pullImageFormLocators = {
  image: '[data-test="input-image"]',
  tag: '[data-test="input-tag"]',
  /** The side panel's Save. It closes once the `app.image.pull` job has succeeded. */
  save: '[data-test="button-save"]',
} as const;

/** The delete dialog's action row, which scopes its buttons away from the toolbar's Delete. */
const deleteImageDialogActions = '[data-test="actions-docker-image-delete"]';

/** `DockerImageDeleteDialog`, `<tn-dialog-shell testId="docker-image-delete">`. */
export const deleteImageDialogLocators = {
  title: '[data-test="dialog-title-docker-image-delete"]',
  /** "The following N docker images will be deleted…", until Delete has run. */
  message: '[data-test="text-delete-confirmation"]',
  /** One line per image the dialog will delete: its tags, or its id when it has none. */
  item: (id: string): string => `[data-test="text-docker-image-${kebabTestSegment(id)}"]`,
  /** Delete stays disabled until this is ticked. */
  confirm: '[data-test="checkbox-confirm"]',
  force: '[data-test="checkbox-force"]',
  delete: `${deleteImageDialogActions} [data-test="button-delete"]`,
  /**
   * The report once a job of more than one image has run; a single image that deletes closes the
   * dialog instead. Each is drawn only when its count is above zero.
   */
  failedCount: '[data-test="text-failed-count"]',
  deletedCount: '[data-test="text-deleted-count"]',
  /** Replaces Cancel and Delete once the job has run. Closes the dialog and reloads the list. */
  close: `${deleteImageDialogActions} [data-test="button-close"]`,
} as const;
