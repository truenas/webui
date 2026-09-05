import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSharingS3 = {
  nameTooltip: T('Bucket name following the S3 rules: 3 to 63 characters of lowercase letters, digits, dots and \
 hyphens, starting and ending with a letter or digit.'),
  parentDatasetTooltip: T('The bucket gets a new dataset of its own under this dataset, named after the bucket. \
 Objects live in the <i>s3data</i> directory under it.'),
  ownerTooltip: T('Account that owns the bucket. The owner bypasses the grants and owns the <i>s3data</i> \
 directory when the S3 service creates it.'),
  enabledTooltip: T('Whether the bucket is served. Toggling restarts the S3 service.'),
  permissionsModelTooltip: T('<b>S3 Only</b>: only the S3 service writes the dataset and every object is written \
 under the account that put it.<br>\
 <b>Multiprotocol</b>: other protocols share the tree, so file permissions also apply to reads.<br>\
 <b>Bucket Owner Enforced</b>: every read and write runs as the owner, so the grants are the whole of the \
 bucket\'s access control.'),
  grantsTooltip: T('Who may access the bucket and how, beyond its owner. A <b>Deny</b> grant refuses every \
 operation for the principal and outranks the owner.'),
  globalGrantsTooltip: T('Grants that apply to every bucket. A <b>Deny</b> here suspends the principal everywhere.'),
  versioningTooltip: T('Keep previous versions of objects. Object lock requires versioning to be Enabled.'),
  snapshotVersionsTooltip: T('Patterns over the names of the bucket dataset\'s ZFS snapshots, with <i>*</i> and \
 <i>?</i> as the only wildcards. Every matching snapshot serves each object\'s state as a read-only version.'),
  snapshotVersionsMaxTooltip: T('How many of the newest matching snapshots one version listing consults.'),
  multipartEtagTooltip: T('<b>Composite</b> is the standard S3 construction and costs an MD5 pass over every \
 part. <b>Minted</b> skips that pass and gives the object an opaque token. Choose Minted only where nothing \
 writing the bucket reads its ETags, such as a backup target with its own checksums.'),
  objectLockTooltip: T('Requires versioning to be Enabled and a permissions model other than Multiprotocol.'),
  objectLockDefaultModeTooltip: T('Retention mode of the default object lock rule. Leave empty for no default rule.'),
  objectLockDefaultDaysTooltip: T('Retention period of the default object lock rule in days.'),
  auditTooltip: T('Which S3 actions on this bucket are recorded in the audit log.'),
  auditOverflowTooltip: T('What an audited request gets when no audit record slot is free.'),
  auditLicenseHint: T('Auditing the S3 service requires an Enterprise license.'),

  listenersTooltip: T('Where the S3 service listens. Leave empty to listen on every address on port 9000 in \
 plaintext. Changing it restarts the service.'),
  listenerTlsTooltip: T('Serve this address over TLS with the certificate below.'),
  certificateTooltip: T('Certificate served by the TLS listeners. Leave empty to use the UI certificate, so a \
 renewal or a change there reaches the S3 service too.'),
  serversTooltip: T('Number of servers handling the listen addresses, at most eight and no more than the system \
 has CPUs. Each server carries its own connection pool and buffering, so more of them cost memory.'),
  regionTooltip: T('Region name echoed to clients. Leave empty to accept whatever a client signs for.'),
  logLevelTooltip: T('Least serious log record the S3 service keeps. <b>Info</b> adds one record per request.'),
  defaultAuditTooltip: T('Actions audited on every bucket that does not set its own audit mask.'),

  accessKeyNameTooltip: T('Human-readable name for the access key.'),
  accessKeyUsernameTooltip: T('Account the access key belongs to. The S3 service runs requests signed with this \
 key as that account.'),
  accessKeyEnabledTooltip: T('A disabled key is refused by the S3 service.'),

  deleteBucketMessage: T('The bucket\'s dataset and every object in it are left in place. \
 The S3 service simply stops serving them.'),
};
