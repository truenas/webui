import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum CloudsyncProviderName {
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
  MicrosoftOnedrive = 'ONEDRIVE',
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

export const cloudsyncProviderNameMap = new Map<CloudsyncProviderName, string>([
  [CloudsyncProviderName.AmazonS3, T('Amazon S3')],
  [CloudsyncProviderName.BackblazeB2, T('Backblaze B2')],
  [CloudsyncProviderName.Box, T('Box')],
  [CloudsyncProviderName.Dropbox, T('Dropbox')],
  [CloudsyncProviderName.Ftp, T('FTP')],
  [CloudsyncProviderName.GoogleCloudStorage, T('Google Cloud Storage')],
  [CloudsyncProviderName.GoogleDrive, T('Google Drive')],
  [CloudsyncProviderName.GooglePhotos, T('Google Photos')],
  [CloudsyncProviderName.Hubic, T('Hubic')],
  [CloudsyncProviderName.Http, T('HTTP')],
  [CloudsyncProviderName.Mega, T('Mega')],
  [CloudsyncProviderName.MicrosoftAzure, T('Microsoft Azure')],
  [CloudsyncProviderName.MicrosoftOnedrive, T('Microsoft OneDrive')],
  [CloudsyncProviderName.OpenstackSwift, T('OpenStack Swift')],
  [CloudsyncProviderName.Pcloud, T('pCloud')],
  [CloudsyncProviderName.Sftp, T('SFTP')],
  [CloudsyncProviderName.Storj, T('Storj')],
  [CloudsyncProviderName.Webdav, T('WebDAV')],
  [CloudsyncProviderName.Yandex, T('Yandex')],
]);
