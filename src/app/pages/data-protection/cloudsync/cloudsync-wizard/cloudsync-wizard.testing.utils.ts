import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';

export const storjProvider = {
  name: CloudSyncProviderName.Storj,
  title: 'Storj iX',
  credentials_schema: [],
  credentials_oauth: null,
  buckets: true,
  bucket_title: 'Bucket',
  task_schema: [],
} as CloudSyncProvider;

export const googlePhotosProvider = {
  name: CloudSyncProviderName.GooglePhotos,
  title: 'Google Photos',
  credentials_schema: [],
  credentials_oauth: null,
  buckets: false,
  bucket_title: 'Bucket',
  task_schema: [],
} as CloudSyncProvider;

export const googlePhotosCreds = {
  id: 1,
  name: 'Google Photos',
  provider: {
    type: CloudSyncProviderName.GooglePhotos,
    client_id: 'test-client-id',
    client_secret: 'test-client-secret',
    token: 'test-token',
  },
};
