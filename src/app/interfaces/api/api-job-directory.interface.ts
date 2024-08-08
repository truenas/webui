import { DockerConfig, DockerConfigUpdate } from 'app/enums/docker-config.interface';
import { SetAcl } from 'app/interfaces/acl.interface';
import { ActiveDirectoryConfig, LeaveActiveDirectory } from 'app/interfaces/active-directory-config.interface';
import { ActiveDirectoryUpdate } from 'app/interfaces/active-directory.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { Certificate, CertificateCreate, CertificateUpdate } from 'app/interfaces/certificate.interface';
import {
  ChartRollbackParams,
  AppStartQueryParams,
  ChartScaleResult,
  AppDeleteParams,
} from 'app/interfaces/chart-release-event.interface';
import {
  App,
  AppCreate,
  AppUpdate,
  AppUpgrade,
  AppUpgradeParams,
} from 'app/interfaces/chart-release.interface';
import { CloudBackupRestoreParams, CloudBackupSnapshot } from 'app/interfaces/cloud-backup.interface';
import { CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { ConfigResetParams } from 'app/interfaces/config-reset-params.interface';
import { PullContainerImageParams, PullContainerImageResponse } from 'app/interfaces/container-image.interface';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { DatasetChangeKeyParams } from 'app/interfaces/dataset-change-key.interface';
import {
  DatasetEncryptionSummary,
  DatasetEncryptionSummaryQueryParams,
} from 'app/interfaces/dataset-encryption-summary.interface';
import { DatasetLockParams, DatasetUnlockParams, DatasetUnlockResult } from 'app/interfaces/dataset-lock.interface';
import { DiskWipeParams } from 'app/interfaces/disk.interface';
import { ExportParams } from 'app/interfaces/export-params.interface';
import { FailoverUpgradeParams } from 'app/interfaces/failover.interface';
import { FilesystemPutParams, FilesystemSetPermParams } from 'app/interfaces/filesystem-stat.interface';
import { IpmiEvent } from 'app/interfaces/ipmi.interface';
import { Job } from 'app/interfaces/job.interface';
import { KmipConfig, KmipConfigUpdate } from 'app/interfaces/kmip-config.interface';
import { LdapConfig, LdapConfigUpdate } from 'app/interfaces/ldap-config.interface';
import { MailConfigUpdate, SendMailParams } from 'app/interfaces/mail-config.interface';
import { PoolExportParams } from 'app/interfaces/pool-export.interface';
import { PoolFindResult, PoolImportParams } from 'app/interfaces/pool-import.interface';
import { PoolRemoveParams } from 'app/interfaces/pool-remove.interface';
import { PoolScrubTaskParams } from 'app/interfaces/pool-scrub.interface';
import {
  CreatePool,
  Pool,
  PoolAttachParams,
  PoolExpandParams,
  PoolReplaceParams,
  UpdatePool,
} from 'app/interfaces/pool.interface';
import { SystemDatasetConfig, SystemDatasetUpdate } from 'app/interfaces/system-dataset-config.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { UpdateParams } from 'app/interfaces/system-update.interface';
import { Tunable, TunableCreate, TunableUpdate } from 'app/interfaces/tunable.interface';
import { VmStopParams } from 'app/interfaces/virtual-machine.interface';
import { AttachTicketParams, CreateNewTicket, NewTicketResponse } from 'app/modules/feedback/interfaces/file-ticket.interface';

export interface ApiJobDirectory {
  // Active Directory
  'activedirectory.update': { params: [ActiveDirectoryUpdate]; response: ActiveDirectoryConfig };
  'activedirectory.leave': { params: [LeaveActiveDirectory]; response: void };

  // Audit
  'audit.export': { params: [ExportParams<AuditEntry>]; response: string };

  // Boot
  'boot.attach': { params: [disk: string, params: { expand?: boolean }]; response: void };
  'boot.replace': { params: [oldDisk: string, newDisk: string]; response: void };
  'boot.scrub': { params: void; response: void };

  // Boot Environment
  'bootenv.delete': { params: [string]; response: boolean };

  // Catalog
  'catalog.sync': { params: [label: string]; response: void };

  // Certificate
  'certificate.create': { params: [CertificateCreate]; response: Certificate };
  'certificate.delete': { params: [id: number, force?: boolean]; response: boolean };
  'certificate.update': { params: [id: number, update: CertificateUpdate]; response: Certificate };

  // App
  'app.create': { params: [AppCreate]; response: App };
  'app.update': { params: [string, AppUpdate]; response: App };
  'app.start': { params: AppStartQueryParams; response: void };
  'app.stop': { params: AppStartQueryParams; response: void };
  'app.delete': { params: AppDeleteParams; response: boolean };
  'app.upgrade': { params: AppUpgradeParams; response: App };

  // Chart Release
  'chart.release.create': { params: [AppCreate]; response: App };
  'chart.release.delete': { params: [string, { delete_unused_images: boolean }]; response: boolean };
  'chart.release.rollback': { params: [name: string, params: ChartRollbackParams]; response: App };
  'chart.release.scale': { params: AppStartQueryParams; response: ChartScaleResult };
  'chart.release.update': { params: [name: string, update: AppUpdate]; response: App };
  'chart.release.upgrade': { params: [name: string, upgrade: AppUpgrade]; response: App };

  // CloudBackup
  'cloud_backup.sync': { params: [id: number, params?: { dry_run: boolean }]; response: void };
  'cloud_backup.restore': { params: CloudBackupRestoreParams; response: CloudBackupSnapshot[] };

  // CloudSync
  'cloudsync.sync': { params: [id: number, params?: { dry_run: boolean }]; response: number };
  'cloudsync.sync_onetime': { params: [task: CloudSyncTaskUpdate, params: { dry_run?: boolean }]; response: void };

  // Container
  'app.image.pull': { params: [PullContainerImageParams]; response: PullContainerImageResponse };

  // Config
  'config.reset': { params: [ConfigResetParams]; response: void };
  'config.upload': { params: void; response: void };

  // Core
  'core.bulk': { params: CoreBulkQuery; response: CoreBulkResponse[] };

  // Directory Services
  'directoryservices.cache_refresh': { params: void; response: void };

  // Disk
  'disk.wipe': { params: DiskWipeParams; response: void };

  // Failover
  'failover.reboot.other_node': { params: void; response: void };
  'failover.upgrade': { params: [FailoverUpgradeParams]; response: boolean };
  'failover.upgrade_finish': { params: void; response: boolean };

  // Filesystem
  'filesystem.put': { params: FilesystemPutParams; response: boolean };
  'filesystem.setacl': { params: [SetAcl]; response: void };
  'filesystem.setperm': { params: [FilesystemSetPermParams]; response: void };

  // idmap
  'idmap.clear_idmap_cache': { params: void; response: void };

  // IPMI
  'ipmi.sel.clear': { params: void; response: void };
  'ipmi.sel.elist': { params: void; response: IpmiEvent[] };

  // KMIP
  'kmip.update': { params: [KmipConfigUpdate]; response: KmipConfig };

  // Docker
  'docker.update': { params: [DockerConfigUpdate]; response: DockerConfig };

  // LDAP
  'ldap.update': { params: [LdapConfigUpdate]; response: LdapConfig };

  // Mail
  'mail.send': { params: [SendMailParams, MailConfigUpdate]; response: boolean };

  // Pool
  'pool.attach': { params: [id: number, params: PoolAttachParams]; response: void };
  'pool.create': { params: [CreatePool]; response: Pool };
  'pool.expand': { params: PoolExpandParams; response: null };
  'pool.export': { params: PoolExportParams; response: void };
  'pool.import_find': { params: void; response: PoolFindResult[] };
  'pool.import_pool': { params: [PoolImportParams]; response: boolean };
  'pool.remove': { params: PoolRemoveParams; response: void };
  'pool.replace': { params: [id: number, params: PoolReplaceParams]; response: boolean };
  'pool.scrub': { params: PoolScrubTaskParams; response: void };
  'pool.update': { params: [id: number, update: UpdatePool]; response: Pool };
  'pool.dataset.change_key': { params: [id: string, params: DatasetChangeKeyParams]; response: void };
  'pool.dataset.encryption_summary': {
    params: [path: string, params?: DatasetEncryptionSummaryQueryParams];
    response: DatasetEncryptionSummary[];
  };
  'pool.dataset.export_key': { params: [id: string, download?: boolean]; response: string };
  'pool.dataset.lock': { params: DatasetLockParams; response: boolean };
  'pool.dataset.unlock': { params: [path: string, params: DatasetUnlockParams]; response: DatasetUnlockResult };

  // Replication
  'replication.run': { params: [id: number]; response: number };

  // Rsync
  'rsynctask.run': { params: [id: number]; response: null };

  // Support
  'support.attach_ticket': { params: AttachTicketParams; response: Job };
  'support.new_ticket': { params: [CreateNewTicket]; response: NewTicketResponse };

  // System
  'system.reboot': { params: { delay?: number }; response: void };
  'system.shutdown': { params: { delay?: number }; response: void };
  'system.security.update': { params: [SystemSecurityConfig]; response: void };

  // SystemDataset
  'systemdataset.update': { params: [SystemDatasetUpdate]; response: SystemDatasetConfig };

  // TrueNAS
  'truenas.set_production': {
    params: [production: boolean, attach_debug: boolean];
    response: { ticket: number; url: string };
  };

  // Tunable
  'tunable.create': { params: [TunableCreate]; response: Tunable };
  'tunable.delete': { params: [id: number]; response: true };
  'tunable.update': { params: [id: number, update: TunableUpdate]; response: Tunable };

  // Update
  'update.download': { params: void; response: boolean };
  'update.file': { params: [{ resume: boolean }?]; response: void };
  'update.update': { params: [UpdateParams]; response: void };

  // VM
  'vm.restart': { params: [id: number]; response: void };
  'vm.stop': { params: VmStopParams; response: void };
}

export type ApiJobMethod = keyof ApiJobDirectory;
export type ApiJobParams<T extends ApiJobMethod> = ApiJobDirectory[T]['params'];
export type ApiJobResponse<T extends ApiJobMethod> = ApiJobDirectory[T]['response'];
