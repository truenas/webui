import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { FibreChannelPortCardComponent } from './fibre-channel-port-card.component';

describe('FibreChannelPortCardComponent', () => {
  let spectator: Spectator<FibreChannelPortCardComponent>;
  const createComponent = createComponentFactory({
    component: FibreChannelPortCardComponent,
    imports: [TranslateModule.forRoot()],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isLoading: false,
        port: {
          port: 'fc1/5',
          wwpn: '10:00:00:00:c9:20:00:00',
          wwpn_b: '10:00:00:00:c9:20:00:01',
        } as unknown as FibreChannelPort,
      },
    });
  });

  it('renders Fibre Channel Port title', () => {
    const title = spectator.query('h3[mat-card-title]');
    expect(title).toHaveText('Fibre Channel Port');
  });

  it('displays port details correctly', () => {
    const content = spectator.queryAll('mat-card-content p');
    expect(content).toHaveLength(3);
    expect(content[0]).toHaveText('Port: fc1/5');
    expect(content[1]).toHaveText('Controller A WWPN: 10:00:00:00:c9:20:00:00');
    expect(content[2]).toHaveText('Controller B WWPN: 10:00:00:00:c9:20:00:01');
  });

  it('displays "No associated Fibre Channel port" message', () => {
    spectator.setInput('port', null);
    spectator.setInput('isLoading', false);
    const content = spectator.query('mat-card-content');
    expect(content).toHaveText('No associated Fibre Channel port');
  });
});
