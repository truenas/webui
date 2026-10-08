import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { SetAcl } from 'app/interfaces/acl.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import {
  DatasetEncryptionSummary,
  DatasetEncryptionSummaryQueryParams,
} from 'app/interfaces/dataset-encryption-summary.interface';
import { DatasetUnlockParams, DatasetUnlockResult } from 'app/interfaces/dataset-lock.interface';
import { ExportParams } from 'app/interfaces/export-params.interface';
import { FailoverUpgradeParams } from 'app/interfaces/failover.interface';
import { FilesystemPutParams } from 'app/interfaces/filesystem-stat.interface';
import { Job } from 'app/interfaces/job.interface';
import { MailConfigUpdate, SendMailParams } from 'app/interfaces/mail-config.interface';
import { PoolScrubTaskParams } from 'app/interfaces/pool-scrub.interface';
import { CreatePool, Pool } from 'app/interfaces/pool.interface';
import { ServiceControlOptions } from 'app/interfaces/service.interface';
import { SystemDatasetConfig, SystemDatasetUpdate } from 'app/interfaces/system-dataset-config.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { UpdateParams } from 'app/interfaces/system-update.interface';
import { Tunable, TunableCreate, TunableUpdate } from 'app/interfaces/tunable.interface';
import { AttachTicketParams, CreateNewTicket, NewTicketResponse } from 'app/modules/feedback/interfaces/file-ticket.interface';

export interface ApiJobDirectory {
  // Audit
  'audit.export': { params: [ExportParams<AuditEntry>]; response: string };

  // Boot
  'boot.attach': { params: [disk: string, params: { expand?: boolean }]; response: void };
  'boot.replace': { params: [oldDisk: string, newDisk: string]; response: void };
  'boot.scrub': { params: void; response: void };

  // Certificate

  // CloudBackup
  'cloud_backup.sync': { params: [id: number, params?: { dry_run: boolean }]; response: void };

  // CloudSync
  'cloudsync.sync': { params: [id: number, params?: { dry_run: boolean }]; response: number };

  // Config
  'config.upload': { params: void; response: void };

  // Core
  'core.bulk': { params: CoreBulkQuery; response: CoreBulkResponse[] };

  // Disk

  // Failover
  'failover.events.vrrp_master': { params: void; response: void };
  'failover.upgrade': { params: [FailoverUpgradeParams]; response: boolean };

  // Filesystem
  'filesystem.put': { params: FilesystemPutParams; response: boolean };
  'filesystem.setacl': { params: [SetAcl]; response: void };

  // IPMI
  'ipmi.sel.clear': { params: void; response: void };

  // KMIP

  // Mail
  'mail.send': { params: [SendMailParams, MailConfigUpdate]; response: boolean };

  // Pool
  'pool.create': { params: [CreatePool]; response: Pool };
  'pool.scrub': { params: PoolScrubTaskParams; response: void };
  'pool.dataset.encryption_summary': {
    params: [path: string, params?: DatasetEncryptionSummaryQueryParams];
    response: DatasetEncryptionSummary[];
  };
  'pool.dataset.unlock': { params: [path: string, params: DatasetUnlockParams]; response: DatasetUnlockResult };

  // Replication
  'replication.run': { params: [id: number]; response: number };

  // Rsync
  'rsynctask.run': { params: [id: number]; response: null };

  // Service
  'service.control': {
    params: [operation: ServiceOperation, service: ServiceName, options?: ServiceControlOptions];
    response: boolean;
  };

  // Support
  'support.attach_ticket': { params: AttachTicketParams; response: Job };
  'support.new_ticket': { params: [CreateNewTicket]; response: NewTicketResponse };

  // System
  'system.security.update': { params: [Partial<SystemSecurityConfig>]; response: void };

  // SystemDataset
  'systemdataset.update': { params: [Partial<SystemDatasetUpdate>]; response: SystemDatasetConfig };

  // TrueNAS
  'truenas.set_production': {
    params: [production: boolean, attach_debug: boolean];
    response: { ticket: number; url: string };
  };

  // Tunable
  'tunable.create': { params: [TunableCreate]; response: Tunable };
  'tunable.delete': { params: [id: number]; response: true };
  'tunable.update': { params: [id: number, update: Partial<TunableUpdate>]; response: Tunable };

  // Update
  'update.file': { params: [{ resume: boolean }?]; response: void };
  'update.run': { params: [UpdateParams]; response: void };
}

export type ApiJobMethod = keyof ApiJobDirectory;
export type ApiJobParams<T extends ApiJobMethod> = ApiJobDirectory[T]['params'];
export type ApiJobResponse<T extends ApiJobMethod> = ApiJobDirectory[T]['response'];
