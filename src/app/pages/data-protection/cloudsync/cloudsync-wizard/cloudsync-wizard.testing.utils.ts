import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';

export const httpProvider = {
  name: CloudSyncProviderName.Http,
  title: 'Http',
  buckets: false,
  bucket_title: 'Bucket',
  task_schema: [],
  credentials_schema: [],
  credentials_oauth: null,
} as CloudSyncProvider;

export const megaProvider = {
  name: CloudSyncProviderName.Mega,
  title: 'Mega',
  buckets: false,
  bucket_title: 'Bucket',
  task_schema: [],
  credentials_schema: [],
  credentials_oauth: null,
} as CloudSyncProvider;

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
  provider: CloudSyncProviderName.GooglePhotos,
  attributes: {
    client_id: 'test-client-id',
    client_secret: 'test-client-secret',
    token: 'test-token',
  },
};

export const httpProviderCreds = {
  id: 2,
  name: 'HTTP Provider',
  provider: CloudSyncProviderName.Http,
  attributes: {
    url: 'http',
  },
};

export const megaProviderCreds = {
  id: 3,
  name: 'test2',
  provider: CloudSyncProviderName.Mega,
  attributes: {
    user: 'login',
    pass: 'password',
  },
};
