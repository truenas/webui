import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { AuditEvent } from 'app/enums/audit-event.enum';
import { AuditEntry } from 'app/interfaces/audit.interface';
import { credentialTypeLabels } from 'app/interfaces/credential-type.interface';

export function getLogImportantData(log: AuditEntry, translateService: TranslateService): string {
  switch (log.event) {
    case AuditEvent.MethodCall:
      return log.event_data?.description || log.event_data?.method;
    case AuditEvent.Rename:
      return `${log.event_data?.src_file?.path} -> ${log.event_data?.dst_file?.path}`;
    case AuditEvent.Authentication:
      if (log.event_data?.credentials) {
        const credentialType = log.event_data?.credentials.credentials;
        const credentialTypeKey = credentialTypeLabels.get(credentialType);
        return translateService.instant(T('Credentials: {credentials}'), {
          credentials: credentialType ? translateService.instant(credentialTypeKey) : credentialType,
        });
      }
      return translateService.instant(T('Account: {account}'), { account: log.event_data?.clientAccount });
    case AuditEvent.Connect:
    case AuditEvent.Disconnect:
      return translateService.instant(T('Host: {host}'), { host: log.event_data?.host });
    case AuditEvent.Create:
    case AuditEvent.Unlink:
      return translateService.instant(T('File: {filename}'), { filename: log.event_data?.file?.path });
    case AuditEvent.Close:
    case AuditEvent.Read:
    case AuditEvent.Write:
    case AuditEvent.OffloadRead:
    case AuditEvent.OffloadWrite:
    case AuditEvent.SetAcl:
    case AuditEvent.SetAttr:
    case AuditEvent.SetQuota:
      return translateService.instant(T('File: {filename}'), { filename: `${log.event_data?.file?.handle?.type}/${log.event_data?.file?.handle?.value}` });
    default:
      return ' - ';
  }
}
