import { SetAcl } from 'app/interfaces/acl.interface';
import { LeaveActiveDirectory } from 'app/interfaces/active-directory-config.interface';
import { Catalog, CatalogCreate } from 'app/interfaces/catalog.interface';
import { Certificate, CertificateCreate, CertificateUpdate } from 'app/interfaces/certificate.interface';
import {
  ChartRollbackParams,
  ChartScaleQueryParams,
  ChartScaleResult,
} from 'app/interfaces/chart-release-event.interface';
import {
  ChartRelease,
  ChartReleaseCreate,
  ChartReleaseUpdate,
  ChartReleaseUpgrade,
} from 'app/interfaces/chart-release.interface';
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
import { DatasetPermissionsUpdate } from 'app/interfaces/dataset-permissions.interface';
import { FailoverUpgradeParams } from 'app/interfaces/failover.interface';
import { FilesystemPutParams } from 'app/interfaces/filesystem-stat.interface';
import { IpmiEvent } from 'app/interfaces/ipmi.interface';
import { Job } from 'app/interfaces/job.interface';
import { KmipConfig, KmipConfigUpdate } from 'app/interfaces/kmip-config.interface';
import { KubernetesConfig, KubernetesConfigUpdate } from 'app/interfaces/kubernetes-config.interface';
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
import { DiskWipeParams } from 'app/interfaces/storage.interface';
import { AttachTicketParams, CreateNewTicket, NewTicketResponse } from 'app/interfaces/support.interface';
import { SystemDatasetConfig, SystemDatasetUpdate } from 'app/interfaces/system-dataset-config.interface';
import { UpdateParams } from 'app/interfaces/system-update.interface';
import { Tunable, TunableCreate, TunableUpdate } from 'app/interfaces/tunable.interface';
import { VmStopParams } from 'app/interfaces/virtual-machine.interface';

export interface ApiJobDirectory {
  // Active Directory
  'activedirectory.leave': { params: [LeaveActiveDirectory]; response: void };

  // Boot
  'boot.attach': { params: [disk: string, params: { expand?: boolean }]; response: void };
  'boot.replace': { params: [oldDisk: string, newDisk: string]; response: void };
  'boot.scrub': { params: void; response: void };

  // Boot Environment
  'bootenv.delete': { params: [string]; response: boolean };

  // Catalog
  'catalog.create': { params: [CatalogCreate]; response: Catalog };
  'catalog.sync': { params: [label: string]; response: void };
  'catalog.sync_all': { params: void; response: void };

  // Certificate
  'certificate.create': { params: [CertificateCreate]; response: Certificate };
  'certificate.delete': { params: [id: number, force?: boolean]; response: boolean };
  'certificate.update': { params: [id: number, update: CertificateUpdate]; response: Certificate };

  // Chart Release
  'chart.release.create': { params: [ChartReleaseCreate]; response: ChartRelease };
  'chart.release.delete': { params: [string, { delete_unused_images: boolean }]; response: boolean };
  'chart.release.rollback': { params: [name: string, params: ChartRollbackParams]; response: ChartRelease };
  'chart.release.scale': { params: ChartScaleQueryParams; response: ChartScaleResult };
  'chart.release.update': { params: [name: string, update: ChartReleaseUpdate]; response: ChartRelease };
  'chart.release.upgrade': { params: [name: string, upgrade: ChartReleaseUpgrade]; response: ChartRelease };

  // Cloudsync
  'cloudsync.sync': { params: [id: number, params?: { dry_run: boolean }]; response: number };
  'cloudsync.sync_onetime': { params: [task: CloudSyncTaskUpdate, params: { dry_run?: boolean }]; response: void };

  // Container
  'container.image.pull': { params: [PullContainerImageParams]; response: PullContainerImageResponse };

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
  'failover.upgrade': { params: [FailoverUpgradeParams]; response: boolean };
  'failover.upgrade_finish': { params: void; response: boolean };

  // Filesystem
  'filesystem.put': { params: FilesystemPutParams; response: boolean };
  'filesystem.setacl': { params: [SetAcl]; response: void };

  // idmap
  'idmap.clear_idmap_cache': { params: void; response: void };

  // IPMI
  'ipmi.sel.clear': { params: void; response: void };
  'ipmi.sel.elist': { params: void; response: IpmiEvent[] };

  // KMIP
  'kmip.update': { params: [KmipConfigUpdate]; response: KmipConfig };

  // Kubernetes
  'kubernetes.update': { params: [Partial<KubernetesConfigUpdate>]; response: KubernetesConfig };

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
  'pool.dataset.permission': { params: DatasetPermissionsUpdate; response: number };
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
