import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { HumanReadableKeyPipe } from 'app/modules/pipes/human-readable-key/human-readable-key.pipe';

describe('HumanReadableKeyPipe', () => {
  let spectator: SpectatorPipe<HumanReadableKeyPipe>;
  const createPipe = createPipeFactory(HumanReadableKeyPipe);

  it('returns human readable app name', () => {
    spectator = createPipe('{{ "actual-budget" | humanReadableKey }}');

    expect(spectator.element).toHaveText('Actual Budget');
  });
});
