export type PoolUnlockQuery = [
  /* mountpoint */ string,
  /* params */ {
    datasets: { name: string; passphrase: string }[];
    key_file: boolean;
    recursive: boolean;
    services_restart: string[];
  },
];

export interface PoolUnlockResult {
  failed: unknown;
  unlocked: string[];
}
