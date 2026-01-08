import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { IsHaDirective } from 'app/directives/is-ha/is-ha.directive';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { FibreChannelPortCardComponent } from './fibre-channel-port-card.component';

describe('FibreChannelPortCardComponent', () => {
  let spectator: Spectator<FibreChannelPortCardComponent>;
  const createComponent = createComponentFactory({
    component: FibreChannelPortCardComponent,
    imports: [IsHaDirective],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isLoading: false,
        ports: [{
          id: 1,
          port: 'fc1/5',
          wwpn: '10:00:00:00:c9:20:00:00',
          wwpn_b: '10:00:00:00:c9:20:00:01',
        } as FibreChannelPort],
      },
    });
  });

  it('renders Fibre Channel Ports title', () => {
    const title = spectator.query('h3[mat-card-title]');
    expect(title).toHaveText('Fibre Channel Ports');
  });

  it('displays port details correctly', () => {
    const content = spectator.queryAll('mat-card-content p');
    expect(content).toHaveLength(3);
    expect(content[0]).toHaveText('Port: fc1/5');
    expect(content[1]).toHaveText('Controller A WWPN: 10:00:00:00:c9:20:00:00');
    expect(content[2]).toHaveText('Controller B WWPN: 10:00:00:00:c9:20:00:01');
  });

  it('displays "No associated Fibre Channel ports" message', () => {
    spectator.setInput('ports', []);
    spectator.setInput('isLoading', false);
    const content = spectator.query('mat-card-content');
    expect(content).toHaveText('No associated Fibre Channel ports');
  });

  it('displays multiple ports correctly', () => {
    spectator.setInput('ports', [
      {
        id: 1,
        port: 'fc0',
        wwpn: '10:00:00:00:c9:20:00:00',
        wwpn_b: '10:00:00:00:c9:20:00:01',
      } as FibreChannelPort,
      {
        id: 2,
        port: 'fc1',
        wwpn: '10:00:00:00:c9:30:00:00',
        wwpn_b: '10:00:00:00:c9:30:00:01',
      } as FibreChannelPort,
    ]);

    const portGroups = spectator.queryAll('.port-group');
    expect(portGroups).toHaveLength(2);

    const allParagraphs = spectator.queryAll('mat-card-content p');
    expect(allParagraphs[0]).toHaveText('Port: fc0');
    expect(allParagraphs[3]).toHaveText('Port: fc1');
  });
});

describe('FibreChannelPortCardComponent not HA', () => {
  let spectator: Spectator<FibreChannelPortCardComponent>;
  const createComponent = createComponentFactory({
    component: FibreChannelPortCardComponent,
    imports: [IsHaDirective],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: false,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isLoading: false,
        ports: [{
          id: 1,
          port: 'fc1/5',
          wwpn: '10:00:00:00:c9:20:00:00',
        } as FibreChannelPort],
      },
    });
  });

  it('displays port details correctly for non HA system', () => {
    const content = spectator.queryAll('mat-card-content p');
    expect(content).toHaveLength(2);
    expect(content[0]).toHaveText('Port: fc1/5');
    expect(content[1]).toHaveText('WWPN: 10:00:00:00:c9:20:00:00');
  });
});
