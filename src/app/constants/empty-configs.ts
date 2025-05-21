import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';

export const storageEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: iconMarker('dns'),
  large: true,
  title: T('No Pools'),
  message: T(`Storage features in TrueNAS require at least one Pool to exist. <br>
 A Pool is a group of disks working together to store and protect your data. <br>
 Once you have a pool, this page will provide an overview of your pool’s health and status.`),
} as EmptyConfig;

export const datasetEmptyConfig = {
  type: EmptyType.NoPageData,
  large: true,
  title: T('No Datasets'),
  icon: iconMarker('ix-dataset-root'),
  message: T(`A dataset is a logical container within a pool used to organize your files and folders. <br> \n
 After you create a pool, this page will list all your datasets.`),
} as EmptyConfig;

export const dataProtectionEmptyConfig = {
  type: EmptyType.NoPageData,
  large: true,
  icon: iconMarker('security'),
  title: T('No Data Protection Tasks'),
  message: T(`This page will help you protect your data by syncing it with other systems on the cloud. <br> \n
 But first, you need to create a storage pool to get started.`),
} as EmptyConfig;

export const sharesEmptyConfig = {
  type: EmptyType.NoPageData,
  large: true,
  icon: iconMarker('folder_shared'),
  title: T('No Shares'),
  message: T(`Shares allow you to make your data accessible over the network. <br> \n
 You’ll need a pool and a dataset that you want to share.`),
} as EmptyConfig;

export const cloudSyncTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: iconMarker('security'),
  title: T('No Cloud Sync Tasks'),
  message: T('Sync data to a popular cloud storage provider, such as: Google Drive and Photos, Dropbox, Amazon S3 and many others.'),
  large: true,
} as EmptyConfig;

export const cloudBackupTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: iconMarker('security'),
  title: T('No TrueCloud Backup Tasks'),
  message: T('Back up to the decentralized network provided by Storj in partnership with TrueNAS.'),
  large: true,
} as EmptyConfig;

export const snapshotTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: iconMarker('security'),
  title: T('No Periodic Snapshot Tasks'),
  message: T('No Periodic Snapshot Tasks configured'),
  large: true,
} as EmptyConfig;

export const rsyncTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: iconMarker('security'),
  title: T('No Rsync Tasks'),
  message: T('Best if you\'re syncing with a generic system that lacks ZFS capabilities.'),
  large: true,
} as EmptyConfig;

export const replicationTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: iconMarker('security'),
  title: T('No Replication Tasks'),
  message: T('Best if you\'re syncing with another TrueNAS or ZFS system — enables advanced features not available with other methods.'),
  large: true,
} as EmptyConfig;

export const smbCardEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: iconMarker('folder_shared'),
  title: T('No Windows (SMB) Shares'),
  large: true,
  message: T(`Well supported by all major operating systems, allows for easy authentication and authorization.
 <br> Choose SMB for easy file sharing across mixed operating systems, especially in home or office networks.
`),
} as EmptyConfig;
