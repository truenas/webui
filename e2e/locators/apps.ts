/**
 * Apps > Installed (`/apps/installed`): the Apps service status, the Configuration menu and the
 * Choose Pool dialog and Settings panel it opens.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

export const appsLocators = {
  /**
   * The Apps service status beside the page title, from `docker-status.component.html`. Its text is
   * the `dockerStatusLabels` entry for `docker.status`: "Apps Service Running", "Apps Service Not
   * Configured", and so on.
   */
  dockerStatus: '[data-test="text-docker-status"]',

  /** The installed apps list's empty state, shown while no app is installed. */
  noInstalledApps: '[data-test="text-no-installed-apps"]',

  /** `<tn-button testId="apps-settings">`, the "Configuration" button that opens the menu below. */
  configMenu: '[data-test="button-apps-settings"]',

  /** `<tn-menu-item testId="choose-pool">`. Always in the menu for a user with `DOCKER_WRITE`. */
  choosePool: '[data-test="button-choose-pool"]',

  /** `<tn-menu-item testId="unset-pool">`. In the menu only while Apps has a pool. */
  unsetPool: '[data-test="button-unset-pool"]',

  /** `<tn-menu-item testId="update-preferred-trains">`, labelled "Settings". Opens the Apps Settings panel. */
  settings: '[data-test="button-update-preferred-trains"]',

  /** `<tn-menu-item testId="docker-registries">`, "Sign-in to a Docker registry". Disabled until Apps has a pool. */
  dockerRegistries: '[data-test="button-docker-registries"]',
} as const;

/**
 * The Apps Settings side panel, `apps-settings.component.html`.
 *
 * Both lists are form arrays whose controls keep their own names, so every address pool's base is
 * `input-base` and every mirror's URL is `input-url`. The row ids are what tell the rows apart, as
 * `row-environment-variable-<i>` does on the container form.
 */
export const appsSettingsLocators = {
  /**
   * The Preferred Trains field, `<tn-form-field testId="preferred-trains">`. It holds the checkbox
   * group and the line a refusal of `catalog.update` is pinned to, which renders no id of its own.
   */
  preferredTrains: '[data-test="form-field-preferred-trains"]',
  /**
   * One train's checkbox. `tn-checkbox-group` scopes each option by its label, which is the train's
   * name, under the group's id, which falls back to `formControlName="preferred_trains"`.
   */
  preferredTrain: (train: string): string => `[data-test="checkbox-preferred-trains-${kebabTestSegment(train)}"]`,

  /**
   * One address pool, by its position. The base is an `ix-ip-input-with-netmask` with no `testId`,
   * so its address is `input-base` and its prefix `select-netmasks`. The prefix's options render in
   * an overlay outside the row, and only the open select has any.
   */
  addressPool: (index: number): { base: string; prefix: string; size: string } => {
    const row = `[data-test="row-address-pool-${index}"]`;
    return {
      base: `${row} [data-test="input-base"]`,
      prefix: `${row} [data-test="select-netmasks"]`,
      size: `${row} [data-test="input-size"]`,
    };
  },
  prefixOption: (bits: number): string => `[data-test="option-netmasks-${bits}"]`,

  /** "Add" under Registry Mirrors: `tn-form-list` names it `['add-item', label]`. */
  addRegistryMirror: '[data-test="button-add-item-registry-mirrors"]',
  /** One registry mirror, by its position. */
  registryMirror: (index: number): { url: string; insecure: string } => {
    const row = `[data-test="row-registry-mirror-${index}"]`;
    return {
      url: `${row} [data-test="input-url"]`,
      insecure: `${row} [data-test="checkbox-insecure"]`,
    };
  },

  enableImageUpdates: '[data-test="checkbox-enable-image-updates"]',

  /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. */
  save: '[data-test="button-save"]',
  closePanel: '[data-test="button-close-side-panel"]',
} as const;

/** `SelectPoolDialog`, `<tn-dialog-shell testId="select-pool-dialog">`. */
export const selectAppsPoolDialogLocators = {
  /** What to wait on before acting on it. */
  title: '[data-test="dialog-title-select-pool-dialog"]',
  pool: '[data-test="select-pool"]',
  poolOption: (pool: string): string => `[data-test="option-pool-${kebabTestSegment(pool)}"]`,
  choose: '[data-test="button-choose"]',
} as const;

/**
 * One installed app on Apps > Installed: its row in `installed-apps-list.component.html` and the
 * Application Info card the details panel shows for the selected row.
 *
 * The row and its cells are tagged with `toUniqueRowTag('app-<name>')`, which kebabs through lodash,
 * so `e2e-it-tools` is `app-e-2-e-it-tools` there. The Start and Stop buttons are `[name, 'start']`
 * through the library's normalizer, which leaves the name as it is.
 */
