import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import {
  EnclosureWrapperComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/enclosure-wrapper/enclosure-wrapper.component';

describe('EnclosureWrapperComponent', () => {
  let spectator: SpectatorHost<EnclosureWrapperComponent>;
  const createHost = createHostFactory({
    component: EnclosureWrapperComponent,
  });

  beforeEach(() => {
    spectator = createHost('<ix-enclosure-wrapper [enclosure]="enclosure">Test</ix-enclosure-wrapper>', {
      hostProps: {
        enclosure: {
          number: 1,
          label: 'M40',
        },
      },
    });
  });

  it('shows enclosure label', () => {
    expect(spectator.query('.enclosure-container')).toHaveText('M40');
    expect(spectator.query('.content-container')).toHaveText('Test');
  });
});
