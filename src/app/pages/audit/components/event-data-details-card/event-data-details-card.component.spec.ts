import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import {
  EventDataDetailsCardComponent,
} from 'app/pages/audit/components/event-data-details-card/event-data-details-card.component';

const logEntry = {
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
  event_data: {
    logonId: '0',
    logonType: 3,
    localAddress: 'ipv4:10.238.238.168:445',
    remoteAddress: 'ipv4:10.220.2.21:10876',
    serviceDescription: 'SMB2',
    authDescription: null,
    clientDomain: 'AD02',
    clientAccount: 'Administrator',
    workstation: 'TNBUILDS03',
    becameAccount: 'Administrator',
    becameDomain: 'AD02',
    becameSid: 'S-1-5-21-2898882361-1697523803-787493405-500',
    mappedAccount: 'Administrator',
    mappedDomain: 'AD02',
    netlogonComputer: null,
    netlogonTrustAccount: null,
    netlogonNegotiateFlags: '0x00000000',
    netlogonSecureChannelType: 0,
    netlogonTrustAccountSid: null,
    passwordType: 'NTLMv2',
    clientPolicyAccessCheck: null,
    serverPolicyAccessCheck: null,
    vers: {
      major: 0,
      minor: 1,
    },
    result: {
      type: 'NTSTATUS',
      value_raw: 0,
      value_parsed: 'SUCCESS',
    },
  },
  success: true,
} as AuditEntry;

const yamlContent = `Logon ID: '0'
Logon Type: 3
Local Address: ipv4:10.238.238.168:445
Remote Address: ipv4:10.220.2.21:10876
Service Description: SMB2
Auth Description: Null
Client Domain: AD02
Client Account: Administrator
Workstation: TNBUILDS03
Became Account: Administrator
Became Domain: AD02
Became Sid: S-1-5-21-2898882361-1697523803-787493405-500
Mapped Account: Administrator
Mapped Domain: AD02
Netlogon Computer: Null
Netlogon Trust Account: Null
Netlogon Negotiate Flags: '0x00000000'
Netlogon Secure Channel Type: 0
Netlogon Trust Account Sid: Null
Password Type: NTLMv2
Client Policy Access Check: Null
Server Policy Access Check: Null
Vers:
  Major: 0
  Minor: 1
Result:
  Type: NTSTATUS
  Value Raw: 0
  Value Parsed: SUCCESS
`;

describe('EventDataDetailsCardComponent', () => {
  let spectator: Spectator<EventDataDetailsCardComponent>;

  const createComponent = createComponentFactory({
    component: EventDataDetailsCardComponent,
    declarations: [
      MockComponent(CopyButtonComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        log: logEntry,
      },
    });
  });

  it('checks card title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Event Data');
  });

  it('renders Event Data in Yaml format', () => {
    const cardContent = spectator.query('mat-card pre')!;
    expect(cardContent.textContent).toBe(yamlContent);
  });

  it('shows a Copy button', () => {
    const copyButton = spectator.query(CopyButtonComponent)!;
    expect(copyButton).toExist();
    expect(copyButton.text).toBe(yamlContent);
  });
});
