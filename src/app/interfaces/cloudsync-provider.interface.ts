import { CloudsyncProviderName } from 'app/enums/cloudsync-provider-name.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';

export interface CloudsyncProvider {
  bucket_title: string;
  buckets: boolean;
  credentials_oauth: string;
  credentials_schema: any[];
  name: CloudsyncProviderName;
  task_schema: any[];
  title: CloudsyncProviderName;
}

export type CloudsyncRestoreParams = [
  id: number,
  params: {
    description: string;
    transfer_mode: TransferMode;
    path: string;
  },
];