export const installedAppLocators = (name: string): {
  row: string;
  name: string;
  state: string;
  updates: string;
  start: string;
  stop: string;
  delete: string;
  edit: string;
  convert: string;
  catalogName: string;
  customName: string;
} => {
  const rowTag = `app-${legacyKebabTestSegment(name)}`;
  const row = `[data-test="row-${rowTag}"]`;
  const app = kebabTestSegment(name);

  return {
    row,
    name: `[data-test="text-application-${rowTag}-row-text"]`,
    state: `[data-test="text-status-${rowTag}-row-state"]`,
    /**
     * The Updates cell, `ix-app-update-cell`: "Up to date", or "Revision available" / "Update
     * available" while `upgrade_available`, depending on whether the upstream version changes too.
     */
    updates: `[data-test="text-updates-${rowTag}-row-text"]`,
    // The info card renders Start and Stop under the same ids for the narrow layout, hidden by CSS
    // on a wide one, so the row's own are scoped to the row.
    start: `${row} [data-test="button-${app}-start"]`,
    stop: `${row} [data-test="button-${app}-stop"]`,
    // The info card's Delete. The list has none of its own.
    delete: `[data-test="button-${app}-delete"]`,
    /**
     * The info card's Edit, the same button for both kinds of app: a catalog app's goes to the install
     * wizard in edit mode, a custom app's opens the YAML side panel.
     */
    edit: `[data-test="button-${app}-edit"]`,
    /** "Convert to custom app" in the card's menu, `appInfoCardLocators.menu`. Disabled on a custom app. */
    convert: `[data-test="button-${app}-convert"]`,
    /** The card's Name: a link to the catalog page on a catalog app, plain text on a custom one. */
    catalogName: `[data-test="link-${app}-name-details"]`,
    customName: `[data-test="text-${app}-name"]`,
  };
};

/**
 * One service's container on the selected app's Workloads card, `app-workloads-card.component.html`.
 * Every id is `[container.service_name, …]` through the library's normalizer. The three actions
 * render only while the app is Running, Deploying or Crashed.
 */
export const workloadsCardLocators = (service: string): {
  serviceName: string;
  state: string;
  shell: string;
  viewLogs: string;
} => {
  const container = kebabTestSegment(service);

  return {
    serviceName: `[data-test="text-${container}-service-name"]`,
    /** The container's state label: "Running", "Exited", and so on. */
    state: `[data-test="text-${container}-container-state"]`,
    /** Disabled, with a lock icon, unless the user holds both `APPS_WRITE` and `web_shell`. */
    shell: `[data-test="button-${container}-shell"]`,
    viewLogs: `[data-test="button-${container}-view-logs"]`,
  };
};

/**
 * `LogsDetailsDialog`, `<tn-dialog-shell testId="logs-details">`, which the logs page raises on open
 * and on every Reconnect. Cancel leaves the page for the app's details.
 */
export const logsDetailsDialogLocators = {
  title: '[data-test="dialog-title-logs-details"]',
  /** Required, `500` by default. */
  tailLines: '[data-test="input-tail-lines"]',
  cancel: '[data-test="button-cancel"]',
  /** "Connect". Disabled while Tail Lines is empty. */
  connect: '[data-test="button-choose"]',
} as const;

/**
 * A container's logs page (`/apps/installed/<train>/<app>/logs/<containerId>`),
 * `container-logs.component.html`. Rows are numbered from 0 in the order they arrived, and Reconnect
 * clears them before the new subscription fills them again.
 */
export const containerLogsLocators = {
  reconnect: '[data-test="button-reconnect"]',
  applicationName: '[data-test="text-application-name"]',
  containerId: '[data-test="text-container-id"]',
  /** Every row's line, for counting them. */
  anyLine: '[data-test^="text-log-data-"]',
  line: (index: number): string => `[data-test="text-log-data-${index}"]`,
  timestamp: (index: number): string => `[data-test="text-log-timestamp-${index}"]`,
} as const;

/** The Application Info card's own controls, the same whichever app is selected. */
export const appInfoCardLocators = {
  /** `<tn-icon-button testId="app-info-menu">`, "More Options", which opens Update and Convert. */
  menu: '[data-test="button-app-info-menu"]',
} as const;

/**
 * The Application Info card's Revision readout and the two actions that change it. Every id is
 * `[app.name, …]` through the library's normalizer, so the name is left as it is.
 */
export const appRevisionLocators = (name: string): {
  revision: string;
  update: string;
  rollback: string;
} => {
  const app = kebabTestSegment(name);

  return {
    /** Revision: the catalog revision the app runs, `app.version`. */
    revision: `[data-test="text-${app}-revision"]`,
    /** A `tn-menu-item` in `appInfoCardLocators.menu`, disabled unless `upgrade_available`. */
    update: `[data-test="button-${app}-update"]`,
    /** Rendered only once `app.rollback_versions` has returned a revision. */
    rollback: `[data-test="button-${app}-rollback"]`,
  };
};

/** `AppUpdateDialog`, `<tn-dialog-shell testId="app-update">`. */
export const appUpdateDialogLocators = {
  title: '[data-test="dialog-title-app-update"]',
  /** The installed `human_version`, e.g. `v1_1.0.5`. */
  installedVersion: '[data-test="text-installed-version"]',
  /** "Revision: <installed> → <target>". */
  revisionChange: '[data-test="text-revision-change"]',
  update: '[data-test="button-update"]',
} as const;

