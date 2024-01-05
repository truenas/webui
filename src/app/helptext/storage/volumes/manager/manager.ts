import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextManager = {
  manager_sizeMessage: T('Estimated total raw data capacity'),

  manager_extendedSizeMessage: T('Estimated data capacity available after extension.'),

  manager_exportedDisksWarning: T(`The following disks have exported pools on them.
  Using those disks will make existing pools on them unable to be imported.
  You will lose any and all data in selected disks.`),

  manager_exportedSelectedDisksWarning: T('Some of the selected disks have exported pools on them. Using those disks will make existing pools on them unable to be imported. You will lose any and all data in selected disks.'),

  manager_exportedPoolsTooltip: T(`Some of the disks are attached to the exported pools
  mentioned in this list. Checking a pool name means you want to
  allow reallocation of the disks attached to that pool.`),

  manager_disknumErrorMessage: T('WARNING: Adding data VDEVs with different numbers of\
 disks is not recommended.'),

  manager_disknumErrorConfirmMessage: T('It is not recommended to create a pool with VDEVs\
 containing different numbers of disks. Continue?'),

  manager_disknumExtendConfirmMessage: T('It is not recommended to extend a pool with one or\
 more VDEVs containing different numbers of disks. Continue?'),

  manager_vdevtypeErrorMessage: T('Adding data VDEVs of different types is not supported.'),

  manager_stripeVdevTypeErrorMessage: T('VDEV is highly discouraged and will result in data loss if it fails'),
  manager_logVdevWarningMessage: T('A stripe log VDEV may result in data loss if it fails combined with a power outage.'),

  manager_diskAddWarning: T('The contents of all added disks will be erased.'),

  manager_diskExtendWarning: T('Added disks are erased, then the pool is extended onto\
 the new disks with the chosen topology. Existing data on the pool is kept intact.'),

  manager_name_tooltip: T('ZFS pools must conform to strict naming \
 <a href="https://docs.oracle.com/cd/E23824_01/html/821-1448/gbcpt.html" target="_blank">conventions</a>. \
 Choose a memorable name.'),

  manager_encryption_tooltip: T('Enable \
 <a href="https://zfsonlinux.org/manpages/0.8.3/man8/zfs.8.html" target="_blank">ZFS encryption</a> \
 for this pool and add an encryption algorithm selector.'),

  manager_suggested_layout_tooltip: T('Create a recommended formation\
 of VDEVs in a pool.'),

  manager_encryption_message: T('Encryption is for users storing sensitive data.\
  Pool-level encryption does not apply to the storage pool or disks in the pool. It applies\
  to the root dataset that shares the pool name and any child datasets created unless you change\
  the encryption at the time you create the child dataset. For more information on encryption please\
  refer to the <a href="http://TrueNAS.com/docs/" target="_blank">TrueNAS Documentation hub</a>.'),

  manual_disk_selection_message: T('VDEVs have been created through manual disk selection. To view or\
  edit your selections, press the "Edit Manual Disk Selection" button below. To start again with the\
  automated disk selection, hit the "Reset" button.'),

  enclosureOptionsDescription: T('Once an enclosure is selected, all other VDEV creation steps will limit disk selection options to disks in the selected enclosure. If the enclosure selection is changed, all disk selections will be reset.'),

  manager_duplicate_vdevs_tooltip: T('Create more data VDEVs like the first.'),

  force_title: T('Warning'),
  force_warning: T('The current pool layout is not recommended.\
 Override the following errors?'),
  force_warnings: {
    diskSizeWarning: T('One or more data VDEVs has disks of different sizes.'),
  },
  data_vdev_title: T('Data'),
  data_vdev_description: T('Normal VDEV type, used for primary storage operations. ZFS pools always have at least one DATA VDEV.'),
  cache_vdev_title: T('Cache'),
  cache_vdev_description: T('ZFS L2ARC read-cache that can be used with fast devices to accelerate read operations.'),
  log_vdev_title: T('Log'),
  log_vdev_description: T('ZFS LOG device that can improve speeds of synchronous writes. Optional write-cache that can be removed.'),
  spare_vdev_title: T('Hot Spare'),
  spare_vdev_description: T('Drive reserved for inserting into DATA pool VDEVs when an active drive has failed.'),
  special_vdev_title: T('Metadata'),
  special_vdev_description: T('Special Allocation class, used to create Fusion pools. Optional VDEV type\
 which is used to speed up metadata and small block IO.'),
  dedup_vdev_title: T('Dedup'),
  dedup_vdev_description: T('De-duplication tables are stored on this special VDEV type. These VDEVs must\
 be sized to X GiB for each X TiB of general storage.'),
  exported_pool_warning: T('This disk is part of the exported pool {pool}. Adding this disk to a new or other existing pools will make {pool} unable to import. You will lose any and all data in {pool}. Please make sure you have backed up any sensitive data in {pool} before reusing/repurposing this disk.'),

  dRaidTooltip: T('dRAID is a ZFS feature that boosts resilver speed and load distribution. Due to fixed stripe width disk space efficiency may be substantially worse with small files. \nOpt for dRAID over RAID-Z when handling large-capacity drives and extensive disk environments for enhanced performance.'),
  stripeTooltip: T('Each disk stores data. A stripe requires at least one disk and has no data redundancy.'),
  mirrorTooltip: T('Data is identical in each disk. A mirror requires at least two disks, provides the most redundancy, and has the least capacity.'),
  raidz1Tooltip: T('Uses one disk for parity while all other disks store data. RAIDZ1 requires at least three disks. RAIDZ is a traditional ZFS data protection scheme. \nChoose RAIDZ over dRAID when managing a smaller set of drives, where simplicity of setup and predictable disk usage are primary considerations.'),
  raidz2Tooltip: T('Uses two disks for parity while all other disks store data. RAIDZ2 requires at least four disks. RAIDZ is a traditional ZFS data protection scheme. \nChoose RAIDZ over dRAID when managing a smaller set of drives, where simplicity of setup and predictable disk usage are primary considerations.'),
  raidz3Tooltip: T('Uses three disks for parity while all other disks store data. RAIDZ3 requires at least five disks. RAIDZ is a traditional ZFS data protection scheme. \nChoose RAIDZ over dRAID when managing a smaller set of drives, where simplicity of setup and predictable disk usage are primary considerations.'),

  dRaidChildrenExplanation: T('The number of children must at the minimum accomodate the total number of disks required for the previous configuration options including parity drives.'),
};
