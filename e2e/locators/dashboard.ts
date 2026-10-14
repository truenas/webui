/**
 * The Dashboard's System Information widget.
 *
 * Its readouts are tagged `tnTestIdType="text"` with `['system-info-active', <field>]`, keyed by
 * the widget's type as `e2e/CLAUDE.md` describes for dashboard widgets, so the ids are static.
 * Each holds the value alone, without its label.
 */
export const dashboardLocators = {
  systemInfo: {
    /**
     * The appliance's hostname. On iX hardware it moves from the list to under the product image,
     * keeping the same id, and only one of the two is ever rendered.
     */
    hostname: '[data-test="text-system-info-active-hostname"]',
    /** The version string alone; the `rendered()` call beside it in the template emits nothing. */
    version: '[data-test="text-system-info-active-version"]',
  },
} as const;
