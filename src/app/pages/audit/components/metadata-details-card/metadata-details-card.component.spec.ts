import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { AuditEntry } from 'app/interfaces/audit.interface';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { MetadataDetailsCardComponent } from 'app/pages/audit/components/metadata-details-card/metadata-details-card.component';

const logEntry = {
  audit_id: '557cbf43-8c04-4250-bce6-e9ee1f45ec23',
  message_timestamp: 1699350345,
  timestamp: {
    $date: 1699350345000,
  },
  address: '10.220.2.21',
  username: 'Administrator',
  session: '',
  service: 'SMB',
  service_data: {
    vers: {
      major: 0,
      minor: 1,
    },
  },
  event: 'AUTHENTICATION',
  event_data: {},
  success: true,
} as unknown as AuditEntry;

describe('MetadataDetailsCardComponent', () => {
  let spectator: Spectator<MetadataDetailsCardComponent>;

  const createComponent = createComponentFactory({
    component: MetadataDetailsCardComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [],
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
    expect(title).toHaveText('Metadata');
  });

  it('renders Metadata in card', () => {
    const chartExtra = spectator.query('mat-card-content').querySelectorAll('p');
    expect(chartExtra).toHaveLength(3);
    expect(chartExtra[0]).toHaveText('Audit ID: 557cbf43-8c04-4250-bce6-e9ee1f45ec23');
    expect(chartExtra[1]).toHaveText('Version: Minor');
    expect(chartExtra[2]).toHaveText('Session: -');
  });
});
