import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum CloudSyncProviderName {
  AmazonS3 = 'S3',
  BackblazeB2 = 'B2',
  Box = 'BOX',
  Dropbox = 'DROPBOX',
  Ftp = 'FTP',
  GoogleCloudStorage = 'GOOGLE_CLOUD_STORAGE',
  GoogleDrive = 'GOOGLE_DRIVE',
  GooglePhotos = 'GOOGLE_PHOTOS',
  Http = 'HTTP',
  Hubic = 'HUBIC',
  Mega = 'MEGA',
  MicrosoftAzure = 'AZUREBLOB',
  MicrosoftOneDrive = 'ONEDRIVE',
  OpenstackSwift = 'OPENSTACK_SWIFT',
  Pcloud = 'PCLOUD',
  Sftp = 'SFTP',
  Storj = 'STORJ_IX',
  Webdav = 'WEBDAV',
  Yandex = 'YANDEX',
}

export enum OneDriveType {
  Personal = 'PERSONAL',
  Business = 'BUSINESS',
  DocumentLibrary = 'DOCUMENT_LIBRARY',
}

export const cloudSyncProviderNameMap = new Map<CloudSyncProviderName, string>([
  [CloudSyncProviderName.AmazonS3, T('Amazon S3')],
  [CloudSyncProviderName.BackblazeB2, T('Backblaze B2')],
  [CloudSyncProviderName.Box, T('Box')],
  [CloudSyncProviderName.Dropbox, T('Dropbox')],
  [CloudSyncProviderName.Ftp, T('FTP')],
  [CloudSyncProviderName.GoogleCloudStorage, T('Google Cloud Storage')],
  [CloudSyncProviderName.GoogleDrive, T('Google Drive')],
  [CloudSyncProviderName.GooglePhotos, T('Google Photos')],
  [CloudSyncProviderName.Hubic, T('Hubic')],
  [CloudSyncProviderName.Http, T('HTTP')],
  [CloudSyncProviderName.Mega, T('Mega')],
  [CloudSyncProviderName.MicrosoftAzure, T('Microsoft Azure')],
  [CloudSyncProviderName.MicrosoftOneDrive, T('Microsoft OneDrive')],
  [CloudSyncProviderName.OpenstackSwift, T('OpenStack Swift')],
  [CloudSyncProviderName.Pcloud, T('pCloud')],
  [CloudSyncProviderName.Sftp, T('SFTP')],
  [CloudSyncProviderName.Storj, T('Storj')],
  [CloudSyncProviderName.Webdav, T('WebDAV')],
  [CloudSyncProviderName.Yandex, T('Yandex')],
]);
