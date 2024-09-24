export interface SystemRebootInfo {
  boot_id: string;
  reboot_required_reasons: RebootRequiredReasons[];
}

export interface FailoverRebootInfo {
  this_node: SystemRebootInfo;
  other_node: SystemRebootInfo | null;
}

export interface RebootRequiredReasons {
  code: string;
  reason: string;
}