/** `AppRollbackModalComponent`, `<tn-dialog-shell testId="app-rollback">`. */
export const appRollbackDialogLocators = {
  title: '[data-test="dialog-title-app-rollback"]',
  /** Filled from `app.rollback_versions`, with the first preselected. */
  version: '[data-test="select-app-version"]',
  rollbackSnapshot: '[data-test="checkbox-rollback-snapshot"]',
  rollBack: '[data-test="button-roll-back"]',
} as const;

/**
 * The install wizard in edit mode (`/apps/installed/<train>/<app>/edit`), on IT Tools' form.
 *
 * Every dynamic field takes its id from the schema variable, so these hold only for an app whose
 * questions name them so. The input-type fields' `tn-form-field` carries the same id, which is what
 * a field's error text is read through.
 */
export const catalogAppEditLocators = {
  /** `network.web_port.port_number`, an int with the schema's `min` and `max` as validators. */
  portNumber: '[data-test="input-port-number"]',
  portNumberField: '[data-test="form-field-port-number"]',
  /** "Add" under Additional Environment Variables: `tn-form-list` names it `['add-item', label]`. */
  addEnvironmentVariable: '[data-test="button-add-item-additional-environment-variables"]',
  /**
   * A row's `name` and `value`. Every row's controls keep those names, so these are unique only while
   * the list holds one row, which the caller checks.
   */
  environmentName: '[data-test="input-name"]',
  environmentValue: '[data-test="input-value"]',
  /** The wizard's Update, `testId="save"`. */
  update: '[data-test="button-save"]',
} as const;

/** `AppDeleteDialog`, `<tn-dialog-shell testId="app-delete">`. */
export const appDeleteDialogLocators = {
  title: '[data-test="dialog-title-app-delete"]',
  /** Delete stays disabled until this holds the app's name. */
  confirmName: '[data-test="input-confirm-app-name"]',
  removeImages: '[data-test="checkbox-remove-images"]',
  delete: '[data-test="button-delete"]',
} as const;

/**
 * Apps > Discover (`/apps/available`), a category page there (`/apps/available/<category>`), an app's
 * page, and the install wizard it opens. Discover and a category page share Search's `input-search`;
 * only one of them is on screen at a time.
 */
export const appCatalogLocators = {
  /** "Discover Apps" in the Installed page's header. */
  discoverApps: '[data-test="button-discover-apps"]',
  search: '[data-test="input-search"]',
  /** "Refresh Catalog", which runs `catalog.sync` behind a job progress dialog. */
  refreshCatalog: '[data-test="link-refresh-apps"]',
  /** An app's card, a link to its page. */
  appCard: (train: string, app: string): string => {
    const id = ['link-open', kebabTestSegment(train), kebabTestSegment(app)].join('-');
    return `[data-test="${id}"]`;
  },
  /** Every app card on the page, for counting them. */
  anyAppCard: '[data-test^="link-open-"]',

  /** A Discover section's heading, `['section-title', appSection.category]`. */
  sectionTitle: (category: string): string => `[data-test="text-section-title-${kebabTestSegment(category)}"]`,
  /**
   * "View All <title>" under a Discover section, `[appSection.title, 'view-all']`. Rendered only for a
   * section of more than 6 apps, and only while no sort or category filter is applied. For a plain
   * category the title is the category itself.
   */
  viewAll: (title: string): string => `[data-test="button-${kebabTestSegment(title)}-view-all"]`,

  /** A category page's title (`page-header.component.html`): the category, titlecased. */
  pageTitle: '[data-test="text-page-title"]',
  /** "Back to Discover Page" on a category page. Rendered only once the category has loaded. */
  backToDiscover: '[data-test="button-back-to-discover-page"]',
  /** A category page's empty state for a search term that matches no app. */
  noSearchResults: '[data-test="text-no-search-results"]',
  /** Install on the app's page. Shown only while Apps has a pool. */
  install: (app: string): string => `[data-test="button-${kebabTestSegment(app)}-install"]`,

  /** The wizard's Application Name, prefilled with the catalog app's name. */
  releaseName: '[data-test="input-release-name"]',
  /** The wizard's Install button. */
  save: '[data-test="button-save"]',
} as const;

/**
 * A custom app's YAML: Discover's Install via YAML, and the `custom-app-form` side panel it and an
 * installed custom app's Edit both open.
 */
export const customAppLocators = {
  /** The "More Options" menu beside Custom App on Discover. Disabled until Apps has a pool. */
  menu: '[data-test="button-custom-app-menu"]',
  installViaYaml: '[data-test="button-custom-app-yaml"]',

  /** The app's name. Read-only when editing. */
  releaseName: '[data-test="input-release-name"]',
  /**
   * "Custom Config": the compose file. CodeMirror's editable element, tagged through
   * `ix-code-editor`'s `testId`, which a test can `fill`.
   */
  config: '[data-test="code-editor-custom-config"]',
  /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. */
  save: '[data-test="button-save"]',
} as const;
