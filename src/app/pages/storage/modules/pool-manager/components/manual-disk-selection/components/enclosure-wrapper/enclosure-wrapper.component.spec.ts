import { createHostFactory, Spectator } from '@ngneat/spectator/jest';
import {
  EnclosureWrapperComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/enclosure-wrapper/enclosure-wrapper.component';

describe('EnclosureWrapperComponent', () => {
  let spectator: Spectator<EnclosureWrapperComponent>;
  const createHost = createHostFactory({
    component: EnclosureWrapperComponent,
  });

  beforeEach(() => {
    spectator = createHost('<ix-enclosure-wrapper [enclosure]="1">Test</ix-enclosure-wrapper>');
  });

  it('shows enclosure number and content', () => {
    expect(spectator.query('.enclosure-container')).toHaveText('1');
    expect(spectator.query('.content-container')).toHaveText('Test');
  });
});
