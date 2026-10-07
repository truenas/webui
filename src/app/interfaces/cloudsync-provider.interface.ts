import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';

export interface CloudSyncProvider {
  bucket_title: string;
  buckets: boolean;
  credentials_oauth: string | null;
  credentials_schema: unknown[];
  name: CloudSyncProviderName;
  task_schema: { property: string }[]; // Not really used
  title: string;
}
