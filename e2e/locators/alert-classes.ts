/**
 * The Category card on System > Alert Settings (`ix-alert-config-form`): one row per alert class with a level and
 * frequency. Ids are built from the class's untranslated title (`[cls.title, 'level']`), e.g.
 * `select-pool-status-is-not-healthy-level`; no row element or class id is involved. Both selects key options by
 * label through the library normalizer, and labels are the wire values (`CRITICAL`, `HOURLY`), so an option is
 * the lower-cased value: `option-<title>-level-critical`.
 */
import { kebabTestSegment } from './test-id';

export const alertClassLocators = {
  /** `<tn-button [testId]="'categories'">` in the card header, labelled with the category on show. */
  categories: '[data-test="button-categories"]',

  /** `<tn-menu-item [testId]="'category-' + category.id">` — the id, e.g. `TASKS`, not the title. */
  category: (categoryId: string): string => `[data-test="button-category-${kebabTestSegment(categoryId)}"]`,

  /** The class's title beside its two selects. */
  title: (classTitle: string): string => `[data-test="text-${kebabTestSegment(classTitle)}-title"]`,

  level: (classTitle: string): string => `[data-test="select-${kebabTestSegment(classTitle)}-level"]`,
  levelOption: (classTitle: string, level: string): string => (
    `[data-test="option-${kebabTestSegment(classTitle)}-level-${kebabTestSegment(level)}"]`
  ),

  policy: (classTitle: string): string => `[data-test="select-${kebabTestSegment(classTitle)}-policy"]`,
  policyOption: (classTitle: string, policy: string): string => (
    `[data-test="option-${kebabTestSegment(classTitle)}-policy-${kebabTestSegment(policy)}"]`
  ),

  /** Renamed from `button-save` so it no longer collides with the Alert Services side panel's Save. */
  save: '[data-test="button-save-alert-config"]',
} as const;
