import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AuditEvent } from 'app/enums/audit-event.enum';
import { AuditEntry } from 'app/interfaces/audit.interface';

export function getLogImportantData(log: AuditEntry): string {
  switch (log.event) {
    case AuditEvent.Rename:
      return `${log.event_data?.src_file?.path} -> ${log.event_data?.dst_file?.path}`;
    case AuditEvent.Authentication:
      return `${T('Account')}: ${log.event_data?.clientAccount}`;
    case AuditEvent.Connect:
    case AuditEvent.Disconnect:
      return `${T('Host')}: ${log.event_data?.host}`;
    case AuditEvent.Create:
    case AuditEvent.Unlink:
      return `${T('File')}: ${log.event_data?.file?.path}`;
    case AuditEvent.Close:
    case AuditEvent.Read:
    case AuditEvent.Write:
    case AuditEvent.OffloadRead:
    case AuditEvent.OffloadWrite:
    case AuditEvent.SetAcl:
    case AuditEvent.SetAttr:
    case AuditEvent.SetQuota:
      return `${T('File')}: ${log.event_data?.file?.handle?.type}/${log.event_data?.file?.handle?.value}`;
    default:
      return ' - ';
  }
}
