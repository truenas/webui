import { AlertLevel } from 'app/enums/alert-level.enum';

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
  ApiCall = 'automated',
}

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

  // For API calls
  apiMethod?: string;
  apiParams?: unknown;

  // Custom handler
  handler?: () => void;
}

export interface SmartAlertEnhancement {
  category: SmartAlertCategory;
  actions: SmartAlertAction[];

  // Help and documentation
  contextualHelp?: string;
  detailedHelp?: string;
  documentationUrl?: string;

  // Navigation integration
  relatedMenuPath?: string[];

  // Visual enhancements
  customIcon?: string;
  severityScore?: number; // 0-100 for prioritization

  // Dynamic fragment extraction for highlighting
  extractFragment?: (alertMessage: string) => string | undefined;

  // Dynamic API parameter extraction for automated actions
  extractApiParams?: (alert: { args: unknown; text: string; formatted: string }) => unknown;
}

export interface SmartAlertConfig {
  // Map by source
  bySource?: Record<string, SmartAlertEnhancement>;

  // Map by class name
  byClass?: Record<string, SmartAlertEnhancement>;

  // Map by level
  byLevel?: Partial<Record<AlertLevel, Partial<SmartAlertEnhancement>>>;
}

export interface EnhancedAlert {
  category?: SmartAlertCategory;
  actions?: SmartAlertAction[];
  contextualHelp?: string;
  detailedHelp?: string;
  documentationUrl?: string;
  relatedMenuPath?: string[];
  customIcon?: string;
  severityScore?: number;
}

/**
 * Creates an extractFragment function that extracts a specific field from an alert message.
 *
 * @param taskPrefix - The prefix to use for the extracted fragment (e.g., 'cloud-backup', 'rsync-task')
 * @param regex - The regex to extract the value from the alert message
 * @param fallbackAnchor - Optional fallback anchor if extraction fails
 * @param transform - Optional function to transform the extracted value
 * @returns A function that extracts and formats the fragment
 *
 * @example
 * // Extract task description without transformation (matches raw uniqueRowTag)
 * const extractor = createFragmentExtractor('cloud-backup',
 * /Cloud\s+Backup(?:\s+Task)?\s+"([^"]+)"/i, 'cloud-backup-tasks');
 * const fragment = extractor('Cloud Backup Task "My Task" failed'); // Returns: 'cloud-backup-My Task'
 *
 * @example
 * // Extract with transformation (for components that transform uniqueRowTag)
 * const extractor = createFragmentExtractor(
 *   'replication-task',
 *   /Replication\s+"([^"]+)"/i,
 *   undefined,
 *   (value) => value.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
 * );
 * const fragment = extractor('Replication "My Task" failed'); // Returns: 'replication-task-my-task'
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
 * Creates a standard task ID extractor for API call actions.
 * Handles the common pattern where alert.args contains either:
 * - An array with an object { id: number, name: string }
 * - An array with a direct ID value
 * - A direct object with an id property
 *
 * @returns A function that extracts the task ID from alert args
 *
 * @example
 * // In alert-enhancement.registry.ts:
 * CloudBackupTaskFailed: {
 *   extractApiParams: createTaskIdExtractor(),
 * }
 */
export function createTaskIdExtractor(): (alert: { args: unknown }) => unknown {
  return (alert: { args: unknown }) => {
    // Handle array args (most common case)
    if (Array.isArray(alert.args) && alert.args.length > 0) {
      const firstArg = alert.args[0];
      // If it's an object with an id property, extract the id
      if (typeof firstArg === 'object' && firstArg !== null && 'id' in firstArg) {
        return (firstArg as { id: number }).id;
      }
      // Otherwise use the first argument directly (already a number)
      return firstArg;
    }
    // Fallback: check if args is directly an object with id property
    if (typeof alert.args === 'object' && alert.args !== null && 'id' in alert.args) {
      return (alert.args as { id: number }).id;
    }
    // Last resort: return args as-is
    return alert.args;
  };
}
