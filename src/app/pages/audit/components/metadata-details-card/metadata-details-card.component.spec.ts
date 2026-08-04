import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import {
  MetadataDetailsCardComponent,
} from 'app/pages/audit/components/metadata-details-card/metadata-details-card.component';

const smbLogEntry = {
  audit_id: '557cbf43-8c04-4250-bce6-e9ee1f45ec23',
  message_timestamp: 1699350345,
  timestamp: {
    $date: 1699350345000,
  },
  address: '10.220.2.21',
  username: 'Administrator',
  session: '',
  service: AuditService.Smb,
  service_data: {
    vers: {
      major: 0,
      minor: 1,
    },
  },
  event: AuditEvent.Authentication,
  event_data: {},
  success: true,
} as AuditEntry;

const middlewareLogEntry = {
  audit_id: '9a6f0e74-bb1a-4171-bd8d-229eb5adda04',
  message_timestamp: 1784904505,
  timestamp: {
    $date: 1784904505000,
  },
  address: '10.234.17.180',
  username: 'root',
  session: 'e39d5968-6828-4e49-8b06-9c9496274515',
  service: AuditService.Middleware,
  service_data: {
    vers: {
      major: 0,
      minor: 1,
    },
    origin: '10.234.17.180',
    protocol: 'WEBSOCKET',
    credentials: {
      credentials: CredentialType.LoginPassword,
      credentials_data: { username: 'root' },
    },
  },
  event: AuditEvent.MethodCall,
  event_data: {
    method: 'api_key.create',
  },
  success: true,
} as AuditEntry;

describe('MetadataDetailsCardComponent', () => {
  let spectator: Spectator<MetadataDetailsCardComponent>;

  const createComponent = createComponentFactory({
    component: MetadataDetailsCardComponent,
    imports: [
      MockComponent(IxDateComponent),
    ],
  });

  function detailsMap(): Record<string, string> {
    const terms = spectator.queryAll('dl.details dt');
    const values = spectator.queryAll('dl.details dd');
    return Object.fromEntries(
      terms.map((term, index) => [term.textContent!.replace(':', '').trim(), values[index].textContent!.trim()]),
    );
  }

  it('checks card title', () => {
    spectator = createComponent({ props: { log: smbLogEntry } });

    expect(spectator.query('h3')).toHaveText('Metadata');
  });

  it('renders shared metadata for any log entry', () => {
    spectator = createComponent({ props: { log: smbLogEntry } });

    expect(detailsMap()).toMatchObject({
      Service: 'SMB',
      Event: 'AUTHENTICATION',
      User: 'Administrator',
      Address: '10.220.2.21',
      Session: '-',
      'Audit ID': '557cbf43-8c04-4250-bce6-e9ee1f45ec23',
      Version: '0.1',
    });
  });

  it('renders connection details for middleware entries', () => {
    spectator = createComponent({ props: { log: middlewareLogEntry } });

    expect(detailsMap()).toMatchObject({
      Service: 'Middleware',
      Event: 'METHOD_CALL',
      User: 'root',
      Address: '10.234.17.180',
      'Authenticated With': 'Password Login',
      Session: 'e39d5968-6828-4e49-8b06-9c9496274515',
    });
  });

  it('does not repeat origin when it matches the address', () => {
    spectator = createComponent({ props: { log: middlewareLogEntry } });

    expect(detailsMap()).not.toHaveProperty('Origin');
  });

  it('shows origin when it differs from the address', () => {
    spectator = createComponent({
      props: {
        log: {
          ...middlewareLogEntry,
          service_data: {
            ...(middlewareLogEntry as { service_data: Record<string, unknown> }).service_data,
            origin: '10.0.0.5',
          },
        } as AuditEntry,
      },
    });

    expect(detailsMap()).toMatchObject({ Origin: '10.0.0.5' });
  });
});
