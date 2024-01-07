import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { MiddlewareAuditEntry } from 'app/interfaces/audit/middleware-audit-entry.interface';
import { SmbAuditEntry } from 'app/interfaces/audit/smb-audit-entry.interface';
import { credentialTypeLabels } from 'app/interfaces/credential-type.interface';

export function getLogImportantData(log: AuditEntry, translateService: TranslateService): string {
  const service = log.service;
  switch (service) {
    case AuditService.Middleware:
      return getMiddlewareLogImportantData(log, translateService);
    case AuditService.Smb:
      return getSmbLogImportantData(log, translateService);
    default:
      assertUnreachable(service);
      return ' - ';
  }
}

function getMiddlewareLogImportantData(log: MiddlewareAuditEntry, translateService: TranslateService): string {
  const event = log.event;
  switch (event) {
    case AuditEvent.MethodCall:
      return log.event_data?.description || log.event_data?.method;
    case AuditEvent.Authentication: {
      const credentialType = log.event_data?.credentials.credentials;
      const credentialTypeKey = credentialTypeLabels.get(credentialType);

      if (log.event_data?.error) {
        return translateService.instant(T('Failed Authentication: {credentials}'), {
          credentials: credentialType ? translateService.instant(credentialTypeKey) : credentialType,
        });
      }

      return translateService.instant(T('Credentials: {credentials}'), {
        credentials: credentialType ? translateService.instant(credentialTypeKey) : credentialType,
      });
    }
    default:
      assertUnreachable(event);
      return ' - ';
  }
}

function getSmbLogImportantData(log: SmbAuditEntry, translateService: TranslateService): string {
  const event = log.event;
  switch (event) {
    case AuditEvent.Rename:
      return `${log.event_data?.src_file?.path} -> ${log.event_data?.dst_file?.path}`;
    case AuditEvent.Authentication:
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
      assertUnreachable(event);
      return ' - ';
  }
}
