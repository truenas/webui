// Constants matching middleware BOOT_POOL_NAME_VALID
export const bootPoolNames = ['freenas-boot', 'boot-pool'] as const;

export interface ZpoolCapacityAlertArgs {
  volume: string;
  capacity: number;
}

export function isBootPoolAlert(alertArgs: unknown): boolean {
  if (!alertArgs || typeof alertArgs !== 'object') {
    return false;
  }

  const args = alertArgs as ZpoolCapacityAlertArgs;
  return bootPoolNames.includes(args.volume as typeof bootPoolNames[number]);
}
