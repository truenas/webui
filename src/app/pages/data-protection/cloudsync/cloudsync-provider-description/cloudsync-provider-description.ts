import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';

export const cloudsyncProviderDescriptionMap = new Map<CloudSyncProviderName, string>([
  [CloudSyncProviderName.Storj, T('StorJ is an S3 compatible, fault tolerant, globally distributed cloud storage platform with a security first approach to backup and recovery - delivering extreme resilience and performance both sustainably and economically. <a href="https://truenas.com/storj" target="_blank">TrueNAS and Storj</a> have partnered to streamline delivery of Hybrid Cloud solutions globally.')],
]);
