/**
 * The Category card on System > Alert Settings, `ix-alert-config-form`: one row
 * per alert class in the chosen category, each with a level and a frequency.
 *
 * A row's ids are built from the class's **title**, untranslated — the template
 * writes `[cls.title, 'level']` — so the Level select of "Pool Status Is Not
 * Healthy" is `select-pool-status-is-not-healthy-level`. There is no row element
 * and no class id in any of them.
 *
 * Both selects take the default option key, the label, run through the library
 * normalizer: levels are labelled by their wire value (`CRITICAL`) and the
 * frequencies by `alert.list_policies` itself (`HOURLY`), so either way the
 * option is the lower-cased value — `option-<title>-level-critical`.
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
