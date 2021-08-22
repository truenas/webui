import { ServiceName } from 'app/enums/service-name.enum';

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
    services_restart: ServiceName[];
    toggle_attachments?: boolean;
  },
];
