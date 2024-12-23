import { of } from 'rxjs';
import { AuditService, AuditEvent } from 'app/enums/audit.enum';
import { ControllerType } from 'app/enums/controller-type.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';

export const auditEntries = [
  {
    audit_id: '1',
    timestamp: {
      $date: 1712932440770,
    },
    message_timestamp: 1712932440,
    address: '10.220.2.21',
    username: 'Administrator',
    service: AuditService.Smb,
    event: AuditEvent.Authentication,
    event_data: {
      clientAccount: 'Administrator',
    },
  },
  {
    audit_id: '2',
    timestamp: {
      $date: 1712932952481,
    },
    message_timestamp: 1712932952,
    address: '10.220.2.21',
    username: 'bob',
    service: AuditService.Smb,
    event: AuditEvent.Create,
    event_data: {
      file_type: 'FILE',
      file: {
        path: 'test.txt',
      },
    },
  },
] as AuditEntry[];

export const mockAuditApiDataProvider = {
  currentPage$: of(auditEntries),
  selectedControllerType: ControllerType.Active,
  load: jest.fn(),
  setPagination: jest.fn(),
  setParams: jest.fn(),
  sorting: {
    propertyName: 'message_timestamp',
    direction: 'desc',
    active: 1,
  },
  pagination: {
    pageSize: 10,
    pageNumber: 1,
  },
  controlsStateUpdated: of(true),
} as unknown as AuditApiDataProvider;
