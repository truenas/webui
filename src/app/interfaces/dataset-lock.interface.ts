export interface DatasetUnlockResult {
  failed: {
    [path: string]: {
      error: string;
      skipped: string[];
    };
  };
  unlocked: string[];
}

export type DatasetUnlockParams = [
  path: string,
  params: {
    datasets: { name: string; key?: string; passphrase: string }[];
    key_file: boolean;
    recursive: boolean;
    toggle_attachments?: boolean;
  },
];
