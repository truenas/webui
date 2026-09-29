export interface SystemRebootInfo {
  boot_id: string;
  reboot_required_reasons: RebootRequiredReasons[];
}

export interface RebootRequiredReasons {
  code: string;
  reason: string;
}
