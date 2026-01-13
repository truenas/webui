// Constants matching middleware BOOT_POOL_NAME_VALID
export const bootPoolNames = ['freenas-boot', 'boot-pool'] as const;

export interface ZpoolCapacityAlertArgs {
  volume: string;
  capacity: number;
}

export function isBootPoolAlert(alertArgs: unknown): alertArgs is ZpoolCapacityAlertArgs {
  if (!alertArgs || typeof alertArgs !== 'object') {
    return false;
  }

  const args = alertArgs as Record<string, unknown>;
  return typeof args.volume === 'string' && bootPoolNames.includes(args.volume as typeof bootPoolNames[number]);
}
