import { TranslateService } from '@ngx-translate/core';
import { AuditEvent } from 'app/enums/audit-event.enum';
import { AuditEntry } from 'app/interfaces/audit.interface';

export function getLogImportantData(log: AuditEntry, translateService: TranslateService): string {
  switch (log.event) {
    case AuditEvent.Rename:
      return `${log.event_data?.src_file?.path} -> ${log.event_data?.dst_file?.path}`;
    case AuditEvent.Authentication:
      return translateService.instant('Account: {account}', { account: log.event_data?.clientAccount });
    case AuditEvent.Connect:
    case AuditEvent.Disconnect:
      return translateService.instant('Host: {host}', { host: log.event_data?.host });
    case AuditEvent.Create:
    case AuditEvent.Unlink:
      return translateService.instant('File: {filename}', { filename: log.event_data?.file?.path });
    case AuditEvent.Close:
    case AuditEvent.Read:
    case AuditEvent.Write:
    case AuditEvent.OffloadRead:
    case AuditEvent.OffloadWrite:
    case AuditEvent.SetAcl:
    case AuditEvent.SetAttr:
    case AuditEvent.SetQuota:
      return translateService.instant('File: {filename}', { filename: `${log.event_data?.file?.handle?.type}/${log.event_data?.file?.handle?.value}` });
    default:
      return ' - ';
  }
}
