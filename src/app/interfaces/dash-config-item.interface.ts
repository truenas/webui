/**
 * Kept for compatibility with older dashboard configurations stored in user attributes.
 * This is only used for old dashboard state in preferences, which is no longer actively used.
 * Can be removed when old dashboard migration support is no longer needed.
 */
enum WidgetName {
  SystemInformation = 'System Information',
  SystemInformationStandby = 'System Information(Standby)',
  Cpu = 'CPU',
  Memory = 'Memory',
  Storage = 'Storage',
  Network = 'Network',
  Interface = 'Interface',
  Pool = 'Pool',
  Help = 'Help',
  Backup = 'Backup',
}

/**
 * Old dashboard configuration item interface.
 * This is stored in user attributes but no longer actively used by the new dashboard.
 * Kept for compatibility with older user data.
 */
export interface DashConfigItem {
  name: WidgetName;
  identifier?: string; // Comma separated 'key,value' eg. pool might have 'name,tank'
  rendered: boolean;
  position?: number;
  id?: string;
}
