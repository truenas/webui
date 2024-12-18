import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { FibreChannelConnectionsCardComponent } from './fibre-channel-connections-card.component';

describe('FibreChannelConnectionsCardComponent', () => {
  let spectator: Spectator<FibreChannelConnectionsCardComponent>;
  const createComponent = createComponentFactory({
    component: FibreChannelConnectionsCardComponent,
    imports: [TranslateModule.forRoot()],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        connections: [{
          A: {
            port_type: 'NPort (fabric via point-to-point)',
            port_state: 'Online',
            speed: '16 Gbit',
            physical: true,
            wwpn: 'naa.210034800d75aec4',
            sessions: [
              '21:00:00:24:ff:19:a2:e2',
              '21:00:00:24:ff:19:a5:80',
              '21:00:00:24:ff:19:a9:0a',
              '21:00:00:24:ff:19:a2:e3',
              '21:00:00:24:ff:19:a5:81',
              '21:00:00:24:ff:19:a9:0b',
              '21:00:00:0e:1e:25:24:80',
            ],
          },
          port: 'fc0',
          B: {
            port_type: 'Unknown',
            port_state: 'Offline',
            speed: 'unknown',
            physical: true,
            wwpn_b: 'naa.210034800d75aed8',
            sessions: [],
          },
        }] as FibreChannelStatus[],
      },
    });
  });

  it('shows fibre channel connections heading', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Fibre Channel Connections');
  });

  it('shows connections', () => {
    const content = spectator.queryAll('mat-card-content p');
    expect(content).toHaveLength(1);
    expect(content[0]).toHaveText('naa.210034800d75aec4 (Active Controller)');
  });
});
