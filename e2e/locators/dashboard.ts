/**
 * The Dashboard page and its widgets.
 *
 * Widget readouts are tagged `tnTestIdType="text"` and keyed by the widget's type, plus the entity
 * the widget's settings pick where there is one, as `e2e/CLAUDE.md` describes for dashboard
 * widgets. So a widget-level id is static, and a pool- or NIC-keyed one is a function. Neither
 * depends on which group or slot the widget sits in. Each readout holds the value alone, without
 * its label.
 */
import { kebabTestSegment } from './test-id';

export const dashboardLocators = {
  /** In the page header; replaced by the editing controls while the layout is being edited. */
  configure: '[data-test="button-configure-dashboard"]',

  /**
   * Configure mode's page controls. Their own ids are the bare `button-save` and `button-cancel`,
   * which the Card Editor's panel Save and the shared dialogs' Cancel also emit, so each is scoped
   * inside the container that holds them.
   */
  edit: {
    add: '[data-test="dashboard-edit-actions"] [data-test="button-add-group"]',
    save: '[data-test="dashboard-edit-actions"] [data-test="button-save"]',
    cancel: '[data-test="dashboard-edit-actions"] [data-test="button-cancel"]',
    /**
     * A group's Delete, by its index in the layout. Keyed by position, which `e2e/CLAUDE.md` rules
     * out for readouts, not for controls on a layout the test wrote itself.
     */
    deleteGroup: (index: number): string => `[data-test="button-delete-group-widget-${index}"]`,
  },

  /** The Card Editor, opened by Add in the shared form side panel. */
  cardEditor: {
    panel: '[data-test="side-panel-widget-group-editor"]',
    /** A layout toggle, keyed by its label: `One large card` is the Full layout. */
    fullLayout: '[data-test="button-toggle-one-large-card"]',
    /** Slot 0 keeps the bare `button-slot`; later slots are `button-slot-<n>`. */
    firstSlot: '[data-test="button-slot"]',
    category: '[data-test="select-category"]',
    /**
     * The CPU category. A category option's label carries a count of the cards the layout can hold
     * in it, `CPU (6 cards)`, and the option id comes from the label, so only its head is stable.
     */
    categoryCpu: '[data-test^="option-category-cpu-"]',
    type: '[data-test="select-type"]',
    /** The option labelled with the CPU widget's name, `CPU Overview`. */
    typeCpuOverview: '[data-test="option-type-cpu-overview"]',
    /** The panel's own Save, `[testId]="'save'"` in form-side-panel-container. */
    save: '[data-test="side-panel-widget-group-editor"] [data-test="button-save"]',
  },

  systemInfo: {
    /**
     * The appliance's hostname. On iX hardware it moves from the list to under the product image,
     * keeping the same id, and only one of the two is ever rendered.
     */
    hostname: '[data-test="text-system-info-active-hostname"]',
    /** The version string alone; the `rendered()` call beside it in the template emits nothing. */
    version: '[data-test="text-system-info-active-version"]',
  },

  /** The CPU card, `cpu` in the registry and CPU Overview in the Card Editor. */
  cpu: {
    title: '[data-test="text-cpu-title"]',
  },

  cpuUsageBar: {
    title: '[data-test="text-cpu-usage-bar-title"]',
  },

  cpuTemperatureBar: {
    title: '[data-test="text-cpu-temperature-bar-title"]',
  },

  cpuUsageGauge: {
    title: '[data-test="text-cpu-usage-gauge-title"]',
  },

  cpuUsageRecent: {
    title: '[data-test="text-cpu-usage-recent-title"]',
  },

  /** Rendered by `ix-widget-datapoint`, which scopes `title` and `value` under the widget's type. */
  cpuModel: {
    title: '[data-test="text-cpu-model-widget-title"]',
    value: '[data-test="text-cpu-model-widget-value"]',
  },

  memory: {
    title: '[data-test="text-memory-title"]',
  },

  /** One tile per pool, the first six pools only. */
  storage: {
    reports: '[data-test="button-storage-reports"]',
    poolName: (pool: string): string => `[data-test="text-storage-${kebabTestSegment(pool)}-name"]`,
    /** The raw `pool.query` status, or "Unhealthy" for a pool that is ONLINE and not healthy. */
    poolStatus: (pool: string): string => `[data-test="text-storage-${kebabTestSegment(pool)}-status"]`,
  },

  backupTasks: {
    title: '[data-test="text-backup-tasks-title"]',
  },

  /** The IPv4 Address card. Without a NIC in its settings it shows the first one. */
  ipv4Address: {
    title: (nic: string): string => `[data-test="text-ipv4-address-${kebabTestSegment(nic)}-title"]`,
    /** Every IPv4 alias, joined with newlines. An HA appliance renders a list instead. */
    value: (nic: string): string => `[data-test="text-ipv4-address-${kebabTestSegment(nic)}-value"]`,
  },

  /** The Interface card. Without a NIC in its settings it shows the first one. */
  interface: {
    name: (nic: string): string => `[data-test="text-interface-${kebabTestSegment(nic)}-name"]`,
    /** `linkStateLabelMap`'s label, rendered untranslated: `LINK STATE UP`. */
    linkState: (nic: string): string => `[data-test="text-interface-${kebabTestSegment(nic)}-link-state"]`,
  },

  help: {
    documentation: '[data-test="link-documentation"]',
  },
} as const;
