import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';

export interface CloudSyncWizardData extends CloudSyncTaskUpdate {
  provider: CloudSyncProviderName;
  name: string;
}
