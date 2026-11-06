import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';

export enum SmartAlertCategory {
  Storage = 'storage',
  Network = 'network',
  Services = 'services',
  System = 'system',
  Security = 'security',
  Hardware = 'hardware',
  Tasks = 'tasks',
  Applications = 'applications',
}

export enum SmartAlertActionType {
  Navigate = 'navigate',
  Modal = 'modal',
  ExternalLink = 'external',
  RunTask = 'run-task',
}

export type SmartAlertRunTaskMethod = 'cloud_backup.sync' | 'cloudsync.sync' | 'rsynctask.run';

export interface SmartAlertAction {
  label: string;
  type: SmartAlertActionType;
  icon: string;
  primary?: boolean;
  requiresConfirmation?: boolean;

  // For navigation
  route?: string[];
  fragment?: string;
  queryParams?: Record<string, string>;

  // For external links
  externalUrl?: string;

  // For API calls: the jobs that run a task now, each taking the task id
  apiMethod?: SmartAlertRunTaskMethod;
  apiParams?: unknown;

  // Custom handler
  handler?: () => void;
}

/**
 * Context that changes how an alert is enhanced.
 */
export interface EnhanceAlertOptions {
  /**
   * The alert stands for several alerts of the same class about different objects.
   * Actions scoped to a single object - task reruns, routes and highlights resolved from
   * one alert's args - are dropped, because they would silently cover one member only.
   */
  isConsolidated?: boolean;
}

export interface SmartAlertEnhancement {
  category: SmartAlertCategory;
  actions: SmartAlertAction[];

  /**
   * Concise headline used when several alerts of this class are consolidated into one entry.
   * An ICU plural over `count`, so locales with more than one plural form can translate it -
   * only the `other` form is written here, since the headline never renders below 2.
   * When omitted the newest alert's own summary is shown instead.
   */
  groupSummary?: string;

  // Help and documentation
  contextualHelp?: string;
  detailedHelp?: string;
  documentationUrl?: string;

  // Navigation integration. The primary feature area of the alert.
  // Drives the nav badge (badge shows on this path and every parent path) and,
  // unless bannerMenuPath overrides it, the page-level banner.
  relatedMenuPath?: string[];

  // Overrides relatedMenuPath *for the banner only*, restricting it to routes at or
  // below this path. Use when the banner should be scoped more narrowly than the nav
  // badge (e.g. an alert relevant only to a sub-page that has no menu item of its own).
  // Falls back to relatedMenuPath when omitted, and never applies to extraMenuPaths.
  bannerMenuPath?: string[];

  // Secondary feature areas, e.g. tiering alerts raised on a pool (Storage) but handled per dataset
  // (Datasets). Each gets the full badge and banner regardless of `bannerMenuPath`; see
  // getAlertBadgeMenuPaths / getAlertBannerMenuPaths.
  extraMenuPaths?: string[][];

  // Visual enhancements
  customIcon?: string;
  severityScore?: number; // 0-100 for prioritization

  // Dynamic fragment extraction for highlighting
  extractFragment?: (alertMessage: string) => string | undefined;

  // Dynamic API parameter extraction for automated actions
  extractApiParams?: (alert: { args: unknown; text: string; formatted: string }) => unknown;
}

/**
 * Picks an enhancement by alert context: the first matching `conditions` entry wins, else
 * `defaultEnhancement`. E.g. ZpoolCapacity points to Boot Environments when it's about the boot pool.
 */
export interface ConditionalSmartAlertEnhancement {
  /**
   * Array of conditions to check in order.
   * First matching condition wins.
   */
  conditions: {
    /** Function that returns true if this enhancement should be applied */
    check: (alert: Alert) => boolean;
    /** Enhancement configuration to use when check passes */
    enhancement: SmartAlertEnhancement;
  }[];
  /** Fallback enhancement when no conditions match */
  defaultEnhancement: SmartAlertEnhancement;
}

/**
 * Type guard to check if an enhancement is conditional
 */
export function isConditionalEnhancement(
  enhancement: SmartAlertEnhancement | ConditionalSmartAlertEnhancement,
): enhancement is ConditionalSmartAlertEnhancement {
  return 'conditions' in enhancement && 'defaultEnhancement' in enhancement;
}

/**
 * Resolves a conditional enhancement to a concrete enhancement based on alert context
 */
export function resolveConditionalEnhancement(
  conditional: ConditionalSmartAlertEnhancement,
  alert: Alert,
): SmartAlertEnhancement {
  // Check conditions in order
  for (const condition of conditional.conditions) {
    if (condition.check(alert)) {
      return condition.enhancement;
    }
  }
  // Return default if no conditions match
  return conditional.defaultEnhancement;
}

