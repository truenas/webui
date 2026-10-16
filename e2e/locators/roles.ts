/**
 * What the UI renders around a control the signed-in user lacks the role for.
 */
export const roleLocators = {
  /**
   * `ix-missing-access-wrapper`'s span, which `*ixRequiresRoles` puts around a
   * control in place of rendering it plainly, with a lock icon beside it. The same
   * id repeats once per locked control on a page, so scope it with
   * `filter({ has })` rather than reading it alone.
   *
   * A `tn-menu-item` never gets one: `tn-menu` draws its own button for each item,
   * outside the wrapper, so a locked menu item is only `disabled`.
   */
  missing: '[data-test="role-missing"]',
} as const;
