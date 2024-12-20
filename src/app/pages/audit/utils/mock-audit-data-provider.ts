import { AuditService, AuditEvent } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { ApiService } from 'app/services/websocket/api.service';

export const mockAuditEntries = [
  {
    audit_id: '1',
    timestamp: { $date: 1712932440770 },
    message_timestamp: 1712932440,
    address: '192.168.1.100',
    username: 'root',
    service: AuditService.Middleware,
    event: AuditEvent.MethodCall,
    success: true,
    event_data: { method: 'test.method' },
  },
  {
    audit_id: '2',
    timestamp: { $date: 1712932952481 },
    message_timestamp: 1712932952,
    address: '192.168.1.101',
    username: 'admin',
    service: AuditService.Smb,
    event: AuditEvent.Authentication,
    success: false,
    event_data: { clientAccount: 'admin' },
  },
] as AuditEntry[];

const api = {
  call: jest.fn(() => mockAuditEntries),
} as unknown as ApiService;

// TODO: Find easy way to mock ApiDataProvider
export const mockAuditDataProvider = new AuditApiDataProvider(api, {
  paginationStrategy: new PaginationServerSide(),
  sortingStrategy: new SortingServerSide(),
});
