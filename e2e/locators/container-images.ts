/**
 * Apps > Configuration > Manage Container Images (`/apps/manage-container-images`): the image list,
 * its Pull Image side panel and the delete dialog.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

export const containerImagesLocators = {
  /** `<tn-menu-item testId="container-images">` in the installed apps page's Configuration menu. */
  menuItem: '[data-test="button-container-images"]',

  pullImage: '[data-test="button-pull-image"]',

  /**
   * One image, by its id (`sha256:…`). The row tag is `toUniqueRowTag('docker-image-<id>')`, which
   * kebabs through lodash, while the Delete button is `[id, 'delete']` through the library's
   * normalizer, so the two spell the id differently.
   */
  image: (id: string): { tags: string; delete: string } => {
    const rowTag = legacyKebabTestSegment(`docker-image-${id}`);
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

/** `DockerImageDeleteDialog`, `<tn-dialog-shell testId="docker-image-delete">`. */
export const deleteImageDialogLocators = {
  title: '[data-test="dialog-title-docker-image-delete"]',
  /** Delete stays disabled until this is ticked. */
  confirm: '[data-test="checkbox-confirm"]',
  delete: '[data-test="button-delete"]',
} as const;
