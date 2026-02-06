import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { tnIconMarker } from '@truenas/ui-components';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

export const storageEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('dns', 'material'),
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
  icon: tnIconMarker('dataset-root', 'custom'),
  message: T(`A dataset is a logical container within a pool used to organize your files and folders. <br>
 After you create a pool, this page will list all your datasets.`),
} as EmptyConfig;

export const dataProtectionEmptyConfig = {
  type: EmptyType.NoPageData,
  large: true,
  icon: tnIconMarker('security', 'material'),
  title: T('No Data Protection Tasks'),
  message: T(`This page will help you protect your data by syncing it with other systems on the cloud. <br>
 But first, you need to create a storage pool to get started.`),
} as EmptyConfig;

export const sharesEmptyConfig = {
  type: EmptyType.NoPageData,
  large: true,
  icon: tnIconMarker('folder_shared', 'material'),
  title: T('No Shares'),
  message: T(`Shares allow you to make your data accessible over the network. <br>
 You’ll need a pool and a dataset that you want to share.`),
} as EmptyConfig;

export const cloudSyncTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('cloud-outline', 'mdi'),
  message: T('Sync data to a popular cloud storage provider, such as: Google Drive and Photos, Dropbox, Amazon S3 and many others.'),
  large: true,
} as EmptyConfig;

export const cloudBackupTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('true-cloud', 'custom'),
  message: T('Back up to the decentralized network provided by Storj in partnership with TrueNAS.'),
  large: true,
} as EmptyConfig;

export const snapshotTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('file-multiple-outline', 'mdi'),
  message: T(`<p>Automatically create point-in-time snapshots of selected datasets at regular intervals.</p>
<p>These snapshots help preserve data states for recovery, backup, and versioning purposes,
 ensuring minimal data loss in case of accidental deletion or corruption.</p>`),
  large: true,
} as EmptyConfig;

export const rsyncTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('desktop-classic', 'mdi'),
  message: T('Best if you\'re syncing with a generic system that lacks ZFS capabilities.'),
  large: true,
} as EmptyConfig;

export const replicationTaskEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('replication', 'custom'),
  message: T('Best if you\'re syncing with another TrueNAS or ZFS system — enables advanced features not available with other methods.'),
  large: true,
} as EmptyConfig;

export const smbCardEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('smb-share', 'custom'),
  large: true,
  message: T(`<p>Well supported by all major operating systems, allows for easy authentication and authorization.</p>
<p>Choose SMB for easy file sharing across mixed operating systems, especially in home or office networks.</p>`),
} as EmptyConfig;

export const nfsCardEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('nfs-share', 'custom'),
  large: true,
  message: T(`<p>Optimized for Linux and Unix systems, offering deeper integration in those environments. </p>
<p>Choose NFS if you're working primarily with Linux servers or need efficient file access in Unix-based workflows.</p>`),
} as EmptyConfig;

export const iscsiCardEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('iscsi-share', 'custom'),
  large: true,
  message: T(`<p>Raw block storage over the network, appearing as a local disk on the client.</p>
<p>Ideal for virtual machines or applications that require direct disk-level access.</p>`),
} as EmptyConfig;

export const nvmeOfEmptyConfig = {
  type: EmptyType.NoPageData,
  icon: tnIconMarker('nvme-share', 'custom'),
  large: true,
  message: T(`<p>Raw block storage using NVMe over Fabrics (e.g. NVMe/TCP), appearing as a local disk on the client.</p>
<p>Compared to iSCSI, NVMe-oF offers significantly lower latency and higher throughput.</p>`),
} as EmptyConfig;

export const installedAppsEmptyConfig = {
  type: EmptyType.NoPageData,
  title: T('No Applications Installed'),
  icon: tnIconMarker('apps', 'material'),
  large: true,
  message: T(`Applications you install will automatically appear here.
 <br> Click below and browse available apps to get started.`),
} as EmptyConfig;

export const containersEmptyConfig = {
  type: EmptyType.NoPageData,
  title: T('No containers'),
  icon: tnIconMarker('laptop', 'mdi'),
  large: true,
  message: T('Containers you create will automatically appear here.'),
} as EmptyConfig;

export const noSearchResultsConfig = {
  type: EmptyType.NoSearchResults,
  title: T('No Search Results.'),
  message: T('No matching results found'),
  large: true,
} as EmptyConfig;

export const loadingConfig = {
  type: EmptyType.Loading,
  large: false,
  title: T('Loading...'),
} as EmptyConfig;

export const errorsConfig = {
  type: EmptyType.Errors,
  large: true,
  title: T('Cannot retrieve response'),
} as EmptyConfig;

export const noItemsConfig = {
  title: T('No records have been added yet'),
  type: EmptyType.NoPageData,
  large: true,
} as EmptyConfig;
