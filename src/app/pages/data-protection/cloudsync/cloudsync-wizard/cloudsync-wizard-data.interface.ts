import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';

export interface CloudsyncWizardData extends CloudSyncTaskUpdate {
  provider: CloudsyncProviderName;
  name: string;
}
