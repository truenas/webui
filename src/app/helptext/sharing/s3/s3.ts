import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSharingS3 = {
  nameTooltip: T('Bucket name following the S3 rules: 3 to 63 characters of lowercase letters, digits, dots and\
 hyphens, starting and ending with a letter or digit.'),
  parentDatasetTooltip: T('The bucket gets a new dataset of its own under this dataset, named after the bucket.\
 Objects live in the <i>s3data</i> directory under it.'),
  ownerTooltip: T('Account that owns the bucket. The owner bypasses the grants and owns the <i>s3data</i>\
 directory when the S3 service creates it.'),
  enabledTooltip: T('Whether the bucket is served. Toggling restarts the S3 service.'),
  permissionsModelTooltip: T('<b>S3 Only</b>: the S3 service is the only door to the dataset. Its filesystem\
 permissions are ignored, and the grants decide access.<br>\
 <b>Multiprotocol</b>: SMB or NFS share the tree, so its filesystem ACL is enforced for S3 callers as well as the\
 grants. S3 ACLs are not supported on such a bucket.'),
  objectOwnershipTooltip: T('Who owns an uploaded object, and whether the bucket supports S3 ACLs.<br>\
 <b>Bucket Owner Enforced</b>: the owner owns every object and ACLs are disabled, so the grants are the whole of\
 the bucket\'s access control and a grantee needs no permissions on the dataset.<br>\
 <b>Bucket Owner Preferred</b>: the owner owns objects uploaded with the bucket-owner-full-control ACL; any other\
 upload is owned by the account that wrote it.<br>\
 <b>Object Writer</b>: the account that uploads an object owns it and may grant access to it through ACLs.'),
  objectOwnershipMultiprotocolHint: T('A Multiprotocol bucket always runs as the object writer: the other\
 protocols\' users own the filesystem permissions.'),
  grantsTooltip: T('Who may access the bucket and how, beyond its owner. A <b>Deny</b> grant refuses every\
 operation for the principal and outranks the owner.'),
  globalGrantsTooltip: T('Grants that apply to every bucket. A <b>Deny</b> here suspends the principal everywhere.'),
  versioningTooltip: T('Keep previous versions of objects. Object lock keeps versioning enabled.'),
  versioningLockedHint: T('Kept enabled while object lock is on.'),
  snapshotVersionsTooltip: T('Patterns over the names of the bucket dataset\'s ZFS snapshots, with <i>*</i> and\
 <i>?</i> as the only wildcards. Every matching snapshot serves each object\'s state as a read-only version.'),
  snapshotVersionsMaxTooltip: T('How many of the newest matching snapshots one version listing consults.'),
  multipartEtagTooltip: T('<b>Composite</b> is the standard S3 construction and costs an MD5 pass over every\
 part. <b>Minted</b> skips that pass and gives the object an opaque token. Choose Minted only where nothing\
 writing the bucket reads its ETags, such as a backup target with its own checksums.'),
  objectLockTooltip: T('Protect objects from being overwritten or deleted for a retention period, as backup\
 targets expect. Turns on versioning, which object lock requires.'),
  objectLockMultiprotocolHint: T('Not available with the Multiprotocol permissions model: another protocol could\
 rewrite a locked object.'),
  objectLockDefaultModeTooltip: T('Retention mode applied to new objects. <b>Compliance</b> cannot be shortened or\
 removed by anyone for the retention period. <b>Governance</b> can be overridden by users with the special\
 permission. Leave empty for no default rule.'),
  objectLockDefaultDaysTooltip: T('Retention period of the default object lock rule in days.'),
  auditTooltip: T('Which S3 actions on this bucket are recorded in the audit log.'),
  auditOverflowTooltip: T('What an audited request gets when no audit record slot is free.'),

  listenersTooltip: T('Where the S3 service listens. Leave empty to listen on every address on port 9000 in\
 plaintext. Changing it restarts the service.'),
  listenerTlsTooltip: T('Serve this address over TLS with the certificate below.'),
  certificateTooltip: T('Certificate served by the TLS listeners. Leave empty to use the UI certificate, so a\
 renewal or a change there reaches the S3 service too.'),
  serversTooltip: T('Number of servers handling the listen addresses, at most eight and no more than the system\
 has CPUs. Each server carries its own connection pool and buffering, so more of them cost memory.'),
  regionTooltip: T('Region name echoed to clients. Leave empty to accept whatever a client signs for.'),
  logLevelTooltip: T('Least serious log record the S3 service keeps. <b>Info</b> adds one record per request.'),
  defaultAuditTooltip: T('Actions audited on every bucket that does not set its own audit mask.'),

  accessKeyNameTooltip: T('Human-readable name for the access key.'),
  accessKeyUsernameTooltip: T('Account the access key belongs to. The S3 service runs requests signed with this\
 key as that account.'),
  accessKeyEnabledTooltip: T('A disabled key is refused by the S3 service.'),

  deleteBucketMessage: T('The bucket\'s dataset and every object in it are left in place.\
 The S3 service simply stops serving them.'),
};
