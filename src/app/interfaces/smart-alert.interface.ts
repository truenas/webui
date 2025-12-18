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
