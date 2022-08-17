import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';

export interface CloudsyncProvider {
  bucket_title: string;
  buckets: boolean;
  credentials_oauth: string;
  credentials_schema: unknown[];
  name: CloudsyncProviderName;
  task_schema: unknown[]; // Not really used
  title: string;
}

export type CloudsyncRestoreParams = [
  id: number,
  params: {
    description: string;
    transfer_mode: TransferMode;
    path: string;
  },
];