export interface SmartAlertConfig {
  // Map by source (supports both regular and conditional enhancements)
  bySource?: Record<string, SmartAlertEnhancement | ConditionalSmartAlertEnhancement>;

  // Map by class name (supports both regular and conditional enhancements)
  // Prefer using AlertClassName enum values for type safety: [AlertClassName.CloudBackupTaskFailed]: {...}
  // String keys are also supported for alerts not yet in the enum
  byClass?: Partial<Record<AlertClassName, SmartAlertEnhancement | ConditionalSmartAlertEnhancement>>
    & Record<string, SmartAlertEnhancement | ConditionalSmartAlertEnhancement>;

  // Map by level
  byLevel?: Partial<Record<AlertLevel, Partial<SmartAlertEnhancement>>>;
}

export interface EnhancedAlert {
  category?: SmartAlertCategory;
  actions?: SmartAlertAction[];
  groupSummary?: string;
  contextualHelp?: string;
  detailedHelp?: string;
  documentationUrl?: string;
  relatedMenuPath?: string[];
  bannerMenuPath?: string[];
  extraMenuPaths?: string[][];
  customIcon?: string;
  severityScore?: number;
}

/**
 * Alert decorated with the count, ids and messages of every alert it consolidates.
 * Alerts only ever consolidate within one alert class: middleware derives `alert.key`
 * from the alert arguments alone, so two different classes raised against the same object
 * share a key (see `getAlertDuplicateKey`) without being duplicates of each other.
 * Dispatchers carry `allIds` so dismiss/reopen actions act on every duplicate
 * without re-querying post-reducer state.
 */
export type ConsolidatedAlert<T> = T & {
  /** Number of alerts represented by this entry. */
  duplicateCount: number;
  /**
   * Number of distinct objects the entry covers, i.e. alerts with distinct keys.
   * Lower than `duplicateCount` when one object reported the same problem more than once -
   * an HA appliance raises the same alert from both controllers. Group headlines are
   * phrased in terms of objects ("{count} pools"), so they count this, not instances.
   */
  objectCount: number;
  /** Ids of every alert in the group, so a single dismiss clears all of them. */
  allIds: string[];
  /**
   * Distinct messages in the group, newest first. Only set for real groups.
   * Identical messages are collapsed, so this can be shorter than `duplicateCount`:
   * the count is instances, this is the messages they carry.
   */
  groupedMessages?: string[];
};

export type AlertWithDuplicates = ConsolidatedAlert<Alert & EnhancedAlert>;

/**
 * Builds an `extractFragment` that pulls a value out of the alert message with `regex` and prefixes it
 * with `taskPrefix`, falling back to `fallbackAnchor`. Without `transform` the value stays raw to match
 * `uniqueRowTag` (`'Cloud Backup Task "My Task"'` → `cloud-backup-My Task`); pass one for components that
 * transform their row tag.
 */
export function createFragmentExtractor(
  taskPrefix: string,
  regex: RegExp,
  fallbackAnchor?: string,
  transform?: (value: string) => string,
): (message: string) => string | undefined {
  return (message: string) => {
    const match = regex.exec(message);
    const extractedValue = match?.[1];

    if (extractedValue) {
      const processedValue = transform ? transform(extractedValue) : extractedValue;
      return `${taskPrefix}-${processedValue}`;
    }

    return fallbackAnchor;
  };
}

/**
 * Extracts a task id from alert args shaped as `[{ id, name }]`, `[id]` or `{ id }`, for registry
 * entries like `extractApiParams: createTaskIdExtractor()`.
 */
export function createTaskIdExtractor(): (alert: { args: unknown }) => number | undefined {
  return (alert: { args: unknown }) => {
    // Handle array args (most common case)
    if (Array.isArray(alert.args) && alert.args.length > 0) {
      const firstArg = alert.args[0];
      // If it's an object with an id property, extract the id
      if (typeof firstArg === 'object' && firstArg !== null && 'id' in firstArg) {
        return (firstArg as { id: number }).id;
      }
      // If it's a plain number, return it
      if (typeof firstArg === 'number') {
        return firstArg;
      }
    }
    // Fallback: check if args is directly an object with id property
    if (typeof alert.args === 'object' && alert.args !== null && 'id' in alert.args) {
      return (alert.args as { id: number }).id;
    }
    // If args is directly a number
    if (typeof alert.args === 'number') {
      return alert.args;
    }
    // Unable to extract ID
    return undefined;
  };
}
