export type DatasetLockParams = [
  id: string,
  params?: { force_umount: boolean },
];

export interface DatasetUnlockResult {
  failed: Record<string, {
    error: string;
    skipped: string[];
  }>;
  unlocked: string[];
}

export interface DatasetUnlockParams {
  datasets: { name: string; key?: string; passphrase: string }[];
  key_file: boolean;
  recursive: boolean;
  toggle_attachments?: boolean;
}
