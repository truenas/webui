import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextPoolCreation = {
  exportedDisksWarning: T(`The following disks have exported pools on them.
  Using those disks will make existing pools on them unable to be imported.
  You will lose any and all data in selected disks.`),

  exportedSelectedDisksWarning: T('Some of the selected disks have exported pools on them. Using those disks will make existing pools on them unable to be imported. You will lose any and all data in selected disks.'),

  encryptionMessage: T('Encryption is for users storing sensitive data.\
  Pool-level encryption does not apply to the storage pool or disks in the pool. It applies\
  to the root dataset that shares the pool name and any child datasets created unless you change\
  the encryption at the time you create the child dataset. For more information on encryption please\
  refer to the <a href="http://TrueNAS.com/docs/" target="_blank">TrueNAS Documentation hub</a>.'),

  diskSelectionMessage: T('VDEVs have been created through manual disk selection. To view or\
  edit your selections, press the "Edit Manual Disk Selection" button below. To start again with the\
  automated disk selection, hit the "Reset" button.'),

  enclosureOptionsDescription: T('Once an enclosure is selected, all other VDEV creation steps will limit disk selection options to disks in the selected enclosure. If the enclosure selection is changed, all disk selections will be reset.'),

  dataVdevDescription: T('Normal VDEV type, used for primary storage operations. ZFS pools always have at least one DATA VDEV.'),
  cacheVdevDescription: T('ZFS L2ARC read-cache that can be used with fast devices to accelerate read operations.'),
  logVdevDescription: T('ZFS LOG device that can improve speeds of synchronous writes. Optional write-cache that can be removed.'),
  spareVdevDescription: T('Drive reserved for inserting into DATA pool VDEVs when an active drive has failed.'),
  specialVdevDescription: T('Special Allocation class, used to create Fusion pools. Optional VDEV type\
 which is used to speed up metadata and small block IO.'),
  dedupVdevDescription: T('De-duplication tables are stored on this special VDEV type. These VDEVs must\
 be sized to X GiB for each X TiB of general storage.'),
  exportedPoolWarning: T('This disk is part of the exported pool {pool}. Adding this disk to a new or other existing pools will make {pool} unable to import. You will lose any and all data in {pool}. Please make sure you have backed up any sensitive data in {pool} before reusing/repurposing this disk.'),

  dRaidTooltip: T('dRAID is a ZFS feature that boosts resilver speed and load distribution. Due to fixed stripe width disk space efficiency may be substantially worse with small files. \nOpt for dRAID over RAID-Z when handling large-capacity drives and extensive disk environments for enhanced performance.'),
  stripeTooltip: T('Each disk stores data. A stripe requires at least one disk and has no data redundancy.'),
  mirrorTooltip: T('Data is identical in each disk. A mirror requires at least two disks, provides the most redundancy, and has the least capacity.'),
  raidz1Tooltip: T('Uses one disk for parity while all other disks store data. RAIDZ1 requires at least three disks. RAIDZ is a traditional ZFS data protection scheme. \nChoose RAIDZ over dRAID when managing a smaller set of drives, where simplicity of setup and predictable disk usage are primary considerations.'),
  raidz2Tooltip: T('Uses two disks for parity while all other disks store data. RAIDZ2 requires at least four disks. RAIDZ is a traditional ZFS data protection scheme. \nChoose RAIDZ over dRAID when managing a smaller set of drives, where simplicity of setup and predictable disk usage are primary considerations.'),
  raidz3Tooltip: T('Uses three disks for parity while all other disks store data. RAIDZ3 requires at least five disks. RAIDZ is a traditional ZFS data protection scheme. \nChoose RAIDZ over dRAID when managing a smaller set of drives, where simplicity of setup and predictable disk usage are primary considerations.'),

  dRaidChildrenExplanation: T('The number of children must at the minimum accomodate the total number of disks required for the previous configuration options including parity drives.'),

  addVdevStripeSpecialWarning: T('Adding a stripe metadata VDEV introduces a single point of failure to your pool.'),
  addVdevStripeDedupWarning: T('Adding a stripe dedup VDEV introduces a single point of failure to your pool.'),

  // SED Encryption
  sedInfoMessage: T('SED-capable (Self-Encrypting Drive) disks detected. Hardware-based encryption provides better performance and security.'),
  sedGlobalPasswordInfo: T('The Global SED Password is a system-wide setting that applies to all pools using SED encryption.'),
  sedGlobalPasswordWarning: T('The Global SED Password is a system-wide setting. A password is already configured. Entering a new password here will update it for all pools using SED encryption.'),
  sedPasswordLabel: T('Global SED Password'),
  sedPasswordConfirmLabel: T('Confirm SED Password'),
  sedPasswordTooltip: T('This password will be used to configure all SED-capable disks in this pool.'),
  sedPasswordsMustMatch: T('SED passwords must match.'),
  encryptionTypeNone: T('None'),
  encryptionTypeSoftware: T('Software Encryption (ZFS)'),
  encryptionTypeSed: T('Self Encrypting Drives (SED)'),
  sedPoolVdevMessage: T('This pool uses SED encryption. Only SED-capable disks will be available for selection.'),
};
