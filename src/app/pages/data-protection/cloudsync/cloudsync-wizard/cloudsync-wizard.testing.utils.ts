import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';

export const httpProvider = {
  name: CloudsyncProviderName.Http,
  title: 'Http',
  buckets: false,
  bucket_title: 'Bucket',
  task_schema: [],
  credentials_schema: [],
  credentials_oauth: null,
} as CloudsyncProvider;

export const megaProvider = {
  name: CloudsyncProviderName.Mega,
  title: 'Mega',
  buckets: false,
  bucket_title: 'Bucket',
  task_schema: [],
  credentials_schema: [],
  credentials_oauth: null,
} as CloudsyncProvider;

export const storjProvider = {
  name: CloudsyncProviderName.Storj,
  title: 'Storj iX',
  credentials_schema: [],
  credentials_oauth: null,
  buckets: true,
  bucket_title: 'Bucket',
  task_schema: [],
} as CloudsyncProvider;

export const googlePhotosProvider = {
  name: CloudsyncProviderName.GooglePhotos,
  title: 'Google Photos',
  credentials_schema: [],
  credentials_oauth: null,
  buckets: false,
  bucket_title: 'Bucket',
  task_schema: [],
} as CloudsyncProvider;

export const googlePhotosCreds = {
  id: 1,
  name: 'Google Photos',
  provider: CloudsyncProviderName.GooglePhotos,
  attributes: {
    client_id: 'test-client-id',
    client_secret: 'test-client-secret',
    token: 'test-token',
  },
};

export const httpProviderCreds = {
  id: 2,
  name: 'HTTP Provider',
  provider: CloudsyncProviderName.Http,
  attributes: {
    url: 'http',
  },
};

export const megaProviderCreds = {
  id: 3,
  name: 'test2',
  provider: CloudsyncProviderName.Mega,
  attributes: {
    user: 'login',
    pass: 'password',
  },
};
